# SPEC-00 — Alcance, ruta y workspace de lectura

> Fase: 1 — Visualización
>
> Submódulo: Seguimiento / Tareas
>
> Ruta objetivo: `/seguimiento/tareas`

## Objetivo

Fijar el alcance exacto de la primera entrega del submódulo `tareas` y dejar claro qué entra y qué no entra en esta fase de solo lectura.

## Dependencias

Implementar después de:

```txt
documentacion/specs/seguimiento/shared/SPEC-00-base-modulo-rutas-permisos.md
documentacion/specs/seguimiento/shared/SPEC-01-simulacion-dev-y-taxonomia-permisos.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
```

## Fuentes obligatorias

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Objetivo funcional de la fase 1

Entregar un workspace de lectura que permita:

1. entrar a `/seguimiento/tareas` con protección por permisos;
2. ver el mapa operativo;
3. filtrar por criterios globales;
4. ver el listado lateral de tareas;
5. abrir el detalle de una tarea;
6. visualizar tareas de tipo `duda`;
7. distinguir estados, ubicaciones, tracker y contexto operativo;
8. recuperarse de errores de carga sin recargar toda la aplicación.

## Alcance confirmado

Incluye:

- ruta protegida;
- shell principal del workspace;
- mapa en modo lectura;
- filtros superiores;
- herramientas básicas del mapa;
- listado lateral de tareas;
- panel derecho de detalle;
- visualización de `finca`, `zona` y `duda`;
- estados loading, empty, error y retry;
- responsive desktop/mobile;
- contratos de lectura, store y composable de visualización.

No incluye:

- creación manual;
- edición manual;
- cancelación;
- eliminación lógica;
- restauración;
- guardado de geometría;
- formularios persistentes;
- acciones administrativas destructivas;
- alta manual de `duda`.

## Modelo de workspace esperado

Basado en el mockup desktop, la composición de la pantalla debe responder a este esquema:

```txt
TrackingTasksView
├── barra superior flotante de filtros globales
├── herramientas flotantes del mapa
├── panel lateral izquierdo de tareas
├── mapa / workspace central
└── panel derecho contextual en modo view
```

La fase 1 sólo activa el panel derecho en modo:

```txt
view
```

## Decisiones confirmadas

- La vista es de solo lectura.
- `Duda` aparece en el mismo listado que las demás tareas.
- `Duda` puede abrir detalle, pero no acciones de crear o editar.
- El mapa no es decorativo; participa de la lectura operativa.
- La toolbar superior opera sobre el workspace completo.
- La ruta debe usar permisos del módulo `seguimiento`.
- La carga del workspace usa `listar_tareas_rastreo_v2` y el detalle usa `obtener_tarea_detalle_v2`.
- La fase 1 no consulta directamente tablas internas de tareas, trackers, visitas, rutas o estados.

## Archivos previstos

```txt
src/views/seguimiento/SeguimientoTareasView.vue
src/composables/seguimiento/useSeguimientoTareasView.ts
src/stores/seguimiento/tareas/**
src/components/seguimiento/tareas/**
src/components/seguimiento/shared/**
```

La ubicación exacta de carpetas puede afinarse después, pero este spec exige separación entre vista, composición, store y componentes.

## Regla de permisos en fase 1

Lectura mínima:

```txt
module_seguimiento
ver_tareas_seguimiento
```

Lecturas especializadas recomendadas desde ya:

```txt
ver_detalle_tarea_seguimiento
ver_dudas_seguimiento
ver_mapa_seguimiento
ver_tracker_tarea_seguimiento
```

En desarrollo, `testjl@cadasa.com` puede atravesar este flujo según la simulación temporal definida en `shared/SPEC-01`.

## No hacer

- No mostrar botones de crear, editar, cancelar o eliminar.
- No abrir panel derecho en modo `create` o `edit`.
- No mezclar implementación de lectura con payloads de escritura.
- No convertir la vista en un único archivo gigante con toda la lógica embebida.
- No tratar `duda` como tarea editable silenciosamente.

## Criterios de aceptación

- La fase 1 queda limitada explícitamente a lectura.
- El workspace queda descrito como una unidad coherente.
- La ruta y el nivel de permisos de lectura quedan definidos.
- La evolución futura a creación y edición no obliga a rehacer esta base.
