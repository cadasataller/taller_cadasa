# Specs — Seguimiento / Tareas

> Módulo: Seguimiento
>
> Subruta inicial: Tareas
>
> Ruta canónica objetivo: `/seguimiento/tareas`

## Propósito

Esta carpeta divide la implementación del submódulo `tareas` en fases pequeñas y controladas, siguiendo el patrón incremental ya usado en el proyecto.

`Tareas` no es solamente una lista. El submódulo combina:

- navegación protegida;
- workspace con mapa;
- filtros globales;
- listado lateral;
- panel contextual derecho;
- entidades de tarea con geometría;
- trackers y estados operativos;
- tipo especial `duda` de solo visualización por ahora.

## Dependencias obligatorias

Antes de implementar cualquier spec de esta carpeta, leer completamente:

```txt
documentacion/specs/seguimiento/README.md
documentacion/specs/seguimiento/shared/SPEC-00-base-modulo-rutas-permisos.md
documentacion/specs/seguimiento/shared/SPEC-01-simulacion-dev-y-taxonomia-permisos.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
documentacion/rastreo_tarea/estrategia_carga_trackers.md
documentacion/rastreo_tarea/estrategia_carga_kay_maps.md
```

## Fases de entrega confirmadas

```txt
fase-1-visualizacion
fase-2-creacion
fase-3-actualizacion
```

## Alcance funcional consolidado

- La fase 1 es exclusivamente de visualización.
- La fase 2 habilita creación manual de tareas `finca` y `zona`.
- La fase 3 habilita actualización manual de tareas `finca` y `zona`.
- `Duda` entra en el mismo workspace de tareas, pero de momento sólo puede visualizarse.
- La carga de mapa, fallback de credenciales y base de trackers no debe redefinirse por fase.

## Organización esperada

```txt
fase-1-visualizacion/
├── SPEC-00-alcance-ruta-workspace-lectura.md
├── SPEC-01-types-servicios-store-lectura.md
├── SPEC-02-shell-vista-y-paneles.md
├── SPEC-03-filtros-superiores-y-toolbar-mapa.md
├── SPEC-04-listado-lateral-tareas.md
├── SPEC-05-detalle-tarea-y-duda.md
└── SPEC-06-responsive-estados-pruebas.md
```

Las fases posteriores deben reutilizar la misma base y ampliar capacidades sin romper la lectura.

## Reglas transversales del submódulo

- La vista de ruta futura debe ser una superficie de composición delgada.
- El mapa ocupa el workspace central y sigue vivo aunque cambie el panel derecho.
- El panel derecho debe soportar modos `view`, `create` y `edit`, aunque en fase 1 sólo se implemente `view`.
- Los filtros superiores pertenecen al workspace global, no a un panel lateral aislado.
- El listado lateral y el detalle no deben duplicar queries ni contratos.
- `Duda` debe mostrarse con capacidades y semántica propias.
- La UI no debe exponer acciones sin el permiso recibido desde `app_feature_access`, incluso para el usuario de prueba.
- La lectura inicial usa `listar_tareas_rastreo_v2`; el detalle usa `obtener_tarea_detalle_v2`. La UI, composables y stores no consultan directamente `tareas`, `ubicaciones_actuales_tracker`, visitas, rutas ni tablas de estado.
- Los DTO remotos deben modelar la respuesta de cada RPC. Las geometrías de detalle se consumen como GeoJSON devuelto por `obtener_tarea_detalle_v2`, sin inferir serializaciones PostGIS desde el cliente.

## Orden de trabajo recomendado

1. Implementar la fase 1 completa.
2. Validar navegación, permisos temporales, lectura de mapa y detalle.
3. Implementar creación sobre la misma base.
4. Implementar actualización sobre la misma base.
5. Ampliar la matriz inicial cuando exista la definición de permisos por perfil.

## Resultado esperado

Al terminar esta carpeta, `seguimiento/tareas` debe quedar documentado como un workspace operativo único que evoluciona por fases sin separar artificialmente mapa, listado, detalle y tipos de tarea.
