# SPEC-05 — Panel central de filtros por equipo

## Objetivo

Mostrar la ficha del equipo seleccionado y todas sus asignaciones de filtros en un panel central de solo lectura.

## Dependencia

Implementar después de `SPEC-04`.

## Archivos a crear

```txt
src/components/engrase/filtros/FiltrosEquipoPanel.vue
src/components/engrase/filtros/FiltrosEquipoHeader.vue
src/components/engrase/filtros/FiltrosEquipoResumen.vue
src/components/engrase/filtros/FiltroEquipoCard.vue
```

## Encabezado del equipo

Mostrar:

```txt
miniatura o fallback
código
tipo de equipo
modelo
etapas
estado
```

- Usar **Modelo**, no Subtipo.
- Si no hay modelo: `Sin modelo`.
- Si no existen relaciones en `equipo_etapa`: `Sin etapa`.
- Si hay varias etapas, mostrarlas todas sin crear una etapa artificial llamada `AMBAS`.
- No incluir menú de acciones ni botón Editar.

## Resumen

Mostrar tres métricas:

```txt
Total filtros
Con equivalencias
En lista de compras
```

Definiciones:

- `Total filtros`: número de asignaciones `equipo_filtro`, no suma de `cantidad`.
- `Con equivalencias`: asignaciones cuyo filtro original tiene al menos una equivalencia activa.
- `En lista de compras`: asignaciones cuyo filtro original tiene `esta_en_lista_compras = true`.

## Tarjeta de filtro

Mostrar:

```txt
tipo de filtro
código original
cantidad
equivalencias activas (conteo)
en lista de compras: Sí/No
```

- El tipo de filtro representa la función/posición; no inventar una columna `posicion`.
- Cantidades mayores que uno deben mostrarse correctamente, por ejemplo `x3`.
- No mostrar badge `Obligatorio`: ese atributo no existe en el modelo confirmado.
- No mostrar un estado general del filtro inexistente.
- La tarjeta completa puede seleccionar el filtro y abrir su detalle.
- Añadir estado de foco y `aria-selected` cuando corresponda.

## Estados

### Sin equipo seleccionado

Mostrar instrucción para seleccionar un equipo.

### Equipo sin filtros

Mostrar un estado vacío válido. El equipo `4-58-014` demuestra que este escenario forma parte del dominio.

### Cargando

Mostrar skeleton del encabezado, métricas y tarjetas, sin reutilizar datos del equipo anterior como si fueran actuales.

### Error parcial

Permitir reintentar la carga de filtros sin perder el listado lateral.

## Contrato

Props sugeridas:

```txt
equipo
filtros
selectedFiltroId
summary
loading
error
```

Emits sugeridos:

```txt
select-filtro
retry
back-to-equipos
```

## Responsive

- Desktop: rejilla de tarjetas dentro del panel central.
- Ajustar número de columnas al ancho disponible, no a breakpoints arbitrarios solamente.
- Móvil: mostrar encabezado y tarjetas después de elegir equipo, con acción clara para volver a la lista.
- No renderizar una tabla horizontal comprimida en móvil.

## Criterios de aceptación

- El equipo seleccionado coincide con el panel lateral.
- Sin etapas muestra `Sin etapa`.
- Cada filtro muestra original, tipo, cantidad y compras.
- Las métricas siguen las definiciones confirmadas.
- Seleccionar una tarjeta abre el detalle derecho.
- No existen controles de escritura ni campos inventados.

