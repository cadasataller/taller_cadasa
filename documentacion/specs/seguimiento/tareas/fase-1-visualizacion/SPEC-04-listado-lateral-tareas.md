# SPEC-04 — Listado lateral de tareas

## Objetivo

Definir el panel lateral izquierdo y la representación visual de tareas en fase 1.

## Dependencias

Implementar después de:

```txt
SPEC-01-types-servicios-store-lectura.md
SPEC-03-filtros-superiores-y-toolbar-mapa.md
```

## Fuente visual

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Rol del panel lateral

El panel lateral izquierdo es el punto principal de exploración y selección de tareas.

La colección proviene de `listar_tareas_rastreo_v2`; el panel no solicita detalle, trackers o estados desde tablas. Al seleccionar, emite el `tarea_id` al store para solicitar `obtener_tarea_detalle_v2`.

Debe permitir:

- ver cantidad de tareas;
- entender el contexto actual;
- filtrar o segmentar localmente si se requiere;
- identificar rápidamente estado, tipo y tiempo;
- seleccionar una tarea para sincronizar detalle y mapa.

## Contenido mínimo del panel

```txt
encabezado
contador
texto de ayuda
controles locales
lista scrollable de tareas
```

## Card o item de tarea

Cada tarea visible debe poder mostrar al menos:

- título o descripción corta;
- ubicación o contexto;
- tipo de tarea;
- estado operativo o administrativo visible;
- tiempo estimado o tiempo actual relevante;
- indicador de selección;
- indicador especial cuando es `duda`.

## Reglas para `duda`

`Duda` debe diferenciarse desde el listado en:

- iconografía;
- etiqueta de tipo;
- color secundario o badge;
- texto que comunique que fue detectada automáticamente.

No debe verse como una tarea normal apenas “con otro color”.

## Selección

Al seleccionar una tarea:

- el item queda activo;
- el mapa refleja foco contextual;
- el detalle se abre o actualiza;
- la selección previa se reemplaza sin ambigüedad.

## Controles locales posibles

La referencia visual sugiere filtros rápidos como estado u opciones similares del listado.

Reglas:

- estos controles afinan la exploración del panel;
- no reemplazan los filtros globales del workspace;
- deben integrarse al mismo store de lectura;
- no deben crear una segunda fuente paralela de resultados.

## Estados del panel

Debe contemplar:

- loading inicial;
- lista con resultados;
- vacío;
- error recuperable;
- sin resultados por filtros.

Cada estado debe ser visible dentro del propio panel sin romper el mapa ni el resto del workspace.

## Archivos previstos

```txt
src/components/seguimiento/tareas/TaskListPanel.vue
src/components/seguimiento/tareas/TaskCard.vue
```

Si el listado crece en complejidad, puede partirse en `desktop/`, `mobile/` o `items/`.

## No hacer

- No convertir el panel lateral en tabla ERP rígida en móvil.
- No ocultar el tipo `duda` como si fuera un caso residual.
- No duplicar el detalle completo dentro de la card.
- No usar el color como único identificador de estado o tipo.

## Criterios de aceptación

- El panel lateral queda definido como origen primario de selección.
- Cada item expone estado, tipo y contexto mínimos.
- `Duda` se distingue funcionalmente desde el listado.
- El panel soporta loading, vacío, error y sin resultados.
