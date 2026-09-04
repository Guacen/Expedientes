import {
  PLATAFORMAS,
  ESTADOS_JUEGO,
  type Game,
  type PlantillaCatalogo,
  type PlantillaTrofeo,
  type Trophy,
} from '../types';

export type ResultadoValidacion =
  | { valida: true; plantilla: PlantillaCatalogo }
  | { valida: false; error: string };

/**
 * Valida la forma de una plantilla de catálogo (venga de src/catalogo/*.json o
 * pegada a mano en Ajustes) y señala con precisión qué campo falla.
 */
export function validarPlantilla(json: unknown): ResultadoValidacion {
  if (typeof json !== 'object' || json === null) {
    return { valida: false, error: 'La plantilla no es un objeto JSON válido.' };
  }
  const r = json as Record<string, unknown>;

  if (typeof r.version !== 'number') {
    return { valida: false, error: 'Falta el campo "version" (numérico).' };
  }

  if (typeof r.juego !== 'object' || r.juego === null) {
    return { valida: false, error: 'Falta el campo "juego".' };
  }
  const juego = r.juego as Record<string, unknown>;

  if (typeof juego.titulo !== 'string' || !juego.titulo.trim()) {
    return { valida: false, error: '"juego.titulo" es obligatorio.' };
  }
  if (
    typeof juego.plataforma !== 'string' ||
    !(PLATAFORMAS as readonly string[]).includes(juego.plataforma)
  ) {
    return {
      valida: false,
      error: `"juego.plataforma" debe ser una de: ${PLATAFORMAS.join(', ')}.`,
    };
  }
  if (
    typeof juego.estado !== 'string' ||
    !(ESTADOS_JUEGO as readonly string[]).includes(juego.estado)
  ) {
    return {
      valida: false,
      error: `"juego.estado" debe ser una de: ${ESTADOS_JUEGO.join(', ')}.`,
    };
  }

  if (!Array.isArray(r.trofeos) || r.trofeos.length === 0) {
    return { valida: false, error: 'La plantilla necesita al menos un trofeo en "trofeos".' };
  }

  const trofeos: PlantillaTrofeo[] = [];
  for (let i = 0; i < r.trofeos.length; i++) {
    const resultado = validarTrofeo(r.trofeos[i], i);
    if (!resultado.valido) return { valida: false, error: resultado.error };
    trofeos.push(resultado.trofeo);
  }

  return {
    valida: true,
    plantilla: {
      version: r.version,
      juego: {
        titulo: juego.titulo.trim(),
        plataforma: juego.plataforma as PlantillaCatalogo['juego']['plataforma'],
        estado: juego.estado as PlantillaCatalogo['juego']['estado'],
      },
      trofeos,
    },
  };
}

type ResultadoTrofeo =
  | { valido: true; trofeo: PlantillaTrofeo }
  | { valido: false; error: string };

function validarTrofeo(t: unknown, indice: number): ResultadoTrofeo {
  const prefijo = `Trofeo #${indice + 1}`;
  if (typeof t !== 'object' || t === null) {
    return { valido: false, error: `${prefijo}: no es un objeto.` };
  }
  const r = t as Record<string, unknown>;

  if (typeof r.titulo !== 'string' || !r.titulo.trim()) {
    return { valido: false, error: `${prefijo}: falta "titulo".` };
  }
  const nombre = `${prefijo} ("${r.titulo}")`;

  if (r.dificultad !== 1 && r.dificultad !== 2 && r.dificultad !== 3) {
    return { valido: false, error: `${nombre}: "dificultad" debe ser 1, 2 o 3.` };
  }
  if (r.tipo !== 'binario' && r.tipo !== 'contador') {
    return { valido: false, error: `${nombre}: "tipo" debe ser "binario" o "contador".` };
  }
  if (typeof r.meta !== 'number' || !Number.isInteger(r.meta) || r.meta < 1) {
    return { valido: false, error: `${nombre}: "meta" debe ser un entero mayor o igual a 1.` };
  }
  if (r.tipo === 'binario' && r.meta !== 1) {
    return { valido: false, error: `${nombre}: los trofeos binarios deben tener meta 1.` };
  }
  if (typeof r.oculto !== 'boolean') {
    return { valido: false, error: `${nombre}: "oculto" debe ser true o false.` };
  }
  if (r.descripcion !== undefined && typeof r.descripcion !== 'string') {
    return { valido: false, error: `${nombre}: "descripcion" debe ser texto.` };
  }
  if (r.guia !== undefined && typeof r.guia !== 'string') {
    return { valido: false, error: `${nombre}: "guia" debe ser texto.` };
  }

  return {
    valido: true,
    trofeo: {
      titulo: r.titulo.trim(),
      descripcion:
        typeof r.descripcion === 'string' && r.descripcion.trim() ? r.descripcion.trim() : undefined,
      guia: typeof r.guia === 'string' && r.guia.trim() ? r.guia.trim() : undefined,
      dificultad: r.dificultad as 1 | 2 | 3,
      tipo: r.tipo as 'binario' | 'contador',
      meta: r.meta,
      oculto: r.oculto,
    },
  };
}

