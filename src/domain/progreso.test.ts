import { describe, expect, it } from 'vitest';
import type { Trophy } from '../types';
import {
  alternarBinario,
  calcularNivel,
  calcularPorcentajeJuego,
  calcularXP,
  conCambios,
  conNuevoValor,
  estaDesbloqueado,
  recalcularExpediente,
  umbralNivel,
} from './progreso';

const AHORA = '2026-01-01T00:00:00.000Z';

function trofeo(overrides: Partial<Trophy> = {}): Trophy {
  return {
    id: 't1',
    gameId: 'g1',
    titulo: 'Trofeo',
    dificultad: 1,
    tipo: 'binario',
    meta: 1,
    valorActual: 0,
    oculto: false,
    orden: 0,
    creadoEn: AHORA,
    ...overrides,
  };
}

describe('Regla 1: el desbloqueo es derivado', () => {
  it('un trofeo está desbloqueado cuando valorActual >= meta', () => {
    expect(estaDesbloqueado({ valorActual: 0, meta: 1 })).toBe(false);
    expect(estaDesbloqueado({ valorActual: 1, meta: 1 })).toBe(true);
    expect(estaDesbloqueado({ valorActual: 47, meta: 100 })).toBe(false);
    expect(estaDesbloqueado({ valorActual: 100, meta: 100 })).toBe(true);
  });

  it('sella desbloqueadoEn la primera vez que cruza la meta', () => {
    const t = trofeo({ tipo: 'contador', meta: 100, valorActual: 99 });
    const actualizado = conNuevoValor(t, 100, AHORA);
    expect(actualizado.desbloqueadoEn).toBe(AHORA);
  });

  it('limpia desbloqueadoEn si el valor baja por debajo de la meta', () => {
    const desbloqueado = trofeo({ tipo: 'contador', meta: 100, valorActual: 100, desbloqueadoEn: AHORA });
    const actualizado = conNuevoValor(desbloqueado, 99, AHORA);
    expect(actualizado.desbloqueadoEn).toBeUndefined();
  });

  it('no resella la fecha si sigue desbloqueado tras otro cambio', () => {
    const primeraFecha = '2025-06-01T00:00:00.000Z';
    const desbloqueado = trofeo({ tipo: 'contador', meta: 100, valorActual: 100, desbloqueadoEn: primeraFecha });
    const actualizado = conNuevoValor(desbloqueado, 150, AHORA);
    expect(actualizado.desbloqueadoEn).toBe(primeraFecha);
  });

  it('conCambios sella desbloqueadoEn si un cambio de meta cruza el umbral', () => {
    const t = trofeo({ tipo: 'contador', meta: 18, valorActual: 15 });
    const actualizado = conCambios(t, { meta: 13 }, AHORA);
    expect(actualizado.valorActual).toBe(15);
    expect(actualizado.meta).toBe(13);
    expect(actualizado.desbloqueadoEn).toBe(AHORA);
  });

  it('conCambios limpia desbloqueadoEn si un cambio saca al trofeo del umbral', () => {
    const t = trofeo({ tipo: 'contador', meta: 10, valorActual: 12, desbloqueadoEn: AHORA });
    const actualizado = conCambios(t, { meta: 20 }, AHORA);
    expect(actualizado.desbloqueadoEn).toBeUndefined();
  });

  it('alternarBinario alterna entre 0 y meta', () => {
    const bloqueado = trofeo({ meta: 1, valorActual: 0 });
    const marcado = alternarBinario(bloqueado, AHORA);
    expect(marcado.valorActual).toBe(1);
    expect(marcado.desbloqueadoEn).toBe(AHORA);

    const desmarcado = alternarBinario(marcado, AHORA);
    expect(desmarcado.valorActual).toBe(0);
    expect(desmarcado.desbloqueadoEn).toBeUndefined();
  });
});

