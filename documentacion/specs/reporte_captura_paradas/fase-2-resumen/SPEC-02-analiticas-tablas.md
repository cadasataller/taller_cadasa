# SPEC-02 — Analíticas, implementos e historial

> Fase: 2 — Resumen del equipo

## Objetivo

Completar los dos niveles inferiores de Resumen con las seis regiones del HTML
sin reducir su densidad ERP.

## Grid analítico

Crear `EquipmentSummaryAnalytics.vue` con tres cards en escritorio:

1. Distribución por clasificación.
2. Principales paradas.
3. Uso por operador.

Todas muestran tabla compacta de tres columnas y barra porcentual. La barra
usa el porcentaje devuelto por backend, limitado visualmente al rango `0–100`;
no recalcula ni altera el dato original. Sus colores siguen el HTML:

```txt
clasificación: main / success / warning
paradas: accent
operadores: main
```

Las razones largas pueden envolver texto; los demás campos se truncan según el
HTML. Cada `v-for` usa una llave estable de dominio, nunca el índice.

## Fila inferior

Crear dos cards bajo `EquipmentSummaryBottomRow.vue`:

### Implementos usados por equipo

Columnas exactas:

```txt
Implemento | Jornadas | Tiempo | % uso
```

Mantener el reparto visual `0.42fr / 0.58fr` de la fila inferior. La tabla no
debe ocultar datos ni reemplazarse por cards en escritorio. La columna
Implemento concatena el número y la descripción; la descripción conserva como
máximo dos palabras con la misma regla de abreviación aplicada a Labor/Motivo.

### Historial reciente

Columnas exactas:

```txt
Inicio | Fin | Labor / Motivo | Tiempo
```

Muestra los diez registros ya limitados por el RPC, agrupados por la fecha de
inicio local. Cada grupo presenta una fila de fecha destacada y las filas
internas muestran solo la hora en Inicio y Fin. El contenedor interno tiene
scroll vertical, bordes compactos y cabecera sticky.

La tabla ocupa todo el ancho disponible: Inicio, Fin y Tiempo conservan ancho
compacto; Labor/Motivo usa el espacio flexible restante. Si Labor/Motivo supera
el ancho disponible de esa columna, se trunca visualmente con elipsis. No se
limita la cantidad de palabras ni se abrevia según la longitud de una palabra.

## Componentes reutilizables permitidos

Se permite extraer solamente piezas visuales con responsabilidad clara:

```txt
EquipmentSummaryTableCard.vue
EquipmentSummaryPercentBar.vue
EquipmentSummaryHistoryTable.vue
```

No crear un componente genérico que oculte las diferencias semánticas de las
tres analíticas. No usar `v-html` para motivo, labor u operador.

## Criterios de aceptación

- Tres analíticas se ven en columnas iguales en escritorio.
- Implementos e historial respetan la proporción del HTML y el historial tiene
  scroll interno con cabecera visible.
- Todos los tiempos son `HH:MM` y todos los datos faltantes usan `—`.
- Cada región conserva su tabla durante el cambio de tamaño; el breakpoint del
  HTML las apila en una columna en ancho reducido.
