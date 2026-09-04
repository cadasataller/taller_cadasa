# Fase 2 — Resumen del equipo

## Objetivo

Reemplazar el placeholder central por la pestaña `Resumen` completa, usando la
respuesta ya existente de `rpc_reporte_equipo_resumen` y conservando la
composición ERP del HTML.

## Orden de implementación

1. [SPEC-00 — Alcance, datos y carga](SPEC-00-alcance-datos-carga.md)
2. [SPEC-01 — Cabecera e indicadores](SPEC-01-cabecera-indicadores.md)
3. [SPEC-02 — Analíticas, implementos e historial](SPEC-02-analiticas-tablas.md)
4. [SPEC-03 — Estados, responsive y pruebas](SPEC-03-estados-responsive-pruebas.md)

## Dependencias

```txt
fase-0-fundacion/
src/components/dashboard/SlideActividadEquipo.vue
src/stores/dashboard/reporte-equipos/reporteEquipos.store.ts
src/stores/dashboard/reporte-equipos/reporteEquipos.service.ts
```

La fase 1 ya entrega toolbar, selección de equipo, contexto y columna derecha.
Esta fase no debe duplicar esos bloques ni realizar nuevas llamadas de detalle
maestro o contexto.
