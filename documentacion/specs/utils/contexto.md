# Contexto final completo — Módulo de Solicitudes de Compra

## 1. Objetivo del módulo

Implementar un módulo de **gestión de solicitudes de compra** para controlar solicitudes de productos y servicios, con flujo por estados, roles, revisión por almacén, revisión por supervisor, aprobación por gerencia, subida al sistema de compras, lectura de órdenes de compra, control de recepción en almacén y adjuntos a nivel de solicitud.

El módulo se reconstruirá desde cero, partiendo de la lógica actual, pero con una estructura más normalizada, versionada en repositorio y con migraciones SQL, seeds, vistas y RPC.

## 2. Decisiones generales

- Se recrearán las tablas del módulo de compras desde cero.
- Se manejará versionado en repositorio.
- Supabase será la base de datos.
- El frontend usará Vue 3, Pinia, Supabase, Sidebar ya existente y Tailwind.
- No se usará la tabla `solicitud_compra_permission_rule`.
- La lógica de permisos se controlará por estado, área, rol y RPC.
- Las acciones importantes no deben depender solo del frontend.
- Las validaciones críticas deben estar en RPC.
- Se usarán vistas para listas, badges, detalle y alertas.
- Se usará `pg_cron` para tareas automáticas.
- `PROFILE` y `equipos` son dependencias externas: no se crean, no se eliminan y no se alteran desde este módulo.
- Los adjuntos serán solo a nivel de solicitud.

## 3. Roles y áreas

### 3.1 Roles

Se usará catálogo de roles.

Roles iniciales:

| Código | Nombre | Uso |
|---|---|---|
| `admin` | Administrador | Acceso general de administración. Equivale a ALL. |
| `gerencia` | Gerencia | Puede crear, revisar, aprobar, rechazar y definir cantidad de gerencia. |
| `almacen` | Almacén | Revisa inventario, descarta productos y corrige códigos temporales. |
| `secretaria` | Secretaría | Registra subida al sistema, `folio_sol`/requisición y `fecha_entrega_sistema`; no registra `folio_oc`. Puede crear correcciones administrativas y solicitudes normales a nombre de gerencia mediante RPC dedicados. |
| `operativo` | Operativo/Supervisor | Crea solicitudes, agrega equipos, productos o servicios y define cantidades solicitadas. |

### 3.2 Áreas

Áreas iniciales:

| Código | Nombre |
|---|---|
| `all` | ALL |
| `gerencia` | Gerencia |
| `almacen` | Almacén |
| `secretaria` | Secretaría |
| `cosecha_agricola` | Cosecha Agrícola |
| `cosecha_mecanizada` | Cosecha Mecanizada |
| `equipo_pesado` | Equipo Pesado |
| `mecanica_transporte` | Mecánica de Transporte |
| `engrase` | Engrase |

Regla: el área se usará para segmentar solicitudes y visibilidad. El rol se usará para controlar acciones.

## 4. Tipos de solicitud

Habrá tipos de solicitud para clasificar el proceso.

| Código | Nombre | Requiere almacén | Permite productos | Permite servicios |
|---|---:|---:|---:|---:|
| `zafra` | Zafra | Sí | Sí | No |
| `cultivo` | Cultivo | Sí | Sí | No |
| `otros` | Otros | Sí | Sí | No |
| `servicio` | Servicio | No | No | Sí |

Reglas:

- Zafra, Cultivo y Otros son solicitudes de productos.
- Servicio no pasa por almacén.
- Productos y servicios no se mezclan en una misma solicitud.
- La fecha de entrega es obligatoria para productos y servicios.
- En servicios, el equipo es opcional.
- En productos, el equipo es obligatorio para enviar la solicitud.
- El tipo no define automáticamente la prioridad. La prioridad la define el usuario correspondiente.

## 5. Estados

Se usará una tabla maestra de estados y una tabla intermedia para indicar en qué contexto se puede usar cada estado.

No se debe depender del ID numérico del estado en código ni RPC. Se debe usar `codigo`.

### 5.1 Estados de solicitud

| Código | Nombre | Contexto |
|---|---|---|
| `borrador` | Borrador | solicitud |
| `para_revision_almacen` | Para Revisión Almacén | solicitud |
| `en_revision_almacen` | En Revisión Almacén | solicitud |
| `revisado_por_almacen` | Revisado Por Almacén | solicitud |
| `para_revision_supervisor` | Para Revisión Supervisor | solicitud |
| `en_revision_supervisor` | En Revisión Supervisor | solicitud |
| `para_revision_gerencia` | Para Revisión Gerencia | solicitud |
| `en_revision_gerencia` | En Revisión Gerencia | solicitud |
| `aprobado_gerencia` | Aprobado Por Gerencia | solicitud |
| `rechazado` | Rechazado | solicitud |
| `descartado_por_supervisor` | Descartado Por Supervisor | solicitud |
| `subiendo_sistema_compras` | Subiendo A Sistema Compras | solicitud |
| `subido_sistema_compra` | Subido A Sistema Compra | solicitud |
| `orden_compra` | Orden de Compra | solicitud |
| `oc_recibido_parcial_almacen` | OC Recibido Parcial En Almacén | solicitud |
| `oc_recibido_completo_almacen` | OC Recibido Completo En Almacén | solicitud |
| `en_revision_administrador` | En Revisión Por Administrador | solicitud |

