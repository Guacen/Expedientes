import { describe, expect, it } from 'vitest';
import type { Game } from '../types';
import { validarPlantilla, yaEnBiblioteca } from './catalogo';

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

describe('yaEnBiblioteca', () => {
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

  it('detecta coincidencia exacta de título y plataforma', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(yaEnBiblioteca(resultado.plantilla, [juego()])).toBe(true);
  });

  it('ignora mayúsculas y espacios al comparar', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(yaEnBiblioteca(resultado.plantilla, [juego({ titulo: '  metroid prime 4  ' })])).toBe(
      true,
    );
  });

  it('no marca como añadido un juego distinto', () => {
    const resultado = validarPlantilla(PLANTILLA_VALIDA);
    if (!resultado.valida) throw new Error('plantilla debería ser válida');
    expect(yaEnBiblioteca(resultado.plantilla, [juego({ titulo: 'Otro juego' })])).toBe(false);
  });
});
