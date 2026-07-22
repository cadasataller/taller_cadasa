ESPECIFICACION DE CAMBIOS DE APP — PRODUCTO + CONTEXTO DESTINO
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Wizard de creacion, borradores y listado
FECHA DE CONTEXTO: 2026-07-02
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir los cambios de codigo que deben implementarse despues de ejecutar los
scripts SQL de esta carpeta.

Este documento no contiene cambios ya aplicados. Es un mapa de implementacion.

=====================================================================
2. DECISIONES FUNCIONALES CONSOLIDADAS
=====================================================================

2.1 Productos

- `nombre` sera el campo principal del producto.
- `descripcion` sera opcional y secundaria.
- en productos existentes:
  - la UI de seleccion y lectura mostrara `nombre`
  - `descripcion` no se mostrara
- en productos temporales/manuales:
  - `nombre` obligatorio
  - limite de 56 caracteres para `nombre`
  - `descripcion` opcional
  - `descripcion` solo se ve al abrir el formulario en modo edicion
  - en modo lectura de linea no se muestra

2.2 Servicios

- mantienen un solo campo `descripcion`
- no tienen maximo de caracteres en formulario
- si tienen minimo funcional de 5 caracteres

2.3 Destino

- el concepto deja de llamarse `equipos` a nivel funcional visible
- pasa a llamarse `destino` o `contexto destino`
- en frontend el destino sigue siendo obligatorio para todos los tipos
- una solicitud puede tener varios destinos solo si todos son del mismo
  `tipo_origen`
- no se pueden mezclar:
  - equipos con contextos de catalogo
  - dos tipos distintos del catalogo

2.4 Restriccion del catalogo

- `restringido_a_servicios = true`
  - solo visible para `admin`, `gerencia`, `secretaria`
  - solo cuando `tipoSolicitud = servicio`
- `operativo` y `almacen` nunca ven esos destinos restringidos
- en tipos `zafra`, `cultivo`, `otros` tampoco aparecen, incluso si el usuario
  es `admin`, `gerencia` o `secretaria`

=====================================================================
3. IMPACTO EN TIPOS Y CONTRATOS
=====================================================================

3.1 Archivo principal

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types.ts`

Cambios requeridos:

- reemplazar `descripcion` principal de producto por `nombre`
- agregar `descripcion?: string | null` donde aplique para temporales/manuales
- renombrar el bloque `equipos` a algo consistente con `destinos`
- reemplazar `EquipoSeleccionadoSource = 'equipo' | 'contexto'`
  por un contrato que soporte:
  - `equipo`
  - `area_operativa`
  - `instalacion_taller`
  - `grupo_equipo`
  - `otros`
- cambiar payload:
  - `p_equipos: string[]`
  - por `p_contextos_destino: Array<{ tipo_origen: ..., codigo: string }>`
- actualizar response:
  - `equipos_total`
  - por `destinos_total`

3.2 Borradores

Archivos:

- `src/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types.ts`
- `src/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.schemas.ts`

Cambios:

- renombrar estructuras visibles de `equipos` a `destinos`
- soportar el nuevo shape de item de destino
- remover obligatoriedad dura del arreglo
- mantener regla de no mezclar `tipo_origen`

=====================================================================
4. IMPACTO EN STORE Y WIZARD
=====================================================================

4.1 Store principal

Archivo:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store.ts`

Cambios requeridos:

- reemplazar `buildObservacionPrefill` para que siga mirando solo items de tipo
  `equipo`
- adaptar `setTipoSolicitud`
  - hoy resetea `equipos` con logica ligada a `servicio`
  - ahora debe resetear o filtrar `destinos` considerando:
    - visibilidad por tipo de solicitud
    - no mezcla de tipos
- reemplazar:
  - `agregarEquipo`
  - `agregarContextoServicio`
  - `removerEquipo`
  por acciones coherentes con el concepto `destino`
- validar en store que, si ya existe un destino seleccionado:
  - el siguiente destino debe tener el mismo `tipo_origen`
- adaptar `buildPayload()` al nuevo contrato del RPC
- adaptar hidratacion y snapshot de borradores

4.2 Composable

Archivo:

- `src/composables/compras/useCrearSolicitudCompraWizard.ts`

Cambios:

- renombrar referencias visibles de `equipos` a `destinos`
- exponer nuevas acciones del store

=====================================================================
5. IMPACTO EN CATALOGO DE DESTINOS
=====================================================================

Archivos actuales:

- `src/stores/db_compras/catalogo_servicio_contexto/catalogoServicioContexto.types.ts`
- `src/stores/db_compras/catalogo_servicio_contexto/catalogoServicioContexto.service.ts`
- `src/components/compras/crear/CrearSolicitudContextosServicioSelector.vue`
- `src/components/compras/crear/CrearSolicitudCompraStepDatosBase.vue`

Cambios requeridos:

- renombrar modulo a `catalogo_contexto_destino`
- el service debe leer:
  - `codigo`
  - `nombre`
  - `tipo_origen`
  - `restringido_a_servicios`
  - `activo`
- filtrar por `activo = true` en nuevas selecciones
- no ocultar historicos en lectura de solicitudes existentes
- el selector debe mostrar destinos del catalogo segun:
  - rol
  - tipo de solicitud
  - `restringido_a_servicios`

=====================================================================
6. IMPACTO EN FORMULARIO DE PRODUCTOS
=====================================================================

6.1 Formulario temporal/manual

Archivos:

- `src/components/compras/crear/CrearSolicitudCompraProductoTemporalForm.vue`
- `src/components/compras/crear/CrearSolicitudCompraProductoTemporalOverlay.vue`

