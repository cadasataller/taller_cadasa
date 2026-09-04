# Fase 3 — Pestaña Paradas

## Objetivo

Implementar el análisis de paradas del equipo seleccionado a partir de
`rpc_reporte_equipo_paradas`, con los KPIs, desgloses y detalle operativo del
HTML de referencia.

## Orden de implementación

1. [SPEC-00 — Alcance, contratos y carga](SPEC-00-alcance-contratos-carga.md)
2. [SPEC-01 — KPIs y desgloses](SPEC-01-kpis-desgloses.md)
3. [SPEC-02 — Motivos y detalle operativo](SPEC-02-motivos-detalle-operativo.md)
4. [SPEC-03 — Estados, responsive y pruebas](SPEC-03-estados-responsive-pruebas.md)

## Dependencias

```txt
fase-0-fundacion/
fase-1-shell-listado-contexto/
src/components/dashboard/SlideActividadEquipo.vue
src/stores/dashboard/reporte-equipos/reporteEquipos.store.ts
src/stores/dashboard/reporte-equipos/reporteEquipos.service.ts
```

La fase 3 reutiliza toolbar, equipo seleccionado, rango de fechas y columnas
laterales. No vuelve a cargar detalle maestro, contexto o Resumen.
