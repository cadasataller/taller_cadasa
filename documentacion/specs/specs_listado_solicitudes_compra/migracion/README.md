ESPECIFICACION DE MIGRACION — LISTADO DE SOLICITUDES DE COMPRA
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Migracion listado a config remota + seguimiento
FECHA DE CONTEXTO: 2026-07-08
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir una migracion segura sobre el listado YA IMPLEMENTADO para pasar del
modelo actual basado en:

- `estado`
- tabs fijas
- opciones hardcodeadas en frontend

al modelo nuevo basado en:

- `seguimiento`
- config remota desde RPC
- tabs visibles por config
- select de seguimiento por grupo
- filtro `Creadas por mi`
- fallback sin config

Este paquete NO reemplaza las specs base existentes.

Este paquete sirve para:

- indicar que archivos actuales se modifican
- indicar que comportamiento se conserva
- indicar que comportamiento se reemplaza
- reducir el riesgo de regresion

=====================================================================
2. PRINCIPIO DE ESTA MIGRACION
=====================================================================

Las specs originales en:

```txt
documentacion/specs/specs_listado_solicitudes_compra/specs/
```

se mantienen como referencia del modulo actual.

Los cambios del modelo nuevo deben ejecutarse leyendo primero este paquete de
migracion y luego ajustando el codigo existente con control de impacto.

=====================================================================
3. DECISIONES CONFIRMADAS
=====================================================================

- No deben convivir contrato viejo y contrato nuevo a nivel funcional final.
- Se creara un archivo nuevo:

  `src/stores/db_compras/solicitudes_compra/solicitudesCompra.config.types.ts`

- `seguimiento` reemplaza a `estado` como fuente visual principal del avance.
- La config remota sale de:

  `rpc_obtener_config_listado_solicitudes`

- El listado principal sale de:

  `rpc_obtener_solicitudes_lista_usuario`

- Los grupos/tabs visibles dependen de config remota.
- El orden visual de grupos se mantiene fijo:
  - `en_proceso`
  - `completadas`
  - `descartadas`
- Si un grupo no viene visible, el siguiente ocupa su lugar.
- El select de seguimiento sale del grupo activo y del config remoto.
- `seguimiento` no debe hardcodearse en frontend.
- Nuevo filtro:

  `Creadas por mi`

- `Creadas por mi` usa `es_mia`.
- Aplica para:
  - `admin`
  - `gerencia`
  - `secretaria`
- Se muestra despues del checkbox `Bloqueadas`.
- Si falla la config:
  - SI hay listado
  - NO hay tabs configuradas
  - NO hay filtros dinamicos de seguimiento
  - SI hay toast informativo

=====================================================================
4. ARCHIVOS DE ESTA CARPETA
=====================================================================

1. `01-spec-impacto-archivos-existentes.md`
   Inventario de archivos existentes, que se conserva, que se adapta,
   que se reemplaza y que no se debe tocar.

2. `02-spec-contratos-rpc-types-config-seguimiento.md`
   Contratos nuevos de types, RPCs y modelos de datos.

3. `03-spec-store-filtros-tabs-toolbar-fallback.md`
   Cambios funcionales del store, composable, toolbar, tabs y fallback.

4. `04-spec-render-tabla-cards-y-no-regresion.md`
   Cambios visuales de tabla/cards y checklist de no regresion.

=====================================================================
5. ORDEN RECOMENDADO DE EJECUCION
=====================================================================

1. Leer `01-spec-impacto-archivos-existentes.md`.
2. Implementar contratos nuevos usando `02-spec-contratos-rpc-types-config-seguimiento.md`.
3. Adaptar store/composable/toolbar/tabs con `03-spec-store-filtros-tabs-toolbar-fallback.md`.
4. Adaptar tabla/cards con `04-spec-render-tabla-cards-y-no-regresion.md`.
5. Ejecutar pruebas de no regresion del listado existente.

=====================================================================
6. REGLA DE SEGURIDAD
=====================================================================

Ninguna implementacion de esta migracion debe:

- tocar creacion de solicitud
- tocar detalle
- tocar borradores
- tocar navegacion
- tocar SQL desde estas specs

salvo que una spec futura lo habilite explicitamente.
