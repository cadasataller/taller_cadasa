# SPEC-03 — Modelo de dominio y capacidades base

## Objetivo

Definir el lenguaje base del módulo `seguimiento` para que los specs futuros compartan el mismo modelo conceptual de tarea, tipos de tarea y capacidades por flujo.

Este spec no crea contratos TypeScript definitivos todavía, pero sí fija el marco funcional que luego se convertirá en types, mappers, stores y componentes.

## Fuentes obligatorias

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
documentacion/specs/seguimiento/shared/SPEC-00-base-modulo-rutas-permisos.md
documentacion/specs/seguimiento/shared/SPEC-01-simulacion-dev-y-taxonomia-permisos.md
documentacion/specs/seguimiento/shared/SPEC-02-mapa-trackers-y-servicios-transversales.md
```

## Entidad funcional principal

La entidad central del submódulo es:

```txt
tarea
```

Según el dominio documentado, una tarea puede involucrar al menos:

- área;
- usuario asignado;
- ubicación;
- fecha programada;
- indicaciones;
- prioridad;
- tiempo estimado;
- estado administrativo;
- estado operativo;
- tracker asociado;
- punto enrutado;
- línea de control;
- orden en ruta;
- visitas y eventos relacionados.

## Tipos base de tarea

A nivel de producto, se reservan tres variantes funcionales iniciales:

```txt
finca
zona
duda
```

## Regla para `finca`

`finca` representa una tarea operativa con:

- punto de enrutado;
- línea de control;
- posibilidad de zonas asociadas si el flujo lo requiere;
- capacidades de visualización, creación y actualización según permisos.

## Regla para `zona`

`zona` representa una tarea operativa donde la geometría principal se apoya en:

- punto de enrutado;
- una zona de control dominante;
- reglas de entrada/salida ligadas a esa zona;
- capacidades de visualización, creación y actualización según permisos.

## Regla para `duda`

`duda` representa una entidad generada automáticamente por el sistema a partir de observación operativa o permanencia detectada.

Por ahora:

- aparece en el mismo listado y workspace;
- debe poder distinguirse visual y funcionalmente;
- tiene acceso de solo visualización;
- no se crea manualmente;
- no se edita manualmente en esta etapa;
- puede requerir detalle específico o simplificado.

## Matriz mínima de capacidades por tipo

```txt
Tipo    Ver   Crear manual   Editar manual   Cancelar/Eliminar   Render mapa
finca   sí    sí             sí              según permiso       sí
zona    sí    sí             sí              según permiso       sí
duda    sí    no             no              no por ahora        sí
```

## Estados funcionales mínimos

Sin amarrar aún el catálogo final de base de datos, la UI debe reconocer al menos:

- tarea pendiente o sin iniciar;
- tarea en ruta;
- tarea en ubicación o activa;
- tarea visitada o completada;
- tarea cancelada;
- duda detectada.

Los nombres finales pueden venir de tablas de estado, pero estas categorías funcionales deben existir desde el diseño.

## Subflujos funcionales del workspace

El mockup confirma tres modos principales del panel derecho:

```txt
view
create
edit
```

Por tanto, el workspace general debe poder abrir:

- detalle de tarea;
- formulario de creación;
- formulario de edición.

Además, debe convivir con:

- listado lateral izquierdo;
- filtros superiores;
- mapa central;
- posibles overlays o acciones puntuales.

## Regla de reutilización de UI

Creación y edición deben concebirse como variaciones del mismo flujo estructural, no como dos productos aislados.

Diferencias esperadas:

- modo de lectura/escritura por campo;
- bloqueo del tipo de tarea en edición si el negocio lo exige;
- reglas distintas para botones finales;
- capacidades restringidas en `duda`.

## Fronteras de fase

Fase 1:

- sólo visualización;
- listado;
- detalle;
- mapa;
- dudas en lectura.

Fase 2:

- creación de `finca` y `zona`;
- asignación;
- detalles básicos;
- geometría inicial;
- guardado.

Fase 3:

- actualización de `finca` y `zona`;
- cambios operativos;
- edición de geometría;
- cancelación, eliminación lógica o restauración según permisos.

## Implicaciones para specs futuros

Los specs de `tareas` deben separar claramente:

- tipos y contratos base;
- lectura y visualización;
- creación;
- actualización;
- reglas específicas de `duda`.

No conviene modelar `duda` como un caso incidental dentro de una card normal sin reglas propias.

## No hacer

- No tratar `duda` como tarea editable estándar.
- No diseñar creación y edición como UIs completamente distintas sin justificación.
- No mezclar tipos de tarea con estados de tarea.
- No dejar la geometría como detalle visual sin contrato funcional.
- No asumir que todos los tipos comparten las mismas acciones.

## Criterios de aceptación

- Quedan definidos `finca`, `zona` y `duda` como variantes funcionales.
- Queda documentado que `duda` es automática y de solo visualización por ahora.
- Queda fijada la matriz mínima de capacidades por tipo.
- Queda definida la separación entre visualización, creación y actualización.
- Los specs futuros pueden derivar types y UI desde este lenguaje común.
