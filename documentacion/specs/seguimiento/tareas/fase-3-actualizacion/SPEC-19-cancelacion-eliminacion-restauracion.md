# SPEC-19 — Cancelación, eliminación lógica y restauración

## Objetivo

Separar y documentar las acciones administrativas sobre tareas existentes.

## Dependencias

Implementar después de:

```txt
SPEC-15-types-contratos-permisos-actualizacion.md
SPEC-16-store-composable-borrador-edicion.md
```

## Fuentes de dominio

```txt
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Acciones contempladas

```txt
cancelar tarea
eliminar lógicamente
restaurar tarea
```

## Separación funcional

Estas acciones no deben mezclarse con el submit normal de edición.

Cada una requiere:

- permiso específico;
- confirmación explícita;
- operación remota propia o claramente separada;
- actualización visible del estado de la tarea.

## Cancelación

La cancelación debe tratarse como transición administrativa de estado, no como borrado.

Debe poder contemplar al menos:

- motivo de cancelación si el negocio lo exige;
- marca temporal y actor si la respuesta o el dominio lo proveen;
- impacto visible en listado, detalle y mapa.

## Eliminación lógica

Las fuentes muestran una operación pública:

```txt
public.eliminar_tarea_logicamente(p_tarea_id uuid)
```

La UI debe tratar esta acción como:

- destructiva a nivel funcional;
- reversible solo si existe permiso y operación de restauración;
- siempre confirmada;
- separada del guardado normal.

## Restauración

Las fuentes muestran una operación pública:

```txt
public.restaurar_tarea(p_tarea_id uuid)
```

La restauración debe considerarse una acción administrativa independiente:

- no siempre visible;
- depende del estado actual de la tarea;
- requiere permiso específico;
- debe sincronizar detalle, listado y mapa.

## Permisos

```txt
cancelar_tareas_seguimiento
eliminar_tareas_seguimiento
restaurar_tareas_seguimiento
```

No asumir equivalencia entre estos permisos.

## UX

- usar confirmaciones claras;
- distinguir acciones peligrosas del botón de guardar;
- no esconder acciones destructivas dentro de un menú ambiguo sin texto suficiente;
- reflejar loading, éxito y error de cada acción por separado.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/edicion/tareaAccionesAdmin.service.ts
src/stores/seguimiento/tareas/edicion/tareaAccionesAdmin.types.ts
src/components/seguimiento/tareas/edit/TaskAdminActions.vue
src/components/seguimiento/tareas/edit/TaskAdminConfirmDialog.vue
```

## No hacer

- No ejecutar eliminación lógica desde el mismo submit de edición.
- No tratar cancelación como simple toggle visual.
- No asumir que restaurar existe para todos los estados.
- No usar un permiso único genérico para todas las acciones administrativas.

## Criterios de aceptación

- Cancelación, eliminación lógica y restauración quedan separadas.
- Cada acción exige permiso y confirmación propios.
- Las operaciones públicas del dominio quedan reflejadas en el diseño.