Cambios:

- campo principal cambia de `Descripcion` a `Nombre`
- `Nombre` obligatorio
- `maxlength = 56`
- agregar campo `Descripcion` opcional
- al editar un producto temporal ya existente:
  - si tiene descripcion, precargarla
- al guardar:
  - normalizar `nombre`
  - no obligar `descripcion`

6.2 Paso 2 productos

Archivo:

- `src/components/compras/crear/CrearSolicitudCompraStepProductos.vue`

Cambios:

- cambiar labels y placeholders ligados a `descripcion`
- en resultados de busqueda mostrar:
  - codigo
  - unidad
  - nombre
- en filas seleccionadas mostrar:
  - codigo o `MANUAL`
  - unidad
  - nombre
- no mostrar descripcion en modo lectura

6.3 Resumen

Archivo:

- `src/components/compras/crear/CrearSolicitudCompraStepResumen.vue`

Cambios:

- renombrar columna visible de producto a `Nombre`
- no mostrar descripcion de producto en el resumen de lectura

=====================================================================
7. IMPACTO EN VALIDACIONES
=====================================================================

7.1 Crear solicitud

Archivo:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.schemas.ts`

Cambios:

- producto temporal:
  - `nombre` obligatorio
  - `nombre` max 56
  - `descripcion` opcional
- servicio:
  - `descripcion` min 5
  - sin max en form
- destinos:
  - mantener obligatoriedad global de al menos un item en frontend
  - agregar regla de no mezclar `tipo_origen`

Regla final:

- `stepDatosBaseSchema` debe seguir fallando si no hay destinos
- `createSolicitudSendSchema` debe seguir fallando si no hay destinos
- el mensaje visible debe seguir dejando claro que el destino es requerido
- esto aplica a:
  - `zafra`
  - `cultivo`
  - `otros`
  - `servicio`

7.2 Borradores

- replicar la misma semantica en
  `solicitudesCompraBorradores.schemas.ts`

Para borradores:

- tambien debe exigirse al menos un destino
- no basta con relajar el registro en backend
- el store debe seguir frenando el guardado de borrador si no hay destinos

Importante:

No basta con cambiar solo Zod.

Tambien debe revisarse:

- store
- payload
- RPC
- copy de errores
- resumen
- autocompletado de observacion

Importante adicional:

- aunque frontend lo trate como obligatorio, el RPC seguira aceptando
  `p_contextos_destino = []`
- por eso el contrato de app y el contrato SQL ya no son identicos, y eso debe
  estar explicitamente documentado en implementacion y pruebas

=====================================================================
8. IMPACTO EN LISTADO DE SOLICITUDES
=====================================================================

Archivos:

- `src/stores/db_compras/solicitudes_compra/solicitudesCompra.types.ts`
- `src/stores/db_compras/solicitudes_compra/solicitudesCompra.mappers.ts`
- `src/components/compras/list/cells/SolicitudEquiposCell.vue`
- `src/components/compras/list/desktop/SolicitudesDesktopTable.vue`
- `src/components/compras/list/mobile/SolicitudMobileCard.vue`
- `src/components/compras/list/SolicitudesListToolbar.vue`
- `src/components/compras/list/solicitudListRoleConfig.ts`

Cambios:

- renombrar columna visible `Equipos` a `Destino`
- renombrar tipos internos de preview para usar `destinos`
- adaptar placeholders de busqueda:
  - hoy hablan de equipo
  - deben hablar de destino
- la celda debe mostrar:
  - codigo de equipo si es equipo
  - nombre del catalogo si es contexto destino

=====================================================================
9. IMPACTO EN VISTAS
=====================================================================

Archivos:

- `src/views/compras/SolicitudCompraCrearView.vue`
- `src/views/compras/SolicitudesCompraView.vue`

Cambios:

- actualizar imports del catalogo renombrado
- cambiar handlers que aun hablan de `contexto-servicio`
- adaptar props y eventos del paso 1
- adaptar cualquier copy visual que hable de equipos cuando ahora debe decir
  `destino`

=====================================================================
10. IMPACTO EN TESTS
=====================================================================

Hay impacto seguro en:

- `solicitudesCompraCrear.store.test.ts`
- `CrearSolicitudCompraStepObservaciones.test.ts`
- `CrearSolicitudCompraStepResumen.test.ts`
- `solicitudListRoleConfig.test.ts`

Cambios esperados:

- nuevos nombres de campos
- nuevos payloads RPC
- nueva regla de no mezclar tipos de destino
- nueva semantica de visibilidad del catalogo
- servicio con minimo 5 caracteres
- producto temporal con `nombre` max 56

=====================================================================
11. RIESGOS SI SE IMPLEMENTA PARCIALMENTE
=====================================================================

1. Si se cambia solo la tabla `producto` pero no el frontend:
   - la UI seguira enviando `descripcion`
   - el RPC fallara o guardara datos en columnas incorrectas

2. Si se cambia solo el schema Zod de destinos:
  - el store seguira mezclando tipos
  - la UI seguira hablando de equipos
  - el RPC antiguo seguira esperando `p_equipos`
  - o el frontend dejara pasar casos que el store aun deberia bloquear

3. Si se cambia solo el listado:
  - la busqueda y labels quedaran inconsistentes con crear solicitud

4. Si no se actualizan borradores:
  - un borrador previo o nuevo puede hidratar shapes viejos y romper el wizard

5. Si no se actualiza el payload frontend:
   - la app seguira enviando `p_equipos`
   - el nuevo RPC esperara `p_contextos_destino`
   - la creacion o guardado de borrador fallaran por contrato incompatible
