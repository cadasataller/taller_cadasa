ESPECIFICACION OPERATIVA — PLAN DE IMPLEMENTACION
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Orden de migracion y checklist
FECHA DE CONTEXTO: 2026-07-02
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. ORDEN RECOMENDADO
=====================================================================

1. Ejecutar `01-producto-nombre-busqueda.sql`.
2. Verificar data migrada en `producto`.
3. Ejecutar `02-contexto-destino-tablas-catalogo.sql`.
4. Verificar data migrada desde `solicitud_equipo`.
5. Ejecutar `03-rpc-crear-solicitud-y-listado.sql`.
6. Implementar cambios de app.
7. Validar wizard, borradores y listado.
8. Cuando todo este estable, ejecutar la fase final para volver
   `producto.nombre` obligatorio.

=====================================================================
2. CHECKLIST DE VALIDACION SQL
=====================================================================

2.1 Producto

- `producto.nombre` existe
- `producto.nombre` tiene el valor que antes estaba en `descripcion`
- `producto.descripcion` quedo en `null`
- `rpc_buscar_productos_solicitud_go` devuelve `nombre`

2.2 Catalogo y destinos

- `catalogo_contexto_destino` existe
- `tipo_origen` y `restringido_a_servicios` existen
- `solicitud_contexto_destino` existe
- el trigger impide mezclar tipos por solicitud
- los datos previos de `solicitud_equipo` quedaron migrados como `equipo`

2.3 RPC de crear

- acepta `p_contextos_destino`
- acepta producto temporal con `nombre`
- rechaza mezcla de tipos de destino
- permite crear sin destinos
- rechaza servicio con menos de 5 caracteres

2.4 RPC de listado

- devuelve `destinos`
- devuelve `destinos_total`
- la busqueda por texto considera destino

=====================================================================
3. CHECKLIST DE VALIDACION FUNCIONAL EN APP
=====================================================================

3.1 Paso 1

- el copy visible ya dice `Destino`
- si obliga seleccionar destino para continuar
- si el usuario elige un equipo:
  - puede agregar varios equipos
  - no puede mezclar con contexto catalogo
- si el usuario elige un contexto catalogo:
  - solo puede agregar mas contextos del mismo `tipo_origen`
  - no puede agregar equipo en esa misma solicitud

3.2 Reglas de visibilidad del catalogo

- `operativo` no ve destinos restringidos
- `almacen` no ve destinos restringidos
- `admin`, `gerencia`, `secretaria` los ven solo en `servicio`
- en `zafra`, `cultivo`, `otros` no aparecen destinos con
  `restringido_a_servicios = true`

3.3 Productos

- la busqueda muestra `nombre`
- la fila de lectura ya no muestra `descripcion`
- el formulario manual exige `nombre`
- el formulario manual permite `descripcion` opcional
- `nombre` no supera 56 caracteres

3.4 Servicios

- descripcion de servicio sin maximo en UI
- descripcion de servicio con minimo 5

3.5 Observacion

- solo autocompleta codigos de equipos reales
- ignora contextos del catalogo

3.6 Borradores

- un borrador nuevo guarda el nuevo shape de destinos y productos
- un borrador se puede restaurar sin romper el wizard
- no se puede guardar borrador sin destino

3.7 Listado

- columna `Destino` visible donde antes decia `Equipos`
- placeholders de busqueda actualizados
- destinos de catalogo muestran nombre
- equipos muestran codigo

=====================================================================
4. RECOMENDACION DE IMPLEMENTACION EN CODIGO
=====================================================================

El spec si incluye el cambio de contrato hacia la BD.

Esto abarca:

- payload frontend -> RPC
- schemas Zod de creacion y borradores
- shape transaccional de destinos
- shape de productos temporales y existentes
- cambio de `p_equipos` a `p_contextos_destino`
- cambio de producto temporal de `descripcion` principal a `nombre` principal

Orden sugerido:

1. tipos
2. schemas
3. stores
4. services/composables
5. componentes de crear solicitud
6. borradores
7. listado
8. tests

Razon:

- si empiezas por componentes antes de estabilizar tipos y store, el cambio se
  vuelve mas costoso
- el payload al RPC y el shape de borradores son el contrato mas sensible

=====================================================================
5. NOTAS FINALES
=====================================================================

5.1 Tabla vieja `solicitud_equipo`

No se elimina en esta fase.

Se recomienda conservarla temporalmente hasta confirmar que:

- el nuevo RPC ya no la usa
- el listado ya no depende de ella
- no existe otro modulo de la app leyendola

5.2 Compatibilidad temporal

Aunque el concepto visible cambie a `destino`, durante la implementacion puede
ser util mantener nombres internos viejos por pocas horas o por una rama corta.

No se recomienda dejar esa compatibilidad semantica en el codigo final.
