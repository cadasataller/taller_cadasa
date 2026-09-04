# SPEC-00 — Alcance, layout, slide y permisos

> Fase: 0 — Fundación técnica y límites de integración

## Objetivo

Definir los límites de la implementación para integrar el reporte sin duplicar el shell global ni alterar el diseño de referencia.

## Fuentes obligatorias

```txt
src/layouts/DefaultLayout.vue
src/views/DashboardView.vue
src/components/dashboard/SlideActividadEquipo.vue
documentacion/reporte_captura_paradas/reporte_equipos_erp_v7_operadores.html
documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
```

## Alcance de esta fase

Incluye:

- definir la integración con el slide y el permiso existente;
- declarar el árbol de componentes y las fronteras de responsabilidad;
- fijar la pestaña inicial `resumen`;
- decidir el área visual que pertenece al reporte;
- preparar los contratos para toolbar, lista, selección y contexto.

No incluye:

- reproducir el topbar del HTML;
- desarrollar las cards y tablas completas de Resumen, Paradas u Operadores;
- modificar los RPCs, la Edge Function o la base de datos;
- usar mapa, trackers o `supabaseRastreoTareas`.

## Integración con `DefaultLayout` y Dashboard

El reporte ya es el slide `actividad_equipo` de `DashboardView`, que se alcanza mediante la ruta existente `/dashboard`. `DashboardView` filtra el slide con el permiso existente `ver_dashboard_actividad_equipo` y lo monta a través de `SlideActividadEquipo.vue`.

`DefaultLayout` contiene Dashboard y ya renderiza sidebar de escritorio, topbar global, topbar y navegación móvil, fecha, perfil, cierre de sesión y `#app-main-content-area`. No se agregan rutas hijas, ítems de menú, permisos ni guardas para el reporte.

Por ello, del HTML de referencia quedan fuera del reporte:

```txt
.topbar
.breadcrumbs
.user
.avatar
```

La primera región propia de la vista es `.toolbar`. No se deben reproducir los textos de breadcrumb, el usuario `SUPERVISOR` ni el avatar del mockup.

## Regla de scroll y alto

En escritorio, el workspace conserva el modelo del HTML: columnas de `250px`, contenido flexible y `300px`, con scroll interno en las regiones que el HTML identifica.

`DashboardView` actualmente da a todos los slides un contenedor `overflow-y-auto`. Para `actividad_equipo`, en escritorio, debe aportar una variante de contenedor que ceda alto al reporte (`h-full min-h-0`) y no imponga scroll vertical exterior. `SlideActividadEquipo` debe ocupar ese alto disponible y concentrar los scrolls en sus regiones internas, como define el HTML.

No se deben fijar alturas contra `100dvh` sin descontar el header global ni modificar el comportamiento de los demás slides. En móvil y ancho reducido, `actividad_equipo` conserva el scroll exterior del slide, igual que el HTML permite scroll de página.

En ancho reducido se aplica el HTML: una columna y scroll de página permitido. Debe respetarse también el espacio de navegación móvil de `DefaultLayout`.

## Slide y permiso

No se crea ruta ni permiso. La integración existente es:

```txt
/dashboard
└── slide: actividad_equipo
    └── permiso: ver_dashboard_actividad_equipo
```

Si el usuario no posee `ver_dashboard_actividad_equipo`, `DashboardView` no incluye el slide; no se debe crear una ruta alternativa para acceder al reporte.

## Estado inicial y árbol de componentes

```ts
type ReportTab = "resumen" | "paradas" | "operadores";

const activeTab: ReportTab = "resumen";
```

```txt
SlideActividadEquipo
├── EquipmentReportToolbar
└── EquipmentReportWorkspace
    ├── EquipmentReportSidebar
    ├── EquipmentReportCenter
    └── EquipmentReportDetailSidebar
```

`SlideActividadEquipo` es la superficie de composición y conecta el composable. Los componentes de la funcionalidad viven bajo `src/components/dashboard/actividad-equipo/`. La fuente mutable de filtros, selección, resultados y estados de carga pertenece al store/composable. Los hijos reciben props tipadas y emiten eventos; no realizan RPCs.

## Criterios de aceptación

- No se programa un topbar propio para el reporte.
- La vista abre con `resumen` como tab activa.
- El reporte aparece únicamente como slide de `/dashboard`, con `ver_dashboard_actividad_equipo`.
- No se crea ruta, permiso ni navegación nuevos.
- El módulo no importa ni llama `supabaseRastreoTareas`.
- El diseño posterior conserva las medidas y scrolls del HTML sin competir con el contenedor de scroll del layout.