### 5.2 Estados de detalle

| Código | Nombre | Contexto |
|---|---|---|
| `pendiente` | Pendiente | detalle_producto, detalle_servicio |
| `activo` | Activo | detalle_producto, detalle_servicio |
| `descartado_almacen` | Descartado Por Almacén | detalle_producto |
| `descartado_gerencia` | Descartado Por Gerencia | detalle_producto, detalle_servicio |
| `aprobado_gerencia` | Aprobado Por Gerencia | detalle_producto, detalle_servicio |
| `subido_sistema` | Subido A Sistema | detalle_producto, detalle_servicio |

Estado inicial de los detalles: `pendiente`.

## 6. Flujo feliz de productos

1. Usuario operativo o gerencia crea solicitud en `borrador`.
2. Agrega fecha de entrega, observación, prioridad, equipos y productos.
3. Si el producto no existe, lo agrega como producto temporal con descripción y unidad de medida.
4. Puede agregar adjuntos a nivel de solicitud.
5. Envía a `para_revision_almacen`.
6. Almacén toma la revisión: `en_revision_almacen`.
7. Almacén revisa inventario:
   - Para productos existentes: edita cantidad de inventario.
   - Para productos temporales: corrige/reemplaza el código de producto y edita cantidad de inventario.
   - Puede descartar productos.
8. Almacén envía a `para_revision_supervisor`.
9. Supervisor toma revisión: `en_revision_supervisor`.
10. Supervisor decide qué productos y cantidades continuarán.
11. Supervisor envía a `para_revision_gerencia`.
12. Gerencia toma revisión: `en_revision_gerencia`.
13. Gerencia agrega cantidad aprobada en `cantidad_gerencia`.
14. Gerencia aprueba: `aprobado_gerencia`.
15. Secretaría toma proceso: `subiendo_sistema_compras`.
16. Secretaría registra folio externo y fecha de entrega si cambió.
17. Secretaría marca `subido_sistema_compra`.
18. Las órdenes de compra se importan/leen desde datos externos.
19. La solicitud pasa a `orden_compra`.
20. Cuando llega recepción:
   - Si falta algo: `oc_recibido_parcial_almacen`.
   - Si todo llegó: `oc_recibido_completo_almacen`.

## 7. Flujo feliz de servicios

1. Usuario operativo o gerencia crea solicitud en `borrador`.
2. Selecciona tipo `servicio`.
3. Agrega descripción del servicio, cantidad y unidad.
4. Unidad por defecto: servicio.
5. Fecha de entrega obligatoria.
6. Equipo opcional.
7. Puede agregar adjuntos a nivel de solicitud.
8. Envía directo a `para_revision_gerencia`.
9. Gerencia revisa, define cantidad de gerencia y aprueba.
10. Sigue el proceso de secretaría, subida al sistema y orden de compra.

## 8. Flujos alternativos

### 8.1 Almacén descarta productos

- Almacén puede descartar productos individuales.
- Un producto descartado por almacén no puede ser reactivado por supervisor.
- Si almacén descarta todo, la solicitud vuelve a `para_revision_supervisor`.
- El supervisor decide si agrega nuevos productos o deja la solicitud sin continuar.
- No se puede enviar a gerencia si todos los productos están descartados.

### 8.2 Supervisor agrega nuevo producto después de almacén

- Si supervisor agrega un producto nuevo después de recibir la revisión de almacén, ese nuevo producto debe ir obligatoriamente a almacén.
- Almacén solo debe revisar los nuevos productos o los productos pendientes de revisión.

### 8.3 Gerencia devuelve a supervisor

- Gerencia puede devolver una solicitud a supervisor.
- Esto inicia un nuevo ciclo.
- El supervisor puede ajustar productos/cantidades.
- Si agrega productos nuevos, debe enviarlos nuevamente a almacén.
- Si no agrega productos nuevos y solo ajusta cantidades ya revisadas, puede volver a gerencia según reglas de validación.

### 8.4 Gerencia rechaza solicitud

- Solo gerencia puede rechazar una solicitud completa.
- Estado de solicitud: `rechazado`.
- El rechazo no requiere completar cantidades.

### 8.5 Gerencia descarta detalle

- Gerencia puede descartar productos o servicios individuales.
- El descarte de detalle no necesariamente rechaza toda la solicitud.
- Si todos los detalles quedan descartados, gerencia puede rechazar la solicitud o devolverla según decisión del negocio.

### 8.6 Descarte automático por supervisor

- Si una solicitud queda en `para_revision_supervisor` por descarte total de almacén y no se continúa durante 30 días, se cambia automáticamente a `descartado_por_supervisor`.
- Esto se ejecutará con `pg_cron`.

### 8.7 Secretaría: delegación y correcciones

Secretaría tiene dos capacidades especiales, ambas mediante RPC y con auditoría en `solicitud_creacion_delegada`.

#### Corrección por error de Secretaría al subir/registrar en sistema de compras

Uso: cuando Secretaría registró o subió mal una cantidad, producto o servicio en el sistema externo y no puede modificar lo ya subido.

