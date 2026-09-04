# SPEC-00 — Desktop ERP y ownership de layout

> Fase: 5 — Responsive, calidad y cierre

## Alcance

En escritorio, el reporte debe reproducir la composición ERP del HTML dentro de `SlideActividadEquipo.vue`. `DefaultLayout.vue` conserva su topbar global, sidebar y navegación; el reporte no añade una topbar, encabezado fijo ni navegación paralela.

La primera pieza del reporte es la toolbar de filtros y pestañas. Debe aparecer bajo el encabezado existente de `DefaultLayout` y dentro del área que entrega `DashboardView` al slide `actividad_equipo`.

## Workspace desktop

Con ancho mayor a `1050px`, conservar la estructura de `.workspace` del HTML:

```txt
250px listado de equipos | minmax(0, 1fr) área central | 300px detalle contextual
```

- Usar una grilla de Tailwind equivalente a `grid-cols-[250px_minmax(0,1fr)_300px]`, con separación compacta del mockup.
- El contenedor del workspace, la columna central y sus wrappers deben incluir `min-h-0`; el shell desktop ocupa la altura cedida por `DashboardView`, sin declarar un viewport propio (`h-screen`, `h-dvh` o similar).
- En desktop, `DashboardView` limita el alto y oculta el overflow exterior del workspace. La implementación debe conservar ese acuerdo; no debe introducir scroll de página para compensar un panel sin límite de alto.
- Los anchos laterales no deben colapsar ni hacer que la columna central exceda el contenedor. Para ello, el área central usa `minmax(0, 1fr)` y tablas/gráficas respetan `min-w-0`.

## Scrolls definidos por el HTML

Solo estos contenidos desplazan internamente cuando el layout tiene altura disponible:

| Área                 | Comportamiento requerido                                                                |
| -------------------- | --------------------------------------------------------------------------------------- |
| Lista de equipos     | `overflow-y-auto` en su cuerpo; filtros y búsqueda permanecen fuera de ese scroll.      |
| Centro de Resumen    | Historial reciente y tablas largas en sus cuerpos.                                      |
| Centro de Paradas    | Tabla de últimos tramos con cuerpo scrollable y cabecera sticky.                        |
| Centro de Operadores | Tabla, historial y cuerpos largos según la fase 4; sus cabeceras se conservan visibles. |
| Panel derecho        | Cuerpo de contexto/descripción con scroll propio.                                       |

No convertir cards, filas o toda la página en contenedores scrollables. En particular, `.workspace`, `.center` y `.center-shell` deben conservar el rol de estructura no desplazable que tienen en el HTML desktop.

## Criterios de aceptación

- No existe topbar ni botón de navegación propio del reporte.
- En desktop se ven tres columnas estables, toolbar superior y scrolls internos, sin scroll exterior del slide.
- El header global de `DefaultLayout` sigue visible y no queda tapado por un elemento `fixed` o `sticky` del reporte.
- La tab inicial continúa siendo `resumen`; este spec no cambia cargas, permisos ni estado de las fases funcionales.
