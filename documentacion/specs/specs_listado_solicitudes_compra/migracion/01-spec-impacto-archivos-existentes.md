# SPEC DE MIGRACION 01 — IMPACTO SOBRE ARCHIVOS EXISTENTES

## Objetivo

Evitar que la migracion del listado toque areas no deseadas del modulo ya
implementado.

## Regla general

Antes de modificar cualquier archivo existente, clasificarlo como:

- `conservar`
- `adaptar`
- `reemplazar parcialmente`
- `no tocar`

## Archivos a conservar

Estos archivos deben seguir existiendo y conservar su responsabilidad general:

```txt
src/views/compras/SolicitudesCompraView.vue
src/components/compras/list/useSolicitudesCompraList.ts
src/components/compras/list/SolicitudesListToolbar.vue
src/components/compras/list/SolicitudesGrupoTabs.vue
src/components/compras/list/desktop/SolicitudesDesktopTable.vue
src/components/compras/list/mobile/SolicitudesMobileList.vue
src/components/compras/list/mobile/SolicitudMobileCard.vue
src/stores/db_compras/solicitudes_compra/solicitudesCompra.store.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.service.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.mappers.ts
src/stores/db_compras/solicitudes_compra/solicitudesCompra.helpers.ts
```

No deben ser redisenados como si el modulo fuera nuevo.

## Archivos a adaptar

### `src/components/compras/list/solicitudesListOptions.ts`

Estado actual:

- contiene grupos y estados hardcodeados

Destino:

- eliminar solo la parte que ahora queda cubierta por config remota
- puede sobrevivir como archivo de helpers si sigue aportando valor

No hacer:

- borrarlo al principio de la migracion sin reemplazo funcional

### `src/components/compras/list/solicitudListRoleConfig.ts`

Estado actual:

- resuelve layout y parte de la visibilidad por rol

Destino:

- mantenerlo SOLO para layout y visibilidad estructural
- quitarle la responsabilidad de tabs/grupos/seguimientos permitidos

## Archivos nuevos permitidos

Crear solo estos archivos nuevos como parte de la migracion:

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.config.types.ts
```

Opcionalmente, si el codigo queda demasiado acoplado:

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.config.helpers.ts
```

Solo crear ese helper adicional si realmente evita complejidad en store o
toolbar.

## Archivos que no se deben tocar

```txt
src/stores/db_compras/solicitudes_compra/borradores/**
src/stores/db_compras/solicitudes_compra/crear_solicitud/**
src/views/compras/SolicitudCompraCrearView.vue
src/router/**
```

Tampoco tocar:

- flujo de crear
- flujo de detalle
- acceso a borradores
- navegacion actual

## Responsabilidades que deben preservarse

### View

Debe seguir siendo una superficie de composicion.

No debe absorber:

- logica de config remota
- logica de derivacion de tabs
- logica de filtrado local complejo

### Store

Debe seguir siendo la fuente de verdad del listado.

### Service

Debe seguir siendo el unico lugar con `.rpc(...)`.

### Toolbar

Debe seguir emitiendo eventos.

No debe llamar store directo.

## Riesgos principales de regresion

- romper la carga inicial del listado
- romper la busqueda existente
- romper scroll/cargar mas
- romper visualizacion por rol ya existente
- mezclar fallback sin config con error real del listado

## Criterio de aceptacion

La implementacion de la migracion puede modificar archivos existentes, pero no
puede cambiarles su responsabilidad principal.
