# SPEC-02 — Store Pinia, filtros locales y composable

## Objetivo

Orquestar carga, selección, filtrado, orden, creación y actualización sin mezclar lógica en componentes.

## Dependencia

Implementar después de `SPEC-01`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.store.test.ts
src/composables/engrase/catalogo/useCatalogoTiposFiltro.ts
```

## Setup Store

Nombre sugerido:

```txt
dbequipos_engrase_catalogo_tipos_filtro
```

Estado fuente:

```txt
items
resumen
cargado
loadingInicial
guardando
errorInicial
errorGuardado
seleccionadoId
busqueda
estado = activos
sortKey = nombre
sortDirection = asc
```

No guardar como estado:

```txt
itemsVisibles
itemSeleccionado
cantidadVisible
hayFiltrosActivos
```

Son valores `computed`.

## Helpers puros

```ts
normalizarBusquedaTipoFiltro(value: string): string
filtrarTiposFiltro(items, busqueda, estado): CatalogoTipoFiltroItem[]
ordenarTiposFiltro(items, key, direction): CatalogoTipoFiltroItem[]
```

La búsqueda:

- usa `trim`;
- ignora mayúsculas/minúsculas;
- puede ignorar diacríticos con `normalize("NFD")`;
- nunca llama al servicio;
- no requiere debounce de red.

Orden inicial por nombre mediante `localeCompare("es", { sensitivity: "base" })`.

## Getters/computed

```txt
itemsVisibles
itemSeleccionado
cantidadVisible
hayFiltrosActivos
sinResultados
```

`hayFiltrosActivos` es verdadero si ocurre al menos uno:

```txt
búsqueda no vacía
estado distinto de activos
orden distinto de nombre ascendente
```

## Acciones

```txt
inicializar(force?)
reintentar()
seleccionar(id | null)
actualizarBusqueda(value)
actualizarEstado(value)
actualizarOrden(key)
limpiarFiltros()
guardar(input)
reset()
```

### Inicializar

- Evitar solicitudes duplicadas con promesa compartida.
- No recargar si ya está cargado, salvo `force`.
- Mantener activos y desactivados en `items`.
- No seleccionar automáticamente la primera fila.
- En error, permitir reintento.

### Seleccionar

- Solo aceptar un ID presente.
- `null` cierra el detalle.
- Cambiar filtros no abre otra selección automáticamente.
- Si el seleccionado deja de ser visible, cerrar detalle.

### Guardar

- Delegar al servicio.
- Creación: insertar una sola vez el item retornado.
- Actualización: reemplazar inmutablemente por ID.
- Mantener seleccionado el item actualizado.
- Evitar doble guardado con `guardando`.
- No recargar todo el listado después del éxito.

Si guardado no devuelve `resumen`, recalcular total, activos y desactivados desde `items`.

## Composable

`useCatalogoTiposFiltro()` debe:

- obtener el store;
- exponer state/getters con `storeToRefs`;
- exponer acciones directamente;
- coordinar crear/editar;
- mantener draft separado del item original;
- derivar `hasChanges` con `computed`;
- confirmar solo actualizaciones;
- coordinar cierre seguro con cambios pendientes.

Estado UI local sugerido:

```txt
modo: cerrado | crear | editar
draft
confirmacionAbierta
confirmarDescarteAbierto
```

No crear otro store solo para el drawer.

## Persistencia

- Conservar filtros al cambiar de pestaña mientras el store viva.
- No usar `localStorage`.
- No sincronizar filtros con URL en esta primera entrega.
- Resetear al cerrar sesión.

## Pruebas

- Carga una sola vez.
- Filtra por nombre y estado sin llamar al servicio.
- Ordena nombre, estado y uso en ambos sentidos.
- Limpiar vuelve a activos/nombre asc.
- Cierra selección si desaparece del resultado.
- Agrega creación sin duplicar.
- Reemplaza actualización y mantiene selección.
- Bloquea doble guardado.
- `storeToRefs` mantiene reactividad.

## Criterios de aceptación

- El store es la fuente de verdad de datos.
- Los componentes no filtran en templates.
- Los filtros no disparan llamadas.
- El item original no se muta durante edición.
- La UI puede usar fixtures tipados sin alterar el store.

