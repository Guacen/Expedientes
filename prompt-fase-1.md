# Prompt para Claude Code — Fase 1

> Pega esto en Claude Code dentro de una carpeta vacía. El archivo `schema.sql` ya debe estar ejecutado en Supabase antes de empezar.

---

## Contexto

Construye **Expedientes**, una PWA instalable en iPhone para llevar manualmente el progreso de trofeos en juegos de Nintendo Switch y emulación retro. Reemplaza el sistema de trofeos de PlayStation, que no existe en Nintendo. Un solo usuario real, pero con autenticación y datos en la nube para sincronizar entre dispositivos.

Todo el registro es manual: el usuario crea sus propios juegos y sus propios trofeos, y marca cuándo los cumple.

## Stack obligatorio

- React 18 + Vite + TypeScript
- `vite-plugin-pwa` en modo `autoUpdate`
- Supabase (`@supabase/supabase-js`) para auth y datos
- Enrutado con `react-router-dom`
- CSS plano con variables o CSS Modules. **No uses Tailwind ni librerías de componentes.**
- Sin librería de estado global: React Query (`@tanstack/react-query`) para el servidor y `useState` para lo local

## Esquema de datos

Ya existe en Supabase. No lo modifiques, no crees migraciones. Léelo de `schema.sql` para conocer tablas, vistas y triggers.

Puntos clave que la UI debe respetar:

- Las tablas son `profiles`, `games`, `trophies`, `difficulty_levels`. Las vistas son `game_progress` y `profile_stats`.
- **Nunca escribas `desbloqueado_at` desde el cliente.** Un trigger lo deriva de `valor_actual >= meta`. Para desbloquear un trofeo binario, haz `update trophies set valor_actual = 1`. Para revertirlo, `valor_actual = 0`.
- Los trofeos de dificultad 4 (Expediente Cerrado) los gestiona la base de datos sola. La UI los muestra pero **no permite marcarlos ni editar su progreso**. Cuando el juego se completa, aparece desbloqueado solo.
- El porcentaje y el XP vienen de las vistas, no los calcules en el cliente.
- Los cuatro niveles son: 1 Rastro (10 pts), 2 Pista (25), 3 Caso (50), 4 Expediente Cerrado (100). Léelos de `difficulty_levels`, no los hardcodees.

## Alcance de la Fase 1

Construye exactamente esto y nada más:

1. **Auth** — login con magic link de Supabase. Una sola pantalla, sin registro separado. Sesión persistente.
2. **Biblioteca** — grid de juegos con portada, título, plataforma y anillo de progreso. Filtro por estado (todos / jugando / backlog / completado / abandonado). Estado vacío que invite a añadir el primer juego.
3. **Crear y editar juego** — título, plataforma (Switch, 3DS, Wii, GameCube, N64, SNES, NES, Game Boy, DS, Otra), estado, fechas, horas, notas. La portada en Fase 1 es una URL pegada a mano; deja el campo listo para que la Fase 2 lo llene con IGDB.
4. **Detalle de juego** — cabecera con portada, porcentaje y conteo de trofeos. Lista de trofeos agrupada por dificultad, de 1 a 4. Cada trofeo binario tiene un control grande para marcarlo. Cada trofeo contador tiene un stepper y un campo para escribir el valor directo.
5. **Crear y editar trofeo** — título, descripción, dificultad (1 a 3; el 4 se crea aparte, ver abajo), tipo binario o contador, meta si es contador, marca de oculto.
6. **Expediente Cerrado** — al crear un juego, crea automáticamente su trofeo de dificultad 4 con título editable (por defecto: `Expediente Cerrado: <título del juego>`) y `meta = 1`.
7. **Borrado** — juegos y trofeos, con confirmación explícita.

**No construyas:** integración con IGDB, generación de trofeos por IA, timeline de actividad, pantalla de perfil con niveles, sonidos, animaciones de desbloqueo, modo offline, export/import, estadísticas. Todo eso es Fase 2 en adelante. Si te sobra tiempo, mejora lo que ya está en lugar de adelantar fases.