Reglas:

- Puede ser para un área operativa o para gerencia.
- No pasa por almacén, supervisor ni revisión normal de gerencia.
- Crea una solicitud nueva en `aprobado_gerencia`.
- Copia solo los productos/servicios que se van a corregir.
- La solicitud original no se modifica.
- La nueva solicitud genera sus propias líneas internas.
- La relación con la solicitud original, línea original, detalle original, cantidad errada y cantidad corregida se guarda en `solicitud_creacion_delegada.payload`.

RPC conceptual:

```txt
rpc_secretaria_crear_correccion_sistema_compras
```

#### Solicitud normal de gerencia creada por Secretaría

Uso: cuando Secretaría captura una solicitud nueva a nombre de gerencia, sin que sea corrección.

Reglas:

- Solo puede crearla a nombre de un usuario con rol `gerencia`.
- Sigue el flujo normal.
- Si es servicio, va directo a `para_revision_gerencia`.
- Si es producto, sigue el flujo normal de productos.
- Se registra en `solicitud_creacion_delegada` con `tipo_delegacion = 'solicitud_gerencia_normal'`.

RPC conceptual:

```txt
rpc_secretaria_crear_solicitud_gerencia_normal
```

#### Tabla de auditoría

```txt
solicitud_creacion_delegada
```

Campos principales:

```txt
solicitud_id
solicitud_origen_id
creada_por_email
creada_por_area_id
creada_por_role_id
creada_para_email
creada_para_area_id
creada_para_role_id
tipo_delegacion
motivo
payload
```

No se agregan columnas nuevas a `solicitud_compra` para esta auditoría.


## 9. Productos temporales

Cuando un producto no existe en catálogo:

- El usuario puede crearlo manualmente.
- Debe escribir descripción.
- Debe seleccionar unidad de medida.
- Se genera un código temporal.
- Se conserva la descripción original del supervisor.
- Almacén debe resolver el producto temporal usando opción B:
  - No se reemplaza forzosamente el catálogo.
  - El detalle cambia de referencia del código temporal al código real.
  - Se registra resolución en tabla `producto_codigo_resolucion`.
  - El producto temporal queda marcado como resuelto/inactivo o como temporal resuelto.

Código sugerido:

```txt
TMP-2026-000001
```

## 10. Bloqueo de edición

Se usará tabla lock.

Reglas:

- Bloqueo de toda la solicitud.
- El bloqueo dura mientras el formulario de actualización esté abierto.
- Se libera al guardar, cancelar o salir.
- Si se cierra mal la pestaña, puede quedar bloqueado.
- ALL no puede forzar liberación.
- Si queda bloqueado debe mostrarse arriba en el detalle.
- Si lleva más de 2 días bloqueado, se debe mostrar modal de alerta.
- El bloqueo debe guardar usuario, área, rol y fecha/hora.
- Para subir o eliminar adjuntos, si existe un lock activo, debe ser del mismo usuario.

## 11. Disponible desde

Para mostrar desde qué hora una solicitud está disponible para revisión, se usará el historial de estados.

Ejemplo:

```txt
Disponible para revisión desde: fecha_inicio del último historial activo
```

Aplica para estados:

- `para_revision_almacen`
- `para_revision_supervisor`
- `para_revision_gerencia`
- `aprobado_gerencia`
- `subiendo_sistema_compras`

## 12. Órdenes de compra e importación

La app no registra manualmente las órdenes de compra. Las OC vienen de una fuente externa relacionada con Excel/Power BI.

### 12.1 Folio OC

Reglas:

- `folio_oc` no debe estar en `solicitud_compra`.
- Una solicitud puede tener varias OC.
- Los folios OC viven en `orden_compra` y `orden_compra_detalle`.
- El listado y detalle muestran OC mediante agregados desde `orden_compra`.
- Secretaría no llena `folio_oc` al marcar subida al sistema.
- `rpc_marcar_subido_sistema` trabaja con `folio_sol`, `fecha_subida_sistema` y `fecha_entrega_sistema`.

### 12.2 Modos de importación

| Modo | Regla |
|---|---|
| `delta` | Actualiza solo lo recibido; no toca lo que no vino. |
| `window_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino dentro del rango. |
| `full_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino para esa fuente. |

No se borran físicamente OC ni líneas que dejan de aparecer. Se usa:

```txt
activo_fuente = false
source_deleted_at
source_deleted_batch_id
last_seen_batch_id
```

### 12.3 Identidad de líneas importadas

```txt
source_identity_key = identidad estable de línea importada
row_hash = detector de cambios
```

Reglas:

- No usar `row_hash` como clave única de línea.
- Usar `linea_fuente` si la fuente la trae.
- Si no hay `linea_fuente`, usar `producto:<cod_producto>`.
- `linea_fuente` no es `linea_solicitud`.

### 12.4 Cantidades

| Campo | Significado |
|---|---|
| `solicitud_producto_detalle.cantidad` | Cantidad solicitada originalmente. |
| `solicitud_producto_detalle.cantidad_gerencia` | Cantidad aprobada por gerencia. |
| `solicitud_producto_detalle.cantidad_solicitada_sistema` | Cantidad registrada/solicitada en sistema externo. |
| `orden_compra_detalle.cantidad` | Cantidad comprada en OC. |

