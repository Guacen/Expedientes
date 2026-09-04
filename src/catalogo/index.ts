import { validarPlantilla } from '../domain/catalogo';
import type { PlantillaCatalogo } from '../types';

export interface EntradaCatalogo {
  archivo: string;
  plantilla: PlantillaCatalogo;
}

// Cualquier archivo .json que se agregue a esta carpeta aparece en el catálogo
// sin tocar más código: no hay red, todo viene empaquetado en el build.
const modulos = import.meta.glob<{ default: unknown }>('./*.json', { eager: true });

export const CATALOGO: EntradaCatalogo[] = Object.entries(modulos)
  .map(([archivo, modulo]): EntradaCatalogo | null => {
    const resultado = validarPlantilla(modulo.default);
    if (!resultado.valida) {
      console.warn(`Plantilla inválida en ${archivo}: ${resultado.error}`);
      return null;
    }
    return { archivo, plantilla: resultado.plantilla };
  })
  .filter((entrada): entrada is EntradaCatalogo => entrada !== null)
  .sort((a, b) => a.plantilla.juego.titulo.localeCompare(b.plantilla.juego.titulo));
