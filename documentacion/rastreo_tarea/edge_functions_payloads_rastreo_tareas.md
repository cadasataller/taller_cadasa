# Edge Functions — Payloads de envío y retorno JSON

Proyecto Supabase: `rastreo_tareas`

Este documento describe los contratos HTTP/JSON de las Edge Functions que actualmente aparecen activas en el proyecto.

## Resumen

| Edge Function | JWT | Método esperado | Payload |
|---|---:|---|---|
| `maps-key` | Sí | Invocación autenticada | `{ "errokey": boolean }` opcional |
| `admin-crear-usuario` | Sí | `POST` | Datos del nuevo usuario |
| `procesar-ruta-pendiente` | Sí | `POST` | `{ "solicitud_id": string }` opcional |
| `navixy-key` | Sí | Invocación autenticada | Sin payload requerido |

> Todas las funciones están desplegadas actualmente con `verify_jwt: true`.

---

# 1. `maps-key`

Obtiene una de las claves configuradas para Google Maps según el valor de `errokey`.

## Autenticación

Requiere un usuario autenticado.

Header esperado:

```http
Authorization: Bearer <access_token>
```

## Payload de envío

El body es opcional.

### Forma normal

```json
{
  "errokey": false
}
```

### Para solicitar la clave alternativa

```json
{
  "errokey": true
}
```

### Si no se envía body

La función toma automáticamente:

```json
{
  "errokey": false
}
```

## Campos

```json
{
  "errokey": "boolean"
}
```

- `errokey`: opcional.
- `false`: usa `GOOGLE_MAPS_BROWSER_KEY`.
- `true`: usa `GOOGLE_MAPS_BROWSER_KEY_2`.

## Retorno exitoso — `200`

```json
{
  "apiKey": "GOOGLE_MAPS_BROWSER_KEY_VALUE",
  "userId": "uuid-del-usuario"
}
```

## Error — `400`

Si `errokey` no es booleano:

```json
{
  "error": "errokey debe ser booleano"
}
```

## Error — `500`

Si la clave correspondiente no está configurada:

```json
{
  "error": "La clave de Google Maps no está configurada"
}
```

---

# 2. `admin-crear-usuario`

Crea un usuario de Supabase Auth y posteriormente registra su rol y, opcionalmente, su área y tipo de trabajador.

## Método

```http
POST
```

Cualquier otro método devuelve `405`.

## Autenticación

Requiere:

```http
Authorization: Bearer <access_token>
```

Además, el usuario autenticado debe tener el permiso:

```text
usuarios.crear
```

## Payload de envío

### Payload completo

```json
{
  "correo_electronico": "usuario@empresa.com",
  "contrasena": "ContrasenaSegura123!",
  "nombre_completo": "Juan Pérez",
  "rol_codigo": "trabajador",
  "area_id": "uuid-del-area",
  "tipo_trabajador_id": 2
}
```

### Payload mínimo

```json
{
  "correo_electronico": "usuario@empresa.com",
  "contrasena": "ContrasenaSegura123!",
  "nombre_completo": "Juan Pérez",
  "rol_codigo": "trabajador"
}
```

## Campos

```json
{
  "correo_electronico": "string, obligatorio",
  "contrasena": "string, obligatorio",
  "nombre_completo": "string, obligatorio",
  "rol_codigo": "string, obligatorio",
  "area_id": "string/uuid, opcional",
  "tipo_trabajador_id": "number/integer, opcional"
}
```

## Retorno exitoso — `201`

```json
{
  "id": "uuid-del-nuevo-usuario",
  "correo_electronico": "usuario@empresa.com"
}
```

## Error — `400`

### Campos obligatorios faltantes

```json
{
  "error": "correo_electronico, contrasena, nombre_completo y rol_codigo son obligatorios."
}
```

### Rol inexistente

```json
{
  "error": "Rol inexistente."
}
```

### Error de Supabase Auth

Ejemplo:

```json
{
  "error": "User already registered"
}
```

### Error al guardar rol, área o trabajador

La respuesta mantiene esta forma:

```json
{
  "error": "mensaje devuelto por Supabase/Postgres"
}
```

## Error — `401`

### Sin header de autorización

```json
{
  "error": "Sesión requerida."
}
```

### Token/sesión inválida

```json
{
  "error": "Sesión no válida."
}
```

## Error — `403`

Si el usuario no posee `usuarios.crear`:

```json
{
  "error": "Sin permiso para crear usuarios."
}
```

## Error — `405`

```json
{
  "error": "Método no permitido."
}
```

---

# 3. `procesar-ruta-pendiente`