La cantidad comprada en OC no debe copiarse a `cantidad_solicitada_sistema`.

### 12.5 Diferencia OC

- Solo aplica a productos.
- No se calcula para solicitudes tipo servicio.
- Se muestra solo si ya existe OC o dato externo suficiente.
- Se guarda en `solicitud_compra_diferencia`.
- Debe incluir `linea_solicitud` cuando corresponda a un detalle interno.

### 12.6 Reglas visuales del folio OC

- El folio de OC se muestra solo cuando ya existe/importó la orden de compra.
- En roles que puedan verlo, se muestra debajo del folio de solicitud, con menor tamaño, opacidad baja y estilo secundario.
- No se debe mostrar texto `Sin OC`.
- Almacén no ve folio de solicitud ni folio OC en el listado.
- Secretaría ve folio de solicitud, pero no ve folio OC en el listado.
## 13. Adjuntos de solicitudes

Los adjuntos serán únicamente a nivel de solicitud.

No se asociarán directamente a:

- Detalles de producto.
- Detalles de servicio.
- Órdenes de compra.
- Recepciones.

Una solicitud podrá tener varios adjuntos:

- Imágenes.
- PDF.
- Documentos.
- Archivos de referencia.
- Cotizaciones.
- Evidencias.

Reglas:

- El archivo físico se guarda en Supabase Storage.
- La tabla `solicitud_adjunto` guarda solo metadata.
- Los adjuntos no modifican el estado de la solicitud.
- Los adjuntos no son obligatorios para enviar, aprobar o rechazar una solicitud.
- Los RPC principales de crear, editar, enviar, aprobar o rechazar solicitud no deben mezclarse con adjuntos.
- Se usarán RPC separados:
  - `rpc_registrar_solicitud_adjunto`
  - `rpc_eliminar_solicitud_adjunto`
- La eliminación será lógica: `eliminado = true`.
- La vista `vw_solicitud_adjuntos` listará los adjuntos visibles.
- `vw_solicitudes_lista` debe incluir `cantidad_adjuntos` y `tiene_adjuntos`.
- `vw_solicitud_detalle_completo` debe incluir un array `adjuntos`.

Reglas visuales de adjuntos en el listado:

- Los adjuntos se muestran como indicador compacto `Adjuntos N`.
- El indicador solo se muestra cuando `cantidad_adjuntos > 0`.
- No se muestran badges vacíos de adjuntos.
- El badge `Adjuntos N` solo aparece para roles que tengan permiso de ver adjuntos.
- Almacén no ve el indicador de adjuntos en el listado.
- Secretaría no ve el indicador de adjuntos en el listado.

Flujo recomendado en frontend:

1. Crear o abrir solicitud.
2. Subir archivo a Supabase Storage en ruta basada en `solicitud_id`.
3. Registrar metadata con `rpc_registrar_solicitud_adjunto`.
4. Mostrar los adjuntos desde `vw_solicitud_adjuntos` o desde `vw_solicitud_detalle_completo`.

Ruta sugerida en Storage:

```txt
solicitudes-compras/{solicitud_id}/{timestamp}-{nombre_archivo}
```

## 14. Badges y alertas

Se usarán badges para mostrar pendientes, bloqueos, adjuntos y diferencias reales con órdenes de compra.

Inicialmente:

- Badge para solicitudes pendientes por rol/área.
- Badge para solicitudes bloqueadas.
- Badge para productos temporales pendientes de resolver.
- Badge `Diferencia OC` cuando exista OC y se detecte diferencia entre lo solicitado/aprobado y lo pedido en la orden de compra.
- Indicador visual `Adjuntos N` para cantidad de adjuntos por solicitud cuando el rol pueda verlos.

Reglas de visibilidad:

- `Bloqueado` debe ser visible para todos los roles cuando aplique.
- `Diferencia OC` reemplaza el concepto anterior de `Alerta OC`.
- `Diferencia OC` solo se muestra cuando ya existe OC importada/asociada.
- `Diferencia OC` no se muestra si no existe OC.
- `Diferencia OC` puede ser visible para administrador, gerencia y usuario operativo cuando aplique.
- `Diferencia OC` no se muestra para almacén.
- `Diferencia OC` no se muestra para secretaría.
- `Adjuntos N` solo se muestra si existen adjuntos y el rol tiene permiso para verlo.
- No deben mostrarse badges vacíos.

## 15. RLS y seguridad

Se puede usar cualquiera de estas dos estrategias:

1. Permitir lectura directa con RLS y controlar escritura por RPC.
2. Permitir más acceso directo, pero validar fuertemente en RPC.

Recomendación de implementación:

- Lectura mediante vistas.
- Escritura crítica mediante RPC.
- Evitar `update` directo desde frontend para cambios de estado, aprobación, rechazo, envío a almacén, envío a gerencia, subida a sistema y liberación de lock.
- Evitar `insert/update/delete` directo en `solicitud_adjunto`; usar RPC.
- Permitir subida del archivo físico a Storage mediante políticas del bucket `solicitudes-compras`.

## 16. Repositorio

Estructura recomendada:

