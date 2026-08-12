# SPEC-02 — Store Pinia, filtros locales y composable

## Objetivo

Orquestar carga, filtros, orden, selección y guardado sin trasladar lógica de negocio a componentes Vue.

## Dependencia

Implementar después de `SPEC-01`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.store.test.ts
src/composables/engrase/catalogo/useCatalogoFiltros.ts
```

## Setup Store

ID sugerido:

```txt
dbequipos_engrase_catalogo_filtros
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
tipoFiltroId = null
compras = todos
estado = activos
sortKey = codigo
sortDirection = asc
```

No guardar `itemsVisibles`, `itemSeleccionado`, `cantidadVisible`, opciones de tipo ni `hayFiltrosActivos`; son `computed`.

## Helpers puros

```ts
normalizarBusquedaCodigo(value: string): string
filtrarCatalogoFiltros(items, filtros): CatalogoFiltroItem[]
ordenarCatalogoFiltros(items, key, direction): CatalogoFiltroItem[]
obtenerOpcionesTiposFiltro(items): CatalogoTipoFiltroRelacionado[]
```

Reglas:

- búsqueda con `trim` e insensible a mayúsculas/minúsculas;
- no eliminar guiones ni espacios internos del código;
- tipo relacionado coincide por `item.tiposFiltro[].id`;
- compras y estado comparan booleanos;
- opciones de tipo se deduplican por ID y ordenan por nombre;
- ordenar código con `localeCompare("es", { numeric: true, sensitivity: "base" })`;
- equipos y asignaciones usan sus conteos separados;
- ningún helper llama al servicio.

## Computed

```txt
itemsVisibles
itemSeleccionado
cantidadVisible
opcionesTiposFiltro
hayFiltrosActivos
sinResultados
```

`hayFiltrosActivos` compara contra los defaults, incluyendo orden.

## Acciones

```txt
inicializar(force?)
reintentar()
seleccionar(id | null)
actualizarBusqueda(value)
actualizarTipoFiltro(id | null)
actualizarCompras(value)
actualizarEstado(value)
actualizarOrden(key)
limpiarFiltros()
guardar(input)
reset()
```

### Carga

- Compartir la promesa en curso para evitar duplicados.
- No recargar si ya está cargado, salvo `force`.
- Mantener activos y desactivados en `items`.
- No seleccionar automáticamente.
- Error inicial permite reintento.

### Selección

- Aceptar solo IDs presentes.
- Abrir no consulta detalle.
- Si el seleccionado deja de estar visible por filtros, cerrar el detalle.
- No seleccionar otra fila automáticamente.

### Guardado

- Bloquear doble operación.
- Crear agrega una vez el item retornado.
- Editar reemplaza inmutablemente por ID.
- La respuesta es la fuente final; no mezclar draft con relaciones antiguas.
- No recargar el listado.
- Si no regresa resumen, recalcular los cinco conteos desde `items`.

## Composable

`useCatalogoFiltros()` obtiene el store, usa `storeToRefs` y coordina:

```txt
modo: cerrado | crear | editar
draft separado
hasChanges computed
confirmación de actualización
confirmación de descarte
apertura/cierre y retorno de foco
```

Draft:

```ts
{
  id: number | null;
  codigo: string;
  estaEnListaCompras: boolean;
  activo: boolean;
}
```

No crear un store adicional para el drawer. Props bajan y eventos suben; el item fuente nunca se muta mientras el usuario escribe.

## Persistencia

- Conservar filtros al alternar pestañas mientras viva el store.
- Sin `localStorage` ni sincronización URL en esta entrega.
- Resetear al cerrar sesión.

## Pruebas

- Carga una vez y reintenta.
- Filtra código, tipo relacionado, compras y estado sin llamadas.
- Extrae/deduplica opciones de tipos desde items.
- Ordena las cinco claves en ambas direcciones.
- Limpiar restaura todos los defaults.
- Cierra selección que desaparece.
- Crea sin duplicar y actualiza sin recarga.
- Recalcula resumen y bloquea doble guardado.
- `storeToRefs` conserva reactividad.

## Criterios de aceptación

- Pinia es la única fuente de verdad de datos.
- Los templates no filtran ni ordenan.
- Ningún filtro visual dispara red.
- Draft e item original permanecen separados.
- Fixtures tipados pueden sustituir temporalmente al adaptador sin alterar el store.

