# Arquitectura de datos y RPC de la app de rastreo — V2

**Proyecto Supabase:** `rastreo_tareas`  
**Estado de referencia:** 2026-08-28  
**Objetivo:** documentar los RPC que utilizará la aplicación y el contexto de las tablas que participan en la estrategia actual de geolocalización, tareas, rutas, permanencia, resguardo, zonas y observaciones.

---

## 1. Objetivo de la estrategia V2

La arquitectura V2 separa claramente cuatro responsabilidades:

1. **Vue / frontend**
   - Carga catálogos.
   - Carga geometría operativa.
   - Lista y visualiza tareas.
   - Crea, edita, cancela, elimina/restaura tareas.
   - Registra observaciones y aclaraciones.
   - Escucha Realtime para cambios de tarea, ubicación, ruta, observaciones y permanencia.

2. **Cloudflare Worker / integración GPS**
   - Recibe los eventos del proveedor de tracking.
   - Envía lotes de eventos a Supabase usando `service_role`.
   - No decide por sí solo entrada/salida de tareas, resguardos o detenciones.

3. **PostgreSQL / Supabase**
   - Es la fuente de verdad.
   - Determina la tarea activa.
   - Detecta paso por línea de control.
   - Detecta entrada/salida de zonas.
   - Registra visitas y permanencias.
   - Detecta resguardo.
   - Gestiona detenciones y zonas automáticas.
   - Mantiene estados administrativos y operativos.
   - Encola recálculos de ruta.

4. **Procesador de rutas**
   - Consume solicitudes pendientes de recálculo.
   - Genera/actualiza `rutas_planificadas`.
   - Mantiene paradas y versiones históricas.
   - No debe hacer que Vue escriba directamente en las tablas de rutas.

> **Regla principal:** Vue debe trabajar principalmente mediante RPC de negocio y Realtime. Las tablas internas de tracking, visitas, rutas y estados automáticos no deben ser modificadas directamente desde el frontend.

---

## 2. Vista general del flujo

```text
GPS / Navixy / TopFlyTech
          │
          ▼
Cloudflare Worker
          │ service_role
          ▼
sb_ws_procesar_eventos_tracker(p_eventos)
          │
          ▼
sb_procesar_evento_tracker(...)
          │
          ▼
sb_procesar_evento_tracker_v2(...)
          │
          ├── actualiza ubicaciones_actuales_tracker
          ├── procesa resguardo
          ├── procesa tarea
          │    ├── línea de control
          │    ├── zona de control
          │    ├── abre/cierra visitas
          │    └── actualiza estados
          ├── procesa detención
          └── dispara Realtime
                    │
                    ▼
                   Vue
```

Flujo de gestión:

```text
Vue supervisor/admin
        │
        ├── obtener_catalogo_personas_tarea_v2
        ├── obtener_geografia_operativa_area_v2
        ├── listar_tareas_rastreo_v2
        ├── obtener_tarea_detalle_v2
        ├── crear_tarea_v2
        ├── actualizar_tarea_v2
        ├── cancelar_tarea_v2
        ├── eliminar_tarea_logicamente
        └── restaurar_tarea
```

---

# 3. RPC que SÍ debe consumir Vue

## 3.1 `obtener_catalogo_personas_tarea_v2`

```sql
public.obtener_catalogo_personas_tarea_v2()
returns jsonb
```

### Propósito

Carga los datos para selects de personas agrupados por área:

- áreas visibles;
- trabajadores;
- supervisores;
- acompañantes previamente registrados.

### Autorización

- `authenticated`: sí.
- `anon`: no.
- `service_role`: sí.
- Supervisor: solo asignaciones vigentes de tipo `supervision`.
- Administrador: todas las áreas activas.

### Respuesta conceptual

```json
{
  "areas": [
    {
      "area_id": "uuid",
      "area_nombre": "Engrase",
      "trabajadores": [
        {
          "usuario_id": "uuid",
          "nombre": "Trabajador",
          "tipo_trabajador_codigo": "despachador",
          "tipo_trabajador_nombre": "Despachador"
        }
      ],
      "supervisores": [],
      "acompanantes": [
        { "nombre": "Nombre histórico" }
      ]
    }
  ]
}
```

### Trabajadores

Solo aparecen cuando:

- `usuarios.activo = true`;
- usuario no eliminado;
- `trabajadores.activo = true`;
- tipo de trabajador activo;
- asignación vigente en `asignaciones_usuario_area`;
- `tipo_asignacion = 'operacion'`.

### Supervisores

Solo se llenan si quien consulta es administrador. Para pertenecer al array de un área deben tener:

- usuario activo;
- rol `supervisor` vigente;
- asignación `supervision` vigente en esa área.

Un supervisor normal recibe `supervisores: []`.

### Acompañantes

No existe catálogo global. Las opciones se derivan de:

```text
acompanantes_tarea
        │
        ▼
      tareas
        │
        ▼
     area_id
```

Se deduplican conceptualmente por:

```text
area_id + lower(trim(nombre))
```

### Tablas

- `areas`
- `usuarios`
- `trabajadores`
- `tipos_trabajador`
- `roles`
- `usuarios_roles`
- `asignaciones_usuario_area`
- `acompanantes_tarea`
- `tareas`

---

## 3.2 `obtener_geografia_operativa_area_v2`

```sql
public.obtener_geografia_operativa_area_v2()
returns jsonb
```

### Propósito

Carga la geografía estática necesaria para el mapa/formularios:

- fincas disponibles;
- límites;
- red vial enrutable consolidada;
- lugares de resguardo;
- punto de enrutamiento del resguardo.

### Respuesta conceptual