/** Encuentra, si existe, el juego de la biblioteca que coincide en título y plataforma. */
export function buscarJuegoCoincidente(plantilla: PlantillaCatalogo, juegos: Game[]): Game | undefined {
  const clave = (titulo: string, plataforma: string) =>
    `${titulo.trim().toLowerCase()}|${plataforma.trim().toLowerCase()}`;
  const objetivo = clave(plantilla.juego.titulo, plantilla.juego.plataforma);
  return juegos.find((j) => clave(j.titulo, j.plataforma) === objetivo);
}

// --- Actualizar desde el catálogo -------------------------------------------

export interface CambioTrofeo {
  existente: Trophy;
  plantilla: PlantillaTrofeo;
  /** Etiquetas legibles de qué cambió, p.ej. "meta: 18 → 13". */
  campos: string[];
}

export interface DiffActualizacion {
  nuevos: PlantillaTrofeo[];
  cambiados: CambioTrofeo[];
  eliminados: Trophy[];
  sinCambios: number;
}

/**
 * Compara una plantilla contra los trofeos 1-3 que ya tiene un juego (sin el
 * Expediente Cerrado) y calcula qué cambiaría al actualizar. El match es solo por
 * título: un trofeo renombrado se ve como uno eliminado + uno nuevo, nunca como
 * "cambiado" — no se intenta migrar progreso entre títulos distintos.
 */
export function calcularDiffActualizacion(
  plantilla: PlantillaCatalogo,
  trofeosExistentes: Trophy[],
): DiffActualizacion {
  const porTitulo = new Map(trofeosExistentes.map((t) => [t.titulo.trim(), t]));
  const titulosPlantilla = new Set(plantilla.trofeos.map((t) => t.titulo.trim()));

  const nuevos: PlantillaTrofeo[] = [];
  const cambiados: CambioTrofeo[] = [];
  let sinCambios = 0;

  for (const trofeoPlantilla of plantilla.trofeos) {
    const existente = porTitulo.get(trofeoPlantilla.titulo.trim());
    if (!existente) {
      nuevos.push(trofeoPlantilla);
      continue;
    }
    const campos = compararTrofeo(existente, trofeoPlantilla);
    if (campos.length > 0) {
      cambiados.push({ existente, plantilla: trofeoPlantilla, campos });
    } else {
      sinCambios++;
    }
  }

  const eliminados = trofeosExistentes.filter((t) => !titulosPlantilla.has(t.titulo.trim()));

  return { nuevos, cambiados, eliminados, sinCambios };
}

function compararTrofeo(existente: Trophy, plantilla: PlantillaTrofeo): string[] {
  const campos: string[] = [];
  if ((existente.descripcion ?? '') !== (plantilla.descripcion ?? '')) {
    campos.push('descripción');
  }
  if (existente.dificultad !== plantilla.dificultad) {
    campos.push(`dificultad: ${existente.dificultad} → ${plantilla.dificultad}`);
  }
  if (existente.tipo !== plantilla.tipo) {
    campos.push(`tipo: ${existente.tipo} → ${plantilla.tipo}`);
  }
  if (existente.meta !== plantilla.meta) {
    campos.push(`meta: ${existente.meta} → ${plantilla.meta}`);
  }
  if (existente.oculto !== plantilla.oculto) {
    campos.push(plantilla.oculto ? 'ahora oculto' : 'ya no oculto');
  }
  if ((existente.guia ?? '') !== (plantilla.guia ?? '')) {
    campos.push('guía');
  }
  return campos;
}
