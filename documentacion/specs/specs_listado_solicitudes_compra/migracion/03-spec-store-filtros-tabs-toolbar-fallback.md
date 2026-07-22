# SPEC DE MIGRACION 03 — STORE, FILTROS, TABS, TOOLBAR Y FALLBACK

## Objetivo

Describir la migracion funcional sobre el comportamiento del listado existente.

## Store: comportamiento que se conserva

`src/stores/db_compras/solicitudes_compra/solicitudesCompra.store.ts`

Debe conservar:

- ser la fuente de verdad
- cargar listado inicial
- manejar `loading`
- manejar `loadingMore`
- manejar `error`
- manejar paginacion local o estrategia actual equivalente

## Store: comportamiento que cambia

Debe agregar:

- carga de config remota
- estado de disponibilidad de config
- filtros locales por `seguimiento.codigo`
- filtro `Creadas por mi`
- derivacion de tabs visibles desde config

## Orden de carga requerido

1. Cargar config remota.
2. Si config existe:
   - derivar grupos visibles
   - definir grupo activo valido
3. Cargar listado.

## Si falla config

Decicion confirmada:

- SI hay listado
- SI hay toast
- NO hay tabs configuradas
- NO hay filtros dinamicos de seguimiento

Mensaje sugerido de toast:

```txt
No pudimos cargar la configuracion del listado. Mostraremos una vista reducida.
```

## Tabs

`src/components/compras/list/SolicitudesGrupoTabs.vue`

Cambios:

- dejar de hardcodear tabs internas
- recibir grupos visibles desde el composable/store
- respetar orden visual fijo

## Toolbar

`src/components/compras/list/SolicitudesListToolbar.vue`

Cambios:

- reemplazar select de estado por select de seguimiento
- poblar opciones desde config del grupo activo
- agregar checkbox `Creadas por mi`

## Regla del checkbox `Creadas por mi`

Condiciones:

- visible para `admin`, `gerencia`, `secretaria`
- usa `es_mia`
- va despues de `Bloqueadas`

Orden final sugerido:

1. `Bloqueadas`
2. `Creadas por mi`
3. `Diferencia OC`

## Cambio de grupo

Si el seguimiento seleccionado ya no existe para el grupo nuevo:

- limpiar el seguimiento seleccionado
- mostrar aviso al usuario

Mensaje sugerido:

```txt
El seguimiento seleccionado ya no aplica para este grupo.
```

## Grupos sin visibilidad

Si la config existe pero no trae grupos visibles:

- no mostrar tabs
- no mostrar lista normal
- mostrar:

```txt
Usuario no tiene permitido ver solicitudes
```

## Composable

`src/components/compras/list/useSolicitudesCompraList.ts`

Debe seguir siendo el adaptador entre store y vista.

Debe exponer adicionalmente:

- `configAvailable`
- `visibleGroups`
- `seguimientoOptions`
- `canUseCreatedByMeFilter`
- `uiMessage`

## Reglas de filtrado local

Con config disponible:

- filtrar por `grupo_listado`
- filtrar por `seguimiento.codigo`
- filtrar por `prioridad`
- filtrar por `bloqueada`
- filtrar por `tiene_diferencia_oc`
- filtrar por `badge_delegacion.codigo`
- filtrar por `es_mia`

Sin config disponible:

- no aplicar select de seguimiento
- no aplicar tabs dinamicas
- mantener filtros basicos permitidos por la vista reducida

## Criterio de aceptacion

La pantalla debe seguir funcionando aunque falle la config, sin romper la carga
del listado existente.