```txt
supabase/
  migrations/
  seeds/
  views/
  functions/
  cron/
docs/
  compras/
src/
  modules/
    solicitudes-compras/
      components/
      composables/
      services/
      stores/
      types/
      views/
      workflow/
```

## 17. División de migraciones actual

La migración está dividida en archivos numéricos. Para adjuntos se agregan archivos nuevos al final:

```txt
017_create_solicitud_adjuntos_solicitud_level.sql
018_update_views_adjuntos.sql
```

Si quieres integrar los adjuntos dentro de la migración base antes de ejecutarla desde cero:

- La tabla `tipo_adjunto`, `solicitud_adjunto`, RPC de adjuntos, RLS y bucket pueden ir después de `006_create_main_tables.sql`.
- La modificación de vistas debe fusionarse en `014_create_views_and_indexes.sql`.
- Los grants y RLS de adjuntos pueden fusionarse en `015_rls_and_grants.sql`.

Si ya ejecutaste los archivos `001` a `016`, puedes ejecutar `017` y `018` después.

## 18. Pendientes no bloqueantes

Estos puntos no impiden iniciar:

- Confirmar columnas reales del Excel/Power BI.
- Diseñar comparación avanzada entre OC importada y solicitud aprobada.
- Definir si más adelante habrá notificaciones por correo o solo badges.
- Definir si en una fase futura los adjuntos deberán clasificarse por etapa, aunque por ahora serán solo por solicitud.
## 19. Vista UI del listado de solicitudes

Esta sección define únicamente el diseño y comportamiento visual del listado de solicitudes de compra. No reemplaza los flujos, estados, RPC, RLS ni reglas de base de datos del módulo.

La vista debe existir en versión desktop y mobile. En desktop se usa tabla administrativa. En mobile se usan cards apiladas.

### 19.1 Reglas generales de la vista

- La vista corresponde al listado de solicitudes del módulo `Compras / Solicitudes de Compra`.
- El diseño debe ser limpio, compacto, profesional y alineado con CADASA Gestión Operativa.
- No debe mostrarse un título principal como `Solicitudes` ni una descripción larga debajo.
- La pantalla debe iniciar directamente con el bloque de búsqueda y filtros.
- El sidebar existente de la app no se elimina ni se modifica.
- Para prompts o diseños generados de la vista, el sidebar no debe dibujarse dentro del mockup.
- En mobile se usa topbar compacto y bottom nav.
- En desktop la creación se hace con botón `Crear` dentro del bloque de filtros.
- En mobile la creación se hace con FAB circular dorado flotante.
- La interacción principal para abrir detalle es la fila completa en desktop o la card completa en mobile.
- No debe existir botón `Ver` en filas ni cards.
- No debe mostrarse texto de ayuda como `Doble click para ver detalle`.

### 19.2 Agrupación visual por estado

El listado debe incluir un divisor tipo segmented control para filtrar por grupo de estado.

Nombres visuales:

```txt
En Proceso | Completadas | Descartadas
```

Reglas:

- El filtro trabaja solo con estados cuyo contexto sea `solicitud`.
- No debe mezclar estados de `detalle_producto`, `detalle_servicio`, `orden_compra` ni `importacion_oc`.
- La opción activa usa fondo verde oscuro o teal corporativo y texto blanco.
- La opción inactiva usa fondo blanco o gris claro con texto oscuro.
- En desktop debe ubicarse pegado a la izquierda del contenedor de tabla, justo encima del encabezado.
- En mobile debe ir debajo del bloque de búsqueda/filtros y encima de las cards.

Estados de `Completadas`:

- `orden_compra`
- `oc_recibido_parcial_almacen`
- `oc_recibido_completo_almacen`

Estados de `Descartadas`:

- `rechazado`
- `descartado_por_supervisor`

Estados de `En Proceso`:

- Todos los demás estados con contexto `solicitud`.
- `subido_sistema_compra` permanece en `En Proceso` porque subir al sistema externo no confirma que exista orden de compra.
- `en_revision_administrador` permanece en `En Proceso` mientras siga activo como estado de solicitud.

### 19.3 Búsqueda y filtros

El bloque superior funciona como barra compacta de control.

Distribución desktop recomendada:

```txt
Buscador → Estado → Prioridad → Rango de fecha → checkboxes → Crear
```

Reglas del bloque:

- El buscador no debe ocupar demasiada altura.
- El buscador debe tener ícono de búsqueda a la izquierda.
- Placeholder desktop sugerido: `Buscar por folio, observación, equipo u orden de compra`.
- En mobile el placeholder sugerido es: `Buscar folio, observación o equipo`.
- `Estado` y `Prioridad` deben verse como selects tipo chip, no como selects grandes de formulario.
- El filtro de fecha debe ser por rango, no por fecha única.
- Los checkboxes `Solo bloqueadas` y `Solo con diferencia OC` deben estar en una misma fila horizontal en desktop.
- En mobile debe usarse un buscador compacto junto a un chip de acción `Filtros`.

Regla del filtro de fecha:

```sql
COALESCE(fecha_entrega_sistema, fecha_entrega)
```

