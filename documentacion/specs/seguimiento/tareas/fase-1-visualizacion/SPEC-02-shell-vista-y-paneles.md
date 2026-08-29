# SPEC-02 — Shell de vista y paneles del workspace

## Objetivo

Definir la composición general de la pantalla `seguimiento/tareas` en fase 1, incluyendo el reparto entre mapa, panel izquierdo, panel derecho y capas flotantes.

## Dependencias

Implementar después de:

```txt
SPEC-01-types-servicios-store-lectura.md
```

## Fuente visual principal

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
```

## Estructura objetivo

```txt
SeguimientoTareasView
├── TrackingFiltersBar
├── MapToolsOverlay
├── TaskListPanel
├── TrackingMapWorkspace
└── TaskDetailPanel
```

En esta fase no existe `TaskFormPanel` activo.

## Responsabilidad de la vista de ruta

La vista:

- consume el composable principal;
- distribuye props hacia los paneles;
- conecta emits con acciones del store;
- compone layout desktop y flujo móvil;
- no contiene queries ni lógica de negocio profunda.

## Layout desktop esperado

Tomando el mockup como guía:

- el mapa ocupa todo el fondo del workspace;
- los overlays flotan sobre el mapa;
- el panel izquierdo queda anclado a izquierda;
- el panel derecho queda anclado a derecha;
- los filtros superiores se ubican arriba del mapa;
- las herramientas del mapa viven en esquina superior derecha o zona equivalente;
- la apertura del panel derecho no destruye el mapa.

## Panel izquierdo

El panel izquierdo contiene:

- encabezado;
- contador;
- ayuda breve;
- controles rápidos locales del listado;
- cuerpo scrollable de cards o items de tarea.

Este panel es el punto primario de selección de tarea.

## Panel derecho

En fase 1 el panel derecho opera sólo como:

```txt
TaskDetailPanel
```

Debe:

- abrirse al seleccionar una tarea;
- cerrarse manualmente;
- reflejar tipo, estado y geometría visible;
- mostrar capacidades restringidas para `duda`;
- no contener controles activos de edición.

## Workspace central

El workspace central debe permitir:

- render del mapa base;
- capas de tarea, tracker, ruta y zonas;
- foco contextual al seleccionar una tarea;
- coexistencia con overlays sin bloquear toda la interacción.

## Densidad visual

Desktop:

- producto orientado a operación;
- paneles compactos;
- textos `text-xs` y `text-sm`;
- badges y métricas de lectura rápida;
- sin estética de formulario pesado en esta fase.

Mobile:

- el patrón puede pasar de paneles simultáneos a flujo secuencial;
- mantener objetivos táctiles mínimos de `44px`;
- evitar compresión extrema del listado o del detalle.

## Archivos previstos

```txt
src/views/seguimiento/SeguimientoTareasView.vue
src/components/seguimiento/tareas/TrackingFiltersBar.vue
src/components/seguimiento/tareas/MapToolsOverlay.vue
src/components/seguimiento/tareas/TaskListPanel.vue
src/components/seguimiento/tareas/TrackingMapWorkspace.vue
src/components/seguimiento/tareas/TaskDetailPanel.vue
```

## No hacer

- No fusionar listado, mapa y detalle en un solo componente.
- No usar el panel derecho para creación o edición todavía.
- No reconstruir el mapa completo cada vez que cambia la selección.
- No dejar que un panel lateral empuje el layout a scroll horizontal accidental.

## Criterios de aceptación

- La vista queda compuesta por paneles con responsabilidades claras.
- Desktop conserva mapa central con overlays y dos paneles.
- El panel derecho es exclusivamente de detalle.
- La composición se mantiene preparada para fases 2 y 3.
