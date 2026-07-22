ESPECIFICACION COMPLEMENTARIA — BORRADORES / CARGA / HIDRATACION / CONTINUACION
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Crear solicitud desde borrador existente
FECHA DE CONTEXTO: 2026-06-30
PROYECTO: gestion operativa / solicitudes compras

Referencia principal:

- `documentacion/specs/creacion_solicitudes/spec.md`

Referencia complementaria:

- `documentacion/specs/creacion_solicitudes/SPEC-07-adjuntos-ui-y-preview.md`

Referencia UI relacionada:

- `documentacion/specs/creacion_solicitudes/SPEC-09-modal-borradores-ui-y-flujo.md`

=====================================================================
1. OBJETIVO
=====================================================================

Definir la logica funcional y tecnica necesaria para permitir que el usuario:

1. presione `Crear` desde el listado de solicitudes
2. vea si ya tiene borradores disponibles
3. elija continuar uno de esos borradores o empezar uno nuevo
4. abra el wizard de creacion con el store ya cargado desde el borrador elegido
5. continue editando desde el paso exacto guardado en el registro

Este documento no define estilos visuales detallados del modal. Esa parte vive en:

- `SPEC-09-modal-borradores-ui-y-flujo.md`

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- consulta de borradores del usuario actual via RPC
- decision previa a la navegacion hacia crear
- modo `nueva solicitud`
- modo `continuar borrador`
- hidratacion del store principal del wizard
- reglas de carga inicial del formulario
- apertura del wizard en el `current_step` persistido
- reglas para adjuntos no restaurables
- reglas para continuar guardando sobre el mismo `draftId`
- criterios de aceptacion y casos borde

No incluye:

- inactivacion automatica de borradores
- descarte de borradores desde UI
- eliminacion administrativa
- restauracion de adjuntos previos
- cambios al contrato actual de envio final

Decisiones ya confirmadas para esta iteracion:

- existe RPC de listado: `rpc_obtener_mis_borradores_solicitud_compra`
- la inactivacion de borradores se implementara despues
- los adjuntos no deben restaurarse
- los borradores no se descartan desde este modal
- el wizard debe abrir en el paso guardado en el registro

=====================================================================
3. CONTEXTO ACTUAL DEL FLUJO
=====================================================================

Hoy el flujo hace esto:

1. el usuario presiona `Crear`
2. la vista de listado anima la salida
3. navega a `SolicitudCompraCrear`
4. al montar la vista de creacion, el store se resetea
5. el wizard arranca vacio

Eso significa que hoy solo existe una entrada al formulario:

- `crear desde cero`

Para soportar borradores, deben existir dos entradas funcionales:

1. `crear desde cero`
2. `continuar borrador`

=====================================================================
4. DEFINICION DE HIDRATACION DEL STORE
=====================================================================

En este contexto, `hidratar el store` significa:

- tomar un registro devuelto por `rpc_obtener_mis_borradores_solicitud_compra`
- transformarlo al shape interno del store del wizard
- cargarlo como estado base antes de renderizar el formulario editable

La hidratacion NO significa solo guardar el `draftId`.

La hidratacion SI debe cargar:

- `draftId`
- `currentStep`
- `tipoSolicitud`
- `fechaEntrega`
- `equipos`
- `productos`
- `servicios`
- `observacion`
- `solicitarUrgente`
- `motivoUrgencia`
- metadatos visuales necesarios como `fechaCreacionLocal` si se decide exponer fecha del borrador

La hidratacion SI debe limpiar o reinicializar:

- `adjuntosLocales`
- `adjuntosErroresRecientes`
- `adjuntosSubidos`
- `uploadSession`
- `loading`
- `draftSaving`
- `uploading`
- `error`
- `validationErrors`
- `productSearchQuery`
- `productSearchResults`
- `productSearchLoading`
- `productSearchError`

La hidratacion NO debe intentar reconstruir:

- archivos `File`
- previews locales de adjuntos
- sesiones temporales de upload

