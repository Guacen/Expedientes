export interface DificultadInfo {
  nivel: 1 | 2 | 3 | 4;
  nombre: string;
  puntos: number;
  color: string;
}

export const DIFICULTADES: Record<1 | 2 | 3 | 4, DificultadInfo> = {
  1: { nivel: 1, nombre: 'Rastro', puntos: 10, color: '#7E8C99' },
  2: { nivel: 2, nombre: 'Pista', puntos: 25, color: '#4E7F8C' },
  3: { nivel: 3, nombre: 'Caso', puntos: 50, color: '#C08A2E' },
  4: { nivel: 4, nombre: 'Expediente Cerrado', puntos: 100, color: '#8E3B3B' },
};
