import { PLATAFORMAS, ESTADOS_JUEGO, type Game, type PlantillaCatalogo, type PlantillaTrofeo } from '../types';

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

  return {
    valido: true,
    trofeo: {
      titulo: r.titulo.trim(),
      descripcion:
        typeof r.descripcion === 'string' && r.descripcion.trim() ? r.descripcion.trim() : undefined,
      dificultad: r.dificultad as 1 | 2 | 3,
      tipo: r.tipo as 'binario' | 'contador',
      meta: r.meta,
      oculto: r.oculto,
    },
  };
}

/** Un juego se considera "ya en la biblioteca" si coincide título y plataforma. */
export function yaEnBiblioteca(plantilla: PlantillaCatalogo, juegos: Game[]): boolean {
  const clave = (titulo: string, plataforma: string) =>
    `${titulo.trim().toLowerCase()}|${plataforma.trim().toLowerCase()}`;
  const objetivo = clave(plantilla.juego.titulo, plantilla.juego.plataforma);
  return juegos.some((j) => clave(j.titulo, j.plataforma) === objetivo);
}
