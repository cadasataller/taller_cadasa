# Specs — Reporte de captura de paradas

> Módulo: Dashboard
>
> Vista objetivo: Reporte ERP de captura de tiempos operador/equipo

## Propósito

Esta carpeta divide la implementación frontend del reporte de equipos en fases pequeñas. El backend ya está disponible: la implementación debe consumir sus Edge Functions y RPCs, sin crear consultas directas a tablas.

## Fuente de verdad

La única fuente de verdad visual es:

```txt
documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
```

El HTML aporta distribución, densidad, dimensiones, responsive, scrolls, colores, tablas y estados visuales. Los Markdown del paquete solo se usan para contratos remotos, datos y responsabilidades.

`DefaultLayout.vue` y el carrusel de `DashboardView.vue` son excepciones deliberadas: aportan sidebar, topbar global, navegación de slides y el contenedor de cada slide. El reporte no implementa ni duplica la topbar del mockup; comienza en la toolbar de filtros y tabs dentro de `SlideActividadEquipo`.

## Fuentes técnicas obligatorias

```txt
src/layouts/DefaultLayout.vue
src/views/DashboardView.vue
src/components/dashboard/SlideActividadEquipo.vue
src/lib/supabase.ts
documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
documentacion/reporte_captura_paradas/documentacion_rpc_bd_equipos.md
documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
```

## Decisiones cerradas

- La pestaña inicial es `resumen`.
- El reporte vive exclusivamente en `SlideActividadEquipo`, dentro de `/dashboard`.
- No se crea una ruta, permiso ni ítem de navegación nuevos.
- El acceso se rige por el slide existente `ver_dashboard_actividad_equipo`.
- El módulo no usa `supabaseRastreoTareas` ni ninguno de sus RPCs.
- Se creará `supabaseCapturaOperador` para la Edge Function y los RPCs de `captura_operador`.
- El detalle maestro e imagen del equipo usan `supabaseEquipos`.
- Toda respuesta JSONB se valida con Zod antes de mapearla a modelos de UI.
- No se permiten `any`, `unknown` ni lecturas directas de tablas para el reporte.

## Fases previstas

```txt
fase-0-fundacion/
fase-1-shell-listado-contexto/
fase-2-resumen/
fase-3-paradas/
fase-4-operadores/
fase-5-responsive-calidad/
```

Las fases 0, 2, 3, 4 y 5 ya están especificadas. Las fases posteriores deben partir de sus contratos y decisiones, sin redefinir el cliente, el layout global ni la fuente visual.
