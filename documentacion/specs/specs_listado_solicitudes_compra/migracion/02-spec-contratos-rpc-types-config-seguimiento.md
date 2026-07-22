# SPEC DE MIGRACION 02 — CONTRATOS RPC, TYPES Y MODELO DE CONFIG

## Objetivo

Definir los contratos nuevos sin reescribir el modulo como greenfield.

## Cambio principal

El frontend deja de usar visualmente:

- `estado`
- `estado_codigo`
- `estado_nombre`

y pasa a usar:

- `seguimiento`

## Archivo nuevo obligatorio

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.config.types.ts
```

## Archivo existente a adaptar

```txt
src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts
```

## Types nuevos en `solicitudesCompra.config.types.ts`

Declarar como minimo:

- `SolicitudCompraListConfigViewer`
- `SolicitudCompraListConfigAlcance`
- `SolicitudCompraListConfigSeguimiento`
- `SolicitudCompraListConfigGrupo`
- `SolicitudCompraListConfigBadgeDelegacion`
- `SolicitudCompraListConfigRpc`

## Adaptaciones requeridas en `solicitudesCompra.types.ts`

### Params del RPC

Eliminar del contrato:

```txt
p_estado_codigo
```

Mantener:

```txt
p_busqueda
p_grupo_listado
p_prioridad_codigo
p_fecha_desde
p_fecha_hasta
p_solo_bloqueadas
p_solo_diferencia_oc
p_limit
p_offset
```

### Fila cruda del listado

Agregar o adaptar para soportar:

- `seguimiento`
- `accion_rol`
- `badge_delegacion`
- `es_delegada`
- `tipo_delegacion`
- `es_mia`

### Item UI

El item final debe exponer:

- `seguimiento`
- `accionRol`
- `badgeDelegacion`
- `esDelegada`
- `tipoDelegacion`
- `esMia`

## Filtros del listado

Actualizar `SolicitudCompraListFilters` para soportar:

- `seguimientoCodigo`
- `soloCreadasPorMi`
- `badgeDelegacionCodigo`

Mantener:

- `busqueda`
- `grupoListado`
- `prioridadCodigo`
- `fechaDesde`
- `fechaHasta`
- `soloBloqueadas`
- `soloDiferenciaOc`

## Reglas de contrato

### Config remota

Sale de:

```txt
rpc_obtener_config_listado_solicitudes
```

### Listado

Sale de:

```txt
rpc_obtener_solicitudes_lista_usuario
```

### Tabs y select

La fuente de verdad para:

- grupos visibles
- orden de tabs a mostrar
- seguimientos del grupo activo

es la config remota.

El frontend no debe volver a codificar listas por rol.

## Regla de orden visual

Aunque el config venga desordenado, la UI debe ordenar visualmente:

1. `en_proceso`
2. `completadas`
3. `descartadas`

## Criterio de aceptacion

Los types nuevos deben permitir migrar el store y los componentes sin tocar SQL
ni otros subflujos.
