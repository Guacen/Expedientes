export type Plataforma =
  | 'Switch'
  | 'Switch 2'
  | '3DS'
  | 'Wii U'
  | 'Wii'
  | 'GameCube'
  | 'N64'
  | 'SNES'
  | 'NES'
  | 'Game Boy'
  | 'DS'
  | 'Otra';

export type EstadoJuego = 'backlog' | 'jugando' | 'completado' | 'abandonado';

export interface Game {
  id: string; // crypto.randomUUID()
  titulo: string;
  plataforma: Plataforma;
  portadaUrl?: string; // URL pegada a mano en Fase 1
  estado: EstadoJuego;
  fechaInicio?: string; // ISO date
  fechaFin?: string;
  horas: number;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoTrofeo = 'binario' | 'contador';

export interface Trophy {
  id: string;
  gameId: string;
  titulo: string;
  descripcion?: string;
  dificultad: 1 | 2 | 3 | 4;
  tipo: TipoTrofeo;
  meta: number; // 1 si es binario
  valorActual: number;
  oculto: boolean;
  orden: number;
  desbloqueadoEn?: string; // ISO datetime, derivado — nunca se escribe a mano
  creadoEn: string;
}
