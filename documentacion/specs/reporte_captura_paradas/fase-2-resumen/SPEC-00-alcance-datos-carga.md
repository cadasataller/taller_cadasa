# SPEC-00 — Alcance, datos y carga

> Fase: 2 — Resumen del equipo

## Objetivo

Convertir `EquipmentReportCenter` en `EquipmentReportSummaryView` para mostrar
el análisis de la pestaña `resumen` del equipo seleccionado.

## Fuente visual y fuentes de datos

```txt
Diseño: documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
Datos:  documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
```

El diseño proviene únicamente del bloque de Resumen del HTML: card superior,
grid de tres analíticas y fila inferior de dos tablas. No se toma diseño de los
Markdown ni se incorpora la topbar del mockup.

## RPC y momento de carga

La única fuente del centro de Resumen es:

```ts
supabaseCapturaOperador.rpc("rpc_reporte_equipo_resumen", {
  p_equipo: selectedEquipmentCode,
  p_desde: filters.startDate,
  p_hasta: filters.endDate,
});
```

La fase 0 ya carga este RPC junto con detalle maestro y contexto al seleccionar
un equipo porque `resumen` es la tab inicial. La fase 2 solo completa schema,
mapper, modelo y presentación de la respuesta. Debe reutilizar una respuesta
vigente y no disparar una segunda petición al montar el componente.

Al cambiar de equipo o de fecha, el store limpia el resumen anterior antes de
exponer el nuevo. Nunca se muestran métricas o tablas de un equipo previo.

## Contrato de UI

El mapper debe separar el resultado en modelos tipados para:

```txt
EquipmentSummaryMetrics
SummaryClassificationRow
SummaryStopReasonRow
SummaryOperatorUsageRow
SummaryImplementRow
SummaryHistoryRow
```

La respuesta conserva segundos para cálculos, orden y porcentaje; la UI muestra
el `HH:MM` retornado por backend. Datos nulos o faltantes se representan como
`null` y se muestran como `—`, nunca como cero inventado.

## Alcance confirmado

Incluye:

- identidad visual del equipo y sus tres indicadores;
- clasificación, paradas y operadores;
- implementos e historial reciente;
- estados independientes loading, empty y error del resumen.

No incluye:

- filtros adicionales;
- edición, exportación o gráficos alternativos;
- carga de Paradas u Operadores;
- modificar la columna izquierda o derecha.
