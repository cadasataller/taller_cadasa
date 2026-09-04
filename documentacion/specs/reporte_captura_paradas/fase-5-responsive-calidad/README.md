# Fase 5 — Responsive, calidad y cierre

## Objetivo

Cerrar el reporte con el comportamiento responsive y de scroll que define el HTML, sin invadir responsabilidades de `DefaultLayout.vue`, y validar calidad visual, accesibilidad, tipos y estados de todos los bloques ya implementados.

## Orden de implementación

1. [SPEC-00 — Desktop ERP y ownership de layout](SPEC-00-desktop-erp-layout.md)
2. [SPEC-01 — Ancho reducido y scroll](SPEC-01-responsive-ancho-reducido.md)
3. [SPEC-02 — Accesibilidad, iconos y tipos](SPEC-02-accesibilidad-consistencia-tipos.md)
4. [SPEC-03 — Validación final y matriz de pruebas](SPEC-03-validacion-final-pruebas.md)

## Dependencias

```txt
fase-0-fundacion/
fase-1-shell-listado-contexto/
fase-2-resumen/
fase-3-paradas/
fase-4-operadores/
src/layouts/DefaultLayout.vue
src/views/DashboardView.vue
src/components/dashboard/SlideActividadEquipo.vue
documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
```

Es una fase transversal: no crea RPCs, Edge Functions, rutas, permisos, navegación ni otro cliente de Supabase. Verifica y ajusta la presentación de los componentes de las fases previas.