- El rango de fecha debe filtrar primero por `fecha_entrega_sistema` cuando exista.
- Si `fecha_entrega_sistema` es `NULL`, se usa `fecha_entrega`.
- En la UI no se debe mostrar `fecha_entrega_sistema` como campo separado.
- La UI muestra una sola fecha de entrega.
- Mientras `fecha_entrega_sistema` sea `NULL`, se muestra la fecha de entrega original.
- Si `fecha_entrega_sistema` existe, puede usarse como fecha efectiva de entrega mostrada, pero sin etiquetarla como campo técnico.

### 19.4 Vista desktop

La vista desktop corresponde a una tabla administrativa.

Estructura visual:

- Fondo principal beige claro `#EEECE4`.
- Contenedor principal blanco cálido `#FFFFFF` o `#FAF9F5`.
- Bordes suaves `#E5E0D6`.
- Sombra ligera.
- Esquinas redondeadas grandes.
- Sin cards.
- Sin sidebar dibujado dentro del diseño generado.

Reglas de tabla:

- Cada tabla debe estar dentro de un contenedor blanco con bordes redondeados grandes.
- No debe tener scroll vertical interno.
- La página puede crecer verticalmente.
- Las filas deben tener altura media/alta, aproximadamente entre `108px` y `128px`.
- La observación debe ser la columna principal y tener mayor ancho.
- La observación debe mostrarse hasta 3 líneas con `line-clamp-3`.
- Si la observación supera 3 líneas, debe cortarse con `...`.
- La fila completa debe sentirse clickeable con hover sutil, cursor pointer y transición suave.

### 19.5 Vista mobile

La vista mobile corresponde al listado en cards apiladas.

Estructura visual:

- Mobile-first para anchos aproximados de `360px` a `390px`.
- Fondo principal beige claro `#EEECE4`.
- Topbar compacto blanco.
- Texto superior: `CADASA | COMPRAS`.
- Sin título adicional como `Solicitudes`.
- Sin subtítulo largo.
- Bottom nav fijo blanco con íconos.
- Ítem `Compras` activo en verde o teal.
- FAB circular dorado flotando sobre la parte inferior derecha.
- Sin tabla.
- Sin sidebar dibujado dentro del diseño mobile generado.

Reglas de cards:

- Las solicitudes se muestran como cards verticales.
- Cada card usa fondo blanco cálido `#FFFFFF` o `#FAF9F5`.
- Las cards tienen esquinas redondeadas grandes, padding cómodo, borde suave y sombra ligera.
- No debe existir scroll interno dentro de las cards.
- La página puede crecer verticalmente.
- La card completa es clickeable.
- No debe haber botones internos dentro de cada card.
- La observación debe ser la información más visible después del folio y estado.
- La observación debe mostrarse hasta 3 líneas con `line-clamp-3` y cortarse con `...`.

### 19.6 Columnas y datos por rol en desktop

#### Usuario operativo normal

Debe ver:

- Folio.
- Observación.
- Estado.
- Prioridad.
- Equipos.
- Fecha entrega.
- Indicadores permitidos.

No debe ver:

- Área.
- Solicitante.
- Email.
- Rol.

Regla de folio:

- En `Folio`, se muestra el folio de solicitud con `#`, por ejemplo `#18532`.
- Si existe folio OC, se muestra debajo, más pequeño, opaco y secundario, por ejemplo `OC-72841`.
- Si no existe OC, no se muestra nada debajo.
- No usar `Sin OC`.

#### Administrador

Debe ver:

- Folio.
- Observación.
- Estado.
- Prioridad.
- Equipos.
- Área.
- Solicitante.
- Fecha entrega.
- Indicadores permitidos.

Regla:

- El solicitante debe mostrarse por nombre, no por email.

#### Gerencia

Debe ver:

- Folio.
- Observación.
- Estado.
- Prioridad.
- Equipos.
- Área.
- Fecha entrega.
- Indicadores permitidos.

No debe ver:

- Solicitante.
- Email.
- Rol.

#### Almacén

Debe tener una tabla simplificada.

Debe ver:

- Observación.
- Área.
- Prioridad.
- Estado.
- Bloqueado.

No debe ver:

- Folio.
- Folio OC.
- Equipos.
- Solicitante.
- Fecha entrega.
- Adjuntos.
- Diferencia OC.
- Email.
- Rol.

#### Secretaría

Debe tener una tabla simplificada, parecida a almacén, pero con folio de solicitud, solicitante y fecha de entrega.

Debe ver:

- Folio de solicitud.
- Observación.
- Área.
- Solicitante.
- Prioridad.
- Estado.
- Fecha entrega.
- Bloqueado.

No debe ver:

- Folio OC.
- Equipos.
- Adjuntos.
- Diferencia OC.
- Email.
- Rol.

Reglas:

- El folio de solicitud se muestra con `#`.
- El solicitante se muestra por nombre, no por email.
- La fecha mostrada sigue la regla `COALESCE(fecha_entrega_sistema, fecha_entrega)`, sin mostrar el nombre técnico del campo.

### 19.7 Datos por rol en mobile

#### Card para usuario operativo normal

Debe mostrar:

- Folio de solicitud.
- Folio OC debajo del folio solo si ya existe.
- Estado.
- Observación.
- Prioridad.
- Equipos.
- Fecha entrega.
- Indicadores permitidos.

