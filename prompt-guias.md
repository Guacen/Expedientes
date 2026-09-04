# Prompt para Claude Code — Guías de trofeo

> Fase 2b. Pega esto como primer mensaje de una sesión nueva sobre el repositorio `Expedientes`.

---

## Objetivo

Cada trofeo puede llevar ahora una **guía**: un texto corto que explica dónde conseguirlo y, sobre todo, en qué momento exacto marcarlo. El problema que resuelve es la duda de "¿esto ya cuenta o todavía no?", que es lo que hace pesado el registro manual.

## Cambios en el modelo

Añade a `Trophy` un campo opcional:

```ts
guia?: string;
```

Es opcional a propósito: los trofeos que el usuario ya tiene guardados no lo traen y deben seguir funcionando sin tocar nada. Sube la versión del esquema de Dexie con una migración vacía; no hay que transformar datos.

El formato de plantilla del catálogo pasa a `version: 2` y admite `guia` en cada trofeo. **La validación debe aceptar tanto plantillas de versión 1 como de versión 2**, tratando `guia` como ausente en las primeras.

## Cambios en la interfaz

**En el detalle del juego.** Un trofeo que tiene guía muestra un control discreto para desplegarla, en la propia fila del trofeo. Cerrado por defecto. Al abrirlo, la guía aparece bajo la descripción, en texto secundario y con un tratamiento que la distinga claramente de la descripción: la descripción dice qué es el trofeo, la guía dice cómo y cuándo. Un trofeo sin guía no muestra el control.

Los trofeos ocultos esconden también la guía. Revelar la pista sería revelar el trofeo.

**En el formulario de trofeo.** Un campo de texto multilínea para la guía, opcional, con una etiqueta que explique para qué sirve.

**En el catálogo.** Si una plantilla trae guías, indícalo en su ficha antes de importar. Es un argumento para elegirla.

## Actualizar la plantilla existente

Reemplaza `src/catalogo/botw.json` con el archivo `botw.json` que está en la raíz del repositorio, y borra el de la raíz. Trae guías en los 30 trofeos y corrige tres errores de la versión anterior:

- Los recuerdos capturados son 13, no 18.
- El Lynel dorado solo existe en Modo Experto; en el juego base el máximo es el plateado.
- "Guardarropa completo" pedía algo inalcanzable sin contenido descargable; ahora pide un solo conjunto al nivel máximo.

Si el usuario ya había importado la versión anterior en su dispositivo, esos tres trofeos quedan desactualizados. **No intentes migrar sus datos.** En su lugar, en la ficha del catálogo, cuando un juego ya está en la biblioteca, ofrece una acción **Actualizar desde el catálogo** que:

1. Muestre exactamente qué va a pasar: trofeos nuevos que se añaden, trofeos que cambian de texto o de meta, y trofeos que ya no están en la plantilla.
2. **Conserve el progreso de los trofeos que coincidan por título.**
3. Pida confirmación explícita antes de aplicar.
4. Deje al usuario cancelar sin efecto.

Esta acción es la parte delicada de la tarea. Si hay que sacrificar algo por tiempo, sacrifica lo estético, no esto.

## Lo que no cambia

Nada de red, nada de generación por IA dentro de la app, ningún cambio en el motor de progreso ni en el Expediente Cerrado. Misma paleta y misma tipografía.

## Método

1. Muéstrame el plan primero, con especial detalle en la lógica de actualización desde catálogo. Espera mi aprobación.
2. No puedo ver capturas: trabajo desde el iPhone. Descríbeme el resultado y espera a que revise la app publicada.
3. Añade tests a la función que compara una plantilla con un juego existente y calcula el diff.

## Criterios de aceptación

- Importo Breath of the Wild y cada trofeo tiene su guía plegada, que se abre al tocarla.
- El trofeo oculto muestra `???` y no deja ver ni descripción ni guía.
- Creo un trofeo a mano sin guía y su fila no muestra ningún control sobrante.
- Un juego importado con la plantilla vieja se puede actualizar, y los trofeos que ya tenía marcados siguen marcados después.
- El diff me dice con claridad qué cambia antes de que yo confirme.
- Una plantilla de versión 1 pegada en Ajustes sigue importándose sin error.
