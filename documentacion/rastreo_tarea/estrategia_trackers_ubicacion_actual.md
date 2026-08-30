# Broadcast de ubicación de trackers por `source_id`

## Objetivo

La aplicación necesita escuchar en tiempo real únicamente los trackers seleccionados por el usuario, sin agruparlos por área y sin recibir ubicaciones de equipos que no están visibles o seleccionados.

La estrategia implementada es:

```text
Un topic privado por source_id
```

Formato del topic:

```text
tracker:<source_id>:ubicacion
```

Ejemplo:

```text
tracker:10303553:ubicacion
```

Evento emitido:

```text
ubicacion_tracker
```

## Cambios aplicados en Supabase

Se aplicó la migración:

```text
activar_broadcast_ubicacion_tracker_por_source
```

### Función de broadcast

Se creó:

```sql
app_privado.broadcast_ubicacion_tracker()
```

La función se ejecuta después de insertar o actualizar una fila en:

```sql
public.ubicaciones_actuales_tracker
```

Obtiene la latitud y longitud desde `posicion` y publica mediante `realtime.send()` en:

```text
tracker:<source_id>:ubicacion
```

con el evento:

```text
ubicacion_tracker
```

### Trigger

Se creó:

```sql
ubicaciones_actuales_tracker_broadcast_trg
```

El trigger se ejecuta en inserciones y cuando cambian campos relevantes de posición, tracker, geocerca o tarea actual.

No se agregó `ubicaciones_actuales_tracker` a la publicación `supabase_realtime`, porque esta solución usa Broadcast desde la base de datos, no `postgres_changes`.

### Autorización

Se amplió:

```sql
app_privado.puede_escuchar_topic_realtime(
  p_topic text,
  p_usuario_id uuid
)
```

Ahora acepta topics con este patrón:

```text
tracker:<source_id>:ubicacion
```

La suscripción se permite cuando existe una tarea no eliminada y no cancelada con ese `source_id`, y además:

- la tarea está asignada al usuario autenticado; o
- el usuario tiene `mapa.ver_area` o `mapa.ver_todos_usuarios` y pertenece al área de la tarea.

El cliente no obtiene acceso solo por escribir un `source_id`; la política valida tareas y permisos.

## Payload emitido

```json
{
  "tipo": "ubicacion_tracker_actualizada",
  "source_id": 10303553,
  "tracker_id": 10467863,
  "tracker_label": "TRACTOR",
  "latitud": 8.981,
  "longitud": -79.521,
  "precision_metros": 8,
  "capturada_en": "2026-07-31T19:30:00Z",
  "recibida_en": "2026-07-31T19:30:02Z",
  "tarea_actual_id": null,
  "tarea_candidata_id": null,
  "estado_geocerca_tarea": "fuera",
  "estado_geocerca_taller": "fuera",
  "ultima_distancia_tarea_metros": 125.4,
  "ultima_distancia_taller_metros": 864.7,
  "ultimo_evento_clave": "tracker_actualizado",
  "actualizado_en": "2026-07-31T19:30:02Z"
}
```

Los campos nulos se eliminan con `jsonb_strip_nulls`.

La identidad principal es:

```text
source_id
```

## Recomendación de arquitectura Vue

```text
Una sola instancia de Supabase
Una sola conexión WebSocket por pestaña
Varios canales privados dentro de esa conexión
Un canal por source_id seleccionado
```

No crear un `createClient()` por tracker.

### Tipo del payload

```ts
export interface TrackerLocationBroadcast {
  tipo: 'ubicacion_tracker_actualizada'
  source_id: number
  tracker_id?: number
  tracker_label?: string
  latitud: number
  longitud: number
  precision_metros?: number
  capturada_en: string
  recibida_en: string
  tarea_actual_id?: string
  tarea_candidata_id?: string
  estado_geocerca_tarea: string
  estado_candidato_tarea?: string
  estado_geocerca_taller: string
  estado_candidato_taller?: string
  ultima_distancia_tarea_metros?: number
  ultima_distancia_taller_metros?: number
  ultimo_evento_clave: string
  ultimo_resultado?: string
  actualizado_en: string
}
```

### Servicio para varios canales

