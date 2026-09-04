# Prompt para Claude Code — Fase 1 (local, sin backend)

> Reemplaza por completo a `prompt-fase-1.md`. Pega esto como primer mensaje de la sesión.

---

## Contexto

Construye **Expedientes**, una PWA instalable en iPhone para llevar manualmente el progreso de trofeos en juegos de Nintendo Switch y emulación retro. Reemplaza el sistema de trofeos de PlayStation, que no existe en Nintendo.

Un solo usuario, sin cuentas y sin servidor. Todos los datos viven en el dispositivo. Todo el registro es manual: el usuario crea sus propios juegos y sus propios trofeos, y marca cuándo los cumple.

## Stack obligatorio

- React 18 + Vite + TypeScript
- `vite-plugin-pwa` en modo `autoUpdate`
- **Dexie.js** sobre IndexedDB para persistencia. No uses `localStorage` para los datos: solo sirve para preferencias de interfaz.
- `react-router-dom` con **HashRouter**
- CSS plano con variables o CSS Modules. **No uses Tailwind ni librerías de componentes.**
- Sin backend, sin autenticación, sin llamadas de red

## Modelo de datos

Define los tipos en `src/types/index.ts` y el esquema de Dexie en `src/db/index.ts`.

```ts
type Plataforma =
  | 'Switch' | 'Switch 2' | '3DS' | 'Wii U' | 'Wii'
  | 'GameCube' | 'N64' | 'SNES' | 'NES' | 'Game Boy' | 'DS' | 'Otra';

type EstadoJuego = 'backlog' | 'jugando' | 'completado' | 'abandonado';

interface Game {
  id: string;              // crypto.randomUUID()
  titulo: string;
  plataforma: Plataforma;
  portadaUrl?: string;     // URL pegada a mano en Fase 1
  estado: EstadoJuego;
  fechaInicio?: string;    // ISO date
  fechaFin?: string;
  horas: number;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

interface Trophy {
  id: string;
  gameId: string;
  titulo: string;
  descripcion?: string;
  dificultad: 1 | 2 | 3 | 4;
  tipo: 'binario' | 'contador';
  meta: number;            // 1 si es binario
  valorActual: number;
  oculto: boolean;
  orden: number;
  desbloqueadoEn?: string; // ISO datetime, derivado — nunca se escribe a mano
  creadoEn: string;
}
```

Índices de Dexie: `games: 'id, estado, plataforma'` y `trophies: 'id, gameId, dificultad, desbloqueadoEn'`.

## Niveles de dificultad

Constante en `src/domain/dificultades.ts`, no hardcodeada en los componentes:

| Nivel | Nombre | Puntos | Color |
|---|---|---|---|
| 1 | Rastro | 10 | `#7E8C99` |
| 2 | Pista | 25 | `#4E7F8C` |
| 3 | Caso | 50 | `#C08A2E` |
| 4 | Expediente Cerrado | 100 | `#8E3B3B` |

## Reglas de dominio

Van en `src/domain/progreso.ts` como **funciones puras y testeables**, separadas de la interfaz. Esta es la lógica que hace que la app se sienta como un sistema de trofeos de verdad; no la disperses entre componentes.

1. **El desbloqueo es derivado, nunca manual.** Un trofeo está desbloqueado si `valorActual >= meta`. Cuando eso pasa por primera vez, se sella `desbloqueadoEn` con la fecha actual. Si el valor baja por debajo de la meta, `desbloqueadoEn` vuelve a `undefined`.

2. **El Expediente Cerrado se abre solo.** Cada juego tiene exactamente un trofeo de dificultad 4. Se desbloquea automáticamente cuando todos los trofeos de dificultad 1 a 3 de ese juego están desbloqueados, y vuelve a bloquearse si alguno se desmarca. **La interfaz lo muestra pero no permite marcarlo, editar su progreso ni borrarlo.** Recalcula tras cada cambio en cualquier otro trofeo del juego.

3. **Porcentaje del juego.** Promedio de `valorActual / meta` sobre todos sus trofeos, incluido el Expediente. Los contadores suman parcialmente: 47 de 100 aporta 0.47.

4. **XP.** Suma de los puntos de todos los trofeos desbloqueados, en toda la biblioteca.

5. **Nivel.** Umbral del nivel `n` = `100 · (n-1)^1.5`. Por tanto `nivel = floor((xp / 100)^(2/3)) + 1`, mínimo 1. En Fase 1 solo calcula y guarda estas funciones con sus tests; la pantalla de perfil es Fase 2.

Escribe tests con Vitest para las cinco reglas. Es la única parte del proyecto que lleva tests en Fase 1.

## Alcance de la Fase 1

Construye exactamente esto:

1. **Biblioteca** — grid de juegos con portada, título, plataforma y anillo de progreso. Filtro por estado. Estado vacío que invite a añadir el primer juego.
2. **Crear y editar juego** — todos los campos del tipo `Game`. Al crear un juego, crea automáticamente su Expediente Cerrado con título editable (por defecto `Expediente Cerrado: <título>`) y `meta = 1`.
3. **Detalle de juego** — cabecera con portada, porcentaje y conteo. Trofeos agrupados por dificultad de 1 a 4. Los binarios tienen un control grande para marcar; los contadores, un stepper más un campo para escribir el valor directo.
4. **Crear y editar trofeo** — título, descripción, dificultad de 1 a 3, tipo, meta si es contador, marca de oculto.
5. **Respaldo** — pantalla de ajustes con dos acciones:
   - **Exportar**: descarga un JSON con todos los juegos y trofeos, más un campo `version` y la fecha. Nombre del archivo: `expedientes-AAAA-MM-DD.json`. En iOS usa un enlace de descarga; el usuario lo guarda en Archivos o iCloud.
   - **Importar**: selector de archivo, valida la estructura, muestra un resumen de lo que va a entrar y **pide confirmación explícita** antes de reemplazar los datos actuales.
