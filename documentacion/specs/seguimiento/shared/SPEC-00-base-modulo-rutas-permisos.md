# SPEC-00 — Base del módulo, rutas y permisos

> Módulo: Seguimiento
>
> Primera subruta funcional: Tareas
>
> Ruta canónica objetivo: `/seguimiento/tareas`

## Objetivo

Definir la entrada del nuevo módulo `seguimiento`, su lugar en la navegación, la protección de rutas y la estrategia base de permisos antes de implementar UI, stores o servicios concretos de tareas.

Este spec no implementa consultas, mapa, realtime ni formularios.

## Fuentes obligatorias

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
documentacion/specs/seguimiento/README.md
```

## Decisiones confirmadas

- El módulo padre se llama `Seguimiento`.
- La primera subruta visible es `Tareas`.
- La ruta canónica objetivo es `/seguimiento/tareas`.
- El módulo debe admitir crecimiento futuro sin rehacer la navegación.
- Debe existir protección por funcionalidades desde el primer día.
- La matriz definitiva de permisos aún no existe, pero el diseño del árbol de permisos sí debe quedar fijado.
- Durante la etapa de desarrollo puede existir una simulación temporal para `testjl@cadasa.com`, documentada en el siguiente spec.

## Arquitectura de navegación objetivo

Desktop:

- `Seguimiento` aparece como grupo padre desplegable en el sidebar.
- El grupo se considera activo cuando la ruta comienza con `/seguimiento`.
- Al expandirse, muestra `Tareas`.
- La estructura debe admitir futuras subrutas como `Rutas`, `Supervisión`, `Historial` o equivalentes sin reescribir el patrón base.

Mobile:

- `Seguimiento` aparece como entrada principal sólo si el usuario tiene acceso al módulo.
- Al tocarlo, se despliega una lista de subrutas en formato de botones táctiles de ancho completo.
- `Tareas` navega a `/seguimiento/tareas`.
- Debe ser posible cerrar la lista sin navegar.

## Protección de rutas

La protección debe operar en tres niveles:

1. visibilidad del módulo padre;
2. visibilidad de la subruta;
3. bloqueo real de navegación directa.

Requisitos:

- La ocultación del menú no sustituye la protección de rutas.
- La resolución de permisos debe ocurrir antes de renderizar contenido restringido.
- No debe haber parpadeo de UI restringida mientras cargan permisos.
- La redirección por falta de acceso debe llevar a una ruta permitida y evitar ciclos.

## Permisos mínimos del nivel módulo

Aunque la matriz final se definirá después, este spec reserva como mínimo:

```txt
module_seguimiento
ver_tareas_seguimiento
```

`module_seguimiento` controla la visibilidad del módulo padre.

`ver_tareas_seguimiento` controla la visibilidad y el acceso a `/seguimiento/tareas`.

Los permisos adicionales por acción se consolidan en `SPEC-01`.

## Archivos previstos

```txt
src/router/index.ts
src/layouts/DefaultLayout.vue
src/views/seguimiento/SeguimientoTareasView.vue
src/stores/db_mantenimiento/app_feature_access/**
```

La vista de ruta futura debe ser una superficie delgada y no debe asumir permisos por sí misma.

## Responsabilidades por capa

```txt
router
  - protege acceso directo
  - resuelve requiredFeatures

layout
  - muestra u oculta el grupo Seguimiento
  - controla expansión desktop y selector móvil

vista de seguimiento
  - compone la pantalla
  - no decide permisos globales
```

## No hacer

- No crear una ruta funcional `/seguimiento` que compita con `/seguimiento/tareas`.
- No codificar correos o usuarios permitidos en múltiples archivos.
- No usar una verificación ad hoc dentro de componentes como reemplazo del store de permisos.
- No mezclar aquí permisos de crear, editar o eliminar con la navegación básica del módulo.
- No asumir todavía subrutas adicionales como implementadas.

## Criterios de aceptación

- Existe una definición canónica de `Seguimiento` como módulo padre.
- Existe una definición canónica de `/seguimiento/tareas` como primera subruta.
- El patrón de navegación desktop y mobile queda documentado.
- El proyecto reserva permisos base de módulo y lectura.
- Queda prohibido duplicar la lógica de autorización en varios puntos.
