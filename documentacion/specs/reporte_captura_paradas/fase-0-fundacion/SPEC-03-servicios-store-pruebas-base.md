# SPEC-03 — Servicios, store y pruebas de base

> Fase: 0 — Fundación técnica y límites de integración

## Objetivo

Definir la orquestación de la carga inicial, la selección de equipo y el estado que consumirá el shell sin acoplar las vistas a Supabase.

## Capas obligatorias

```txt
service → mapper/schema → store Pinia → composable → vista/componentes
```

El service solo hace IO y devuelve modelos validados. El store es la única fuente mutable de filtros, selección, resultados, errores y estados. El composable expone acciones y refs preparadas para `SlideActividadEquipo`.

## Estado mínimo del store

```ts
type ReportLoadState = "idle" | "loading" | "ready" | "empty" | "error";

interface ReportLoadStates {
  equipmentList: ReportLoadState;
  equipmentDetail: ReportLoadState;
  context: ReportLoadState;
  summary: ReportLoadState;
  stops: ReportLoadState;
  operators: ReportLoadState;
  operatorDetail: ReportLoadState;
}
```

El estado incluye además:

- rango de fechas inicial de último mes;
- búsqueda de equipo;
- equipo seleccionado o `null`;
- `activeTab: 'resumen'`;
- operador seleccionado o `null`;
- resultados tipados por bloque;
- errores tipados por bloque;
- identificador o contador de solicitud vigente para descartar respuestas obsoletas.

## Flujos obligatorios

### Carga inicial

1. Calcular el último mes para la UI.
2. Llamar `buscar-equipos-reporte` mediante `supabaseCapturaOperador`.
3. Validar y mapear la respuesta.
4. Seleccionar el primer equipo solo si la lista tiene elementos.
5. Si la lista está vacía, mostrar estado vacío sin invocar RPCs de detalle.

### Selección de equipo

Al seleccionar un código, limpiar el operador y todos los datos dependientes del equipo anterior. Después, en paralelo, solicitar:

```txt
supabaseEquipos.rpc('rpc_reporte_equipo_detalle')
supabaseCapturaOperador.rpc('rpc_reporte_equipo_contexto')
supabaseCapturaOperador.rpc('rpc_reporte_equipo_resumen')
```

La última llamada es obligatoria porque `resumen` es la tab inicial. Las tres operaciones poseen estados de carga y error independientes; una falla parcial no bloquea las demás.

### Cambio de fecha o búsqueda

Un cambio confirmado de rango vuelve a cargar la Edge Function y reinicia el contexto del equipo. Una búsqueda con texto no hace consultas N+1: se delega en `buscar-equipos-reporte` con su límite y rango vigentes. Las solicitudes anteriores se cancelan o sus resultados se descartan mediante el identificador de solicitud.

### Cambio de tab

- `resumen`: reutiliza una respuesta vigente o carga `rpc_reporte_equipo_resumen`.
- `paradas`: carga bajo demanda `rpc_reporte_equipo_paradas`.
- `operadores`: carga bajo demanda `rpc_reporte_equipo_operadores`.
- El detalle de operador no se consulta hasta elegir una fila de operador.

## Pruebas mínimas de fase 0

- El service usa `supabaseCapturaOperador` para Edge Function y RPCs de Captura Operador, y `supabaseEquipos` para el detalle maestro.
- Las respuestas inválidas de cada contrato quedan en estado `error` sin contaminar los modelos UI.
- La carga inicial activa `resumen` y solicita su RPC tras seleccionar equipo.
- Un cambio rápido de equipo no permite que una respuesta anterior reemplace el estado vigente.
- La falla fail-soft de enriquecimiento mantiene visible el equipo y refleja jornadas/tiempo nulos.
- Una lista vacía no dispara cargas de detalle.

## Criterios de aceptación

- La vista puede consumir un composable sin conocer Supabase.
- El cambio de equipo nunca deja datos de otro equipo visibles.
- Los siete bloques de carga tienen estado y error independientes.
- Ninguna consulta del reporte usa `supabaseRastreoTareas` ni acceso directo a tablas.
