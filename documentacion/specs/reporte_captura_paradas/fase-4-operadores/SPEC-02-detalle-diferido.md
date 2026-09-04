# SPEC-02 — Detalle diferido del operador

> Fase: 4 — Pestaña Operadores

## Objetivo

Mostrar las tres analíticas del operador solo después de una selección explícita y con datos de `rpc_reporte_equipo_operador_detalle`.

## Componentes previstos

```txt
src/components/dashboard/actividad-equipo/
├── OperatorDetailAnalytics.vue
├── OperatorTimeDistributionCard.vue
├── OperatorMainStopsCard.vue
└── OperatorEngineUsageCard.vue
```

La cabecera contextual de cada card muestra la etiqueta del operador seleccionado y “últimos 10 registros”, igual que el HTML.

## Grid de tres analíticas

Reproducir `.operator-analysis` con tres cards de igual ancho:

### Distribución del tiempo

Columnas:

```txt
Estado | Tiempo | % muestra
```

La fuente principal es `distribucion_estado` (`trabajando` y `parado`). `distribucion_clasificacion` se conserva en el modelo para evolución posterior, pero no sustituye la tabla visual actual sin una decisión de producto.

### Principales paradas

Columnas:

```txt
Motivo | Tiempo | % detenido
```

Los motivos permiten wrap seguro y las barras usan `accent`, conforme al HTML.

### Uso de motor

Columnas:

```txt
Estado | Tiempo | % muestra
```

Presenta Encendido y Apagado a partir de `motor`. No se deduce el motor del estado Trabajando/Parado: son dimensiones distintas.

## Reglas de concurrencia

El detalle queda ligado a esta tupla:

```txt
selectedEquipmentCode + selectedOperatorId + startDate + endDate
```

Si cambia cualquiera de sus valores, se invalida la vista y las respuestas anteriores se ignoran. Un error o loading del detalle no afecta KPIs ni tabla principal de Operadores.

## Criterios de aceptación

- Sin operador seleccionado no se ejecuta la segunda RPC.
- La selección visible y los tres cards siempre corresponden al mismo operador.
- El motor usa los datos del RPC y diferencia encendido/apagado sin inferencias.
- Las tres cards se apilan en una columna en ancho reducido, según el HTML.
