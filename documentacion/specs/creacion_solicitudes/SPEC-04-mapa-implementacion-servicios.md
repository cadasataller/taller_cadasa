MAPA DE IMPLEMENTACION — SERVICIOS UI Y LOGICA
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 2 / Servicios
FECHA DE CONTEXTO: 2026-06-26
PROYECTO: gestion operativa / solicitudes compras

Referencia principal:

- `documentacion/specs/creacion_solicitudes/SPEC-03-servicios-ui-y-logica.md`

Referencia complementaria:

- `documentacion/specs/creacion_solicitudes/SPEC-05-contextos-servicio-catalogo.md`

=====================================================================
1. OBJETIVO DEL MAPA
=====================================================================

Traducir la especificacion funcional de servicios a una estructura concreta de archivos, capas y secuencia de implementacion.

Este documento responde:

- que archivos crear
- que archivos modificar
- donde vive cada responsabilidad
- como fluye la data del formulario al store y al payload
- en que orden conviene implementar

=====================================================================
2. RESUMEN DE ARQUITECTURA
=====================================================================

Capas involucradas:

1. Step 1 de servicios con source unificado de seleccion
2. Step 2 especifico de servicios
3. Listado visual de servicios
4. Formulario interno de servicio
5. Drawer shell
6. Bottom sheet shell
7. Ajustes en store, schemas y composable del wizard
8. Reutilizacion del service/composable de unidades
9. Reutilizacion del store de equipos + catalogo de contextos

Flujos principales:

Paso 1 servicio:

Input unico de seleccion
-> contextos visibles para usuarios autorizados
-> equipos visibles por busqueda
-> seleccion normalizada
-> store del wizard
-> payload final `p_equipos`

Paso 2 servicio:

Boton `Agregar servicio`
-> overlay responsive
-> formulario interno de servicio
-> validacion/normalizacion local
-> store del wizard
-> listado visual del paso 2
-> payload final `p_servicios`

=====================================================================
3. ARCHIVOS A CREAR
=====================================================================

3.0 Selector unificado de paso 1 servicio

Crear o ajustar archivo:

- `src/components/compras/crear/CrearSolicitudContextosServicioSelector.vue`

Responsabilidad:

- renderizar un solo input para solicitudes de servicio
- mezclar dos sources en una sola lista visual:
  - equipos
  - contextos de servicio
- permitir seleccion normalizada sin romper el store actual
- mostrar contextos solo para usuarios autorizados
- permitir solo equipos cuando el usuario no pueda usar contextos

3.1 Paso 2 especifico de servicios

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraStepServicios.vue`

Responsabilidad:

- renderizar la UI principal del paso 2 para `servicio`
- mostrar CTA principal
- mostrar listado
- mostrar empty state
- emitir eventos de alta, edicion y eliminacion

3.2 Listado visual de servicios

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraServiciosList.vue`

Responsabilidad:

- renderizar filas/cards de servicios
- mantener la misma intencion visual del listado manual de productos
- renderizar acciones `editar` y `eliminar`

3.3 Formulario interno de servicio

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraServicioForm.vue`

Responsabilidad:

- renderizar `cantidad`, `descripcion`, `unidad`
- aplicar validacion local del formulario
- normalizar cantidad a `1` cuando venga vacia o en `0`
- emitir `cancel`
- emitir `submit`

3.4 Drawer shell de servicio

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraServicioDrawer.vue`

Responsabilidad:

- contenedor desktop del formulario
- aplicar overlay, layout y cierre estricto

3.5 Bottom sheet shell de servicio

Crear archivo:

- `src/components/compras/crear/CrearSolicitudCompraServicioBottomSheet.vue`

Responsabilidad:

- contenedor mobile/tablet del formulario
- compartir mismas reglas de cierre 

3.6 Confirmacion de eliminacion

Opciones validas:

1. Crear un componente dedicado:
- `src/components/compras/crear/CrearSolicitudCompraServicioDeleteConfirm.vue`

2. O resolverlo dentro del paso de servicios si el equipo quiere menor numero de archivos.

Recomendacion:

- empezar integrado en el paso y extraer solo si crece.

=====================================================================
4. ARCHIVOS A MODIFICAR
=====================================================================

4.1 Vista principal del wizard

Modificar:

- `src/views/compras/SolicitudCompraCrearView.vue`

Cambios esperados:

- cuando `currentStep === 1` y `tipoSolicitud === 'servicio'`, mantener el paso base con selector unificado
- cuando `currentStep === 2` y `tipoSolicitud === 'servicio'`, montar `CrearSolicitudCompraStepServicios`
- mantener `CrearSolicitudCompraStepProductos` para tipos de producto
- manejar apertura/cierre del overlay de servicio
- manejar modo `crear` y `editar`
- manejar confirmacion de eliminacion

