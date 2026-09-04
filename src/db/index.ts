import Dexie, { type Table } from 'dexie';
import type { Game, Trophy } from '../types';
import { alternarBinario, conNuevoValor, recalcularExpediente } from '../domain/progreso';

class ExpedientesDB extends Dexie {
  games!: Table<Game, string>;
  trophies!: Table<Trophy, string>;

  constructor() {
    super('expedientes');
    this.version(1).stores({
      games: 'id, estado, plataforma',
      trophies: 'id, gameId, dificultad, desbloqueadoEn',
    });
  }
}

export const db = new ExpedientesDB();

function ahora(): string {
  return new Date().toISOString();
}

// --- Juegos -----------------------------------------------------------

export type DatosNuevoJuego = Omit<Game, 'id' | 'creadoEn' | 'actualizadoEn'>;

export async function crearJuego(datos: DatosNuevoJuego): Promise<Game> {
  const fecha = ahora();
  const juego: Game = {
    ...datos,
    id: crypto.randomUUID(),
    creadoEn: fecha,
    actualizadoEn: fecha,
  };
  const expediente: Trophy = {
    id: crypto.randomUUID(),
    gameId: juego.id,
    titulo: `Expediente Cerrado: ${juego.titulo}`,
    dificultad: 4,
    tipo: 'binario',
    meta: 1,
    valorActual: 0,
    oculto: false,
    orden: 0,
    creadoEn: fecha,
  };
  await db.transaction('rw', db.games, db.trophies, async () => {
    await db.games.add(juego);
    await db.trophies.add(expediente);
  });
  return juego;
}

export type CambiosJuego = Partial<Omit<Game, 'id' | 'creadoEn' | 'actualizadoEn'>>;

export async function actualizarJuego(id: string, cambios: CambiosJuego): Promise<void> {
  await db.games.update(id, { ...cambios, actualizadoEn: ahora() });
}

export async function borrarJuego(id: string): Promise<void> {
  await db.transaction('rw', db.games, db.trophies, async () => {
    await db.trophies.where('gameId').equals(id).delete();
    await db.games.delete(id);
  });
}

// --- Trofeos ------------------------------------------------------------

export type DatosNuevoTrofeo = Omit<
  Trophy,
  'id' | 'creadoEn' | 'desbloqueadoEn' | 'valorActual' | 'dificultad'
> & { dificultad: 1 | 2 | 3 };

export async function crearTrofeo(datos: DatosNuevoTrofeo): Promise<Trophy> {
  const trofeo: Trophy = {
    ...datos,
    id: crypto.randomUUID(),
    valorActual: 0,
    creadoEn: ahora(),
  };
  await db.trophies.add(trofeo);
  await recalcularExpedienteDeJuego(trofeo.gameId);
  return trofeo;
}

export type CambiosTrofeo = Partial<
  Pick<Trophy, 'titulo' | 'descripcion' | 'dificultad' | 'tipo' | 'meta' | 'oculto' | 'orden'>
>;

export async function actualizarTrofeo(id: string, cambios: CambiosTrofeo): Promise<void> {
  const trofeo = await db.trophies.get(id);
  if (!trofeo) return;
  if (trofeo.dificultad === 4) {
    throw new Error('El Expediente Cerrado no se puede editar.');
  }
  await db.trophies.update(id, cambios);
  await recalcularExpedienteDeJuego(trofeo.gameId);
}

export async function borrarTrofeo(id: string): Promise<void> {
  const trofeo = await db.trophies.get(id);
  if (!trofeo) return;
  if (trofeo.dificultad === 4) {
    throw new Error('El Expediente Cerrado no se puede borrar.');
  }
  await db.trophies.delete(id);
  await recalcularExpedienteDeJuego(trofeo.gameId);
}

export async function establecerValorTrofeo(id: string, valorActual: number): Promise<void> {
  const trofeo = await db.trophies.get(id);
  if (!trofeo) return;
  if (trofeo.dificultad === 4) {
    throw new Error('El Expediente Cerrado no se puede marcar a mano.');
  }
  const actualizado = conNuevoValor(trofeo, valorActual, ahora());
  await db.trophies.put(actualizado);
  await recalcularExpedienteDeJuego(trofeo.gameId);
}

