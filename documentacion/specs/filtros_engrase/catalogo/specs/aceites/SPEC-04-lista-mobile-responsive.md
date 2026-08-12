# SPEC-04 — Lista mobile y comportamiento responsive

## Objetivo

Adaptar Aceites a teléfono y tablet sin comprimir la tabla ERP ni perder filtros.

## Dependencia

Implementar después de `SPEC-03`.

## Archivos

```txt
src/components/engrase/catalogo/aceites/AceitesMobileList.vue
src/components/engrase/catalogo/aceites/AceiteMobileCard.vue
src/components/engrase/catalogo/aceites/AceitesMobileFilterSheet.vue
```

## Patrón

```txt
mobile: cards apiladas
tablet estrecha: cards o tabla según legibilidad
desktop: tabla compacta
```

No preservar la tabla mediante scroll horizontal.

## Toolbar mobile

```txt
[Buscar por nombre                             ]
[Filtros (N)                     ] [Limpiar 44px]
[+ Nuevo aceite                              ]
```

`Filtros (N)` abre bottom sheet con Sistema, Estado y En uso.

Reglas:

- búsqueda y CTA ocupan el ancho disponible;
- controles con `min-h-11`;
- input `text-base` en mobile para evitar zoom automático;
- icon buttons `44×44px` con `aria-label`;
- N cuenta criterios distintos de defaults;
- aplicar/cerrar no dispara red;
- footer del sheet con `Restablecer` y `Ver N resultados`;
- habilitado `cursor-pointer`.

## Card

Contenido:

```txt
Nombre del aceite                     [Estado]
Sistema 1 · Sistema 2 · +N
Equipos N · Asignaciones N       [ChevronRight]
```

- Máximo dos sistemas visibles y `+N`.
- Sin cantidades por sistema en la card.
- Sin relaciones: `Sin sistemas asociados`.

Jerarquía:

- Nombre `text-sm font-semibold`.
- Estado/sistemas/metadatos `text-xs`.
- Cifras tabulares.
- Card `p-3`, borde suave, `rounded-lg`, sombra mínima.

Interacción:

- Card completa como `button` o equivalente semántico.
- `cursor-pointer`, foco visible, pressed rápido y target mayor a 44px.
- Selección anunciada y no dependiente solo de color.
- Chevron decorativo; no duplicar focos.

Si `+N` es interactivo dentro de la card, evitar botones anidados: debe existir una única acción que abra Detalles y enfoque la sección de sistemas, o separar acciones mediante estructura semántica válida.

## Sheet de filtros

- Título `Filtrar aceites`.
- Labels visibles para Sistema, Estado y En uso.
- Focus trap, cierre con Escape y retorno al trigger.
- Footer sticky, safe area y targets 44px.
- En tablet puede convertirse en popover sin alterar comportamiento.

## Flujo mobile

```txt
cards
  ↓ seleccionar
detalle full-screen
  ↓ cerrar/guardar
cards preservando filtros y posición lógica
```

- Una superficie principal a la vez.
- Devolver foco a la card si sigue visible.
- Si el item sale del filtro tras guardar, anunciar éxito y mover foco al encabezado.

## Scroll y estados

- Un solo scroll principal o claramente controlado.
- Safe area y espacio para bottom nav.
- Teclado virtual no oculta acciones.
- Skeleton de 4–6 cards.
- Error/reintento no modal.
- Vacío con Nuevo; sin coincidencias con Limpiar.

## Viewports

```txt
320px
375px
414px
640px
768px
1024px
```

## Criterios de aceptación

- Sin tabla comprimida ni overflow horizontal.
- Los cuatro criterios continúan disponibles.
- Cards respetan máximo dos sistemas sin cantidades.
- Targets 44px y base visual `xs/sm`.
- Filtros, foco y posición se preservan.
- Todo elemento clickeable habilitado usa `cursor-pointer`.

