# SPEC-02 — Store Pinia, filtros locales y composable

## Objetivo

Orquestar carga, filtrado, orden, selección y guardado sin mezclar lógica en componentes.

## Dependencia

Implementar después de `SPEC-01`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.store.test.ts
src/composables/engrase/catalogo/useCatalogoAceites.ts
```

## Setup Store

ID sugerido:

```txt
dbequipos_engrase_catalogo_aceites
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
sistemaId = null
estado = activos
uso = todos
sortKey = nombre
sortDirection = asc
```

El Setup Store devuelve todas sus refs, computed y acciones. No guardar `itemsVisibles`, `itemSeleccionado`, `opcionesSistema`, `cantidadVisible` o `hayFiltrosActivos`; son derivados.

## Helpers puros

```ts
normalizarBusquedaAceite(value: string): string
filtrarCatalogoAceites(items, filtros): CatalogoAceiteItem[]
ordenarCatalogoAceites(items, key, direction): CatalogoAceiteItem[]
obtenerOpcionesSistemas(items): CatalogoSistemaRelacionado[]
```

Reglas:

- búsqueda con `trim`, insensible a mayúsculas y diacríticos;
- sistema coincide por `item.sistemas[].id`;
- `en-uso` significa `impacto.totalEquipos > 0`;
- `sin-uso` significa `impacto.totalEquipos === 0`;
- opciones de sistema se deduplican por ID y ordenan por nombre;
- nombre usa `localeCompare("es", { numeric: true, sensitivity: "base" })`;
- orden `sistemas` compara cantidad de sistemas y desempata por nombre;
- equipos y asignaciones son métricas independientes;
- ningún helper ejecuta red.

Cuando exista un store compartido para `rpc_catalogo_auxiliares`, el selector puede consumir sus sistemas activos y desactivados. Hasta entonces, derivarlos de `items[].sistemas` es válido para filtrar relaciones presentes. La pestaña nunca debe cargar auxiliares por cada cambio visual.

## Computed

```txt
itemsVisibles
itemSeleccionado
cantidadVisible
opcionesSistema
hayFiltrosActivos
sinResultados
```

## Acciones

```txt
inicializar(force?)
reintentar()
seleccionar(id | null)
actualizarBusqueda(value)
actualizarSistema(id | null)
actualizarEstado(value)
actualizarUso(value)
actualizarOrden(key)
limpiarFiltros()
guardar(input)
reset()
```

### Carga y selección

- Compartir promesa en curso y evitar recargas si ya está cargado.
- Mantener activos y desactivados en `items`.
- No seleccionar automáticamente.
- Abrir un item no consulta detalle.
- Si deja de ser visible por filtros, cerrar sin seleccionar otro.

### Guardado

- Bloquear doble operación.
- Crear agrega una sola vez el item retornado.
- Actualizar reemplaza inmutablemente por ID.
- La respuesta completa es la fuente final.
- No recargar el listado.
- Si no llega resumen, recalcular total, activos y desactivados.

## Composable

`useCatalogoAceites()` obtiene el store, usa `storeToRefs` para state/getters y coordina:

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
  nombre: string;
  activo: boolean;
}
```

No crear otro store para el drawer. Props bajan y eventos suben; el item original nunca se muta al escribir.

## Persistencia

- Conservar carga y filtros al alternar pestañas durante la sesión.
- Sin `localStorage` ni sincronización URL en esta entrega.
- Resetear al cerrar sesión.

## Pruebas

- Carga una vez y permite reintento.
- Filtra nombre, sistema, estado y uso sin requests.
- Define correctamente en uso/sin uso.
- Deduplica sistemas por ID.
- Ordena cinco claves en ambas direcciones.
- Limpiar restaura defaults.
- Cierra selección no visible.
- Crear/editar actualizan localmente una vez.
- `storeToRefs` mantiene reactividad.

## Criterios de aceptación

- Store como única fuente de verdad.
- Componentes sin filtros inline.
- Cero red por controles visuales.
- Draft separado del item.
- Fixtures tipados pueden alimentar el mismo flujo.