```json
{
  "areas": [
    {
      "area_id": "uuid",
      "area_nombre": "Engrase",
      "fincas": [
        {
          "ubicacion_id": "uuid",
          "nombre": "Finca Calle Larga",
          "limite": { "type": "MultiPolygon", "coordinates": [] },
          "red_vial": { "type": "MultiLineString", "coordinates": [] },
          "segmentos_red": 162
        }
      ],
      "resguardos": [
        {
          "resguardo_id": "uuid",
          "ubicacion_id": "uuid",
          "nombre": "Resguardo Calle Larga",
          "limite": { "type": "MultiPolygon", "coordinates": [] },
          "punto_enrutado": { "lat": 0, "lng": 0 }
        }
      ]
    }
  ]
}
```

### Finca operativa

Una `ubicaciones` se considera finca operativa cuando:

```text
activa = true
eliminado_en IS NULL
limite IS NOT NULL
NO existe lugares_resguardo_tracker activo
SÍ existe red_vial_enrutable
Y está disponible para el área
```

### Resguardo

Una ubicación es resguardo si existe:

```text
lugares_resguardo_tracker.ubicacion_id
    → ubicaciones.id
```

con el resguardo activo. No se infiere por nombre, coordenadas o `origen_creacion`.

### Red vial

Los segmentos de `red_vial_enrutable` se consolidan por finca en una sola `MultiLineString` para Vue. Actualmente `Finca Calle Larga` tiene 162 segmentos almacenados y el RPC los entrega como una sola geometría.

### Tablas

- `areas`
- `asignaciones_usuario_area`
- `ubicaciones`
- `ubicaciones_areas`
- `lugares_resguardo_tracker`
- `red_vial_enrutable`

---

## 3.3 `resolver_configuracion_mapa_v2`

```sql
public.resolver_configuracion_mapa_v2(
  p_area_id uuid,
  p_usuario_id uuid
)
returns table(
  lugar_resguardo_id uuid,
  latitud double precision,
  longitud double precision,
  zoom numeric,
  origen text
)
```

### Propósito

Resolver el centro inicial del mapa.

Prioridad:

```text
configuracion_mapa_usuario_area
        ↓
configuracion_mapa_area
        ↓
resguardo activo disponible para el área
```

---

# 4. Gestión de tareas

## 4.1 `crear_tarea_v2`

```sql
public.crear_tarea_v2(
  p_area_id uuid,
  p_tipo_codigo text,
  p_usuario_asignado_id uuid,
  p_tracker_id bigint,
  p_source_id bigint,
  p_tracker_label text,
  p_acompanante_nombre text,
  p_indicaciones text,
  p_fecha_programada date,
  p_prioridad_id smallint,
  p_tiempo_estimado_minutos integer,
  p_ubicacion_id uuid,
  p_punto_latitud double precision,
  p_punto_longitud double precision,
  p_linea_control_geojson jsonb,
  p_zona_control_geojson jsonb,
  p_orden_ruta integer
)
returns jsonb
```

### Tipos manuales

```text
finca
zona
```

`duda_automatica` no se crea desde el formulario normal.

### Finca

Requiere:

- área;
- trabajador operativo;
- tracker/source/label;
- indicaciones;
- fecha;
- prioridad;
- duración;
- `ubicacion_id`;
- punto enrutado;
- línea de control;
- orden opcional.

La finca debe estar activa, con límite, disponible para el área, con red vial y no ser resguardo.

### Zona

Requiere zona de control GeoJSON y punto enrutado. En el formulario normal:

```text
p_ubicacion_id = NULL
```

El RPC crea internamente:

```text
tareas
  │
  └── tarea_zonas
          │
          └── zonas_operativas
```

### Duración

```text
15 <= minutos <= 10080
minutos % 15 = 0
```

### Orden

`prioridad != orden_ruta`. El supervisor define `orden_ruta` explícitamente.

### Tablas escritas

- `tareas`
- `acompanantes_tarea`
- `zonas_operativas` si es zona
- `tarea_zonas` si es zona

---

## 4.2 `actualizar_tarea_v2`

```sql
public.actualizar_tarea_v2(
  p_tarea_id uuid,
  p_version_esperada integer,
  p_tipo_codigo text,
  p_usuario_asignado_id uuid,
  p_tracker_id bigint,
  p_source_id bigint,
  p_tracker_label text,
  p_acompanante_nombre text,
  p_indicaciones text,
  p_fecha_programada date,
  p_prioridad_id smallint,
  p_tiempo_estimado_minutos integer,
  p_ubicacion_id uuid,
  p_punto_latitud double precision,
  p_punto_longitud double precision,
  p_linea_control_geojson jsonb,
  p_zona_control_geojson jsonb,
  p_orden_ruta integer
)
returns jsonb
```

### Reglas

- usa `version` para concurrencia;
- no cambia `finca` ↔ `zona`;
- no modifica eliminadas/canceladas;
- trabajador debe ser operativo del área;
- finca debe estar disponible para el área;
- respeta protección de geometría si ya hay ejecución;
- sincroniza acompañante;
- reorganiza orden sin pisar posiciones.

Una operación puede incrementar `version` más de una vez internamente. Vue debe conservar la **versión final devuelta**.

---

## 4.3 `cancelar_tarea_v2`

```sql
public.cancelar_tarea_v2(
  p_tarea_id uuid,
  p_version_esperada integer,
  p_motivo text
)
returns jsonb
```

Guarda motivo, actor, timestamp, estado administrativo y nueva versión.

---

## 4.4 `eliminar_tarea_logicamente`

```sql
public.eliminar_tarea_logicamente(
  p_tarea_id uuid
)
returns tareas
```

Marca `eliminado_en` / `eliminado_por`. No borra físicamente.

---

## 4.5 `restaurar_tarea`

```sql
public.restaurar_tarea(
  p_tarea_id uuid
)
returns tareas
```

