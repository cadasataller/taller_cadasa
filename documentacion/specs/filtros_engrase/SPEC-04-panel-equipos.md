# SPEC-04 — Panel lateral de equipos

## Objetivo

Implementar el listado lateral de equipos resultante de los filtros y permitir seleccionar el equipo cuyo detalle se muestra en el panel central.

## Dependencia

Implementar después de `SPEC-03`.

## Archivos a crear

```txt
src/components/engrase/filtros/EquiposEngrasePanel.vue
src/components/engrase/filtros/EquipoEngraseListItem.vue
src/components/engrase/filtros/EquipoEngraseThumbnail.vue
```

## Contenido del panel

- Título `Equipos`.
- Conteo de resultados.
- Búsqueda local por código, tipo de equipo o modelo.
- Resumen por tipo de equipo.
- Lista de equipos.
- Estado de carga, error y vacío.
- Pie con rango mostrado o mecanismo de carga progresiva.

## Tarjeta/fila de equipo

Mostrar:

```txt
miniatura o fallback
código
tipo de equipo
modelo
estado
indicador de selección
```

- No mostrar `subtipo` como etiqueta; el texto visible es Modelo.
- Si el modelo es nulo o vacío, mostrar `Sin modelo`.
- Estado usa `ACTIVO` o `DESCARTADO` y no depende solo del color.
- El equipo seleccionado debe distinguirse mediante borde, fondo y semántica accesible.

## Imágenes

- Usar `EquipoEngraseThumbnail` como límite de responsabilidad.
- Recibir la URL firmada; el componente no accede a Storage.
- Usar `loading="lazy"` cuando corresponda.
- Preparar/firma de imagen cuando el elemento se aproxima al viewport.
- Error de carga conduce al fallback, sin reintento infinito.
- El fallback debe ser neutro y consistente, no una imagen inventada del equipo.

## Resumen por tipo de equipo

- Agrupar usando `tipo_equipo`.
- Mostrar nombre y cantidad dentro de los resultados actuales.
- No llamarlo Grupo de equipos.
- El resumen es informativo; si se vuelve interactivo, debe actualizar el filtro superior como fuente única de verdad.

## Búsqueda local

- No reemplaza la búsqueda exacta de código de filtro.
- Filtra únicamente los equipos ya obtenidos.
- Coincidencia parcial por código, tipo de equipo o modelo.
- Limpiar la búsqueda restaura la lista del filtro superior.

## Paginación o carga progresiva

- El tamaño debe definirse en implementación según volumen; referencia inicial: 25.
- Conservar selección al cargar más.
- No cargar una imagen privada de cada equipo de forma anticipada.
- Si se usa scroll interno, mantener encabezado y buscador visibles.

## Contrato

Props sugeridas:

```txt
equipos
selectedEquipoId
countsByTipo
loading
error
hasMore
```

Emits sugeridos:

```txt
select-equipo
retry
load-more
```

## Responsive

- Desktop: columna izquierda estable, con scroll interno cuando sea necesario.
- Tablet: puede reducir ancho sin ocultar código ni estado.
- Móvil: se convierte en primera etapa del flujo; al seleccionar equipo se muestra su panel de filtros.

## Criterios de aceptación

- Solo aparecen equipos que cumplen los filtros superiores.
- El buscador local no altera el filtro exacto de código.
- La selección carga el panel central.
- Sin imagen muestra fallback.
- Sin modelo muestra `Sin modelo`.
- Los estados de carga, error y vacío no deforman el layout.

