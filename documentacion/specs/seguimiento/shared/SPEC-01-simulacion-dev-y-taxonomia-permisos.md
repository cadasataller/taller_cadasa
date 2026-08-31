# SPEC-01 — Matriz inicial y taxonomía de permisos

## Objetivo

Definir dos cosas antes de implementar lógica funcional:

1. la matriz inicial de permisos persistida en `app_feature` y `app_feature_access`;
2. una taxonomía preliminar de permisos por acción y por capacidad.

Este spec fija una política inicial controlada mientras se completa la matriz definitiva por perfiles.

## Contexto confirmado

- La matriz por perfiles finales todavía no está definida.
- Deben existir permisos diferenciados para trabajador, supervisor y administrador.
- Durante desarrollo, `testjl@cadasa.com` requiere acceso formal al módulo.
- La política debe permanecer centralizada en la fuente real de permisos.

## Política inicial de acceso

La fuente de verdad es `app_feature` y `app_feature_access`:

- las funcionalidades de `seguimiento` se crean con `visible_por_defecto = false`;
- todos los accesos previos al módulo se marcan con `puede_ver = false`;
- `testjl@cadasa.com` recibe `puede_ver = true` para las 18 funcionalidades definidas;
- ningún otro correo recibe acceso positivo mientras no se publique una matriz adicional;
- la resolución se consume mediante `obtener_funcionalidades_permitidas`, sin reglas ocultas en UI.

El script ejecutable se encuentra en:

```txt
documentacion/specs/seguimiento/shared/sql/01-permisos-seguimiento-solo-testjl.sql
```

## Estrategia de ampliación

La matriz se podrá ampliar cuando se definan perfiles reales:

1. se insertan o actualizan explícitamente los registros de `app_feature_access` por correo;
2. se mantienen `visible_por_defecto = false` y el mismo `feature_key`;
3. se prueban los accesos de trabajador, supervisor y administrador;
4. no se cambian los contratos públicos ni las verificaciones de router, layout o componentes.

## Taxonomía preliminar de permisos

Este spec reserva un árbol inicial de permisos. Los nombres pueden ajustarse levemente después, pero la granularidad debe mantenerse.

Permisos base:

```txt
module_seguimiento
ver_tareas_seguimiento
```

Permisos de lectura especializada:

```txt
ver_detalle_tarea_seguimiento
ver_dudas_seguimiento
ver_historial_tarea_seguimiento
ver_tracker_tarea_seguimiento
ver_mapa_seguimiento
```

Permisos de creación:

```txt
crear_tareas_seguimiento
asignar_tracker_tarea_seguimiento
definir_geometria_tarea_seguimiento
```

Permisos de actualización:

```txt
editar_tareas_seguimiento
editar_asignacion_tarea_seguimiento
editar_geometria_tarea_seguimiento
reprogramar_tarea_seguimiento
```

Permisos de acciones administrativas:

```txt
cancelar_tareas_seguimiento
eliminar_tareas_seguimiento
restaurar_tareas_seguimiento
registrar_observaciones_tarea_seguimiento
```

## Matriz conceptual por perfil

Trabajador:

- normalmente lectura de sus tareas;
- lectura de mapa y detalle;
- eventualmente registro de observaciones si el negocio lo confirma;
- sin creación administrativa general;
- sin eliminación;
- sin edición estructural de geometría salvo confirmación futura.

Supervisor:

- lectura amplia;
- visualización de dudas;
- capacidad de creación y actualización operativa;
- capacidad de reasignación y cambios de ruta si el negocio lo confirma;
- capacidad parcial sobre observaciones e historial.

Administrador:

- acceso total al módulo;
- mantenimiento completo de tareas;
- cancelación, eliminación lógica, restauración y override operativo si el negocio lo autoriza.

Esta matriz es conceptual y no reemplaza la matriz oficial futura.

## Reglas de diseño

- La UI no debe asumir que `ver` implica `crear` o `editar`.
- Cada acción visible debe poder amarrarse a un permiso específico.
- `Dudas` requiere permiso de visualización propio aunque inicialmente sea de solo lectura.
- El formulario no debe mostrarse sólo porque la ruta sea accesible.
- El detalle puede ser visible para usuarios que no pueden editar.

## No hacer

- No dejar reglas de correo hardcodeadas en router, layout, vistas o componentes.
- No devolver `true` global para cualquier permiso.
- No sustituir `app_feature_access` con un fallback temporal una vez aplicada la matriz.
- No colapsar varios permisos diferentes en uno solo de “admin seguimiento”.
- No asumir que trabajador, supervisor y administrador comparten el mismo set.

## Criterios de aceptación

- Queda documentada la política inicial exclusiva para `testjl@cadasa.com`.
- Queda documentada la fuente de verdad de los accesos.
- Existe una taxonomía inicial de permisos por capacidad.
- La estructura soporta fases de visualización, creación y actualización sin rediseñar permisos.