Restaura una tarea eliminada lógicamente si los permisos lo permiten.

---

# 5. Lectura de tareas

## 5.1 `listar_tareas_rastreo_v2`

```sql
public.listar_tareas_rastreo_v2(
  p_area_id uuid,
  p_fecha date,
  p_usuario_asignado_id uuid,
  p_source_id bigint,
  p_estado_operativo_codigo text,
  p_incluir_canceladas boolean
)
returns table(...)
```

### Propósito

Fuente principal para:

- cards;
- listado lateral;
- filtros;
- puntos simples;
- resumen de permanencia.

Devuelve entre otros:

```text
id
version
area
fecha_programada
indicaciones
tipo_tarea
ubicacion
trabajador
source_id
tracker_id
tracker_label
prioridad
estado administrativo
estado operativo
tiempo_estimado_minutos
cantidad_visitas
segundos_totales
segundos_visita_actual
visita_abierta
entrada_actual_en
primera_entrada_en
ultima_salida_en
orden_ruta
punto_latitud
punto_longitud
cancelada_en
eliminado_en
actualizado_en
```

`segundos_totales` = visitas cerradas acumuladas + visita abierta actual.

No devuelve líneas/zonas/redes pesadas.

---

## 5.2 `obtener_tarea_detalle_v2`

```sql
public.obtener_tarea_detalle_v2(
  p_tarea_id uuid
)
returns jsonb
```

Secciones:

```text
tarea
asignacion
estado
tiempo
visitas
ruta
permisos
```

### `tarea`

Incluye punto, línea GeoJSON, zonas de control GeoJSON, ubicación, orden, fechas y versión.

### `asignacion`

Trabajador, tracker, source, label y acompañante activo.

### `tiempo`

Resumen acumulado de permanencia.

### `ruta`

Referencia de ruta planificada relacionada.

### `permisos`

Puede incluir:

```text
puede_editar
puede_editar_punto
puede_editar_geometria_control
puede_reordenar
geometria_bloqueada
puede_cancelar
puede_eliminar
```

La UI debe preferir estos permisos para habilitar acciones concretas.

---

# 6. Observaciones y aclaraciones

## 6.1 `listar_observaciones_tarea_v2`

```sql
public.listar_observaciones_tarea_v2(
  p_tarea_id uuid
)
returns table(...)
```

Devuelve autor, tipo, jerarquía, descripción, estado operativo, ubicación y timestamps.

Aclaraciones usan:

```text
observacion_origen_id
```

---

## 6.2 `registrar_observacion_tarea`

```sql
public.registrar_observacion_tarea(
  p_tarea_id uuid,
  p_tipo_codigo text,
  p_descripcion text,
  p_cliente_id uuid,
  p_capturada_en timestamptz,
  p_latitud double precision,
  p_longitud double precision,
  p_precision_metros numeric,
  p_ubicacion_capturada_en timestamptz
)
returns observaciones_tarea
```

Permite guardar geolocalización del teléfono y precisión junto con la observación.

---

## 6.3 `agregar_aclaracion_observacion`

```sql
public.agregar_aclaracion_observacion(
  p_observacion_origen_id uuid,
  p_descripcion text,
  p_cliente_id uuid,
  p_capturada_en timestamptz,
  p_latitud double precision,
  p_longitud double precision,
  p_precision_metros numeric,
  p_ubicacion_capturada_en timestamptz
)
returns observaciones_tarea
```

Crea una aclaración ligada a una observación existente.

---

# 7. Permanencia e historial

## 7.1 `obtener_resumen_tiempo_tarea`

```sql
public.obtener_resumen_tiempo_tarea(p_tarea_id uuid)
```

Devuelve:

```text
cantidad_visitas
segundos_visitas_cerradas
segundos_visita_abierta
segundos_totales
visita_abierta
llegada_actual_en
primera_llegada_en
ultima_salida_en
segundos_sin_datos
```

---

## 7.2 `obtener_resumen_tiempos_tareas`

```sql
public.obtener_resumen_tiempos_tareas(p_tarea_ids uuid[])
```

Versión bulk. No llamarla redundantemente después de `listar_tareas_rastreo_v2` si el listado ya trae el resumen necesario.

---

## 7.3 `obtener_resumen_permanencia_tracker_tarea`

```sql
public.obtener_resumen_permanencia_tracker_tarea(p_tarea_id uuid)
```

Adecuado para diagnóstico o vista operacional avanzada; añade tracker, última actualización y estados.

---

## 7.4 `obtener_visitas_tracker_tarea`

```sql
public.obtener_visitas_tracker_tarea(p_tarea_id uuid)
```

Devuelve:

```text
id
numero_visita
entrada_en
salida_en
duracion_segundos
estado
motivo_incompleto
anulado_en
actualizado_en
```

`obtener_tarea_detalle_v2` ya incorpora visitas para el detalle normal.

---

# 8. Correcciones excepcionales de geometría

## 8.1 `corregir_linea_control_tarea_v2`

```sql
public.corregir_linea_control_tarea_v2(
  p_tarea_id uuid,
  p_linea geometry,
  p_motivo text
)
returns tareas
```

Corrección auditada, no edición normal.

## 8.2 `corregir_geometria_zona_v2`

```sql
public.corregir_geometria_zona_v2(
  p_zona_id uuid,
  p_geom geometry,
  p_motivo text
)
returns zonas_operativas
```

La UI normal debe respetar `geometria_bloqueada` y no saltarse esta protección.

---

# 9. Permisos generales

## `mis_permisos_efectivos`

```sql
public.mis_permisos_efectivos()
returns table(...)
```

Útil para el store global de permisos. Permisos relevantes:

```text
tareas.crear
tareas.modificar
tareas.cancelar
tareas.eliminar
tareas.restaurar
tareas.ver
tareas.ver_detalle
tareas.ver_mapa_actual
mapa.ver
mapa.ver_area
trabajadores.ver
```

