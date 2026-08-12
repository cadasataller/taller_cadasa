# SPEC-04 — Lista mobile y comportamiento responsive

## Objetivo

Adaptar la pestaña Filtros a teléfono y tablet sin comprimir la tabla ni perder capacidad operativa.

## Dependencia

Implementar después de `SPEC-03`.

## Archivos

```txt
src/components/engrase/catalogo/filtros/FiltrosMobileList.vue
src/components/engrase/catalogo/filtros/FiltroMobileCard.vue
src/components/engrase/catalogo/filtros/FiltrosMobileFilterSheet.vue
```

## Patrón responsive

```txt
mobile: cards apiladas
tablet estrecha: cards o tabla según legibilidad real
desktop: tabla compacta
```

No usar scroll horizontal para conservar la tabla.

## Toolbar mobile

Orden recomendado:

```txt
[Buscar por código                            ]
[Filtros (N)                    ] [Limpiar 44px]
[+ Nuevo filtro                              ]
```

`Filtros (N)` abre un bottom sheet con Tipo de filtro, En compras y Estado. Esto evita cuatro selects comprimidos y conserva todos los criterios.

Reglas:

- búsqueda y CTA de ancho completo;
- input/select con `min-h-11`;
- input `text-base` en mobile para evitar zoom del navegador, aunque el resto siga `xs/sm`;
- botones de icono mínimo `44×44px` y `aria-label`;
- el contador N representa criterios distintos de sus defaults;
- Aplicar/cerrar sheet no ejecuta red; si los controles actualizan en vivo, `Aplicar` solo cierra;
- `Limpiar` restaura todos los defaults;
- cada control habilitado usa `cursor-pointer`.

## Card

Contenido definitivo:

```txt
Código                              [Estado]
[Sí/No en compras]              [ChevronRight]
Equipos N · Asignaciones N
```

No mostrar tipos de filtro ni tipos de equipo.

### Jerarquía

- Código: `text-sm font-semibold`.
- Estado y compras: badges `text-xs` con texto.
- Uso: `text-xs`, cifras tabulares.
- Card: `p-3`, borde suave, `rounded-lg`, sombra mínima o ninguna.

### Interacción

- Toda la card es un `button` o patrón semántico equivalente de ancho completo.
- `cursor-pointer`, foco visible y feedback pressed rápido.
- Target mayor de 44px.
- Selección comunicada con `aria-pressed`/estado equivalente y señal adicional al color.
- Un solo foco por acción; chevron decorativo.

## Sheet de filtros

- Título `Filtrar filtros`.
- Controles con labels visibles.
- `Restablecer` y `Ver N resultados`.
- Footer sticky y safe area.
- Focus trap, Escape/cierre y retorno de foco al trigger.
- En pantallas suficientemente anchas puede ser popover; el comportamiento funcional no cambia.

## Flujo mobile

```txt
cards
  ↓ seleccionar
detalle full-screen
  ↓ cerrar/guardar
cards con filtros y posición lógica preservados
```

- Una superficie principal a la vez.
- Al cerrar, devolver foco a la card si sigue visible.
- Si guardar cambia el estado y sale del filtro Activos, anunciar éxito antes de retirarlo y enfocar el encabezado del listado.

## Scroll

- Un único scroll principal o claramente controlado.
- Sin scroll interno en cards.
- Padding inferior para bottom nav y safe area.
- Teclado virtual no tapa campos ni acciones.

## Estados

- 4–6 skeleton cards.
- Error/reintento dentro del contenido, no modal bloqueante.
- Vacío con CTA Nuevo.
- Sin coincidencias con Limpiar filtros.
- Conteo antes de la lista.

## Viewports de aceptación

```txt
320px
375px
414px
640px
768px
1024px
```

## Criterios de aceptación

- No existe tabla horizontal ni overflow de página.
- Los cuatro filtros siguen disponibles.
- Cards solo contienen código, compras, estado y uso.
- Targets mínimos 44px con tipografía visual `xs/sm`.
- Filtros, foco y posición lógica sobreviven al detalle.
- Todo elemento clickeable habilitado usa `cursor-pointer`.

