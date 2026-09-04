# SPEC-03 — Estados, responsive y pruebas

> Fase: 2 — Resumen del equipo

## Estados de presentación

El centro usa exclusivamente `loadStates.summary` y su error asociado. La
columna izquierda, perfil y motor conservan sus estados independientes de fase 1.

| Estado    | Comportamiento                                                               |
| --------- | ---------------------------------------------------------------------------- |
| `loading` | Skeleton compacto que mantiene la altura y grilla del Resumen.               |
| `ready`   | Hero, analíticas y fila inferior con datos reales.                           |
| `empty`   | Mensaje corto dentro del centro; no mostrar tablas vacías artificiales.      |
| `error`   | Mensaje compacto con retry del resumen, sin tumbar listado ni panel derecho. |

No bloquear el slide completo por un error del resumen: perfil y uso de motor
pueden estar disponibles en paralelo.

## Responsive

En escritorio el slide debe usar el alto cedido por `DashboardView` y preservar
los scrolls internos definidos por el HTML. En móvil y ancho reducido:

- el scroll exterior vuelve al contenedor del slide;
- hero: identidad en fila completa y métricas en grid reducido;
- analíticas y fila inferior: una columna;
- tablas mantienen encabezados y permiten overflow horizontal solo si su ancho
  mínimo ya no permite lectura.

No cambiar el comportamiento ni las dimensiones de otros slides del Dashboard.

## Pruebas mínimas

- El mapper convierte todos los bloques de `rpc_reporte_equipo_resumen` y
  preserva segundos, `HH:MM` y nulos.
- El cambio de equipo limpia el Summary anterior mientras carga el nuevo.
- La tab Resumen no duplica la llamada que fase 0 inició al seleccionar equipo.
- Loading, empty y error no rompen la grilla ni el resto del workspace.
- Las tablas usan keys estables y muestran `—` para campos faltantes.
- En escritorio, el historial hace scroll interno; en móvil, el slide conserva
  scroll exterior.

## Validación final

Ejecutar:

```txt
pnpm exec prettier --write <archivos-modificados>
pnpm run typecheck
pnpm run build
```

La comparación visual se realiza contra el bloque Resumen del HTML, excluyendo
la topbar porque pertenece a `DefaultLayout`.