6. **Borrado** — juegos y trofeos, con confirmación.

**No construyas:** integración con IGDB, generación de trofeos por IA, timeline de actividad, pantalla de perfil con niveles, sonidos, animaciones de desbloqueo, estadísticas, sincronización. Si te sobra tiempo, mejora lo que ya está en lugar de adelantar fases.

## Dirección visual

El producto es un archivo de casos, no un dashboard. Un trofeo es una prueba archivada. Cada juego es un expediente que se cierra. Esa metáfora manda sobre cualquier decisión estética, y la app se usa de noche, con el iPhone en la mano.

**Paleta** (variables CSS en `:root`):

```
--tinta      #0F1B21   fondo, azul petróleo profundo, deliberadamente no negro
--niebla     #16252C   superficies elevadas
--humo       #22353E   bordes y separadores
--papel      #E4DDCE   texto principal, blanco cálido de papel de archivo
--apagado    #8A9AA3   texto secundario
--latón      #C08A2E   acento único: progreso, acciones primarias
--sangre     #8E3B3B   reservado exclusivamente al Expediente Cerrado
```

El latón es el único acento. El sangre aparece una sola vez por juego. Nada más lleva color.

**Tipografía** — dos familias de Google Fonts, claramente distintas:
- Zilla Slab para títulos de juego y de trofeo: slab con carácter de máquina de escribir, coherente con el expediente.
- Archivo para interfaz, cifras y texto corrido.

Escala tipográfica de 1.25. Interlineado 1.5 en texto corrido, 1.15 en títulos.

**Principios**

- El anillo de progreso es la pieza memorable. SVG con `stroke-dasharray`, transición suave al cambiar, porcentaje en el centro. Es lo único que puede permitirse ser llamativo.
- Un trofeo bloqueado no es un trofeo gris. Se lee como una ficha pendiente, con presencia propia: opacidad alta, borde marcado, título sin desaturar.
- Los ocultos muestran `???` en el título y esconden la descripción hasta desbloquearse.
- La única animación no provocada por el usuario es la del anillo al cargar. Todo lo demás responde a una acción.
- Respeta `prefers-reduced-motion`.

**Evita** estos defaults: eyebrows en mayúsculas sobre cada título, tarjetas redondeadas idénticas para todo tipo de contenido, la misma sombra gris bajo cada elemento, flechas `→` pegadas al texto de los botones, degradados decorativos, fuentes monoespaciadas para las cifras.

## Requisitos móviles

Se usa **solo en iPhone**, en vertical. Diseña para 390 px de ancho y escala hacia arriba, no al revés.

- `viewport-fit=cover` y `env(safe-area-inset-bottom)` en la navegación inferior
- Áreas táctiles mínimas de 44×44 px
- `-webkit-tap-highlight-color: transparent` y estados `:active` propios
- `overscroll-behavior-y: contain`
- Manifest con `display: standalone`, `theme_color: #0F1B21`, íconos de 192 y 512 px, y `start_url` relativa
- No uses `navigator.vibrate`: Safari en iOS no lo soporta

## Despliegue en GitHub Pages

El repositorio es privado y se publica con GitHub Pages desde una GitHub Action.

- `base: '/expedientes/'` en `vite.config.ts`
- `HashRouter`, no `BrowserRouter`
- Workflow en `.github/workflows/deploy.yml` que construya con Node 20 y publique `dist` con `actions/deploy-pages`
- Sin variables de entorno: no hay nada secreto que inyectar

## Estructura

```
src/
  db/index.ts            esquema Dexie y helpers de acceso
  domain/progreso.ts     reglas puras + tests
  domain/dificultades.ts
  types/index.ts
  components/            ProgressRing, TrophyRow, GameCard, Modal, Stepper, ConfirmDialog
  routes/                Library, GameDetail, GameForm, TrophyForm, Settings
  styles/tokens.css
  App.tsx
```

## Método de trabajo

1. Antes de escribir código, muéstrame un plan corto: rutas, componentes y forma de las funciones de dominio. Espera mi visto bueno.
2. Construye por orden: tipos y dominio con tests → base de datos → tokens y layout → biblioteca → detalle → formularios → respaldo.
3. Sin `any`.
4. No puedo ver capturas: trabajo desde el iPhone. En cada hito descríbeme el resultado, critícalo tú mismo, y espera a que yo revise la app publicada.
5. Al terminar, un `README.md` con cómo levantarlo, cómo desplegarlo y cómo instalarlo en el iPhone.

## Criterios de aceptación

- Creo un juego y su Expediente Cerrado aparece solo en la lista, bloqueado y sin controles para marcarlo.
- Añado tres trofeos de dificultad 1 a 3, los marco todos, y el Expediente Cerrado se desbloquea solo.
- Desmarco uno y el Expediente vuelve a bloquearse.
- Un trofeo contador con meta 100 y valor 47 sube el porcentaje del juego de forma parcial.
- Cierro la app por completo, la reabro, y todo sigue ahí.
- Exporto el JSON, borro un juego, importo el respaldo, y el juego vuelve.
- Instalada desde Safari se abre a pantalla completa, sin barra de navegador y sin nada tapado por el notch ni por la barra inferior.
- Todo se maneja con una sola mano.
