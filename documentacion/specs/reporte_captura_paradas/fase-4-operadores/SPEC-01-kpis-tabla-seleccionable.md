# SPEC-01 — KPIs y tabla seleccionable

> Fase: 4 — Pestaña Operadores

## Componentes previstos

```txt
src/components/dashboard/actividad-equipo/
├── EquipmentOperatorsView.vue
├── EquipmentOperatorsKpiGrid.vue
└── EquipmentOperatorsUsageTable.vue
```

`SlideActividadEquipo` conserva su rol de composición. Estos componentes reciben props tipadas y emiten selección; no llaman RPCs.

## KPIs

Reproducir `.operator-kpis` como una grilla de cuatro cards compactas:

| Card                | Valor               | Texto auxiliar           |
| ------------------- | ------------------- | ------------------------ |
| Operadores únicos   | `operadores_unicos` | Código del equipo actual |
| Tiempo registrado   | `tiempo_total`      | Participación acumulada  |
| Jornadas del equipo | `jornadas`          | Rango consultado         |
| Mayor participación | `porcentaje`        | Etiqueta del operador    |

Los valores vienen de `rpc_reporte_equipo_operadores.metricas`; no se calculan desde las filas. El cuarto card debe tratar `mayor_participacion` ausente como `—` sin fabricar operador ni porcentaje.

## Tabla principal

Crear `operators-usage-table-card` siguiendo `.operator-main-card` del HTML.

Columnas exactas:

```txt
Operador | Jornadas | Total | Trabajando | Parado | % uso
```

Los valores por fila provienen del primer RPC, por lo que ya deben llenar jornadas, trabajando y parado cuando el backend los entregue. `null` se muestra como `—`.

Cada fila:

- usa `operador_id` como key e ID estable;
- es un control seleccionable accesible por click, Enter y Space;
- recibe el estilo de selección del HTML: fondo success y acento main izquierdo;
- emite `select-operator`, sin mutar props ni invocar el servicio.

El encabezado incluye el texto de guía “Selecciona un operador para analizar su actividad”. Mientras no haya selección, el detalle inferior no se carga y debe mostrar un estado de espera compacto.

## Criterios de aceptación

- Al abrir Operadores se realiza una sola carga del primer RPC para el equipo/rango vigente.
- Ningún detalle de operador inicia hasta un click o acción de teclado.
- La tabla conserva seis columnas, densidad y barras porcentuales del HTML.
- En ancho reducido, la tabla mantiene su semántica y puede hacer overflow horizontal antes de ocultar columnas.
