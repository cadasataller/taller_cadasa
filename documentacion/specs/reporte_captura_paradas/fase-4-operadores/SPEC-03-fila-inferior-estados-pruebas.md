# SPEC-03 — Fila inferior, estados y pruebas

> Fase: 4 — Pestaña Operadores

## Fila inferior

Crear `OperatorDetailBottomRow.vue` con la proporción visual de `.operator-bottom`:

```txt
0.38fr implementos | 0.62fr historial
```

### Implementos usados por operador

Columnas exactas:

```txt
Implemento | Tipo / Nombre | Jornadas | Tiempo
```

Se filtra implícitamente por equipo, operador y rango mediante la segunda RPC. No aplica filtros extra ni solicita un endpoint adicional.

### Historial reciente

Columnas exactas:

```txt
Inicio | Fin | Labor / Motivo | Tiempo
```

Muestra hasta los diez registros retornados. Mantiene scroll interno, cabecera sticky y `Labor / Motivo` con wrap seguro. Los horarios se presentan en la zona de Panamá ya preparada por backend.

## Estados

| Bloque                     | Estados requeridos                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| KPIs y tabla principal     | `idle`, `loading`, `ready`, `empty`, `error` de `loadStates.operators`                   |
| Analíticas y fila inferior | espera de selección, `loading`, `ready`, `empty`, `error` de `loadStates.operatorDetail` |

Un estado vacío del primer RPC muestra un mensaje de Operadores sin tabla ficticia. Antes de seleccionar, el detalle muestra una instrucción breve; no un spinner. Loading conserva la geometría de las cards y tablas.

## Responsive

En escritorio se conserva la grilla de cuatro KPIs, tres analíticas y fila inferior `0.38fr / 0.62fr`. En ancho reducido sigue el HTML:

- KPIs: dos columnas;
- analíticas: una columna;
- fila inferior: una columna;
- historial: scroll interno cuando hay alto disponible y scroll exterior del slide en móvil.

## Pruebas mínimas

- Abrir la tab llama `rpc_reporte_equipo_operadores` una vez por equipo/rango vigente.
- Abrir la tab no llama `rpc_reporte_equipo_operador_detalle`.
- Seleccionar una fila llama la segunda RPC con `p_equipo`, `p_operador`, `p_desde` y `p_hasta` correctos.
- Cambio de equipo, fecha o búsqueda limpia `selectedOperatorId` y `operatorDetail` y descarta resultados antiguos.
- Filas con jornadas, trabajando o parado nulos muestran `—`.
- Motor encendido/apagado, implementos e historial se mapean desde la segunda RPC sin inventar datos.
- El historial conserva cabecera visible durante scroll y los layouts desktop/reducido coinciden con el HTML.

## Validación final

```txt
pnpm exec prettier --write <archivos-modificados>
pnpm run typecheck
pnpm run build
```
