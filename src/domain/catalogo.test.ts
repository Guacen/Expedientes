import { describe, expect, it } from 'vitest';
import type { Game, Trophy } from '../types';
import { buscarJuegoCoincidente, calcularDiffActualizacion, validarPlantilla } from './catalogo';

const PLANTILLA_VALIDA = {
  version: 1,
  juego: { titulo: 'Metroid Prime 4', plataforma: 'Switch 2', estado: 'backlog' },
  trofeos: [
    { titulo: 'Primer paso', dificultad: 1, tipo: 'binario', meta: 1, oculto: false },
    {
      titulo: 'Coleccionable',
      descripcion: 'Encuentra 50 objetos.',
      dificultad: 2,
      tipo: 'contador',
      meta: 50,
      oculto: true,
    },
  ],
};

describe('validarPlantilla', () => {
  it('acepta una plantilla bien formada', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    expect(resultado.valida).toBe(true);
    if (resultado.valida) {
      expect(resultado.plantilla.juego.titulo).toBe('Metroid Prime 4');
      expect(resultado.plantilla.trofeos).toHaveLength(2);
    }
  });

  it('rechaza algo que no es un objeto', () => {
    const resultado = validarPlantilla('no soy json');
    expect(resultado.valida).toBe(false);
  });

  it('rechaza una plantilla sin "version"', () => {
    const { version: _version, ...sinVersion } = PLANTILLA_VALIDA;
    const resultado = validarPlantilla(sinVersion);
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/version/);
  });

  it('rechaza una plataforma desconocida', () => {
    const resultado = validarPlantilla({
      ...PLANTILLA_VALIDA,
      juego: { ...PLANTILLA_VALIDA.juego, plataforma: 'PlayStation 5' },
    });
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/plataforma/);
  });

  it('rechaza una dificultad fuera de 1-3', () => {
    const resultado = validarPlantilla({
      ...PLANTILLA_VALIDA,
      trofeos: [{ titulo: 'Malo', dificultad: 4, tipo: 'binario', meta: 1, oculto: false }],
    });
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/dificultad/);
  });

  it('rechaza un tipo de trofeo inválido', () => {
    const resultado = validarPlantilla({
      ...PLANTILLA_VALIDA,
      trofeos: [{ titulo: 'Malo', dificultad: 1, tipo: 'raro', meta: 1, oculto: false }],
    });
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/tipo/);
  });

  it('rechaza un binario con meta distinta de 1', () => {
    const resultado = validarPlantilla({
      ...PLANTILLA_VALIDA,
      trofeos: [{ titulo: 'Malo', dificultad: 1, tipo: 'binario', meta: 5, oculto: false }],
    });
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/binarios deben tener meta 1/);
  });

  it('rechaza "oculto" que no es booleano', () => {
    const resultado = validarPlantilla({
      ...PLANTILLA_VALIDA,
      trofeos: [{ titulo: 'Malo', dificultad: 1, tipo: 'binario', meta: 1, oculto: 'si' }],
    });
    expect(resultado.valida).toBe(false);
    if (!resultado.valida) expect(resultado.error).toMatch(/oculto/);
  });

  it('rechaza una plantilla sin trofeos', () => {
    const resultado = validarPlantilla({ ...PLANTILLA_VALIDA, trofeos: [] });
    expect(resultado.valida).toBe(false);
  });
});

function juego(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    titulo: 'Metroid Prime 4',
    plataforma: 'Switch 2',
    estado: 'backlog',
    horas: 0,
    creadoEn: '2026-01-01T00:00:00.000Z',
    actualizadoEn: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buscarJuegoCoincidente', () => {
  it('detecta coincidencia exacta de título y plataforma', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(buscarJuegoCoincidente(resultado.plantilla, [juego()])?.id).toBe('g1');
  });

  it('ignora mayúsculas y espacios al comparar', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(
      buscarJuegoCoincidente(resultado.plantilla, [juego({ titulo: '  metroid prime 4  ' })]),
    ).toBeDefined();
  });

  it('no marca como añadido un juego distinto', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(
      buscarJuegoCoincidente(resultado.plantilla, [juego({ titulo: 'Otro juego' })]),
    ).toBeUndefined();
  });
});