## Dirección visual

El producto es un archivo de casos, no un dashboard. Un trofeo es una prueba archivada. Cada juego es un expediente que se cierra. Esa metáfora manda sobre cualquier decisión estética, y la aplicación se usa de noche, con el iPhone en la mano.

**Paleta** (defínela como variables CSS en `:root`):

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

**Tipografía** — dos familias claramente distintas, de Google Fonts:
- Zilla Slab para títulos de juego y de trofeo: es una slab con carácter de máquina de escribir, coherente con el expediente.
- Archivo para interfaz, cifras y texto corrido.

Escala tipográfica de 1.25. Interlineado de 1.5 en texto corrido, 1.15 en títulos.

**Principios**

- El anillo de progreso es la pieza memorable. Trabájalo bien: SVG con `stroke-dasharray`, transición suave al cambiar, el porcentaje en el centro. Es lo único que puede permitirse ser llamativo.
- Un trofeo bloqueado no es un trofeo gris. Debe leerse como una ficha pendiente, con su propia presencia: opacidad alta, borde marcado, sin desaturar el título.
- Los trofeos ocultos muestran `???` en el título y ocultan la descripción hasta desbloquearse.
- La única animación no provocada por el usuario es la del anillo al cargar. Todo lo demás responde a una acción.
- Respeta `prefers-reduced-motion`.

**Evita** estos defaults: eyebrows en mayúsculas sobre cada título, tarjetas redondeadas idénticas para todo tipo de contenido, la misma sombra gris debajo de cada elemento, flechas `→` pegadas al texto de los botones, degradados decorativos, fuentes monoespaciadas para las cifras.

## Requisitos móviles

Se usa **solo en iPhone**, en vertical. Diseña para 390 px de ancho y escala hacia arriba, no al revés.

- `viewport-fit=cover` y `env(safe-area-inset-bottom)` en la navegación inferior
- Áreas táctiles mínimas de 44×44 px
- `-webkit-tap-highlight-color: transparent` y estados `:active` propios
- `overscroll-behavior-y: contain`
- El manifest debe declarar `display: standalone`, `theme_color: #0F1B21` e íconos de 192 y 512 px
- No uses `navigator.vibrate`: Safari en iOS no lo soporta

## Estructura

```
src/
  lib/supabase.ts        cliente
  lib/queries.ts         hooks de React Query
  types/db.ts            tipos generados del esquema
  components/            ProgressRing, TrophyRow, GameCard, Modal, Stepper
  routes/                Login, Library, GameDetail, GameForm, TrophyForm
  styles/tokens.css      variables
  App.tsx
```

Variables de entorno en `.env.local`: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Incluye un `.env.example` y añade `.env.local` al `.gitignore`.

## Método de trabajo

1. Antes de escribir código, muéstrame un plan corto: rutas, componentes y forma de los hooks de datos. Espera mi visto bueno.
2. Construye por orden: tokens y layout → auth → biblioteca → detalle → formularios.
3. Escribe los tipos de TypeScript a partir del esquema real. Sin `any`.
4. Muéstrame capturas o descríbeme el resultado en cada hito y critícalo tú mismo antes de que lo revise yo.
5. Al terminar, un `README.md` con los pasos para levantarlo y desplegarlo en Vercel.

## Criterios de aceptación

- Entro con magic link y la sesión sobrevive a cerrar y reabrir la app.
- Creo un juego y su Expediente Cerrado aparece automáticamente en la lista de trofeos, bloqueado.
- Añado tres trofeos de dificultad 1 a 3, los marco todos, y el Expediente Cerrado se desbloquea solo sin que yo lo toque.
- Desmarco uno y el Expediente Cerrado vuelve a bloquearse.
- Un trofeo contador con meta 100 y valor 47 hace que el porcentaje del juego suba parcialmente.
- Instalada desde Safari, se abre a pantalla completa, sin barra de navegador y sin nada tapado por el notch ni por la barra inferior.
- Todo funciona con una sola mano en un iPhone.
