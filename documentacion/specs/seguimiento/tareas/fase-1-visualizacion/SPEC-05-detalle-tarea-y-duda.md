# SPEC-05 — Detalle de tarea y detalle de duda

## Objetivo

Definir el panel derecho de visualización para tareas normales y para `duda`, incluyendo sus diferencias funcionales.

## Dependencias

Implementar después de:

```txt
SPEC-04-listado-lateral-tareas.md
```

## Fuente visual

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Rol del panel derecho

El panel derecho es la superficie de lectura contextual de la tarea seleccionada.

En fase 1:

- abre en modo `view`;
- no permite edición;
- no guarda cambios;
- debe poder cerrarse;
- debe reflejar restricciones por tipo.

## Detalle de tarea operativa

Para `finca` y `zona`, el detalle debería poder mostrar al menos:

- título o descripción;
- tipo de tarea;
- trabajador asignado;
- tracker o equipo asociado;
- estado visible;
- fecha programada;
- duración estimada o tiempo relevante;
- geometría asociada;
- posición en ruta si aplica;
- señales operativas o visitas si el contrato de lectura las provee.

## Detalle de `duda`

El detalle de `duda` debe comunicar explícitamente:

- que es una detección automática;
- qué señal o contexto la originó si existe;
- tiempo o permanencia relevante;
- tracker relacionado si existe;
- ubicación o foco geográfico;
- estado de revisión si aplica;
- ausencia de acciones manuales de crear o editar.

## Diferencias funcionales obligatorias

`finca` y `zona`:

- pueden evolucionar luego a crear y editar;
- conservan semántica de tarea operativa.

`duda`:

- es solo visualización por ahora;
- no muestra CTAs de edición;
- puede usar badges y copy distintos;
- puede ocultar bloques que sólo tienen sentido para tareas manuales.

## Geometría visible

El detalle debe poder relacionarse con:

- punto de enrutado;
- línea de control;
- zona o zonas;
- posición de tarea en la ruta.

No hace falta que todo sea editable en fase 1, pero sí visible y semánticamente claro.

## Acciones permitidas en fase 1

Permitidas:

- cerrar panel;
- enfocar en mapa;
- reintentar carga del detalle o bloque parcial si falla.

No permitidas:

- editar tarea;
- cancelar tarea;
- eliminar tarea;
- crear tarea;
- modificar geometría.

## Archivos previstos

```txt
src/components/seguimiento/tareas/TaskDetailPanel.vue
src/components/seguimiento/tareas/TaskDetailSections/**
```

Si `duda` requiere layout propio, puede existir una subvariante interna sin romper el panel principal.

## No hacer

- No mostrar botones deshabilitados de edición “por si acaso”.
- No reutilizar exactamente el mismo copy entre tarea normal y duda si semánticamente no aplica.
- No esconder la naturaleza automática de `duda`.
- No depender del mockup para inventar acciones no confirmadas en esta fase.

## Criterios de aceptación

- El panel derecho queda definido como detalle de solo lectura.
- Se diferencian claramente tarea operativa y `duda`.
- La geometría visible forma parte del detalle.
- No se documentan mutaciones en la fase 1.
