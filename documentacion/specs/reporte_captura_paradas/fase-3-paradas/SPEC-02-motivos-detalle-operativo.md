# SPEC-02 — Motivos y detalle operativo

> Fase: 3 — Pestaña Paradas

## Principales motivos

Crear `EquipmentStopsReasonsCard.vue` para reproducir `.stop-motives`.

Columnas exactas:

```txt
Motivo | Ocurrencias | Tiempo | % parada
```

El motivo permite salto de línea para no perder texto. Tiempo y ocurrencias se
alinean a la derecha. Las barras usan el token accent, igual que el HTML.

## Detalle de paradas

Crear `EquipmentStopsDetailTable.vue` para `.stop-detail`.

Título exacto de intención:

```txt
Detalle de paradas · 10 últimas · hora de Panamá
```

Columnas exactas:

```txt
Inicio | Fin | Duración | Motivo | Origen | Clasificación | Motor | Implemento
```

El RPC entrega como máximo diez últimos tramos de causa. No se pagina, no se
solicitan más filas y no se mezcla con historial de Resumen.

## Reglas de mapeo

| Dato remoto                 | Presentación                                                               |
| --------------------------- | -------------------------------------------------------------------------- |
| `inicio_local`, `fin_local` | texto horario de Panamá retornado por RPC                                  |
| `duracion`                  | `HH:MM`                                                                    |
| `motivo`                    | texto con wrap seguro; nunca `v-html`                                      |
| `origen`                    | Equipo, Implemento u Otro                                                  |
| `clasificacion`             | texto de clasificación retornado                                           |
| `motor_encendido`, `motor`  | etiqueta retornada; el booleano conserva semántica para iconografía futura |
| `implemento` nulo           | `—`                                                                        |
| `implemento` presente       | etiqueta compuesta con número y nombre, sin inventar campos                |

Para una parada de implemento se debe mostrar dicho implemento. Una parada de
equipo u otro sin implemento muestra `—`. Motor encendido y apagado deben
conservarse como datos distintos aunque una parada tenga duración cero.

## Scroll y tabla

El card ocupa el espacio restante de la tab mediante una grilla:

```txt
h-full min-h-0 grid grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-2 overflow-hidden
```

El contenedor de la tabla usa:

```txt
flex-1 min-h-0 overflow-y-auto rounded-md border border-gray-100
```

La cabecera permanece `sticky top-0`; Inicio, Fin y Duración no hacen wrap.
Motivo e Implemento sí permiten `break-words`. Se usan solo clases Tailwind,
sin CSS local.

## Criterios de aceptación

- Motivos y detalle usan el orden de columnas del HTML.
- El detalle conserva scroll interno y cabecera fija en escritorio.
- Implemento, motor, origen y clasificación se representan correctamente para
  cada tramo, incluidos tramos de duración `00:00`.
