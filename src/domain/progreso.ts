import type { Trophy } from '../types';
import { DIFICULTADES } from './dificultades';

/** Regla 1: el desbloqueo es derivado, nunca manual. */
export function estaDesbloqueado(t: Pick<Trophy, 'valorActual' | 'meta'>): boolean {
  return t.valorActual >= t.meta;
}

/**
 * Aplica un nuevo valorActual a un trofeo. Sella desbloqueadoEn la primera vez que
 * cruza la meta, y lo limpia si vuelve a caer por debajo. Si el estado de desbloqueo
 * no cambia, desbloqueadoEn queda intacto (no se resella).
 */
export function conNuevoValor(trophy: Trophy, valorActual: number, ahora: string): Trophy {
  const eraDesbloqueado = estaDesbloqueado(trophy);
  const actualizado: Trophy = { ...trophy, valorActual };
  const esDesbloqueadoAhora = estaDesbloqueado(actualizado);

  if (!eraDesbloqueado && esDesbloqueadoAhora) {
    actualizado.desbloqueadoEn = ahora;
  } else if (eraDesbloqueado && !esDesbloqueadoAhora) {
    actualizado.desbloqueadoEn = undefined;
  }

  return actualizado;
}

/** Alterna un trofeo binario entre bloqueado (0) y desbloqueado (meta). */
export function alternarBinario(trophy: Trophy, ahora: string): Trophy {
  const nuevoValor = estaDesbloqueado(trophy) ? 0 : trophy.meta;
  return conNuevoValor(trophy, nuevoValor, ahora);
}

/**
 * Regla 2: el Expediente Cerrado se abre solo cuando todos los trofeos 1-3 del
 * juego están desbloqueados, y vuelve a cerrarse si alguno se desmarca.
 */
export function recalcularExpediente(
  expediente: Trophy,
  trofeosDelJuego: Trophy[],
  ahora: string,
): Trophy {
  const todosDesbloqueados =
    trofeosDelJuego.length > 0 && trofeosDelJuego.every((t) => estaDesbloqueado(t));
  const nuevoValor = todosDesbloqueados ? expediente.meta : 0;
  return conNuevoValor(expediente, nuevoValor, ahora);
}

/**
 * Regla 3: promedio de valorActual/meta sobre todos los trofeos del juego,
 * incluido el Expediente. Los contadores aportan parcialmente.
 */
export function calcularPorcentajeJuego(trofeos: Trophy[]): number {
  if (trofeos.length === 0) return 0;
  const suma = trofeos.reduce((acc, t) => acc + (t.meta > 0 ? t.valorActual / t.meta : 0), 0);
  return suma / trofeos.length;
}

/** Regla 4: XP = suma de puntos de todos los trofeos desbloqueados, en toda la biblioteca. */
export function calcularXP(trofeos: Trophy[]): number {
  return trofeos
    .filter((t) => estaDesbloqueado(t))
    .reduce((acc, t) => acc + DIFICULTADES[t.dificultad].puntos, 0);
}

/** Regla 5: umbral de XP requerido para alcanzar un nivel dado. */
export function umbralNivel(nivel: number): number {
  return 100 * Math.pow(nivel - 1, 1.5);
}

/** Regla 5: nivel alcanzado con un total de XP dado, mínimo 1. */
export function calcularNivel(xp: number): number {
  // Epsilon para evitar que el redondeo de punto flotante de Math.pow deje
  // un xp exactamente en el umbral (p. ej. 800 -> 3.9999999999999996) un
  // nivel por debajo del que le corresponde.
  const progreso = Math.pow(xp / 100, 2 / 3) + 1e-9;
  return Math.max(1, Math.floor(progreso) + 1);
}
