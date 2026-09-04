# SPEC-03 — Estados, responsive y pruebas

> Fase: 3 — Pestaña Paradas

## Estados

El store añade y usa `loadStates.stops` y un error específico de Paradas. Un
error de esta tab no invalida listado, perfil, motor ni Resumen.

| Estado    | Comportamiento                                                        |
| --------- | --------------------------------------------------------------------- |
| `idle`    | No carga hasta activar la tab.                                        |
| `loading` | Skeleton compacto que conserva el alto de KPIs, cards y tabla.        |
| `ready`   | KPIs, desgloses, motivos y detalle con datos del RPC.                 |
| `empty`   | Mensaje breve dentro del centro; no se inventan cero paradas.         |
| `error`   | Error compacto y reintento exclusivo de `rpc_reporte_equipo_paradas`. |

## Responsive

En escritorio, la vista mantiene scroll interno en el detalle y no activa
scroll exterior adicional. En ancho reducido aplica el HTML:

- KPIs en dos columnas;
- clasificación y origen en una columna;
- motivos y detalle debajo;
- el slide conserva su scroll exterior móvil.

La tabla puede hacer overflow horizontal solo cuando el ancho ya no permite
mostrar sus ocho columnas de manera legible. No se transforman las filas en
cards ni se eliminan columnas.

## Pruebas de contrato y mapper

- `rpc_reporte_equipo_paradas` se invoca con `p_equipo`, `p_desde` y `p_hasta`
  usando `supabaseCapturaOperador`.
- El schema rechaza contratos inválidos sin introducir `any` o `unknown` en
  estado/UI.
- Métricas, clasificación, origen, motivos y detalle conservan segundos,
  porcentajes y valores `HH:MM`.
- Una respuesta sin paradas es `empty` o muestra sus valores documentados sin
  fabricar filas.

## Pruebas de comportamiento y UI

- Una parada de origen `implemento` muestra número/nombre de implemento.
- Una parada sin implemento muestra `—`.
- Motor encendido y apagado se distinguen, incluidos períodos `00:00`.
- Un cambio rápido de equipo o fecha no muestra un detalle de paradas obsoleto.
- Cabecera del detalle queda visible durante el scroll interno de escritorio.
- Loading, empty y error no desplazan ni rompen las columnas laterales.

## Validación final

```txt
pnpm exec prettier --write <archivos-modificados>
pnpm run typecheck
pnpm run build
```

La comparación visual usa únicamente la tab Paradas del HTML y excluye la
topbar, que pertenece al layout global.
