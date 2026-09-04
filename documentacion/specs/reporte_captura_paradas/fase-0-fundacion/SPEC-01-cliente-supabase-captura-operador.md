# SPEC-01 — Cliente Supabase Captura Operador

> Fase: 0 — Fundación técnica y límites de integración

## Objetivo

Incorporar un cliente Supabase explícito para los recursos ya desplegados en la base de Captura Operador y definir cuál cliente usa cada fuente del reporte.

## Cliente nuevo obligatorio

En `src/lib/supabase.ts` se debe crear y exportar:

```ts
supabaseCapturaOperador;
```

Sus variables de entorno son:

```txt
VITE_SUPABASE_CAPTURA_OPERADOR_URL
VITE_SUPABASE_CAPTURA_OPERADOR_ANON_KEY
```

El cliente se autentica y cierra sesión siguiendo el patrón de los clientes existentes. Debe incluirse en el cierre de sesión coordinado de `DefaultLayout` para que no quede una sesión activa en Captura Operador.

No reutilizar `supabaseRastreoTareas`, sus credenciales, sus canales realtime ni sus Edge Functions. Es un módulo ajeno a este reporte.

## Matriz de clientes y operaciones

| Recurso                  | Cliente obligatorio       | Operación                                    |
| ------------------------ | ------------------------- | -------------------------------------------- |
| Listado enriquecido      | `supabaseCapturaOperador` | `functions.invoke('buscar-equipos-reporte')` |
| Contexto común           | `supabaseCapturaOperador` | `rpc('rpc_reporte_equipo_contexto')`         |
| Resumen                  | `supabaseCapturaOperador` | `rpc('rpc_reporte_equipo_resumen')`          |
| Paradas                  | `supabaseCapturaOperador` | `rpc('rpc_reporte_equipo_paradas')`          |
| Operadores               | `supabaseCapturaOperador` | `rpc('rpc_reporte_equipo_operadores')`       |
| Detalle de operador      | `supabaseCapturaOperador` | `rpc('rpc_reporte_equipo_operador_detalle')` |
| Detalle maestro e imagen | `supabaseEquipos`         | `rpc('rpc_reporte_equipo_detalle')`          |

`rpc_reporte_equipos_lista` no se invoca desde Vue en el flujo normal: la Edge Function `buscar-equipos-reporte` ya lo usa como enriquecimiento batch.

## Autenticación y Edge Function

La Edge Function se despliega con `verify_jwt = true`. La llamada usa `supabaseCapturaOperador` para heredar la sesión del usuario, en lugar de construir manualmente URLs, headers `Authorization` o tokens.

El servicio envía:

```ts
{
  q: string;
  limit: number;
  full: boolean;
  desde: string;
  hasta: string;
}
```

`desde` y `hasta` son fechas ISO de la UI. El backend interpreta ambos días de forma inclusiva en `America/Panama`.

## Cliente de equipos

El detalle maestro no pertenece a Captura Operador. La RPC `rpc_reporte_equipo_detalle` consulta `public.equipos` y `engrase.vw_equipos_con_imagen_main`; por eso usa `supabaseEquipos`.

La ruta de Storage retornada en `equipo.imagen.storage_path` no se trata como URL pública. El servicio debe resolver URL pública o firmada con `supabaseEquipos`, según la configuración efectiva del bucket. Si no hay imagen, el modelo UI expone `null` y la vista muestra el placeholder del HTML.

## Criterios de aceptación

- Existe un único cliente `supabaseCapturaOperador` con variables propias.
- Todos los RPCs de reporte y la Edge Function usan ese cliente.
- El RPC maestro de equipo usa `supabaseEquipos`.
- Ningún archivo del reporte importa `supabaseRastreoTareas`.
- No hay peticiones manuales con token ni consultas directas a tablas.
