# Specs — Fase 2 / Creación de tareas

> Submódulo: Seguimiento / Tareas
>
> Fase funcional: Creación

## Propósito

Esta carpeta divide la implementación de creación manual de tareas en entregas pequeñas, reutilizando la base de lectura definida en la fase 1 y la infraestructura transversal del módulo `seguimiento`.

La fase 2 habilita únicamente creación manual de tareas de tipo:

```txt
finca
zona
```

`Duda` queda explícitamente fuera de creación manual.

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
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Orden de implementación

1. [SPEC-07 — Alcance y flujo general de creación](SPEC-07-alcance-flujo-general-creacion.md)
2. [SPEC-08 — Types, contratos y permisos de creación](SPEC-08-types-contratos-permisos-creacion.md)
3. [SPEC-09 — Store, composable y máquina de estados](SPEC-09-store-composable-maquina-estados-creacion.md)
4. [SPEC-10 — Formulario, asignación y detalles base](SPEC-10-formulario-asignacion-detalles-base.md)
5. [SPEC-11 — Geometría, mapa y posición en ruta](SPEC-11-geometria-mapa-posicion-ruta.md)
6. [SPEC-12 — Validaciones, payload y frontera RPC](SPEC-12-validaciones-payload-frontera-rpc.md)
7. [SPEC-13 — Integración UI, estados y pruebas](SPEC-13-integracion-estados-pruebas-creacion.md)
8. [Subespecificaciones — Flujo espacial](flujo-espacial/README.md)
9. [SPEC-17 — Wizard guiado de creación desde el mapa](SPEC-17-wizard-creacion-guiado-mapa.md)

## Reglas transversales

- Reutilizar el mismo workspace, mapa y paneles definidos en fase 1.
- La creación abre el panel derecho en modo `create`.
- No crear una pantalla aparte desconectada del workspace salvo necesidad extrema no confirmada.
- `Duda` no puede crearse manualmente.
- La lógica de creación no debe rehacer la carga del mapa o trackers desde cero.
- Las validaciones de geometría, tracker, ruta y zona deben reconocer que ya existen triggers y restricciones del lado base de datos.

## Resultado esperado

Al terminar esta fase, el usuario con permisos de creación podrá abrir el formulario de tarea, completar tipo, asignación, detalles, geometría y guardar una nueva tarea `finca` o `zona` desde el mismo workspace de seguimiento.