```ts
import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '@/services/supabase'
import type { TrackerLocationBroadcast } from '@/types/tracker'

type TrackerLocationHandler = (
  payload: TrackerLocationBroadcast,
) => void

const trackerChannels = new Map<number, RealtimeChannel>()

export async function subscribeTrackerLocation(
  sourceId: number,
  onLocation: TrackerLocationHandler,
): Promise<void> {
  if (!Number.isSafeInteger(sourceId) || sourceId <= 0) {
    throw new Error('sourceId inválido.')
  }

  if (trackerChannels.has(sourceId)) {
    return
  }

  await supabase.realtime.setAuth()

  const topic = `tracker:${sourceId}:ubicacion`

  const channel = supabase
    .channel(topic, {
      config: {
        private: true,
      },
    })
    .on(
      'broadcast',
      {
        event: 'ubicacion_tracker',
      },
      ({ payload }) => {
        const data = payload as TrackerLocationBroadcast

        if (data.source_id !== sourceId) {
          return
        }

        onLocation(data)
      },
    )

  trackerChannels.set(sourceId, channel)

  await new Promise<void>((resolve, reject) => {
    channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        resolve()
        return
      }

      if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        trackerChannels.delete(sourceId)
        reject(
          error ??
            new Error(
              `No se pudo suscribir al tracker ${sourceId}.`,
            ),
        )
      }
    })
  })
}

export async function unsubscribeTrackerLocation(
  sourceId: number,
): Promise<void> {
  const channel = trackerChannels.get(sourceId)

  if (!channel) {
    return
  }

  trackerChannels.delete(sourceId)
  await supabase.removeChannel(channel)
}

export async function syncTrackerLocationSubscriptions(
  sourceIds: readonly number[],
  onLocation: TrackerLocationHandler,
): Promise<void> {
  const desiredIds = new Set(
    sourceIds.filter(
      (sourceId) =>
        Number.isSafeInteger(sourceId) && sourceId > 0,
    ),
  )

  await Promise.all(
    [...trackerChannels.keys()]
      .filter((sourceId) => !desiredIds.has(sourceId))
      .map((sourceId) =>
        unsubscribeTrackerLocation(sourceId),
      ),
  )

  await Promise.all(
    [...desiredIds]
      .filter((sourceId) => !trackerChannels.has(sourceId))
      .map((sourceId) =>
        subscribeTrackerLocation(sourceId, onLocation),
      ),
  )
}

export async function clearTrackerLocationSubscriptions(): Promise<void> {
  const channels = [...trackerChannels.values()]
  trackerChannels.clear()

  await Promise.all(
    channels.map((channel) =>
      supabase.removeChannel(channel),
    ),
  )
}
```

### Uso desde una vista o store

```ts
const selectedSourceIds = computed(() =>
  selectedTrackers.value.map(
    (tracker) => tracker.source_id,
  ),
)

watch(
  selectedSourceIds,
  async (sourceIds) => {
    await syncTrackerLocationSubscriptions(
      sourceIds,
      (location) => {
        trackerLocationsBySourceId.value.set(
          location.source_id,
          location,
        )
      },
    )
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(async () => {
  await clearTrackerLocationSubscriptions()
})
```

## Carga inicial

Broadcast solo entrega cambios posteriores a la suscripción.

Flujo recomendado:

1. Consultar `ubicaciones_actuales_tracker` para los `source_id` seleccionados.
2. Pintar los marcadores iniciales.
3. Crear los canales.
4. Aplicar los eventos recibidos.

```ts
async function loadCurrentTrackerLocations(
  sourceIds: number[],
) {
  if (!sourceIds.length) {
    return []
  }

  const { data, error } = await supabase
    .from('ubicaciones_actuales_tracker')
    .select(`
      source_id,
      tracker_id,
      tracker_label_snapshot,
      posicion,
      precision_metros,
      capturada_en,
      recibida_en,
      tarea_actual_id,
      estado_geocerca_tarea,
      actualizado_en
    `)
    .in('source_id', sourceIds)

  if (error) {
    throw error
  }

  return data ?? []
}
```

La RLS de la tabla seguirá controlando qué filas puede consultar cada usuario.

## Plan Free

Varios canales pueden compartir una sola conexión WebSocket cuando se reutiliza la misma instancia de Supabase.

```text
1 pestaña
└── 1 WebSocket
    ├── tracker:10303553:ubicacion
    ├── tracker:10303554:ubicacion
    └── tracker:10303555:ubicacion
```

Recomendaciones:

- Suscribir solo trackers seleccionados o visibles.
- Eliminar canales al cambiar filtros.
- Limpiar canales al desmontar la vista.
- No crear clientes Supabase por tracker.
- Vigilar la frecuencia de mensajes GPS.
- Considerar limitar broadcasts por tiempo o distancia si aumenta el volumen.

## Prueba funcional

1. Iniciar sesión con un usuario autorizado.
2. Suscribirse a:

```text
tracker:<source_id>:ubicacion
```

3. Confirmar estado `SUBSCRIBED`.
4. Actualizar el tracker desde Navixy/Worker.
5. Confirmar recepción del evento:

```text
ubicacion_tracker
```

6. Intentar un `source_id` no visible para el usuario.
7. Confirmar que el canal privado rechaza la suscripción.

## Resumen

```text
Tabla:
public.ubicaciones_actuales_tracker

Trigger:
ubicaciones_actuales_tracker_broadcast_trg

Función:
app_privado.broadcast_ubicacion_tracker()

Topic:
tracker:<source_id>:ubicacion

Evento:
ubicacion_tracker

Privado:
sí

Autorización:
tarea propia o permiso de mapa con acceso al área

Frontend:
un canal por source_id seleccionado
```