No debe mostrar:

- Área.
- Solicitante.
- Email.
- Rol.

Reglas:

- El folio va a la izquierda.
- El estado va a la derecha como badge.
- Si existe OC, se muestra debajo del folio como texto pequeño y opaco.
- Los equipos se muestran solo como números, máximo 3 chips.
- Si hay más equipos, se agrega un chip `+2` o el número correspondiente.

#### Card para administrador

Debe mostrar:

- Folio de solicitud.
- Folio OC debajo del folio solo si ya existe.
- Estado.
- Observación.
- Prioridad.
- Equipos.
- Área.
- Solicitante con nombre.
- Fecha entrega.
- Indicadores permitidos.

No debe mostrar:

- Email.
- Rol.

#### Card para gerencia

Debe mostrar:

- Folio de solicitud.
- Folio OC debajo del folio solo si ya existe.
- Estado.
- Observación.
- Prioridad.
- Equipos.
- Área.
- Fecha entrega.
- Indicadores permitidos.

No debe mostrar:

- Solicitante.
- Email.
- Rol.

#### Card para almacén

Debe ser más simple y enfocada.

Debe mostrar:

- Observación.
- Área.
- Prioridad.
- Estado.
- Bloqueado, solo si aplica.

No debe mostrar:

- Folio de solicitud.
- Folio OC.
- Equipos.
- Solicitante.
- Email.
- Rol.
- Fecha entrega.
- Adjuntos.
- Diferencia OC.

#### Card para secretaría

Debe ser simple, parecida a almacén, pero con folio de solicitud, solicitante y fecha de entrega.

Debe mostrar:

- Folio de solicitud.
- Observación.
- Área.
- Solicitante.
- Prioridad.
- Estado.
- Fecha entrega.
- Bloqueado, solo si aplica.

No debe mostrar:

- Folio OC.
- Equipos.
- Adjuntos.
- Diferencia OC.
- Email.
- Rol.

Reglas:

- El folio de solicitud se muestra con `#`.
- El solicitante se muestra como nombre visible.
- La fecha mostrada sigue la regla `COALESCE(fecha_entrega_sistema, fecha_entrega)`, sin mostrar el nombre técnico del campo.

### 19.8 Indicadores visuales del listado

Los indicadores deben mostrarse como badges compactos únicamente cuando apliquen.

Indicadores iniciales:

- `Diferencia OC`
- `Bloqueado`
- `Adjuntos N`

Reglas:

- No deben mostrarse badges vacíos.
- `Bloqueado` es visible para todos los roles cuando aplique.
- `Diferencia OC` solo se muestra si existe OC disponible/importada y hay diferencia entre lo solicitado/aprobado y lo pedido en la orden de compra.
- `Diferencia OC` puede mostrarse para administrador, gerencia y usuario operativo cuando aplique.
- `Diferencia OC` no se muestra para almacén.
- `Diferencia OC` no se muestra para secretaría.
- `Adjuntos N` solo se muestra si existen adjuntos y el rol puede verlos.
- `Adjuntos N` no se muestra para almacén.
- `Adjuntos N` no se muestra para secretaría.

### 19.9 Estilo visual

Paleta base:

- Fondo principal: `#EEECE4`.
- Card o contenedor: `#FFFFFF` o `#FAF9F5`.
- Verde corporativo oscuro: `#003D36`.
- Teal activo: `#005C53`.
- Dorado: `#D9A73F`.
- Texto principal: `#111827`.
- Texto secundario: `#7A746B`.
- Bordes suaves: `#E5E0D6`.

Uso de colores:

- Estados: badges teal suaves.
- Prioridad alta: dorado/ámbar.
- Prioridad urgente: rojo suave.
- Diferencia OC: naranja/rojo suave.
- Adjuntos: gris/beige o azul muy suave.
- Bloqueado: gris oscuro suave o ámbar discreto.

### 19.10 Comportamiento esperado

- La vista desktop debe sentirse como una tabla administrativa compacta y legible.
- La vista mobile debe sentirse como una guía visual de cards, no como una tabla comprimida.
- La observación debe tener prioridad visual para lectura rápida.
- Las diferencias entre roles deben resolverse por columnas o datos visibles, no por títulos grandes.
- No se deben mostrar labels visibles como `Usuario operativo`, `Administrador`, `Gerencia`, `Almacén` o `Secretaría` encima de cada tabla/card.
- La diferencia entre versiones se entiende por los datos visibles según rol.

# Tema actualizado: línea interna, importación OC y Secretaría delegada/corrección

Actualizado: `2026-06-15`.

## 1. Línea interna de productos y servicios

Se adopta la lógica de líneas internas generadas **solo al llegar a aprobación de gerencia**.

### Regla principal

```txt
linea_solicitud se mantiene NULL mientras la solicitud está en revisión.
linea_solicitud se genera cuando la solicitud llega al estado configurado por fn_estado_generar_linea_solicitud().
Estado configurado actualmente: aprobado_gerencia.
```

### Tablas con línea interna

| Tabla | Regla |
|---|---|
| `solicitud_producto_detalle` | Tiene `linea_solicitud integer NULL`. Se numera al aprobar gerencia. |
| `solicitud_servicio_detalle` | Tiene `linea_solicitud integer NULL`. Se numera al aprobar gerencia. |

