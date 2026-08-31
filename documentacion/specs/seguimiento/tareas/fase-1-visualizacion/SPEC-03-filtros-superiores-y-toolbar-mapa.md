# SPEC-03 — Filtros superiores y toolbar del mapa

## Objetivo

Definir la barra superior flotante del workspace y las herramientas básicas del mapa en la fase de visualización.

Los filtros que cambian el contexto remoto se traducen a los parámetros de `listar_tareas_rastreo_v2`. Los filtros puramente visuales operan sobre el resultado ya cargado. Ningún control consulta tablas directamente.

## Dependencias

Implementar después de:

```txt
SPEC-02-shell-vista-y-paneles.md
```

## Fuente visual

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Alcance funcional

La barra superior pertenece al workspace completo y debe servir para acotar el contexto operativo visible.

Campos sugeridos por el mockup:

- fecha;
- trabajador;
- tracker o equipo;
- coordenadas o búsqueda de foco geográfico;
- acción principal de aplicar o enfocar.

La toolbar del mapa debe incluir herramientas pequeñas de lectura, por ejemplo:

- reset de vista;
- acciones de enfoque;
- herramientas auxiliares no destructivas.

## Reglas de la barra de filtros

- Opera sobre listado, mapa y detalle.
- No es un filtro local de un panel aislado.
- Debe aceptar estado vacío inicial cuando el store aún no carga catálogos o contexto.
- Los cambios pueden aplicarse inmediatamente o mediante acción explícita, pero el comportamiento debe ser uniforme.
- No debe disparar varias consultas por campo si el diseño opta por un botón de aplicar.

## Contrato funcional mínimo

La barra debe poder representar al menos:

```txt
fecha operativa
trabajador seleccionado
tracker seleccionado
coordenadas o foco manual
estado de carga
estado deshabilitado
acción de aplicar / ir
```

## Reglas de permisos y visibilidad

- Si el usuario no tiene acceso al mapa, la barra no debe exponer acciones que dependan de él.
- Si no tiene acceso a trackers, el filtro correspondiente puede ocultarse o quedar informativo según política futura.
- La UI sigue respetando el diseño de permisos aunque la matriz inicial conceda todas las capacidades a `testjl@cadasa.com`.

## Herramientas del mapa

Las herramientas flotantes del mapa deben ser pequeñas, legibles y de un solo propósito.

En fase 1:

- no deben modificar datos;
- no deben abrir flujo de creación;
- no deben depender de panel derecho en modo edición;
- pueden recentrar, restablecer o enfocar.

## Mobile

- La barra superior puede reorganizarse en varias filas.
- Los controles no deben quedar más pequeños que el mínimo táctil.
- Si las coordenadas no caben bien en una sola fila, deben envolverse sin romper el layout.

## Archivos previstos

```txt
src/components/seguimiento/tareas/TrackingFiltersBar.vue
src/components/seguimiento/tareas/MapToolsOverlay.vue
```

## No hacer

- No mezclar aquí los filtros internos del listado lateral.
- No usar acciones de crear o editar disfrazadas como herramienta del mapa.
- No convertir la barra en un formulario de alta.
- No ligar cada tecla de un campo a una recarga remota obligatoria sin control.

## Criterios de aceptación

- Existe una barra superior global del workspace.
- Existe una toolbar flotante del mapa en modo lectura.
- Los filtros afectan la lectura global y no un panel aislado.
- Las herramientas del mapa no realizan mutaciones.