Para una tarea concreta, complementar con `obtener_tarea_detalle_v2().permisos`.

---

# 10. RPC del Cloudflare Worker

## 10.1 `sb_ws_procesar_eventos_tracker`

```sql
public.sb_ws_procesar_eventos_tracker(
  p_eventos jsonb
)
returns jsonb
```

Entrada servidor-servidor. Debe llamarse con `service_role`, nunca desde Vue.

Evento conceptual:

```json
{
  "source_id": 123,
  "latitud": 8.0,
  "longitud": -82.0,
  "precision_metros": 5,
  "capturada_en": "timestamp",
  "recibida_en": "timestamp",
  "movement_status": "moving",
  "movement_status_update": "timestamp",
  "speed": 20,
  "ignition": true,
  "ignition_update": "timestamp",
  "connection_status": "online",
  "estado_navixy_actualizado_en": "timestamp"
}
```

Flujo:

```text
sb_ws_procesar_eventos_tracker
        ↓
sb_procesar_evento_tracker
        ↓
sb_procesar_evento_tracker_v2
```

---

## 10.2 `sb_procesar_evento_tracker`

```sql
public.sb_procesar_evento_tracker(p_evento jsonb)
returns jsonb
```

Wrapper individual. Solo `service_role`.

---

## 10.3 `sb_procesar_evento_tracker_v2`

```sql
public.sb_procesar_evento_tracker_v2(p_evento jsonb)
returns jsonb
```

Motor principal. Responsabilidades:

1. validar service role;
2. parsear evento;
3. construir clave V2;
4. serializar por `source_id`;
5. controlar duplicados/atrasados;
6. actualizar `ubicaciones_actuales_tracker`;
7. procesar resguardo;
8. procesar tarea;
9. procesar detención;
10. publicar cambios derivados.

Clave V2 conceptual:

```text
source_id
estado_navixy_actualizado_en
capturada_en
movement_status
movement_status_update
ignition
ignition_update
latitud
longitud
```

---

# 11. Helpers del motor tracker — NO llamar desde Vue

```text
sb_v2_procesar_resguardo_tracker
sb_v2_procesar_tarea_tracker
sb_v2_buscar_tarea_activable
sb_v2_abrir_visita_tarea
sb_v2_cerrar_visita_tarea
sb_v2_procesar_detencion_tracker
sb_v2_geometria_zona_automatica
```

Funciones principales:

- detectar resguardo;
- seleccionar tarea activable;
- abrir/cerrar visitas;
- procesar transición de tarea;
- administrar detención;
- generar geometría automática.

---

# 12. Helpers privados de gestión — NO llamar desde Vue

## `app_privado.reubicar_orden_tarea_v2`

Maneja el orden sin violar la unicidad de:

```text
source_id + fecha_programada + orden_ruta
```

Evita desplazar tareas ya ejecutadas.

## `app_privado.sincronizar_acompanante_tarea_v2`

Mantiene un único acompañante activo por tarea y normaliza duplicados.

## `app_privado.tarea_ejecutada_v2`

Determina si una tarea ya tiene ejecución suficiente para bloquear ciertas operaciones.

## `app_privado.ubicacion_disponible_en_area_v2`

```sql
app_privado.ubicacion_disponible_en_area_v2(
  p_ubicacion_id uuid,
  p_area_id uuid
)
returns boolean
```

Regla:

```text
ubicaciones.disponible_todas_areas = true
OR
existe ubicaciones_areas(ubicacion_id, area_id)
```

---

# 13. Modelo de áreas y usuarios

## `areas`

Representa responsabilidad organizacional, no un lugar físico.

Campos relevantes:

```text
id
codigo
nombre
descripcion
activa
eliminado_en
```

## `asignaciones_usuario_area`

```text
usuario_id
area_id
tipo_asignacion
vigente_desde
vigente_hasta
```

Tipos relevantes:

```text
operacion
supervision
```

- `operacion`: trabajador disponible para tareas del área.
- `supervision`: supervisor puede administrar/visualizar el área.
- Administrador: no queda limitado por una sola área en los RPC V2.

## `usuarios`

```text
id
correo_electronico
nombre_completo
activo
eliminado_en
```

## `trabajadores`

```text
usuario_id
tipo_trabajador_id
activo
```

## `tipos_trabajador`

Catálogo del tipo de trabajador.

## `roles`, `usuarios_roles`, `permisos`, `roles_permisos`

```text
rol  → qué puede hacer
área → sobre qué conjunto operativo puede hacerlo
```

---

# 14. Modelo de ubicaciones multiárea

## 14.1 `ubicaciones`

Campos principales:

```text
id
area_id
nombre
origen_creacion
activa
limite
disponible_todas_areas
eliminado_en
```

### Significado de `area_id`

`ubicaciones.area_id` queda como **área propietaria/origen administrativo**. No es la regla única de disponibilidad.

## 14.2 `ubicaciones_areas`

Relación N:N:

```text
ubicacion_id
area_id
creado_en
creado_por
```

Casos:

```text
Solo Área A:
  disponible_todas_areas = false
  ubicaciones_areas = [A]

Áreas A, B, C:
  disponible_todas_areas = false
  ubicaciones_areas = [A, B, C]

Todas:
  disponible_todas_areas = true
```

No hace falta crear una fila por cada área para una ubicación global.

---

# 15. Fincas y red vial

No existe tabla `fincas`. Una finca es una `ubicaciones` operable con red vial y que no sea resguardo.

```text
ubicaciones
   │ id
   ├────────► red_vial_enrutable.ubicacion_id
   └────────► ubicaciones_areas.ubicacion_id
```

## `red_vial_enrutable`

