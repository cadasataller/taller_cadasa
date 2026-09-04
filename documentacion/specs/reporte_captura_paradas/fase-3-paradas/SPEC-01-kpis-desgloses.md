# SPEC-01 — KPIs y desgloses

> Fase: 3 — Pestaña Paradas

## Componentes previstos

```txt
src/components/dashboard/actividad-equipo/
├── EquipmentStopsView.vue
├── EquipmentStopsKpiGrid.vue
└── EquipmentStopsBreakdown.vue
```

`SlideActividadEquipo` sigue como superficie de composición. Los componentes
reciben props tipadas y emiten acciones de UI; no llaman RPCs.

## KPIs

Reproducir `.stop-kpis` como grilla compacta de cuatro columnas en escritorio:

| Card              | Valor                       | Texto auxiliar                  |
| ----------------- | --------------------------- | ------------------------------- |
| Tiempo parado     | `tiempo_parado`             | Total acumulado                 |
| % parado          | `porcentaje_parado` con `%` | Sobre `tiempo_total` registrado |
| N.º de paradas    | `cantidad_paradas`          | Períodos con causa principal    |
| Duración promedio | `duracion_promedio`         | Tiempo parado / paradas         |

El tiempo total usado en el texto auxiliar proviene del resumen/contexto ya
cargado; no se calcula ni se consulta de nuevo. Los cuatro cards usan labels
de 10px, valor destacado `text-main` y la densidad del HTML.

## Desgloses

`EquipmentStopsBreakdown` reproduce `.stop-breakdown`: dos cards iguales en
escritorio, con tabla de cuatro columnas.

### Por clasificación

```txt
Clasificación | Tiempo | N.º | % parada
```

Los colores visuales siguen el HTML: `OPERATIVO` usa success y `TALLER` usa
warning. Una clasificación adicional usa un token existente apropiado; no se
definen colores arbitrarios.

### Por origen

```txt
Origen | Tiempo | N.º | % parada
```

Los orígenes de dominio son `equipo`, `implemento` y `otro`; la UI los presenta
como Equipo, Implemento y Otro. Se conserva el color del HTML para cada fila:
main, success o warning según corresponda.

Cada barra porcentual muestra el valor del backend, limitado solo para su ancho
visual a `0–100`. No se altera el porcentaje presentado ni se inventan filas
en cero.

## Criterios de aceptación

- Los KPIs y los dos desgloses coinciden en columnas, textos y densidad con el
  bloque Paradas del HTML.
- Los datos nulos o ausentes muestran `—`; una colección vacía muestra un
  estado compacto de card, no valores ficticios.
- En escritorio hay cuatro KPIs y dos desgloses en paralelo; en ancho reducido
  siguen el breakpoint del HTML: dos KPIs por fila y desgloses apilados.