Procesa una solicitud pendiente de cálculo/recalculo de ruta utilizando la arquitectura V2.

Actualmente trabaja con:

- tracker;
- `source_id`;
- tareas `finca` y `zona`;
- `orden_ruta` definido por el supervisor;
- origen proveniente de ubicación del tracker o lugar de resguardo;
- OpenRouteService como motor de generación de geometría.

## Método

```http
POST
```

## Autenticación

Requiere:

```http
Authorization: Bearer <access_token>
```

El usuario debe tener el permiso:

```text
rutas.procesar
```

## Payload de envío

`solicitud_id` es opcional.

### Procesar una solicitud específica

```json
{
  "solicitud_id": "uuid-de-la-solicitud"
}
```

### Procesar la solicitud pendiente más antigua

```json
{}
```

Cuando no se proporciona `solicitud_id`, la función busca la primera solicitud con:

```text
estado = pendiente
```

ordenada por `solicitada_en`.

## Campos

```json
{
  "solicitud_id": "string/uuid, opcional"
}
```

---

## Retorno exitoso — ruta calculada — `200`

```json
{
  "solicitud_id": "uuid-de-la-solicitud",
  "ruta_id": "uuid-de-la-ruta",
  "paradas": 4,
  "tracker_id": 12,
  "source_id": 34567,
  "origen_tipo": "ubicacion_tracker",
  "origen_capturada_en": "2026-08-29T18:35:21.000Z",
  "recorrido_tracker_id": "uuid-del-recorrido",
  "motor": "v2_orden_supervisor"
}
```

`origen_tipo` puede ser:

```json
"ubicacion_tracker"
```

o:

```json
"resguardo"
```

`origen_capturada_en` puede ser `null`.

`recorrido_tracker_id` puede ser `null`.

---

## Retorno exitoso — no existen tareas activas — `200`

Si ya existía una ruta y ahora no quedan tareas activas:

```json
{
  "solicitud_id": "uuid-de-la-solicitud",
  "ruta_id": "uuid-de-la-ruta-anterior",
  "paradas": 0,
  "codigo": "ruta_eliminada_sin_tareas",
  "motor": "v2"
}
```

Si tampoco existía una ruta previa:

```json
{
  "solicitud_id": "uuid-de-la-solicitud",
  "ruta_id": null,
  "paradas": 0,
  "codigo": "sin_tareas_activas",
  "motor": "v2"
}
```

---

## Retorno pendiente — origen no disponible — `202`

Esta respuesta no significa que la solicitud falló.

La solicitud vuelve a mantenerse en estado `pendiente` porque todavía no existe un origen válido para calcular la ruta.

```json
{
  "solicitud_id": "uuid-de-la-solicitud",
  "estado": "pendiente",
  "codigo": "origen_no_disponible",
  "motivo": "Descripción de por qué todavía no existe un origen válido.",
  "origen_tipo": "ubicacion_tracker",
  "recorrido_tracker_id": "uuid-del-recorrido"
}
```

También puede devolver:

```json
{
  "solicitud_id": "uuid-de-la-solicitud",
  "estado": "pendiente",
  "codigo": "origen_no_disponible",
  "motivo": "Descripción del motivo",
  "origen_tipo": "resguardo",
  "recorrido_tracker_id": null
}
```

---

## Error — `401`

```json
{
  "error": "Sesión no válida."
}
```

## Error — `403`

```json
{
  "error": "Sin permiso para procesar rutas."
}
```

## Error — `404`

Si no se encuentra una solicitud pendiente:

```json
{
  "error": "No existe una solicitud pendiente."
}
```

## Error — `405`

```json
{
  "error": "Método no permitido."
}
```

## Error — `409`

Si otra ejecución tomó la solicitud antes:

```json
{
  "error": "La solicitud ya está siendo procesada."
}
```

## Error — `500`

Los errores ocurridos después de tomar una solicitud incluyen también `solicitud_id`.

```json
{
  "error": "detalle del error",
  "solicitud_id": "uuid-de-la-solicitud"
}
```

Ejemplos de causas posibles:

- precondiciones V2 incompletas;
- error consultando tareas;
- tarea con tipo operativo inválido;
- prioridad inválida;
- tarea sin `punto_enrutado`;
- `orden_ruta` ausente o inválido;
- órdenes de ruta duplicados;
- origen inconsistente;
- error de OpenRouteService;
- error guardando la ruta;
- error guardando las paradas;
- error sincronizando estados operativos.

También existen errores internos previos a tomar una solicitud que mantienen únicamente:

```json
{
  "error": "detalle del error"
}
```

Por ejemplo, problemas de configuración interna o de permisos/RPC.

---

# 4. `navixy-key`

Obtiene el valor de `NAVIXY_HASH` para un usuario autenticado.

## Autenticación

Requiere:

```http
Authorization: Bearer <access_token>
```

## Payload de envío

No requiere body JSON.

Puede invocarse sin payload.

Conceptualmente:

```json
{}
```

La implementación actual ignora el contenido del request.

## Retorno exitoso — `200`

```json
{
  "navixyHash": "valor-configurado-en-NAVIXY_HASH",
  "userId": "uuid-del-usuario"
}
```

## Error — `500`

Si el secreto no está configurado:

```json
{
  "error": "NAVIXY_HASH no está configurada"
}
```

---

# Ejemplo desde Supabase JS

Las Edge Functions autenticadas pueden invocarse desde un cliente Supabase con sesión activa.

## `maps-key`

```ts
const { data, error } = await supabase.functions.invoke('maps-key', {
  body: {
    errokey: false,
  },
})
```

## `admin-crear-usuario`

```ts
const { data, error } = await supabase.functions.invoke('admin-crear-usuario', {
  body: {
    correo_electronico: 'usuario@empresa.com',
    contrasena: 'ContrasenaSegura123!',
    nombre_completo: 'Juan Pérez',
    rol_codigo: 'trabajador',
    area_id: areaId,
    tipo_trabajador_id: 2,
  },
})
```

## `procesar-ruta-pendiente`

### Solicitud específica

```ts
const { data, error } = await supabase.functions.invoke('procesar-ruta-pendiente', {
  body: {
    solicitud_id: solicitudId,
  },
})
```

### Primera solicitud pendiente

```ts
const { data, error } = await supabase.functions.invoke('procesar-ruta-pendiente', {
  body: {},
})
```

## `navixy-key`

```ts
const { data, error } = await supabase.functions.invoke('navixy-key')
```

---

# Tipos TypeScript sugeridos

```ts
export interface MapsKeyPayload {
  errokey?: boolean
}

export interface MapsKeyResponse {
  apiKey: string
  userId?: string
}

export interface AdminCrearUsuarioPayload {
  correo_electronico: string
  contrasena: string
  nombre_completo: string
  rol_codigo: string
  area_id?: string
  tipo_trabajador_id?: number
}

export interface AdminCrearUsuarioResponse {
  id: string
  correo_electronico?: string
}

export interface ProcesarRutaPendientePayload {
  solicitud_id?: string
}

export interface ProcesarRutaCalculadaResponse {
  solicitud_id: string
  ruta_id: string
  paradas: number
  tracker_id: number
  source_id: number
  origen_tipo: 'ubicacion_tracker' | 'resguardo'
  origen_capturada_en: string | null
  recorrido_tracker_id: string | null
  motor: 'v2_orden_supervisor'
}

export interface ProcesarRutaSinTareasResponse {
  solicitud_id: string
  ruta_id: string | null
  paradas: 0
  codigo: 'ruta_eliminada_sin_tareas' | 'sin_tareas_activas'
  motor: 'v2'
}

export interface ProcesarRutaOrigenNoDisponibleResponse {
  solicitud_id: string
  estado: 'pendiente'
  codigo: 'origen_no_disponible'
  motivo: string
  origen_tipo: 'ubicacion_tracker' | 'resguardo'
  recorrido_tracker_id: string | null
}

export interface NavixyKeyResponse {
  navixyHash: string
  userId?: string
}

export interface EdgeFunctionError {
  error: string
  solicitud_id?: string
}
```

---

# Contratos principales para el frontend

Para la integración del frontend, los retornos de `procesar-ruta-pendiente` deben distinguirse principalmente mediante `codigo` y/o `motor`.

```ts
type ProcesarRutaPendienteResponse =
  | ProcesarRutaCalculadaResponse
  | ProcesarRutaSinTareasResponse
  | ProcesarRutaOrigenNoDisponibleResponse
```

Casos:

```text
motor = v2_orden_supervisor
    -> ruta calculada correctamente

codigo = ruta_eliminada_sin_tareas
    -> la ruta anterior fue eliminada porque ya no existen tareas activas

codigo = sin_tareas_activas
    -> no existen tareas activas y tampoco había una ruta que conservar

codigo = origen_no_disponible
    -> HTTP 202; la solicitud permanece pendiente y puede procesarse posteriormente
```

---

Documento generado a partir de las versiones actualmente desplegadas de las Edge Functions del proyecto `rastreo_tareas`.
