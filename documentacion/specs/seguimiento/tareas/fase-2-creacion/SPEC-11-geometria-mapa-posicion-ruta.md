# SPEC-11 — Geometría, mapa y posición en ruta

## Objetivo

Definir el bloque de creación espacial de la tarea y su integración con el mapa del workspace.

## Dependencias

Implementar después de:

```txt
SPEC-10-formulario-asignacion-detalles-base.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
```

## Fuente visual y de dominio

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Bloque de ubicación y geometría

El mockup confirma al menos estos elementos:

- punto de enrutado;
- línea de control para `finca`;
- zona o zonas para el caso correspondiente;
- acciones de cambiar o editar desde el mapa;
- posición de tarea dentro de la ruta.

## Reglas por tipo

`finca`:

- requiere punto de enrutado;
- requiere línea de control;
- puede mostrar zonas asociadas si el negocio lo admite en esta variante.

`zona`:

- requiere punto de enrutado;
- requiere una zona de control dominante;
- no debe obligar una línea de control si el modelo funcional no la usa para esta variante.

## Integración con mapa

El mapa debe permitir al flujo de creación:

- enfocar el punto de enrutado;
- capturar o ajustar geometría;
- editar visualmente línea o zona según el tipo;
- devolver el resultado al draft.

No debe reinventar el bootstrap del provider ya definido en `shared`.

## Relación con el dominio SQL/RPC

El esquema y las funciones documentadas indican restricciones fuertes sobre:

- `tareas.punto_enrutado`;
- `tareas.linea_control`;
- `tarea_zonas`;
- `zonas_operativas`;
- validaciones automáticas de control de zona;
- protección de geometría;
- recálculo de ubicación;
- orden de ruta y triggers asociados.

Por tanto, la UI de creación debe diseñarse sabiendo que:

- la geometría no es decorativa;
- el backend puede rechazar combinaciones inválidas;
- la relación entre tarea y zona no debe modelarse como texto libre;
- la posición en ruta puede impactar otras entidades del dominio.

## Posición en ruta

El formulario debe contemplar una posición u orden de tarea cuando aplique.

Reglas:

- el usuario debe poder ver o definir el orden;
- el valor no debe romper restricciones del dominio;
- la UI no debe asumir que cualquier entero es válido;
- si la validación final depende del backend, debe reflejarse como posible error remoto específico.

## Estados del bloque geométrico

El bloque de geometría debe poder reflejar:

- vacío;
- capturado;
- editando;
- inválido;
- error remoto o inconsistencia de validación.

## Archivos previstos

```txt
src/components/seguimiento/tareas/create/TaskGeometrySection.vue
src/components/seguimiento/tareas/create/TaskRoutePosition.vue
src/stores/seguimiento/tareas/creacion/tareaCreacion.geometry.ts
```

## No hacer

- No tratar el mapa como mero preview pasivo.
- No serializar geometría arbitraria sin contrato.
- No permitir `duda` dentro de este flujo geométrico.
- No ocultar errores espaciales del backend bajo un mensaje genérico.

## Criterios de aceptación

- La creación espacial queda diferenciada por tipo `finca` y `zona`.
- El mapa participa activamente del flujo.
- La posición de ruta queda reconocida como parte del dominio.
- Las restricciones del backend quedan contempladas en el diseño.
