# SPEC-00 — Alcance, contratos y carga

> Fase: 4 — Pestaña Operadores

## Objetivo

Implementar `equipment-operators-view` como análisis de operadores del equipo actual, sin convertir el operador en un contexto global independiente.

## Fuentes obligatorias

```txt
Diseño: documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
Datos:  documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
```

El diseño proviene solo de `.operators-view` en el HTML. La topbar del mockup queda fuera porque pertenece a `DefaultLayout`.

## Dos cargas con responsabilidades distintas

Al abrir la tab `operadores`, y solo si no existe respuesta vigente para el equipo/rango, cargar:

```ts
supabaseCapturaOperador.rpc("rpc_reporte_equipo_operadores", {
  p_equipo: selectedEquipmentCode,
  p_desde: filters.startDate,
  p_hasta: filters.endDate,
});
```

Este RPC llena los KPIs y la tabla principal. No calcula detalle pesado por operador y no debe disparar `rpc_reporte_equipo_operador_detalle` por cada fila.

La segunda carga ocurre solo después de elegir una fila:

```ts
supabaseCapturaOperador.rpc("rpc_reporte_equipo_operador_detalle", {
  p_equipo: selectedEquipmentCode,
  p_operador: selectedOperatorId,
  p_desde: filters.startDate,
  p_hasta: filters.endDate,
});
```

Ambas usan exclusivamente `supabaseCapturaOperador`; no usan `supabaseRastreoTareas`, tablas directas ni `supabaseEquipos`.

## Estado y coherencia

El store debe mantener, de forma tipada:

```txt
operators
selectedOperatorId
operatorDetail
loadStates.operators
loadStates.operatorDetail
errores independientes por bloque
```

Al cambiar equipo, fecha o búsqueda que altere el listado:

1. se invalida la colección de operadores;
2. se limpia `selectedOperatorId`;
3. se limpia `operatorDetail`;
4. se descartan respuestas anteriores mediante el identificador de solicitud.

No seleccionar automáticamente al primer operador: el detalle solo comienza por una elección explícita del usuario.

## Contratos y modelos mínimos

Extender schema Zod, DTO, mapper y modelos UI para:

```txt
EquipmentOperators
OperatorMetrics
OperatorUsageRow
OperatorDetail
OperatorStateDistributionRow
OperatorStopReasonRow
OperatorEngineUsageRow
OperatorImplementRow
OperatorHistoryRow
```

Los campos documentados se conservan exactamente: `operador_id`, `operador`, jornadas, tiempos en segundos y `HH:MM`, porcentajes, métricas, distribuciones, implementos e historial. No se infieren datos desde el HTML ni se usan `any` o `unknown` para admitir un contrato incompleto.