```text
id
ubicacion_id
geom
creado_en
```

No necesita `area_id`; hereda disponibilidad por `ubicacion_id`.

Vue debe obtenerla mediante `obtener_geografia_operativa_area_v2`, no consultar los segmentos directamente.

---

# 16. Resguardos

## `lugares_resguardo_tracker`

```text
id
ubicacion_id
punto_enrutado
activo
```

Un resguardo combina:

```text
ubicaciones.limite
+
lugares_resguardo_tracker.punto_enrutado
```

La disponibilidad por área se hereda de `ubicaciones` / `ubicaciones_areas`.

---

# 17. Zonas operativas

## `zonas_operativas`

```text
id
nombre
geom
tipo_zona
origen
activa
creado_en
actualizado_en
```

### Decisión de arquitectura

Las zonas **NO pertenecen a áreas directamente**. No se debe agregar `area_id` para catálogo.

## `tarea_zonas`

```text
tarea_id
zona_id
rol
```

Relación:

```text
tareas
  │
  └── tarea_zonas
          │
          └── zonas_operativas
```

El área contextual de una zona se deriva de `tareas.area_id`, pero la zona solo aparece por tarea.

Roles actuales:

```text
control
permanencia
```

---

# 18. Tabla central `tareas`

Campos principales:

```text
id
area_id
usuario_asignado_id
ubicacion_id
fecha_programada
indicaciones
prioridad_id
tiempo_estimado_minutos
estado_tarea_id
estado_operativo_tarea_id
cancelada_en
cancelada_por
motivo_cancelacion
creado_por
creado_en
actualizado_por
actualizado_en
eliminado_en
eliminado_por
version
tracker_id
tracker_label_snapshot
source_id
tracker_asignado_en
tracker_asignado_por
tipo_tarea_id
punto_enrutado
linea_control
orden_ruta
```

---

# 19. Tipos de tarea

Tabla `tipos_tarea`.

```text
finca
zona
duda_automatica
```

## Finca

```text
tareas.ubicacion_id
+tareas.punto_enrutado
+tareas.linea_control
```

## Zona

```text
tareas
  ↓
tarea_zonas
  ↓
zonas_operativas.geom
```

La finca física puede resolverse por superposición; no se selecciona `ubicacion_id` manualmente en el formulario de zona.

## Duda automática

La crea el motor en escenarios automáticos; no el formulario estándar.

---

# 20. Estados

## `estados_tarea`

Estado administrativo. Códigos relevantes actuales:

```text
pendiente
asignada
completada
cancelada
duda
```

Hay códigos históricos/inactivos que no deben suponerse parte del flujo vigente sin revisar el catálogo.

## `estados_operativos_tarea`

```text
sin_iniciar
en_ruta
en_ubicacion
visitada
```

Diferencia:

```text
estado_tarea          → estado administrativo
estado_operativo      → progreso detectado operacionalmente
```

---

# 21. Prioridades

Tabla `prioridades`.

La prioridad expresa importancia. No define la secuencia.

```text
prioridad != orden_ruta
```

El supervisor controla `tareas.orden_ruta`.

---

# 22. Acompañantes

## `acompanantes_tarea`

```text
id
tarea_id
nombre
creado_por
creado_en
actualizado_por
actualizado_en
eliminado_en
eliminado_por
```

No existe una entidad global de acompañante. El catálogo del formulario se construye con nombres históricos del área.

---

# 23. Visitas y permanencia

## `visitas_tarea_tracker`

Fuente de verdad del tiempo real de una tarea.

```text
id
tarea_id
recorrido_tracker_id
source_id
tracker_id_snapshot
tracker_label_snapshot
usuario_id_snapshot
numero_visita
entrada_en
salida_en
duracion_segundos
estado
distancia_entrada_metros
distancia_salida_metros
clave_evento_entrada
clave_evento_salida
metodo_cierre
anulado_en
```

Ejemplo:

```text
visita 1: 12 min
visita 2: 8 min
visita 3 abierta: 4 min
TOTAL = 24 min
```

## `visitas_zona_tarea_tracker`

```text
tarea_id
zona_id
source_id
numero_visita
entrada_en
salida_en
duracion_segundos
estado
```

Traza permanencia específica dentro de una zona.

---

# 24. Snapshot del tracker

## `ubicaciones_actuales_tracker`

Una fila por `source_id`.

```text
source_id
tracker_id
tracker_label_snapshot
posicion
precision_metros
capturada_en
recibida_en
tarea_actual_id
tarea_candidata_id
estado_geocerca_tarea
estado_candidato_tarea
conteo_candidato_tarea
primera_lectura_candidata_tarea_en
ultima_distancia_tarea_metros
ultimo_evento_clave
ultimo_resultado
movement_status
movement_status_update
velocidad
ignition
ignition_update
connection_status
estado_navixy_actualizado_en
actualizado_en
```

Es snapshot operacional, no historial completo.

---

# 25. Recorridos

## `recorridos_tracker`

Representa movimiento real desde salida de resguardo hasta regreso/cierre.

```text
id
source_id
tracker_id_snapshot
tracker_label_snapshot
fecha_operativa
estado
lugar_resguardo_salida_id
salida_resguardo_en
lugar_resguardo_cierre_id
entrada_resguardo_en
clave_evento_salida
clave_evento_regreso
origen_procesamiento
version_reprocesamiento
anulado_en
reemplazada_por_id
```

La estrategia V2 utiliza recorrido tracker en lugar de depender de una jornada heredada.

## `recorrido_tareas_tracker`

```text
recorrido_tracker_id
tarea_id
estado
vinculada_en
entrada_geocerca_en
salida_geocerca_en
version_reprocesamiento
anulado_en
```

---

# 26. Detenciones

## `estado_detencion_tracker`

