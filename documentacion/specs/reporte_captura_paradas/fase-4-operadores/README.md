# Fase 4 — Pestaña Operadores

## Objetivo

Implementar el análisis de operadores dentro del equipo seleccionado: resumen, tabla seleccionable, detalle bajo demanda e historial, usando los dos RPCs ya disponibles.

## Orden de implementación

1. [SPEC-00 — Alcance, contratos y carga](SPEC-00-alcance-contratos-carga.md)
2. [SPEC-01 — KPIs y tabla seleccionable](SPEC-01-kpis-tabla-seleccionable.md)
3. [SPEC-02 — Detalle diferido del operador](SPEC-02-detalle-diferido.md)
4. [SPEC-03 — Fila inferior, estados y pruebas](SPEC-03-fila-inferior-estados-pruebas.md)

## Dependencias

```txt
fase-0-fundacion/
fase-1-shell-listado-contexto/
src/components/dashboard/SlideActividadEquipo.vue
src/stores/dashboard/reporte-equipos/reporteEquipos.store.ts
src/stores/dashboard/reporte-equipos/reporteEquipos.service.ts
```

La fase 4 reutiliza toolbar, rango, equipo activo y columnas laterales. No vuelve a cargar detalle maestro, contexto, Resumen ni Paradas.
