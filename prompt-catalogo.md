# Prompt para Claude Code — Catálogo de plantillas

> Fase 2a. Pega esto como primer mensaje de una sesión nueva sobre el repositorio `Expedientes`.

---

## Objetivo

Hoy el usuario tiene que escribir cada trofeo a mano. Añade un **catálogo de plantillas**: listas de trofeos ya redactadas que se importan de una sola vez y crean el juego completo.

Las plantillas se generan fuera de la app y se guardan como archivos JSON en el repositorio. La app no llama a ninguna API ni necesita red: lee los archivos que vienen empaquetados en el build.

## Formato de plantilla

Cada archivo vive en `src/catalogo/` y tiene esta forma:

```json
{
  "version": 1,
  "juego": {
    "titulo": "The Legend of Zelda: Breath of the Wild",
    "plataforma": "Switch",
    "estado": "backlog"
  },
  "trofeos": [
    {
      "titulo": "Abre los ojos",
      "descripcion": "Sal del Santuario de la Resurrección...",
      "dificultad": 1,
      "tipo": "binario",
      "meta": 1,
      "oculto": false
    }
  ]
}
```

Reglas del formato:

- Las plantillas **nunca traen ids ni fechas**. La app los genera al importar.
- Las plantillas **nunca traen el trofeo de dificultad 4**. Se crea solo, como en cualquier juego nuevo.
- `dificultad` va de 1 a 3.
- Los `oculto: true` se muestran como `???` hasta desbloquearse, igual que ahora.

Define un tipo `PlantillaCatalogo` en `src/types/` y una función de validación en `src/domain/catalogo.ts` que rechace plantillas malformadas con un mensaje claro.

## Qué construir

**1. Carga del catálogo.** Usa `import.meta.glob('./catalogo/*.json', { eager: true })` para que cualquier archivo JSON nuevo en esa carpeta aparezca en la app sin tocar más código. Añadir un juego al catálogo debe ser: crear un archivo, hacer commit, listo.

**2. Nueva ruta `/catalogo`.** Lista las plantillas disponibles mostrando título, plataforma y cuántos trofeos trae, desglosados por dificultad. Si un juego del catálogo ya existe en la biblioteca (mismo título y plataforma), márcalo como ya añadido y desactiva el botón.

**3. Importar.** Al elegir una plantilla, muestra un resumen y pide confirmación. Al aceptar, crea el juego, todos sus trofeos con `valorActual: 0`, y su Expediente Cerrado. Luego navega al detalle del juego recién creado.

**4. Punto de entrada.** En la pantalla de añadir juego, ofrece dos caminos claros: **Elegir del catálogo** o **Crear en blanco**. El catálogo va primero. En el estado vacío de la biblioteca, el botón principal debe llevar al catálogo, no al formulario en blanco.

**5. Pegar una plantilla.** En Ajustes, añade **Importar plantilla desde texto**: un área donde el usuario pega el JSON de una plantilla, se valida, se muestra el resumen y se importa igual que las del catálogo. Esto permite añadir juegos sin volver a desplegar.

**6. Semilla inicial.** Crea `src/catalogo/botw.json` con el contenido del archivo `botw.json` que está en la raíz del repositorio, y mueve el archivo ahí en lugar de duplicarlo.

## Lo que no cambia

- El motor de progreso, XP y Expediente Cerrado ya está en `src/domain/`. **Reutilízalo, no lo dupliques.** Importar una plantilla no es un caso especial: es crear un juego y sus trofeos con las mismas funciones de siempre.
- Ninguna llamada de red. La app sigue funcionando completa sin conexión.
- Misma paleta, misma tipografía, mismos principios visuales. El catálogo es una lista sobria, no una tienda con portadas grandes.

## No construyas

Generación de trofeos por IA dentro de la app, descarga de plantillas desde una URL, portadas automáticas, pantalla de perfil, estadísticas. Nada de eso todavía.

## Método

1. Muéstrame primero el plan: tipos, ruta, componentes y cómo encaja con el dominio existente. Espera mi aprobación.
2. No puedo ver capturas, trabajo desde el iPhone. Descríbeme el resultado y espera a que yo revise la app publicada.
3. Actualiza el `README.md` con una sección corta sobre cómo añadir un juego al catálogo.

## Criterios de aceptación

- Entro al catálogo, veo Breath of the Wild con sus 30 trofeos desglosados por dificultad, lo importo, y aparece en mi biblioteca al 0%.
- El Expediente Cerrado del juego importado existe, está bloqueado y no tiene controles para marcarlo.
- Marco todos los trofeos de dificultad 1 a 3 y el Expediente se abre solo.
- Vuelvo al catálogo y Breath of the Wild aparece como ya añadido.
- Pego una plantilla válida en Ajustes y se importa. Pego un JSON roto y me dice qué está mal sin romper la app.
- Los contadores grandes, como el de 900 semillas, aportan progreso parcial al porcentaje del juego.
