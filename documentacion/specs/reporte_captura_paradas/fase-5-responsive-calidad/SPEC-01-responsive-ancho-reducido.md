# SPEC-01 — Ancho reducido y scroll

> Fase: 5 — Responsive, calidad y cierre

## Umbral obligatorio

El HTML cambia el reporte a modo reducido en `@media (max-width: 1050px)`. La implementación debe aplicar la misma frontera, por ejemplo con variantes arbitrarias de Tailwind (`max-[1050px]:` y `min-[1051px]:`) o una variante equivalente configurada. No se debe sustituir silenciosamente por `lg` si eso cambia el comportamiento entre 1025px y 1050px.

## Estructura reducida

En `≤1050px` reproducir las reglas del HTML:

- Workspace en una sola columna.
- Panel izquierdo, centro, shell central y panel derecho con alto automático y overflow visible.
- Scroll exterior permitido en el contenido del slide.
- Lista de equipos con `max-height: 360px` para no desplazar indefinidamente la selección.
- Grilla de Resumen de dos columnas, con identidad/contexto ocupando ambas.
- Analíticas, fila inferior, desgloses de Paradas y análisis/fila inferior de Operadores en una columna.
- KPIs de Paradas y Operadores en dos columnas.

La toolbar puede envolver sus controles de filtro y pestañas sin solapamientos. Tablas conservan sus columnas semánticas: cuando el ancho sea insuficiente, su wrapper horizontal puede desplazar el contenido; no se recortan texto, encabezados ni acciones.

## Relación con `DefaultLayout`

El slide no crea una barra móvil ni reserva su propio espacio para ella. Debe respetar lo que ya dispone `DefaultLayout`:

- El espaciador superior de navegación móvil.
- El área principal con scroll vertical exterior.
- El `padding-bottom` existente que libera la barra de navegación móvil fija.

No usar `fixed`, `absolute` a pantalla completa, márgenes negativos ni una altura de viewport para forzar el layout. Debe ser posible llegar mediante scroll exterior al último bloque de Operadores, Paradas o Resumen sin que quede cubierto por la navegación móvil.

## Estados responsive

Loading, vacío, error y datos parciales conservan la misma columna y el mismo ancho que su bloque listo. Los skeletons no deben imponer el grid desktop ni provocar saltos que oculten el panel siguiente al cambiar de estado.

## Criterios de aceptación

- A 1050px y por debajo no existen tres columnas ni un overflow desktop que impida recorrer el contenido.
- A 1051px el reporte vuelve al workspace ERP de tres columnas y scrolls internos.
- A tamaños móviles, los controles se pueden tocar, los tabs no quedan bajo la barra superior y el final del contenido queda por encima de la navegación inferior.