describe('calcularDiffActualizacion', () => {
  function trofeoExistente(overrides: Partial<Trophy> = {}): Trophy {
    return {
      id: 't-existente',
      gameId: 'g1',
      titulo: 'Primer paso',
      dificultad: 1,
      tipo: 'binario',
      meta: 1,
      valorActual: 1,
      oculto: false,
      orden: 0,
      creadoEn: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('todo el catálogo es "nuevo" si el juego no tenía trofeos', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const diff = calcularDiffActualizacion(resultado.plantilla, []);
    expect(diff.nuevos).toHaveLength(2);
    expect(diff.cambiados).toHaveLength(0);
    expect(diff.eliminados).toHaveLength(0);
  });

  it('no reporta cambios si los trofeos existentes coinciden exactamente', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const existentes = [
      trofeoExistente({ id: 't1', titulo: 'Primer paso' }),
      trofeoExistente({
        id: 't2',
        titulo: 'Coleccionable',
        descripcion: 'Encuentra 50 objetos.',
        dificultad: 2,
        tipo: 'contador',
        meta: 50,
        oculto: true,
      }),
    ];
    const diff = calcularDiffActualizacion(resultado.plantilla, existentes);
    expect(diff.sinCambios).toBe(2);
    expect(diff.nuevos).toHaveLength(0);
    expect(diff.cambiados).toHaveLength(0);
    expect(diff.eliminados).toHaveLength(0);
  });

  it('reporta un cambio de meta con la etiqueta X → Y', () => {
    const plantilla = {
      version: 2,
      juego: { titulo: 'X', plataforma: 'Switch', estado: 'backlog' },
      trofeos: [
        { titulo: 'Cien años después', dificultad: 2, tipo: 'contador', meta: 13, oculto: false },
      ],
    };
    const resultado = validarPlantilla(plantilla);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const existente = trofeoExistente({
      titulo: 'Cien años después',
      dificultad: 2,
      tipo: 'contador',
      meta: 18,
      valorActual: 15,
    });
    const diff = calcularDiffActualizacion(resultado.plantilla, [existente]);
    expect(diff.cambiados).toHaveLength(1);
    expect(diff.cambiados[0].campos).toEqual(['meta: 18 → 13']);
    expect(diff.cambiados[0].existente.valorActual).toBe(15);
  });

  it('un trofeo que ya no está en la plantilla aparece como eliminado', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const existentes = [
      trofeoExistente({ id: 't1', titulo: 'Primer paso' }),
      trofeoExistente({ id: 't2', titulo: 'Coleccionable', dificultad: 2, tipo: 'contador', meta: 50 }),
      trofeoExistente({ id: 't3', titulo: 'Ya no existe' }),
    ];
    const diff = calcularDiffActualizacion(resultado.plantilla, existentes);
    expect(diff.eliminados).toHaveLength(1);
    expect(diff.eliminados[0].titulo).toBe('Ya no existe');
  });

  it('un renombre se ve como eliminado + nuevo, nunca como cambiado (caso "Los tres laberintos")', () => {
    const plantilla = {
      version: 2,
      juego: { titulo: 'X', plataforma: 'Switch', estado: 'backlog' },
      trofeos: [
        {
          titulo: 'Los tres laberintos',
          descripcion: 'Resuelve los tres laberintos antiguos.',
          dificultad: 2,
          tipo: 'contador',
          meta: 3,
          oculto: false,
        },
      ],
    };
    const resultado = validarPlantilla(plantilla);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const existente = trofeoExistente({
      titulo: 'El laberinto del norte',
      descripcion: 'Resuelve los tres laberintos antiguos.',
      dificultad: 2,
      tipo: 'contador',
      meta: 3,
      valorActual: 2,
    });
    const diff = calcularDiffActualizacion(resultado.plantilla, [existente]);
    expect(diff.cambiados).toHaveLength(0);
    expect(diff.nuevos.map((t) => t.titulo)).toEqual(['Los tres laberintos']);
    expect(diff.eliminados.map((t) => t.titulo)).toEqual(['El laberinto del norte']);
  });

  it('detecta cambios combinados de descripción y guía en el mismo trofeo', () => {
    const plantilla = {
      version: 2,
      juego: { titulo: 'X', plataforma: 'Switch', estado: 'backlog' },
      trofeos: [
        {
          titulo: 'Primer paso',
          descripcion: 'Nueva descripción.',
          guia: 'Nueva guía.',
          dificultad: 1,
          tipo: 'binario',
          meta: 1,
          oculto: false,
        },
      ],
    };
    const resultado = validarPlantilla(plantilla);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    const existente = trofeoExistente({ titulo: 'Primer paso', descripcion: 'Vieja descripción.' });
    const diff = calcularDiffActualizacion(resultado.plantilla, [existente]);
    expect(diff.cambiados).toHaveLength(1);
    expect(diff.cambiados[0].campos).toEqual(expect.arrayContaining(['descripción', 'guía']));
  });
});
