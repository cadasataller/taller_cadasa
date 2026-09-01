# SPEC-01 — Types, servicios y store de lectura

## Objetivo

Definir la base técnica de lectura de `seguimiento/tareas` para que la fase 1 tenga contratos claros antes de construir UI.

Este spec cubre types, servicios de consulta, store de orquestación y composable de pantalla en modo lectura.

## Dependencias

Implementar después de:

```txt
SPEC-00-alcance-ruta-workspace-lectura.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
```

## Fuentes de dominio

```txt
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Capas esperadas

```txt
types
service
store
composable
```

## Responsabilidad de cada capa

Types:

- representan tarea, duda, tracker visible, filtros de consulta y detalle;
- modelan estados de carga y selección;
- separan entidades base de DTOs remotos si hace falta.

Service:

- resuelve consultas remotas;
- encapsula exclusivamente los RPC de negocio de tareas definidos en la documentación;
- no contiene estado visual.

Store:

- es la única fuente de verdad mutable de la pantalla;
- conserva filtros, selección, resultados, errores y estados de carga;
- coordina mapa, listado y detalle en lectura.

Composable:

- expone refs y acciones listas para la vista;
- concentra side effects de ciclo de vida;
- no reemplaza al store como dueño del estado.

## Estado mínimo esperado

El store de lectura debe contemplar al menos:

```txt
filtros globales
loading inicial
error inicial
listado de tareas visibles
tarea seleccionada
detalle cargado
estado del panel derecho
estado de mapa listo / error
trackers visibles
herramientas flotantes del mapa
```

## Contratos RPC obligatorios de fase 1

El service debe usar estas RPCs, sin consultas directas a tablas internas:

```ts
listar_tareas_rastreo_v2({
  p_area_id,
  p_fecha,
  p_usuario_asignado_id,
  p_source_id,
  p_estado_operativo_codigo,
  p_incluir_canceladas,
});

obtener_tarea_detalle_v2({ p_tarea_id });

listar_rutas_planificadas_v2({
  p_area_id,
  p_fecha,
  p_usuario_id,
  p_source_id,
});
```

`listar_tareas_rastreo_v2` es la fuente del listado, filtros, puntos simples, tracker visible y resumen de permanencia. No devuelve líneas, zonas ni redes pesadas.

`obtener_tarea_detalle_v2` es la fuente del panel derecho y devuelve `tarea`, `asignacion`, `estado`, `tiempo`, `visitas`, `ruta` y `permisos`; las geometrías de línea y zonas llegan como GeoJSON.

`listar_rutas_planificadas_v2` entrega las polilíneas viales y paradas. Es una
carga suplementaria y no bloqueante: se dispara en paralelo con el listado
solo cuando hay área, fecha y trabajador o equipo.

Cuando exista, `ruta` usa el DTO remoto
`{ ruta_planificada_id, estado_calculo, ... }`. El mapper debe convertir
`ruta_planificada_id` al nombre de identificador usado por el modelo de UI;
el schema no debe esperar una clave remota llamada `id`.

Los types remotos deben representar esos dos contratos y los mappers deben convertirlos al modelo de UI. No se permite utilizar `Record<string, unknown>` ni inferir WKT/PostGIS dentro del cliente para suplir un contrato que ya devuelve la RPC.

## Consultas mínimas de fase 1

La fase 1 necesita al menos resolver conceptualmente:

1. colección de tareas visibles mediante `listar_tareas_rastreo_v2`;
2. detalle de tarea seleccionada mediante `obtener_tarea_detalle_v2`;
3. tracker, punto y estado operativo incluidos por el RPC de listado;
4. geometrías y metadatos ampliados incluidos por el RPC de detalle.

## Regla de carga

- La carga inicial no debe disparar múltiples consultas redundantes por cada panel.
- El listado es la primera fuente visible de selección.
- El detalle se carga al seleccionar una tarea si no vino ya suficientemente hidratado.
- El mapa puede renderizarse con datos parciales mientras completa capas secundarias.
- Los errores parciales no deben tumbar por completo el workspace.

## Selección y sincronización

La selección de una tarea debe sincronizar:

- item activo en el listado;
- marcadores y foco lógico en el mapa;
- contenido del panel derecho;
- contexto visual de tipo `finca`, `zona` o `duda`.

No debe haber fuentes de selección paralelas y contradictorias.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/tareasSeguimiento.types.ts
src/stores/seguimiento/tareas/tareasSeguimiento.service.ts
src/stores/seguimiento/tareas/tareasSeguimiento.mappers.ts
src/stores/seguimiento/tareas/tareasSeguimiento.helpers.ts
src/stores/seguimiento/tareas/tareasSeguimiento.store.ts
src/composables/seguimiento/useSeguimientoTareasView.ts
```

Los nombres finales pueden ajustarse, pero la separación no debe perderse.

## No hacer

- No consultar Supabase directamente desde componentes.
- No usar `.from(...)` para leer tablas del dominio de tareas desde el service de fase 1.
- No repartir estado equivalente entre view, composable y store.
- No crear un service único gigante que mezcle mapa, tareas y permisos sin frontera interna.
- No diseñar el store de lectura con supuestos de creación o edición como comportamiento activo.

## Criterios de aceptación

- La base técnica de lectura queda separada por capas.
- El store concentra filtros, selección, cargas y errores.
- El detalle y el mapa consumen la misma fuente de verdad.
- La UI futura puede montarse sin queries directas.
