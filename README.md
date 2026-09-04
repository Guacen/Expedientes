# Expedientes

PWA instalable en iPhone para llevar manualmente el progreso de trofeos en juegos de
Nintendo Switch y emulación retro. Un solo usuario, sin cuentas, sin backend. Todos los
datos viven en el dispositivo (IndexedDB vía Dexie); tú creas tus propios juegos y
trofeos, y marcas a mano cuándo los cumples.

## Levantar en local

Requiere Node 20+.

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173/expedientes/`).

Otros comandos:

```bash
npm run test     # tests de Vitest sobre las reglas de dominio y la validación del catálogo
npm run build    # typecheck + build de producción en dist/
npm run preview  # sirve dist/ localmente para probar el build
```

## Desplegar en GitHub Pages

El repositorio es privado y se publica desde `.github/workflows/deploy.yml`:

1. Haz push a `main`.
2. La Action construye con Node 20 y publica `dist/` con `actions/deploy-pages`.
3. En el repo de GitHub: **Settings → Pages → Source: GitHub Actions** (solo hace falta
   una vez).
4. La app queda en `https://<usuario>.github.io/expedientes/`.

No hay variables de entorno que configurar: no hay nada secreto que inyectar.

## Instalar en el iPhone

1. Abre la URL publicada en **Safari** (tiene que ser Safari, no otro navegador).
2. Toca el botón de compartir (el cuadrado con la flecha hacia arriba).
3. Elige **Añadir a pantalla de inicio**.
4. Ábrela desde el ícono nuevo: se abre a pantalla completa, sin barra de Safari.

Los datos se guardan en el IndexedDB de ese dispositivo. Si desinstalas la app o borras
los datos del sitio en Safari, se pierden — usa **Ajustes → Exportar** de vez en cuando
para guardar un respaldo en Archivos o iCloud.

## Estructura

```
src/
  db/index.ts            esquema Dexie y helpers de acceso/orquestación
  domain/progreso.ts      reglas puras + tests (Vitest)
  domain/dificultades.ts  constante de niveles, puntos y colores
  domain/catalogo.ts      validación de plantillas + tests (Vitest)
  catalogo/                *.json del catálogo + cargador (import.meta.glob)
  types/index.ts          Game, Trophy, PlantillaCatalogo y tipos asociados
  components/             ProgressRing, GameCard, TrophyRow, Stepper, Modal, ConfirmDialog, BottomNav
  routes/                 Library, Catalog, AddGame, GameDetail, GameForm, TrophyForm, Settings
  styles/tokens.css       paleta, tipografía, resets
```

## Añadir un juego al catálogo

El catálogo (`/catalogo` en la app) es una lista de plantillas ya redactadas: se
importan de una y arman el juego completo con todos sus trofeos y su Expediente
Cerrado. No hay red ni backend — las plantillas viajan empaquetadas en el build.

Para añadir una, crea un archivo en `src/catalogo/` con esta forma (mira
`src/catalogo/botw.json` como ejemplo completo):

```json
{
  "version": 1,
  "juego": {
    "titulo": "Nombre del juego",
    "plataforma": "Switch",
    "estado": "backlog"
  },
  "trofeos": [
    {
      "titulo": "Título del trofeo",
      "descripcion": "Opcional.",
      "dificultad": 1,
      "tipo": "binario",
      "meta": 1,
      "oculto": false
    }
  ]
}
```

Reglas: nunca lleva `id` ni fechas (la app los genera), nunca lleva el trofeo de
dificultad 4 (el Expediente Cerrado se arma solo), `dificultad` va de 1 a 3, y los
binarios siempre tienen `meta: 1`. Guarda el archivo y haz commit — aparece en el
catálogo sin tocar más código.

Si no quieres esperar a un despliegue, en **Ajustes → Importar plantilla desde texto**
puedes pegar el mismo JSON directamente; se valida igual y crea el juego al instante.

## Alcance de esta fase (Fase 1 + catálogo)

Biblioteca con filtro por estado, alta/edición/borrado de juegos y trofeos, detalle de
juego con trofeos agrupados por dificultad, el Expediente Cerrado que se abre y cierra
solo, respaldo manual por JSON (exportar/importar con confirmación), y un catálogo de
plantillas para armar juegos completos de una vez (desde archivos empaquetados o
pegando el JSON en Ajustes). No incluye integración con IGDB, generación de trofeos por
IA, descarga de plantillas desde una URL, timeline, pantalla de perfil, sonidos,
animaciones de desbloqueo, estadísticas ni sincronización.