export async function alternarTrofeoBinario(id: string): Promise<void> {
  const trofeo = await db.trophies.get(id);
  if (!trofeo) return;
  if (trofeo.dificultad === 4) {
    throw new Error('El Expediente Cerrado no se puede marcar a mano.');
  }
  const actualizado = alternarBinario(trofeo, ahora());
  await db.trophies.put(actualizado);
  await recalcularExpedienteDeJuego(trofeo.gameId);
}

/** Regla 2: recalcula el Expediente Cerrado del juego a partir de sus trofeos 1-3. */
export async function recalcularExpedienteDeJuego(gameId: string): Promise<void> {
  const trofeosDelJuego = await db.trophies.where('gameId').equals(gameId).toArray();
  const expediente = trofeosDelJuego.find((t) => t.dificultad === 4);
  if (!expediente) return;
  const trofeos1a3 = trofeosDelJuego.filter((t) => t.dificultad !== 4);
  const recalculado = recalcularExpediente(expediente, trofeos1a3, ahora());
  if (
    recalculado.valorActual !== expediente.valorActual ||
    recalculado.desbloqueadoEn !== expediente.desbloqueadoEn
  ) {
    await db.trophies.put(recalculado);
  }
}

// --- Respaldo -------------------------------------------------------------

export const VERSION_RESPALDO = 1;

export interface RespaldoJSON {
  version: number;
  fecha: string;
  games: Game[];
  trophies: Trophy[];
}

export async function exportarDatos(): Promise<RespaldoJSON> {
  const [games, trophies] = await Promise.all([db.games.toArray(), db.trophies.toArray()]);
  return { version: VERSION_RESPALDO, fecha: ahora(), games, trophies };
}

export type ValidacionRespaldo =
  | { valido: true; datos: RespaldoJSON }
  | { valido: false; error: string };

function esGameValido(g: unknown): g is Game {
  if (typeof g !== 'object' || g === null) return false;
  const r = g as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.titulo === 'string' &&
    typeof r.plataforma === 'string' &&
    typeof r.estado === 'string' &&
    typeof r.horas === 'number' &&
    typeof r.creadoEn === 'string' &&
    typeof r.actualizadoEn === 'string'
  );
}

function esTrofeoValido(t: unknown): t is Trophy {
  if (typeof t !== 'object' || t === null) return false;
  const r = t as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.gameId === 'string' &&
    typeof r.titulo === 'string' &&
    typeof r.dificultad === 'number' &&
    typeof r.tipo === 'string' &&
    typeof r.meta === 'number' &&
    typeof r.valorActual === 'number' &&
    typeof r.oculto === 'boolean' &&
    typeof r.orden === 'number' &&
    typeof r.creadoEn === 'string'
  );
}

export function validarRespaldo(json: unknown): ValidacionRespaldo {
  if (typeof json !== 'object' || json === null) {
    return { valido: false, error: 'El archivo no contiene un objeto JSON válido.' };
  }
  const r = json as Record<string, unknown>;
  if (typeof r.version !== 'number') {
    return { valido: false, error: 'Falta el campo "version".' };
  }
  if (!Array.isArray(r.games) || !r.games.every(esGameValido)) {
    return { valido: false, error: 'El campo "games" no tiene la forma esperada.' };
  }
  if (!Array.isArray(r.trophies) || !r.trophies.every(esTrofeoValido)) {
    return { valido: false, error: 'El campo "trophies" no tiene la forma esperada.' };
  }
  return {
    valido: true,
    datos: {
      version: r.version,
      fecha: typeof r.fecha === 'string' ? r.fecha : ahora(),
      games: r.games,
      trophies: r.trophies,
    },
  };
}

export async function importarDatos(datos: RespaldoJSON): Promise<void> {
  await db.transaction('rw', db.games, db.trophies, async () => {
    await db.games.clear();
    await db.trophies.clear();
    await db.games.bulkPut(datos.games);
    await db.trophies.bulkPut(datos.trophies);
  });
}