```text
source_id
movement_status
inicio_en
punto_ancla
tarea_contexto_id
zona_generada_id
tarea_duda_id
actualizado_en
```

Concepto:

```text
tracker detenido
    │
    ├── hay tarea activa
    │      └── contexto dentro de la tarea
    │
    └── no hay tarea activa
           └── posible duda automática según reglas
```

No se modifica desde Vue.

---

# 27. Eventos de procesamiento

## `eventos_procesamiento_tracker`

Tabla de diagnóstico/trazabilidad del motor.

```text
clave_evento
source_id
tracker_id_snapshot
tracker_label_snapshot
capturada_en
recibida_en
procesada_en
origen_procesamiento
resultado
codigo_resultado
tarea_ids_evaluadas
tarea_id_resultado
visita_tarea_tracker_id
recorrido_tracker_id
detalle_error
datos
```

No es fuente de cards ni posición actual.

---

# 28. Eventos de tarea

## `eventos_tarea`

```text
tarea_id
tipo_evento_tarea_id
ocurrido_en
origen
actor_usuario_id
datos
visita_tarea_tracker_id
anulado_en
```

Catálogo: `tipos_evento_tarea`.

Los eventos del dominio son generados por la lógica interna; Vue no debe crearlos para simular transiciones GPS.

---

# 29. Observaciones

## `observaciones_tarea`

```text
id
cliente_id
tarea_id
usuario_id
tipo_observacion_id
observacion_origen_id
descripcion
estado_operativo_tarea_id
ubicacion
precision_metros
ubicacion_capturada_en
capturada_en
recibida_en
creado_en
```

Catálogo: `tipos_observacion_tarea`.

---

# 30. Rutas planificadas

## `rutas_planificadas`

```text
id
usuario_id
area_id
fecha_programada
version_actual
estado_calculo
origen
origen_tipo
origen_capturada_en
proveedor
polilinea_codificada_cache
cache_calculada_en
cache_expira_en
motivo_ultima_actualizacion_id
solicitada_por
tracker_id
tracker_label_snapshot
source_id
recorrido_tracker_id
```

## `paradas_ruta_planificada`

```text
ruta_planificada_id
tarea_id
numero_orden
nivel_prioridad_snapshot
nombre_prioridad_snapshot
indicaciones_snapshot
punto_enrutado_snapshot
```

Diferencia:

```text
tareas.orden_ruta
  → intención actual del supervisor

paradas_ruta_planificada.numero_orden
  → snapshot de una ruta calculada
```

## `solicitudes_recalculo_ruta`

```text
usuario_id
area_id
fecha_programada
tarea_id
motivo_cambio_ruta_id
estado
solicitada_por
solicitada_en
procesada_en
detalle_error
tracker_id
tracker_label_snapshot
source_id
```

Triggers como `encolar_recalculo_ruta_v2` crean estas solicitudes automáticamente. Vue no debe insertar en esta tabla después de guardar una tarea.

## Historial

```text
historial_rutas_planificadas
historial_paradas_ruta_planificada
```

Mantienen versiones anteriores de rutas/paradas.

---

# 31. Origen de ruta

Existen:

```sql
resolver_origen_ruta_tracker(p_source_id bigint)
resolver_origen_ruta_tracker_v2(
  p_source_id bigint,
  p_ruta_planificada_id uuid
)
```

La versión nueva de infraestructura es para backend/service role. El frontend no necesita resolver origen en cada render.

---

# 32. Configuración del sistema

## `configuraciones_sistema`

Guarda parámetros operativos del motor.

Ejemplo relevante:

```text
finca.zona_fuera_porcentaje_maximo
```

Para resolver una finca desde una zona, las candidatas deben ser:

- activas;
- no eliminadas;
- con límite;
- disponibles para el área;
- no resguardos;
- con red vial.

La zona sigue perteneciendo a la tarea, no al área como catálogo.

---

# 33. Grupos externos de trackers

## `grupos_tracker_area`

```text
group_id
area_id
activo
eliminado_en
```

Relaciona grupos externos con áreas. No sustituye `tareas.source_id` ni `ubicaciones_areas`.

---

# 34. Realtime

Realtime evita polling constante.

Flujo conceptual:

```text
cambio de tarea
     → trabajador asignado

cambio de ruta
     → trabajador asignado

observación
     → supervisión del área

ubicación tracker
     → suscriptores autorizados

permanencia
     → actualización operacional
```

Cuando el supervisor ejecuta un RPC de escritura, debe actualizar su store con la respuesta del RPC; no necesita esperar su propio broadcast.

---

# 35. Qué NO debe hacer Vue

No escribir directamente en:

```text
visitas_tarea_tracker
visitas_zona_tarea_tracker
ubicaciones_actuales_tracker
estado_detencion_tracker
recorridos_tracker
recorrido_tareas_tracker
eventos_procesamiento_tracker
eventos_tarea
rutas_planificadas
paradas_ruta_planificada
solicitudes_recalculo_ruta
historial_rutas_planificadas
historial_paradas_ruta_planificada
```

No llamar manualmente:

```text
sb_v2_procesar_resguardo_tracker
sb_v2_procesar_tarea_tracker
sb_v2_abrir_visita_tarea
sb_v2_cerrar_visita_tarea
sb_v2_procesar_detencion_tracker
app_privado.reubicar_orden_tarea_v2
app_privado.sincronizar_acompanante_tarea_v2
app_privado.tarea_ejecutada_v2
```

---

# 36. Carga recomendada del workspace de supervisor

```text
1. mis_permisos_efectivos
2. obtener_catalogo_personas_tarea_v2
3. obtener_geografia_operativa_area_v2
4. resolver_configuracion_mapa_v2
5. listar_tareas_rastreo_v2
6. conectar Realtime
```