4.1.1 Paso base del wizard

Modificar:

- `src/components/compras/crear/CrearSolicitudCompraStepDatosBase.vue`

Cambios esperados:

- cuando `tipoSolicitud === 'servicio'`, usar selector unificado de equipos + contextos
- cuando `tipoSolicitud !== 'servicio'`, mantener selector normal de equipos
- seguir persistiendo todo dentro del mismo campo `equipos` del wizard

4.1.2 Composable de contextos

Modificar:

- `src/composables/compras/useCatalogoServicioContextoOptions.ts`

Cambios esperados:

- exponer opciones de contexto para el selector unificado
- restringir disponibilidad a:
  - `area = ALL`
  - `role = gerencia`
  - `role = secretaria`

4.2 Composable principal del wizard

Modificar:

- `src/composables/compras/useCrearSolicitudCompraWizard.ts`

Cambios esperados:

- exponer acciones de servicio completas
- si hace falta, exponer helpers para actualizar servicio

4.3 Store principal del wizard

Modificar:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store.ts`

Cambios esperados:

- agregar accion para actualizar servicio existente
- mantener accion para agregar servicio
- mantener accion para remover servicio
- exigir al menos un servicio para validar el paso 2 cuando `tipoSolicitud === 'servicio'`
- mapear `cantidad` real al payload de `p_servicios`

4.4 Tipos del store

Modificar:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types.ts`

Cambios esperados:

- agregar `cantidad` a `ServicioSolicitudItem`
- agregar tipo draft de formulario

4.5 Schemas de validacion

Modificar:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.schemas.ts`

Cambios esperados:

- validar descripcion
- validar cantidad negativa
- validar cantidad no numerica si el draft se modela como string de formulario
- exigir minimo un servicio para avanzar de paso

=====================================================================
5. RESPONSABILIDADES POR CAPA
=====================================================================

5.0 Selector unificado de paso 1

Debe encargarse de:

- mezclar visualmente equipos y contextos
- filtrar contextos localmente
- buscar equipos con el store existente
- emitir seleccion segun el source correcto
- mantener una sola experiencia visual para solicitudes de servicio

No debe encargarse de:

- persistir directo a Supabase
- alterar el contrato de `p_equipos`

5.1 Componente del paso

Debe encargarse de:

- composicion visual general
- CTA principal
- listado
- empty state
- mensaje de error del paso

No debe encargarse de:

- consultar unidades
- persistir directo a Supabase

5.2 Formulario interno

Debe encargarse de:

- estado local temporal del formulario
- validacion local
- normalizacion de cantidad
- submit del draft normalizado

No debe encargarse de:

- renderizar la lista completa
- decidir desktop/mobile

5.3 Shells responsive

Drawer y bottom sheet deben encargarse solo de:

- contenedor visual
- cierre estricto
- layout responsive

5.4 Store

Debe encargarse de:

- estado persistente del wizard
- lista de servicios
- validacion del paso
- armado del payload

=====================================================================
6. SECUENCIA DE IMPLEMENTACION RECOMENDADA
=====================================================================

1. Ajustar paso 1 servicio para usar selector unificado de equipos + contextos.
2. Restringir catalogo de contextos por `area = ALL`, `gerencia` y `secretaria`.
3. Ajustar tipos y schemas del store para soportar `cantidad`.
4. Agregar accion `actualizarServicio` en el store.
5. Ajustar `buildPayload()` para enviar `cantidad` real.
6. Crear formulario interno de servicio.
7. Crear drawer shell y bottom sheet shell.
8. Crear listado visual de servicios.
9. Crear paso 2 especifico de servicios.
10. Integrar ambos ajustes en `SolicitudCompraCrearView.vue`.
9. Agregar confirmacion de eliminacion.
10. Probar alta, edicion, eliminacion y bloqueo de avance.

=====================================================================
7. RIESGOS Y PUNTOS DE ATENCION
=====================================================================

1. No reutilizar el mismo archivo de productos para servicios.
2. No mezclar reglas de producto temporal con reglas de servicio.
3. No dejar `cantidad` hardcodeada en `1` dentro del payload si el usuario la edita.
4. La unidad inicial debe resolverse desde el catalogo dinamico, no hardcodear solo el label.
5. La validacion del paso 2 para servicios debe vivir en store/schema, no solo en UI.

=====================================================================
8. CRITERIOS DE IMPLEMENTACION COMPLETA
=====================================================================

1. Existe un paso 2 especifico de servicios separado del de productos.
2. Existe un formulario interno unico reutilizado por drawer y bottom sheet.
3. El store soporta crear, editar y eliminar servicios con `cantidad`.
4. El usuario no puede avanzar de paso sin al menos un servicio.
5. El payload final de `p_servicios` envia `cantidad`, `descripcion` y `unidad_codigo`.
