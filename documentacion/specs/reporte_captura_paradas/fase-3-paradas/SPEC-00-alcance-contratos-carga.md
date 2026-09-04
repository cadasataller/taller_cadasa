# SPEC-00 — Alcance, contratos y carga

> Fase: 3 — Pestaña Paradas

## Objetivo

Reemplazar el contenido central de la tab `paradas` por la vista completa de
paradas del equipo activo.

## Fuentes obligatorias

```txt
Diseño: documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
Datos:  documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
```

El bloque visual fuente va desde `.stops-view` hasta su tabla de detalle. No se
replica la topbar y no se toma diseño de los Markdown.

## RPC y carga bajo demanda

La pestaña llama, solo cuando queda activa y no hay una respuesta vigente, a:

```ts
supabaseCapturaOperador.rpc("rpc_reporte_equipo_paradas", {
  p_equipo: selectedEquipmentCode,
  p_desde: filters.startDate,
  p_hasta: filters.endDate,
});
```

La llamada usa el cliente de Captura Operador. Nunca consulta tablas directas,
`supabaseEquipos` ni `supabaseRastreoTareas`.

Al cambiar equipo o rango de fechas, se invalida la respuesta anterior antes de
mostrar una nueva. Cambiar entre tabs no debe reconsultar si la misma
combinación equipo/rango ya está vigente; sí debe recargar tras su invalidación.

## Extensión de contratos

Agregar schema Zod, DTO remoto, mapper y modelos UI para:

```txt
EquipmentStops
StopMetrics
StopClassificationRow
StopOriginRow
StopReasonRow
StopDetailRow
StopImplement
```

El schema representa exactamente estos bloques del RPC:

```txt
metricas
por_clasificacion
por_origen
principales_motivos
detalle
```

No se infieren tipos desde el HTML. Los segundos se preservan para orden y
cálculos; los tiempos entregados por backend se muestran como `HH:MM`.

## Alcance

Incluye:

- cuatro KPIs;
- clasificación y origen;
- motivos principales;
- detalle de diez últimos tramos de causa.

No incluye:

- filtros nuevos;
- edición, exportación o acciones sobre la parada;
- carga de Operadores;
- reconfiguración de las columnas de equipo, perfil o motor.