=====================================================================
5. FUENTES DE DATOS
=====================================================================

5.1 RPC de listado

Fuente confirmada:

- `rpc_obtener_mis_borradores_solicitud_compra`

Responsabilidad del RPC:

- devolver solo borradores del usuario autenticado
- devolver la informacion necesaria para construir:
  - cards resumidas del modal
  - payload completo para continuar editando

Minimo de campos esperados por item:

- `id`
- `current_step`
- `tipo_solicitud`
- `fecha_entrega`
- `observacion`
- `solicitar_urgente`
- `motivo_urgencia`
- `equipos`
- `productos`
- `servicios`
- `created_at`
- `updated_at`
- cualquier campo adicional de resumen que el backend ya exponga

5.2 Servicio frontend de borradores

Debe existir una capa service que encapsule:

1. obtener lista de borradores del usuario actual
2. normalizar la respuesta del RPC a tipos frontend
3. exponer los datos al punto de decision del boton `Crear`

No debe mezclarse esta llamada RPC directamente dentro del template del modal.

=====================================================================
6. MODOS DE ENTRADA AL WIZARD
=====================================================================

Debe existir un modo de apertura explicito.

6.1 Modo nuevo

Comportamiento:

- se limpia el store
- se inicializa el contexto del usuario actual
- el wizard abre en paso 1
- `draftId = null`

6.2 Modo continuar borrador

Comportamiento:

- se obtiene el borrador elegido desde el resultado del RPC
- se resetea el store para limpiar residuos de otra sesion
- se inicializa el contexto del usuario actual
- se hidrata el store con el borrador seleccionado
- el wizard abre en `current_step`
- `draftId = id del borrador`

Regla obligatoria:

- al continuar un borrador, todos los siguientes guardados manuales y autoguardados deben actualizar el mismo `draftId`

=====================================================================
7. MOMENTO CORRECTO PARA RESOLVER LA DECISION
=====================================================================

La decision entre `nuevo` y `continuar` debe ocurrir antes de navegar al wizard.

Razon:

- hoy la vista de creacion resetea el store al montar
- si primero se navega y luego se pregunta, se monta un formulario vacio innecesariamente
- eso complica el estado, la UX y la sincronizacion del overlay de carga

Secuencia correcta:

1. click en `Crear`
2. consultar borradores
3. si no hay borradores:
   - navegar directo como hoy
4. si hay borradores:
   - abrir modal de decision
5. segun la accion del usuario:
   - `nueva solicitud` -> navegar en modo nuevo
   - `continuar borrador` -> navegar en modo continuar con payload seleccionado

=====================================================================
8. REGLAS DE HIDRATACION POR CAMPO
=====================================================================

8.1 `draftId`

- debe asignarse desde `id` del borrador
- es obligatorio para que el siguiente guardado haga `update` y no `insert`

8.2 `currentStep`

- debe respetarse exactamente el `current_step` del registro
- no recalcularse desde la data
- valores esperados hoy: `2 | 3 | 4`

8.3 `tipoSolicitud`

- debe asignarse desde `tipo_solicitud`
- define si el paso 2 abre productos o servicios

8.4 `fechaEntrega`

- debe asignarse desde `fecha_entrega`
- debe seguir validando contra reglas actuales del schema

8.5 `equipos`

- debe asignarse tal como fue persistido
- debe conservar `source`
- debe servir tanto para:
  - producto con equipos reales
  - servicio con equipos o contextos

8.6 `productos`

- si `tipoSolicitud !== servicio`, deben cargarse al store
- si el borrador fuera de servicio y trae productos vacios, el usuario vera el paso tal cual fue guardado

8.7 `servicios`

- si `tipoSolicitud === servicio`, deben cargarse al store
- el paso 2 debe abrir mostrando los servicios ya capturados

8.8 `observacion`

- debe restaurarse exactamente la observacion persistida
- no debe regenerarse desde el prefill si el borrador trae texto ya guardado