Al seleccionar una tarea:

```text
obtener_tarea_detalle_v2
+
listar_observaciones_tarea_v2
```

Opcional para diagnóstico:

```text
obtener_resumen_permanencia_tracker_tarea
obtener_visitas_tracker_tarea
```

---

# 37. Crear tarea finca

```text
seleccionar área
    ↓
trabajadores del catálogo
    ↓
tracker
    ↓
finca disponible
    ↓
mostrar límite + red vial
    ↓
punto enrutado
    ↓
línea de control
    ↓
orden
    ↓
crear_tarea_v2
```

---

# 38. Crear tarea zona

```text
seleccionar área
    ↓
trabajador/tracker
    ↓
punto enrutado
    ↓
dibujar MultiPolygon control
    ↓
NO seleccionar ubicacion_id
    ↓
crear_tarea_v2
    ↓
BD crea zonas_operativas + tarea_zonas
    ↓
BD puede resolver finca física por superposición
```

---

# 39. Editar tarea

```text
obtener_tarea_detalle_v2
       ↓
leer version
       ↓
leer permisos
       ↓
tipo bloqueado
       ↓
si geometria_bloqueada
  no editar línea/zona
       ↓
actualizar_tarea_v2(version)
       ↓
guardar version final retornada
```

---

# 40. Entrada/salida de tarea

La UI no marca manualmente `en_ubicacion`.

Para finca, el motor compara posición anterior + nueva contra la línea de control y abre/cierra visitas según las reglas V2.

```text
posición anterior + posición nueva
        ↓
segmento de movimiento
        ↓
línea_control / zona
        ↓
transición confirmada
        ↓
visitas_tarea_tracker
        ↓
estado_operativo
```

---

# 41. Resguardo y recorrido

```text
salida de resguardo confirmada
        ↓
recorridos_tracker abierto
        ↓
movimiento / tareas / visitas
        ↓
regreso a resguardo válido
        ↓
cierre del recorrido
```

Un resguardo puede estar físicamente dentro del polígono de una finca; estar dentro de la finca no basta por sí solo para decidir que la tarea terminó.

---

# 42. Pertenencia de zona a finca

Para una tarea zona, la finca física puede resolverse con:

```text
área_intersección(zona, finca)
-----------------------------
área_total(zona)
```

Solo se consideran fincas V2 operables y disponibles para el área de la tarea.

---

# 43. Seguridad

RPC de negocio nuevos:

```text
authenticated = permitido
anon          = revocado
```

con validación de:

- `auth.uid()`;
- usuario activo;
- permisos;
- rol;
- áreas;
- estado actual de tarea.

RPC del motor tracker:

```text
service_role
```

**Nunca exponer la `service_role` en Vue.**

---

# 44. Lista resumida de RPC directos de Vue

## Inicialización / catálogos

```text
mis_permisos_efectivos
obtener_catalogo_personas_tarea_v2
obtener_geografia_operativa_area_v2
resolver_configuracion_mapa_v2
```

## Tareas

```text
listar_tareas_rastreo_v2
obtener_tarea_detalle_v2
crear_tarea_v2
actualizar_tarea_v2
cancelar_tarea_v2
eliminar_tarea_logicamente
restaurar_tarea
```

## Observaciones

```text
listar_observaciones_tarea_v2
registrar_observacion_tarea
agregar_aclaracion_observacion
```

## Tiempo / visitas

```text
obtener_resumen_tiempo_tarea
obtener_resumen_tiempos_tareas
obtener_resumen_permanencia_tracker_tarea
obtener_visitas_tracker_tarea
```

## Correcciones excepcionales

```text
corregir_linea_control_tarea_v2
corregir_geometria_zona_v2
```

---

# 45. Lista resumida de RPC Worker/backend

## Entrada

```text
sb_ws_procesar_eventos_tracker
```

## Procesamiento

```text
sb_procesar_evento_tracker
sb_procesar_evento_tracker_v2
```

## Helpers V2

```text
sb_v2_procesar_resguardo_tracker
sb_v2_procesar_tarea_tracker
sb_v2_buscar_tarea_activable
sb_v2_abrir_visita_tarea
sb_v2_cerrar_visita_tarea
sb_v2_procesar_detencion_tracker
sb_v2_geometria_zona_automatica
```

## Ruta/backend

```text
resolver_origen_ruta_tracker_v2
sincronizar_estados_operativos_ruta
```

---

# 46. Helpers privados

```text
app_privado.ubicacion_disponible_en_area_v2
app_privado.reubicar_orden_tarea_v2
app_privado.sincronizar_acompanante_tarea_v2
app_privado.tarea_ejecutada_v2
app_privado.usuario_tiene_area
app_privado.usuario_es_trabajador_de_area
app_privado.tiene_permiso
app_privado.tiene_rol
```

---

# 47. Tablas principales V2

## Identidad y acceso

```text
usuarios
roles
usuarios_roles
permisos
roles_permisos
trabajadores
tipos_trabajador
areas
asignaciones_usuario_area
```

## Geografía

```text
ubicaciones
ubicaciones_areas
lugares_resguardo_tracker
red_vial_enrutable
zonas_operativas
tarea_zonas
configuracion_mapa_area
configuracion_mapa_usuario_area
```

## Tareas

```text
tareas
tipos_tarea
prioridades
estados_tarea
estados_operativos_tarea
acompanantes_tarea
```

## Tracking / ejecución

```text
ubicaciones_actuales_tracker
visitas_tarea_tracker
visitas_zona_tarea_tracker
recorridos_tracker
recorrido_tareas_tracker
estado_detencion_tracker
eventos_procesamiento_tracker
eventos_tarea
tipos_evento_tarea
```

## Observaciones

```text
observaciones_tarea
tipos_observacion_tarea
```

