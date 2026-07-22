ESPECIFICACION DE MIGRACION — CREACION DE SOLICITUDES
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Migracion producto + contexto destino + RPCs + listado
FECHA DE CONTEXTO: 2026-07-02
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Agrupar en una sola carpeta los cambios de base de datos y de aplicacion
necesarios para soportar estas decisiones ya confirmadas:

- `producto.nombre` pasa a ser el campo principal.
- `producto.descripcion` queda como dato opcional y secundario.
- la busqueda de productos ya no usa `descripcion`.
- `solicitud_equipo` deja de representar el concepto real del negocio.
- el nuevo concepto transaccional sera `solicitud_contexto_destino`.
- el catalogo maestro pasara de `catalogo_servicio_contexto` a
  `catalogo_contexto_destino`.
- una solicitud puede tener varios destinos solo si todos pertenecen al mismo
  `tipo_origen`.
- en frontend, el destino sigue siendo obligatorio para:
  - enviar
  - guardar borrador
  - avanzar en el flujo cuando aplique validacion del paso 1
- los destinos con `restringido_a_servicios = true` solo aparecen para
  `admin`, `gerencia` y `secretaria`, y solo cuando la solicitud es de tipo
  `servicio`.

=====================================================================
2. ARCHIVOS DE ESTA CARPETA
=====================================================================

1. `01-producto-nombre-busqueda.sql`
   Cambios de tabla `producto` y RPC de busqueda de productos.

2. `02-contexto-destino-tablas-catalogo.sql`
   Renombre del catalogo, nueva tabla transaccional
   `solicitud_contexto_destino` y migracion desde `solicitud_equipo`.

3. `03-rpc-crear-solicitud-y-listado.sql`
   RPC principal de creacion y RPC de listado adaptados al nuevo modelo.

4. `04-spec-cambios-app-producto-y-contexto-destino.md`
   Mapa de cambios requeridos en frontend, stores, schemas, tests y copy.

5. `05-spec-plan-de-implementacion.md`
   Orden recomendado de ejecucion y checklist de validacion.

=====================================================================
3. ORDEN RECOMENDADO DE EJECUCION
=====================================================================

1. Ejecutar `01-producto-nombre-busqueda.sql`.
2. Ejecutar `02-contexto-destino-tablas-catalogo.sql`.
3. Ejecutar `03-rpc-crear-solicitud-y-listado.sql`.
4. Implementar cambios de aplicacion usando `04-spec-cambios-app-producto-y-contexto-destino.md`.
5. Verificar con `05-spec-plan-de-implementacion.md`.

=====================================================================
4. NOTAS IMPORTANTES
=====================================================================

4.1 SQL manual

Los scripts de esta carpeta estan escritos para que los ejecutes manualmente.
No se ejecutan desde Codex.

4.2 Fase de obligatoriedad de `producto.nombre`

Por decision confirmada:

- primero se agrega `producto.nombre` como nullable
- se migra la data actual
- se adapta la app
- al final se vuelve obligatorio

El SQL deja esa segunda fase preparada y claramente comentada.

4.3 Historial de nombre de destino

No se guardara `label_snapshot` en `solicitud_contexto_destino`.

La solicitud persistira solo:

- `tipo_origen`
- `codigo`

El label visible se resolvera contra el catalogo vigente o, en el caso de
equipos, contra la fuente externa de equipos.

4.4 Restriccion por tipo de origen

La nueva tabla transaccional debe impedir que una misma solicitud mezcle:

- `equipo` con `area_operativa`
- `equipo` con `grupo_equipo`
- `grupo_equipo` con `otros`

Si una solicitud tiene varios destinos, todos deben compartir el mismo
`tipo_origen`.

4.5 Regla dual de obligatoriedad

La obligatoriedad del destino queda separada en dos niveles:

- frontend:
  - si exige al menos un destino para guardar borrador o enviar
- backend:
  - permite registrar solicitudes aun si `p_contextos_destino` llega vacio

Esto es intencional y debe mantenerse reflejado en schemas, store, mensajes de
error y RPC.