8.9 `solicitarUrgente` y `motivoUrgencia`

- deben restaurarse desde el borrador
- la UI debe reflejarlos desde la apertura

8.10 `adjuntos`

- siempre deben quedar vacios al continuar
- debe mostrarse mensaje visual aclaratorio en la UI

=====================================================================
9. REGLAS DE INICIALIZACION DEL STORE
=====================================================================

9.1 Secuencia recomendada para nuevo

1. `reset()`
2. `initialize()`
3. abrir wizard

9.2 Secuencia recomendada para continuar borrador

1. `reset()`
2. `initialize()`
3. `hydrateFromDraft(draft)`
4. abrir wizard

Regla obligatoria:

- `hydrateFromDraft(draft)` debe ejecutarse despues de `initialize()`

Motivo:

- `initialize()` llena datos del usuario autenticado
- `hydrateFromDraft()` no debe borrar esos datos base

=====================================================================
10. LOGICA DE CARGA DE DATOS
=====================================================================

Debe existir una accion de store o helper equivalente que:

1. reciba un borrador tipado
2. valide que tenga estructura minima esperada
3. transforme nombres de columnas backend a nombres internos del store
4. asigne el estado resultante de forma atomica

Transformaciones minimas esperadas:

- `id` -> `draftId`
- `current_step` -> `currentStep`
- `tipo_solicitud` -> `tipoSolicitud`
- `fecha_entrega` -> `fechaEntrega`
- `solicitar_urgente` -> `solicitarUrgente`
- `motivo_urgencia ?? ''` -> `motivoUrgencia`

Tambien debe ajustar:

- `lastSavedDraftSnapshotHash`

Regla obligatoria:

- al terminar de hidratar, el snapshot hash debe representar el estado cargado como ultimo estado persistido exitosamente

Motivo:

- evita que el autoguardado inmediato vuelva a mandar el mismo borrador sin cambios

=====================================================================
11. AUTOGUARDADO DESPUES DE CONTINUAR
=====================================================================

Despues de cargar un borrador:

- el autoguardado debe seguir activo
- no debe crear un nuevo borrador
- no debe dispararse de nuevo si no hubo cambios reales

Comportamiento esperado:

1. usuario abre borrador
2. se hidrata el estado
3. el timer de autosave sigue disponible
4. si no hubo cambios, `skipIfUnchanged` debe evitar update redundante
5. si hubo cambios, se actualiza el mismo `draftId`

=====================================================================
12. FLUJO DE CREACION DESDE BORRADOR
=====================================================================

12.1 Continuar y luego guardar borrador

Resultado esperado:

- se actualiza el mismo registro
- el wizard permanece en la vista actual

12.2 Continuar y luego enviar solicitud

Resultado esperado:

- se usa la data hidratada + cambios del usuario
- se ejecuta el flujo normal de envio
- no se restauran adjuntos previos
- si el usuario necesita adjuntos, los vuelve a seleccionar

Nota:

- la inactivacion del borrador asociado queda fuera de esta iteracion

=====================================================================
13. CASOS BORDE
=====================================================================

13.1 El RPC devuelve cero borradores

- no se muestra modal
- se navega directo al wizard nuevo

13.2 El RPC falla

- no se debe bloquear permanentemente el flujo
- definir fallback:
  - opcion recomendada: mostrar toast o feedback corto y abrir nuevo

13.3 El borrador elegido viene incompleto o invalido

- no debe romper el wizard
- debe mostrarse error recuperable
- fallback recomendado:
  - no abrir ese borrador
  - permitir volver al modal o iniciar nuevo

13.4 El borrador tiene `current_step = 4` pero ya no cumple reglas actuales

- debe abrir en paso 4 porque ese fue el estado guardado
- al intentar avanzar, guardar o enviar, las validaciones actuales siguen aplicando

13.5 El borrador contiene productos y servicios incompatibles con su tipo

