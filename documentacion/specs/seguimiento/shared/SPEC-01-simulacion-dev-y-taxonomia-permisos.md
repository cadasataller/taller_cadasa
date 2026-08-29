# SPEC-01 — Simulación temporal de desarrollo y taxonomía de permisos

## Objetivo

Definir dos cosas antes de implementar lógica funcional:

1. una simulación temporal de permisos para desarrollo;
2. una taxonomía preliminar de permisos por acción y por capacidad.

Este spec existe para permitir avance controlado mientras la matriz oficial de permisos aún no está publicada.

## Contexto confirmado

- Los permisos reales todavía no están definidos.
- Deben existir permisos diferenciados para trabajador, supervisor y administrador.
- Durante desarrollo se necesita que `erickq@cadasa.com` pueda atravesar el flujo sin esperar el alta formal de permisos.
- La simulación temporal no debe degradar el diseño definitivo.

## Regla temporal de desarrollo

Mientras no exista la matriz oficial:

- `erickq@cadasa.com` puede recibir respuesta positiva para los permisos del módulo `seguimiento`;
- esa excepción debe vivir en un único punto de integración;
- ningún otro correo debe depender de reglas ocultas o dispersas;
- el comportamiento debe poder retirarse sin tocar componentes de UI.

## Alcance del fallback temporal

El fallback temporal puede devolver `true` para permisos de `seguimiento` solamente si:

1. el usuario autenticado coincide exactamente con `erickq@cadasa.com`;
2. la verificación solicitada pertenece al espacio de permisos de `seguimiento`;
3. la fuente real de permisos aún no provee la matriz oficial.

No debe activar permisos de otros módulos no relacionados.

## Ubicación arquitectónica permitida

La simulación debe ubicarse en uno solo de estos niveles:

```txt
adaptador de permisos
store de feature access
helper único consumido por el store
```

No debe vivir en:

```txt
router + layout + view
componentes sueltos
composables de pantalla
templates
```

## Estrategia de retiro

La implementación futura debe permitir retirar la simulación cuando se cumplan estas condiciones:

1. ya existe matriz real de permisos para seguimiento;
2. `app_feature_access` o su fuente equivalente retorna permisos definitivos;
3. las pruebas cubren acceso de trabajador, supervisor y administrador;
4. se elimina la excepción de `erickq@cadasa.com` sin cambiar contratos públicos.

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

- No dejar el correo temporal hardcodeado en varios archivos.
- No devolver `true` global para cualquier permiso.
- No usar el fallback temporal como sustituto permanente del modelo de permisos.
- No colapsar varios permisos diferentes en uno solo de “admin seguimiento”.
- No asumir que trabajador, supervisor y administrador comparten el mismo set.

## Criterios de aceptación

- Queda documentada la excepción temporal para `erickq@cadasa.com`.
- Queda documentado que la excepción debe vivir en un único punto.
- Existe una taxonomía inicial de permisos por capacidad.
- La estructura soporta fases de visualización, creación y actualización sin rediseñar permisos.