### Reglas de numeración

- Solo se numeran detalles activos.
- Solo se numeran detalles del ciclo actual.
- No se numeran detalles descartados/inactivos.
- No se renumeran líneas existentes.
- No se copian líneas desde una solicitud original cuando Secretaría crea una corrección.
- La numeración es independiente por tabla: productos tienen sus líneas y servicios tienen sus líneas.
- La línea interna no viene de Excel, Power BI ni OC.

### Ciclos y devolución de gerencia

- Cuando gerencia devuelve, `solicitud_compra.ciclo_estado` aumenta.
- Cuando supervisor vuelve a enviar a gerencia, se actualiza el `ciclo` de productos/servicios activos al ciclo actual.
- No se crean registros nuevos para cambiar ciclo.
- Los descartados/inactivos quedan en su ciclo histórico.
- Antes de mover productos activos, se valida que no haya duplicados que rompan `UNIQUE (solicitud_id, producto_id, ciclo)`.

## 2. Importación OC

La importación se maneja como sincronización con tres modos:

| Modo | Regla |
|---|---|
| `delta` | Actualiza solo lo que vino; no toca lo que no vino. |
| `window_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino dentro del rango. |
| `full_snapshot` | Si `is_complete_scope = true`, marca no vigente lo que no vino para esa fuente. |

### Identidad de línea importada

```txt
source_identity_key = identidad estable de la línea importada.
row_hash = detector de cambios.
```

No usar `row_hash` como parte de la identidad.

### Folio OC

- `folio_oc` no vive en `solicitud_compra`.
- `folio_oc` vive en `orden_compra` y `orden_compra_detalle`.
- Una solicitud puede tener varias OC.
- Secretaría no llena `folio_oc` al marcar subida al sistema.

### Cantidades

| Campo | Significado |
|---|---|
| `solicitud_producto_detalle.cantidad` | Cantidad solicitada originalmente. |
| `solicitud_producto_detalle.cantidad_gerencia` | Cantidad aprobada por gerencia. |
| `solicitud_producto_detalle.cantidad_solicitada_sistema` | Cantidad registrada/solicitada en sistema externo. |
| `orden_compra_detalle.cantidad` | Cantidad comprada en OC. |

La cantidad comprada en OC no debe copiarse a `cantidad_solicitada_sistema`.

### Servicios en importación

- Se puede guardar OC de servicios.
- No se calculan diferencias OC para solicitudes tipo servicio.
- No se compara servicio por descripción.
- Las líneas importadas de servicio se reemplazan según la estrategia definida, porque no tienen identidad estable por producto.

## 3. Secretaría: delegación y corrección

Se agrega una tabla única:

```txt
solicitud_creacion_delegada
```

No se agregan columnas nuevas a `solicitud_compra` para esta auditoría.

### Casos soportados

| Caso | RPC | Flujo |
|---|---|---|
| Corrección por error de Secretaría al subir/registrar en sistema de compras | `rpc_secretaria_crear_correccion_sistema_compras` | Crea una solicitud nueva ya en `aprobado_gerencia`, con solo lo corregido. Puede ser para área operativa o gerencia. |
| Solicitud normal creada por Secretaría a nombre de gerencia | `rpc_secretaria_crear_solicitud_gerencia_normal` | Sigue el flujo normal. Si es servicio, va directo a gerencia. Si es producto, sigue flujo normal de productos. |

### Tabla `solicitud_creacion_delegada`

Campos principales:

```txt
solicitud_id
solicitud_origen_id
creada_por_email
creada_por_area_id
creada_por_role_id
creada_para_email
creada_para_area_id
creada_para_role_id
tipo_delegacion
motivo
payload
created_at
updated_at
```

### Reglas de corrección

- La corrección no modifica la solicitud original.
- La nueva solicitud contiene solo los productos/servicios que se corrigen.
- El detalle de la corrección se guarda en `payload`.
- No se crea tabla `solicitud_detalle_correccion`.
- La nueva solicitud genera sus propias líneas internas.
- La línea original puede guardarse como referencia dentro de `payload`.

### Reglas de validación

- Solo usuarios con rol `secretaria` pueden ejecutar estos RPC.
- Para solicitud normal por Secretaría, el representado debe ser `gerencia`.
- Para corrección, el representado puede ser área operativa o gerencia.
- Las solicitudes normales de gerencia creadas por Secretaría respetan el flujo del tipo de solicitud.

## 4. Reglas finales para IA y desarrollo

- No inventar `folio_oc` en `solicitud_compra`.
- No mezclar `linea_solicitud` con `linea_fuente`.
- No usar `row_hash` como identidad de línea OC.
- No copiar cantidad comprada a `cantidad_solicitada_sistema`.
- No calcular diferencias OC para servicios.
- No borrar físicamente OC ni líneas que dejan de aparecer; usar `activo_fuente = false`.
- Generar `linea_solicitud` solo al aprobar gerencia.
- No crear detalles nuevos para cambiar ciclo; actualizar `ciclo` solo en activos.
- Auditar delegación/corrección de Secretaría en `solicitud_creacion_delegada.payload`.