- debe priorizarse el `tipo_solicitud`
- la carga debe respetar el shape valido para ese tipo
- cualquier limpieza o saneamiento debe ser explicita y documentada

13.6 Cambio de schemas en el futuro

- la carga de borradores debe contemplar `schema_version`
- si en una version futura se requiere migracion, ese comportamiento debe documentarse aparte

=====================================================================
14. ARCHIVOS Y CAPAS A MODIFICAR
=====================================================================

14.1 Listado / punto de entrada

Modificar:

- `src/views/compras/SolicitudesCompraView.vue`

Responsabilidad:

- interceptar click en `Crear`
- pedir borradores antes de navegar
- abrir modal si aplica
- resolver modo nuevo o continuar

14.2 Service de borradores

Modificar:

- `src/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.service.ts`

Responsabilidad:

- agregar wrapper del RPC `rpc_obtener_mis_borradores_solicitud_compra`
- tipar y normalizar respuesta

14.3 Tipos de borradores

Modificar:

- `src/stores/db_compras/solicitudes_compra/borradores/solicitudesCompraBorradores.types.ts`

Responsabilidad:

- definir tipo de item para listado/continuacion
- separar si hace falta:
  - row de tabla
  - item de RPC resumido
  - payload de hidratacion

14.4 Store del wizard

Modificar:

- `src/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.store.ts`

Responsabilidad:

- agregar accion `hydrateFromDraft`
- asegurar secuencia `reset -> initialize -> hydrate`
- recalcular `lastSavedDraftSnapshotHash`

14.5 Composable del wizard

Modificar si hace falta:

- `src/composables/compras/useCrearSolicitudCompraWizard.ts`

Responsabilidad:

- exponer capacidades nuevas si la vista las necesita

14.6 Vista de creacion

Modificar:

- `src/views/compras/SolicitudCompraCrearView.vue`

Responsabilidad:

- soportar entrada en modo nuevo o continuar
- mostrar mensaje fijo de adjuntos no restaurados cuando aplique

=====================================================================
15. CONTRATO DE EVENTOS ENTRE LISTADO Y WIZARD
=====================================================================

Se recomienda formalizar la intencion de apertura del wizard con una de estas dos estrategias:

1. estado temporal centralizado
2. route meta / query / store transitorio de apertura

Lo importante no es el mecanismo sino la regla:

- el wizard debe saber si abre en modo nuevo o con un borrador seleccionado

Requisito funcional:

- esa intencion debe existir antes del montaje util del formulario

=====================================================================
16. CRITERIOS DE ACEPTACION
=====================================================================

1. Si el usuario no tiene borradores, presionar `Crear` abre el wizard nuevo sin pasos adicionales.

2. Si el usuario tiene borradores, presionar `Crear` abre un modal de decision antes de navegar.

3. Si el usuario elige `Nueva solicitud`, el wizard abre limpio en paso 1.

4. Si el usuario elige un borrador, el wizard abre con la data restaurada del registro seleccionado.

5. El wizard abre exactamente en el `current_step` del borrador.

6. Los siguientes guardados actualizan el mismo `draftId`.

7. Los adjuntos no se restauran y el usuario ve una indicacion clara de ello.

8. El autoguardado no regraba inmediatamente el mismo borrador si no hubo cambios.

9. Un fallo al consultar borradores no deja bloqueado el CTA `Crear`.

10. La continuidad del borrador funciona tanto para solicitudes de producto como de servicio.

=====================================================================
17. CHECKLIST DE IMPLEMENTACION
=====================================================================

- definir tipo frontend de respuesta del RPC
- agregar metodo service para `rpc_obtener_mis_borradores_solicitud_compra`
- decidir mecanismo de paso de intencion `nuevo` vs `continuar`
- agregar accion `hydrateFromDraft` en store
- recalcular `lastSavedDraftSnapshotHash` despues de hidratar
- agregar mensaje persistente de adjuntos no restaurados
- conectar decision del boton `Crear` con modal previo a navegacion
- cubrir tests de nuevo flujo

