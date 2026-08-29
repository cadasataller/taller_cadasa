# SPEC-18 — Geometría, tracker y ruta en edición

## Objetivo

Definir las reglas de actualización espacial y operativa de una tarea existente.

## Dependencias

Implementar después de:

```txt
SPEC-17-formulario-edicion-restricciones-ux.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-11-geometria-mapa-posicion-ruta.md
```

## Fuentes de dominio

```txt
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Ámbitos de cambio

La edición puede involucrar:

- cambio de tracker o asignación operativa;
- cambio de punto de enrutado;
- cambio de línea de control;
- cambio de zona o zonas asociadas;
- cambio de posición en ruta;
- reprogramación de fecha con efectos en ruta.

## Restricciones del dominio a considerar

Las fuentes documentadas muestran reglas relevantes en:

- `validar_asignacion_tracker_tarea()`;
- `proteger_geometria_tarea_v2()`;
- `recalcular_ubicacion_tarea_por_zonas_v2()`;
- `validar_control_zona_tarea_v2()`;
- `validar_orden_ruta_v2()`;
- `encolar_recalculo_por_reprogramacion_v2()`;
- `vincular_tarea_recorrido_tracker()`;
- `corregir_linea_control_tarea_v2()`;
- `corregir_geometria_zona_v2()`.

La UI debe asumir que cambiar geometría, tracker o fecha puede producir validaciones y efectos laterales reales.

## Reglas por tipo

`finca`:

- puede requerir edición de línea de control;
- el punto de enrutado y la línea deben seguir siendo consistentes.

`zona`:

- el control principal puede recaer en zona;
- la edición debe respetar la relación con `tarea_zonas` y validaciones de zona.

## Integración con mapa

Durante la edición:

- el mapa debe enfocar la geometría actual;
- el usuario debe poder ajustar la geometría permitida;
- el draft debe reflejar cambios antes del submit;
- los cambios locales no deben mutar inmediatamente la entidad persistida.

## Cambios de ruta

La actualización de orden o fecha puede disparar:

- revalidación de orden;
- recálculo de ruta;
- cambios en historial o solicitudes derivadas.

La UI no necesita resolver toda esa lógica localmente, pero sí debe reconocerla y manejar sus errores o confirmaciones.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/edicion/tareaEdicion.geometry.ts
src/components/seguimiento/tareas/edit/TaskEditGeometrySection.vue
src/components/seguimiento/tareas/edit/TaskEditRoutePosition.vue
```

## No hacer

- No aplicar cambios geométricos directamente sobre el detalle persistido.
- No asumir que reprogramar fecha es un simple cambio visual.
- No ocultar errores de ruta, geometría o tracker detrás de un mensaje genérico.

## Criterios de aceptación

- La edición geométrica queda diferenciada por tipo.
- El mapa participa activamente del flujo de edición.
- Se contemplan las restricciones y efectos laterales del dominio.