describe('Regla 2: el Expediente Cerrado se abre solo', () => {
  it('se desbloquea cuando los tres trofeos 1-3 están desbloqueados', () => {
    const expediente = trofeo({ id: 'exp', dificultad: 4, titulo: 'Expediente Cerrado: X' });
    const trofeos = [
      trofeo({ id: 't1', dificultad: 1, valorActual: 1 }),
      trofeo({ id: 't2', dificultad: 2, valorActual: 1 }),
      trofeo({ id: 't3', dificultad: 3, valorActual: 1 }),
    ];
    const recalculado = recalcularExpediente(expediente, trofeos, AHORA);
    expect(estaDesbloqueado(recalculado)).toBe(true);
    expect(recalculado.desbloqueadoEn).toBe(AHORA);
  });

  it('vuelve a bloquearse si se desmarca uno de los trofeos', () => {
    const expedienteAbierto = trofeo({
      id: 'exp',
      dificultad: 4,
      titulo: 'Expediente Cerrado: X',
      valorActual: 1,
      desbloqueadoEn: AHORA,
    });
    const trofeos = [
      trofeo({ id: 't1', dificultad: 1, valorActual: 1 }),
      trofeo({ id: 't2', dificultad: 2, valorActual: 0 }), // desmarcado
      trofeo({ id: 't3', dificultad: 3, valorActual: 1 }),
    ];
    const recalculado = recalcularExpediente(expedienteAbierto, trofeos, AHORA);
    expect(estaDesbloqueado(recalculado)).toBe(false);
    expect(recalculado.desbloqueadoEn).toBeUndefined();
  });

  it('no se desbloquea si el juego todavía no tiene trofeos 1-3', () => {
    const expediente = trofeo({ id: 'exp', dificultad: 4 });
    const recalculado = recalcularExpediente(expediente, [], AHORA);
    expect(estaDesbloqueado(recalculado)).toBe(false);
  });
});

describe('Regla 3: porcentaje del juego', () => {
  it('promedia valorActual/meta sobre todos los trofeos, incluido el Expediente', () => {
    const trofeos = [
      trofeo({ id: 't1', valorActual: 1, meta: 1 }), // 1.0
      trofeo({ id: 't2', valorActual: 0, meta: 1 }), // 0.0
      trofeo({ id: 'exp', dificultad: 4, valorActual: 0, meta: 1 }), // 0.0
    ];
    expect(calcularPorcentajeJuego(trofeos)).toBeCloseTo(1 / 3);
  });

  it('un contador con meta 100 y valor 47 aporta 0.47 de forma parcial', () => {
    const trofeos = [trofeo({ id: 't1', tipo: 'contador', meta: 100, valorActual: 47 })];
    expect(calcularPorcentajeJuego(trofeos)).toBeCloseTo(0.47);
  });

  it('devuelve 0 si el juego no tiene trofeos', () => {
    expect(calcularPorcentajeJuego([])).toBe(0);
  });
});

describe('Regla 4: XP', () => {
  it('suma los puntos de los trofeos desbloqueados en toda la biblioteca', () => {
    const trofeos = [
      trofeo({ id: 't1', dificultad: 1, valorActual: 1, meta: 1 }), // 10 pts, desbloqueado
      trofeo({ id: 't2', dificultad: 3, valorActual: 0, meta: 1 }), // 50 pts, bloqueado -> no cuenta
      trofeo({ id: 't3', dificultad: 4, valorActual: 1, meta: 1 }), // 100 pts, desbloqueado
    ];
    expect(calcularXP(trofeos)).toBe(110);
  });

  it('devuelve 0 si nada está desbloqueado', () => {
    const trofeos = [trofeo({ dificultad: 2, valorActual: 0, meta: 1 })];
    expect(calcularXP(trofeos)).toBe(0);
  });
});

describe('Regla 5: nivel', () => {
  it('el umbral del nivel n es 100 * (n-1)^1.5', () => {
    expect(umbralNivel(1)).toBe(0);
    expect(umbralNivel(2)).toBe(100);
    expect(umbralNivel(3)).toBeCloseTo(282.84, 1);
  });

  it('calcula el nivel a partir del xp, mínimo 1', () => {
    expect(calcularNivel(0)).toBe(1);
    expect(calcularNivel(50)).toBe(1);
    expect(calcularNivel(umbralNivel(2))).toBe(2);
    expect(calcularNivel(umbralNivel(5))).toBe(5);
  });
});
