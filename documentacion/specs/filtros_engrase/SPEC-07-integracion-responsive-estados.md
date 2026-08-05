# SPEC-07 — Integración de la vista, responsive y estados

## Objetivo

Componer los bloques anteriores en la vista final, definir el flujo responsive y asegurar estados visuales coherentes.

## Dependencias

Implementar después de `SPEC-03` a `SPEC-06`.

## Archivos principales

```txt
src/views/engrase/FiltrosEngraseView.vue
src/composables/engrase/useFiltrosEngrase.ts
```

Los componentes creados en los specs anteriores se integran, pero no se fusionan en una vista monolítica.

## Mapa de componentes

```txt
FiltrosEngraseView
├── FiltrosEngraseToolbar
└── área de resultados
    ├── EquiposEngrasePanel
    │   └── EquipoEngraseListItem
    ├── FiltrosEquipoPanel
    │   ├── FiltrosEquipoHeader
    │   ├── FiltrosEquipoResumen
    │   └── FiltroEquipoCard
    └── FiltroDetallePanel
        └── FiltroEquivalenciasList
```

La vista:

- consume `useFiltrosEngrase()`;
- distribuye props;
- conecta emits con acciones;
- no contiene queries ni transformaciones complejas;
- no declara contratos duplicados.

## Desktop

- Filtro superior ocupa todo el ancho útil.
- Debajo, composición de tres columnas:

```txt
equipos | filtros del equipo | detalle del filtro
```

- El panel central recibe el mayor ancho.
- Los paneles laterales mantienen ancho usable y scroll interno cuando corresponda.
- Evitar scroll horizontal de página.
- Mantener una apariencia operativa, clara y coherente con el sistema existente y el mockup.

## Tablet

- Priorizar panel de equipos y panel central.
- El detalle puede convertirse en drawer.
- La toolbar puede reorganizarse en varias filas.
- No reducir controles por debajo del tamaño táctil mínimo.

## Móvil

Flujo secuencial:

```txt
filtros superiores → lista de equipos → filtros del equipo → detalle
```

- Mostrar una sección principal a la vez cuando el ancho no permita lectura cómoda.
- Seleccionar equipo avanza a sus filtros.
- Debe existir una acción visible para regresar a equipos.
- Seleccionar filtro abre el detalle.
- Cerrar detalle vuelve a filtros del equipo.
- Preservar filtros superiores y posición lógica al regresar.
- Este flujo es independiente del selector móvil de subpestañas definido en `SPEC-00`.

## Estados globales

### Carga inicial

- Mostrar skeleton de toolbar y paneles.
- No mostrar mensajes de vacío antes de terminar la primera consulta.

### Sin resultados

- Indicar que no existen equipos con la combinación actual.
- Ofrecer limpiar filtros sin borrar silenciosamente la selección del usuario.

### Error inicial

- Mensaje claro y acción Reintentar.
- Distinguir falta de sesión en Equipos, esquema no expuesto y fallo de red cuando sea posible.

### Errores parciales

- Imagen, filtros o equivalencias pueden fallar sin inutilizar toda la vista.
- Cada panel presenta reintento en su propio ámbito.

## Persistencia de filtros

- En esta primera entrega, conservar filtros mientras la vista permanezca montada.
- No persistirlos en `localStorage` sin requerimiento adicional.
- La sincronización con query params es opcional y no debe bloquear la entrega.
- Al abandonar sesión, el store debe resetearse para no conservar datos entre usuarios.

## Rendimiento

- Carga diferida de miniaturas.
- Consultas de detalle solamente para el equipo seleccionado.
- Equivalencias en lote.
- Evitar watchers profundos sobre colecciones grandes.
- No recalcular agrupaciones directamente en templates.

## Accesibilidad

- Orden de tabulación coherente con el flujo visual.
- Foco visible.
- Estados seleccionados comunicados semánticamente.
- Iconos decorativos ocultos a tecnología asistiva.
- Texto suficiente junto a colores de estado.
- Respetar reducción de movimiento.

## No hacer

- No implementar edición o creación.
- No agregar botón global/FAB de nuevo registro en esta ruta.
- No usar el evento global `open-new-record` para Engrase en esta fase.
- No descargar todas las imágenes al montar.
- No convertir la vista de ruta en un mega componente.

## Criterios de aceptación

- La composición desktop presenta los tres paneles.
- El flujo móvil permite ir y volver sin perder filtros.
- Cada error puede recuperarse en el nivel adecuado.
- No hay scroll horizontal accidental.
- No existen consultas directas desde componentes.
- La vista es exclusivamente de lectura.

