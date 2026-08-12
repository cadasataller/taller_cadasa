# SPEC-02 — Store Pinia, filtros locales y composable

## Objetivo

Orquestar carga, filtros, orden, selección y guardado fuera de los componentes presentacionales.

## Dependencia

Implementar después de `SPEC-01`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.store.test.ts
src/composables/engrase/catalogo/useCatalogoSistemas.ts
```

## Setup Store

ID sugerido:

```txt
dbequipos_engrase_catalogo_sistemas
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
uso = todos
sortKey = nombre
sortDirection = asc
```

Retornar todas las refs, computed y acciones del Setup Store. `itemsVisibles`, `itemSeleccionado`, `cantidadVisible` y `hayFiltrosActivos` son computed, no estado duplicado.

## Helpers puros

```ts
normalizarBusquedaSistema(value: string): string
filtrarCatalogoSistemas(items, filtros): CatalogoSistemaItem[]
ordenarCatalogoSistemas(items, key, direction): CatalogoSistemaItem[]
```

Reglas:

- búsqueda con `trim`, insensible a mayúsculas y diacríticos;
- `en-uso`: `impacto.totalEquipos > 0`;
- `sin-uso`: `impacto.totalEquipos === 0`;
- nombre con `localeCompare("es", { numeric: true, sensitivity: "base" })`;
- equipos/asignaciones se ordenan como métricas independientes;
- ningún helper llama al servicio.

## Computed

```txt
itemsVisibles
itemSeleccionado
cantidadVisible
hayFiltrosActivos
sinResultados
```

## Acciones

```txt
inicializar(force?)
reintentar()
seleccionar(id | null)
actualizarBusqueda(value)
actualizarEstado(value)
actualizarUso(value)
actualizarOrden(key)
limpiarFiltros()
guardar(input)
reset()
```

### Carga/selección

- Compartir promesa y evitar duplicados.
- No recargar si ya está cargado, salvo `force`.
- Conservar activos/desactivados en `items`.
- No seleccionar automáticamente.
- Abrir detalle sin request.
- Cerrar selección si deja de ser visible; no elegir otra.

### Guardado

- Bloquear doble operación.
- Crear agrega una vez; editar reemplaza inmutablemente por ID.
- Respuesta completa como fuente final.
- No recargar listado.
- Recalcular resumen si la respuesta no lo incluye.

## Composable

`useCatalogoSistemas()` obtiene el store, usa `storeToRefs` y coordina:

```txt
modo: cerrado | crear | editar
draft independiente
hasChanges computed
confirmación de actualización
confirmación de descarte
apertura/cierre y foco
```

Draft:

```ts
{
  id: number | null;
  nombre: string;
  activo: boolean;
}
```

No crear store del drawer. Props bajan, eventos suben y el item fuente no se muta al escribir.

## Persistencia

- Conservar carga/filtros al alternar pestañas durante la sesión.
- Sin URL ni `localStorage` inicial.
- Resetear al cerrar sesión.

## Pruebas y aceptación

- Carga una vez y reintenta.
- Filtra nombre/estado/uso sin requests.
- Ordena cuatro claves en ambas direcciones.
- Limpiar restaura defaults.
- Cierra selección invisible.
- Crear/editar actualizan una vez sin recarga.
- `storeToRefs` conserva reactividad.
- Store es única fuente de verdad; templates no filtran.

