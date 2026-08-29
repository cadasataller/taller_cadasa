# Specs — Fase 3 / Actualización de tareas

> Submódulo: Seguimiento / Tareas
>
> Fase funcional: Actualización

## Propósito

Esta carpeta divide la implementación de actualización manual de tareas en entregas pequeñas, reutilizando la base de visualización de la fase 1 y la base de creación de la fase 2.

La fase 3 habilita actualización manual únicamente para tareas de tipo:

```txt
finca
zona
```

`Duda` permanece fuera del flujo de edición manual.

## Dependencias obligatorias

Antes de implementar cualquier spec de esta carpeta, leer:

```txt
documentacion/specs/seguimiento/README.md
documentacion/specs/seguimiento/shared/SPEC-00-base-modulo-rutas-permisos.md
documentacion/specs/seguimiento/shared/SPEC-01-simulacion-dev-y-taxonomia-permisos.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
documentacion/specs/seguimiento/tareas/README.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-00-alcance-ruta-workspace-lectura.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-01-types-servicios-store-lectura.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-02-shell-vista-y-paneles.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-03-filtros-superiores-y-toolbar-mapa.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-04-listado-lateral-tareas.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-05-detalle-tarea-y-duda.md
documentacion/specs/seguimiento/tareas/fase-1-visualizacion/SPEC-06-responsive-estados-pruebas.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/README.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-07-alcance-flujo-general-creacion.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-08-types-contratos-permisos-creacion.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-09-store-composable-maquina-estados-creacion.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-10-formulario-asignacion-detalles-base.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-11-geometria-mapa-posicion-ruta.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-12-validaciones-payload-frontera-rpc.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-13-integracion-estados-pruebas-creacion.md
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Orden de implementación

1. [SPEC-14 — Alcance y flujo general de actualización](SPEC-14-alcance-flujo-general-actualizacion.md)
2. [SPEC-15 — Types, contratos y permisos de actualización](SPEC-15-types-contratos-permisos-actualizacion.md)
3. [SPEC-16 — Store, composable y carga del borrador de edición](SPEC-16-store-composable-borrador-edicion.md)
4. [SPEC-17 — Formulario de edición, restricciones y UX](SPEC-17-formulario-edicion-restricciones-ux.md)
5. [SPEC-18 — Geometría, tracker y ruta en edición](SPEC-18-geometria-tracker-ruta-edicion.md)
6. [SPEC-19 — Cancelación, eliminación lógica y restauración](SPEC-19-cancelacion-eliminacion-restauracion.md)
7. [SPEC-20 — Integración, estados y pruebas de actualización](SPEC-20-integracion-estados-pruebas-actualizacion.md)

## Reglas transversales

- Reutilizar el mismo workspace, mapa y paneles definidos en las fases anteriores.
- La actualización abre el panel derecho en modo `edit`.
- No crear una pantalla aparte desconectada del workspace salvo una necesidad no confirmada.
- `Duda` no puede editarse manualmente en esta fase.
- La lógica de edición debe respetar restricciones del dominio existentes en tablas, índices y triggers.
- Las acciones administrativas destructivas deben estar separadas del guardado normal de cambios.

## Resultado esperado

Al terminar esta fase, el usuario con permisos de actualización podrá abrir una tarea `finca` o `zona`, editar sus campos permitidos, ajustar geometría y ruta cuando corresponda, y ejecutar acciones administrativas separadas como cancelación o eliminación lógica según permisos.