## Rutas

```text
rutas_planificadas
paradas_ruta_planificada
solicitudes_recalculo_ruta
motivos_cambio_ruta
historial_rutas_planificadas
historial_paradas_ruta_planificada
```

## Configuración / integración

```text
configuraciones_sistema
grupos_tracker_area
```

---

# 48. Relaciones principales

```text
usuarios
  ├── usuarios_roles ── roles
  ├── trabajadores ── tipos_trabajador
  └── asignaciones_usuario_area ── areas

areas
  ├── tareas
  └── ubicaciones_areas ── ubicaciones

ubicaciones
  ├── ubicaciones_areas ── areas
  ├── red_vial_enrutable
  └── lugares_resguardo_tracker

tareas
  ├── tipos_tarea
  ├── prioridades
  ├── estados_tarea
  ├── estados_operativos_tarea
  ├── acompanantes_tarea
  ├── tarea_zonas ── zonas_operativas
  ├── visitas_tarea_tracker
  ├── visitas_zona_tarea_tracker
  ├── observaciones_tarea
  ├── eventos_tarea
  ├── recorrido_tareas_tracker ── recorridos_tracker
  └── paradas_ruta_planificada ── rutas_planificadas

source_id
  ├── tareas
  ├── ubicaciones_actuales_tracker
  ├── visitas_tarea_tracker
  ├── recorridos_tracker
  ├── estado_detencion_tracker
  ├── eventos_procesamiento_tracker
  └── rutas_planificadas
```

---

# 49. Fuente de verdad por dato

| Dato | Fuente principal |
|---|---|
| Área organizacional | `areas` |
| Áreas supervisor | `asignaciones_usuario_area` / `supervision` |
| Áreas trabajador | `asignaciones_usuario_area` / `operacion` |
| Finca física | `ubicaciones` + `red_vial_enrutable` |
| Disponibilidad de finca/resguardo | `ubicaciones_areas` / `disponible_todas_areas` |
| Resguardo | `lugares_resguardo_tracker` |
| Zona de tarea | `tarea_zonas` + `zonas_operativas` |
| Tarea | `tareas` |
| Acompañante | `acompanantes_tarea` |
| Estado administrativo | `tareas.estado_tarea_id` |
| Estado operativo | `tareas.estado_operativo_tarea_id` |
| Tiempo real | `visitas_tarea_tracker` |
| Posición actual | `ubicaciones_actuales_tracker` |
| Recorrido real | `recorridos_tracker` |
| Asociación recorrido/tarea | `recorrido_tareas_tracker` |
| Detención activa | `estado_detencion_tracker` |
| Observación | `observaciones_tarea` |
| Ruta actual | `rutas_planificadas` |
| Paradas calculadas | `paradas_ruta_planificada` |
| Orden supervisor | `tareas.orden_ruta` |
| Cola recálculo | `solicitudes_recalculo_ruta` |

---

# 50. Elementos heredados fuera del núcleo V2

La nueva app no debe volver a depender de un modelo de `jornada` para saber el desplazamiento actual.

El núcleo operacional es:

```text
source_id
+
ubicaciones_actuales_tracker
+
recorridos_tracker
+
visitas_tarea_tracker
+
resguardos
+
tareas
```

---

# 51. Contrato recomendado para Vue + Pinia

```text
useTrackingCatalogStore
  ├── personasPorArea
  └── geografiaPorArea

useTrackingTasksStore
  ├── tareas
  ├── tareaSeleccionada
  ├── filtros
  └── create/update/cancel/delete/restore

useTrackingRealtimeStore
  ├── canales
  ├── ubicacionesTracker
  └── permanenciaEnVivo

useTrackingObservationsStore
  └── observacionesPorTarea
```

Evitar un store por cada tabla de PostgreSQL. El frontend debe modelar casos de uso.

---

# 52. Estrategia de caché frontend

Relativamente estáticos:

```text
obtener_catalogo_personas_tarea_v2
obtener_geografia_operativa_area_v2
```

Dinámicos:

```text
tareas
ubicación tracker
permanencia
observaciones
ruta
```

Actualizar con:

```text
RPC + Realtime
```

---

# 53. Regla final de frontera

```text
┌─────────────────────────────────────────────┐
│ Vue                                         │
│ RPC de negocio + Realtime                   │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│ PostgreSQL / Supabase                       │
│ reglas, permisos, geometría, estados        │
└──────────────────────┬──────────────────────┘
                       │
┌──────────────────────▼──────────────────────┐
│ Worker / procesos backend                   │
│ GPS, eventos, cálculo externo de ruta       │
└─────────────────────────────────────────────┘
```

Vue no debe decidir:

- si cruzó una línea;
- si entró o salió de una tarea;
- si terminó una visita;
- si está en resguardo;
- si una detención crea una zona/duda;
- si un evento tracker es duplicado;
- cuál tarea es activable;
- cómo resolver conflictos de orden.

Estas reglas quedan centralizadas en PostgreSQL/backend para que web, móvil y futuros clientes compartan exactamente el mismo comportamiento.

---

# 54. Resumen de la estrategia

```text
ÁREAS
  → acceso organizacional

UBICACIONES + UBICACIONES_AREAS
  → lugares físicos reutilizables por 1, N o todas las áreas

TAREAS
  → trabajo planificado

ZONAS
  → geometría contextual de tarea; no catálogo por área

TRACKER / SOURCE
  → identidad operacional

VISITAS
  → permanencia real

RECORRIDOS
  → movimiento real entre resguardos

RUTAS PLANIFICADAS
  → planificación calculada

OBSERVACIONES
  → comunicación y aclaraciones

REALTIME
  → actualización sin polling continuo
```

La API de Vue queda orientada a casos de uso y no a manipular directamente las tablas internas del motor.
