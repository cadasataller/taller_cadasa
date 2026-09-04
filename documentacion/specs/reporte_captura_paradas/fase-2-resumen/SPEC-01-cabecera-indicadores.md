# SPEC-01 — Cabecera e indicadores

> Fase: 2 — Resumen del equipo

## Componentes previstos

```txt
src/components/dashboard/actividad-equipo/
├── EquipmentReportSummaryView.vue
├── EquipmentSummaryHero.vue
└── EquipmentSummaryMetric.vue
```

`SlideActividadEquipo` continúa como superficie de composición. Los
componentes de Resumen reciben props tipadas y no llaman RPCs ni modifican el
store.

## Diseño obligatorio

Reproducir el bloque `.summary > .summary-grid` del HTML:

```txt
identidad de equipo | horas registradas | horas efectivas | efectividad
```

En escritorio usa una columna de identidad flexible y tres métricas compactas.
En ancho reducido, identidad ocupa todo el ancho y las métricas se organizan
como establece el breakpoint del HTML.

La identidad muestra:

- imagen del equipo o placeholder neutral;
- código;
- tipo;
- chip de jornadas;
- chip de activo/inactivo.

La imagen proviene de `masterDetail.imageUrl` ya resuelta en fase 0. No se
vuelve a consultar Storage desde este componente.

## Indicadores

| Card              | Valor                          | Texto auxiliar                    |
| ----------------- | ------------------------------ | --------------------------------- |
| Horas registradas | `metricas.tiempo_total`        | Total acumulado                   |
| Horas efectivas   | `metricas.tiempo_trabajando`   | Tiempo trabajando                 |
| Efectividad       | `metricas.efectividad` con `%` | `metricas.tiempo_parado` detenido |

Los indicadores mantienen el tamaño compacto, texto de 10px para labels y el
valor principal en `text-main`, tal como el HTML. Se implementan con clases
Tailwind; no se añade CSS local ni valores de color aislados.

## Criterios de aceptación

- El hero usa datos de `masterDetail`, `context` y `summary` sin duplicar IO.
- La identidad y las métricas conservan la jerarquía del HTML.
- Imagen ausente, modelo ausente y estado de detalle se degradan con `—` o
  placeholder, sin romper el layout.
- La pestaña `resumen` muestra este bloque solamente cuando es la tab activa.
