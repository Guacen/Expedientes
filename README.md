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
npm run test     # tests de Vitest sobre las reglas de dominio (src/domain/progreso.ts)
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
  types/index.ts          Game, Trophy y tipos asociados
  components/             ProgressRing, GameCard, TrophyRow, Stepper, Modal, ConfirmDialog, BottomNav
  routes/                 Library, GameDetail, GameForm, TrophyForm, Settings
  styles/tokens.css       paleta, tipografía, resets
```

## Alcance de esta fase (Fase 1)

Biblioteca con filtro por estado, alta/edición/borrado de juegos y trofeos, detalle de
juego con trofeos agrupados por dificultad, el Expediente Cerrado que se abre y cierra
solo, y respaldo manual por JSON (exportar/importar con confirmación). No incluye
integración con IGDB, generación de trofeos por IA, timeline, pantalla de perfil,
sonidos, animaciones de desbloqueo, estadísticas ni sincronización.
