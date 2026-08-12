# SPEC-04 — Lista mobile y comportamiento responsive

## Objetivo

Adaptar Sistemas a teléfono/tablet sin comprimir la tabla.

## Dependencia

Implementar después de `SPEC-03`.

## Archivos

```txt
src/components/engrase/catalogo/sistemas/SistemasMobileList.vue
src/components/engrase/catalogo/sistemas/SistemaMobileCard.vue
src/components/engrase/catalogo/sistemas/SistemasMobileFilterSheet.vue
```

## Patrón

```txt
mobile: cards
tablet estrecha: cards o tabla por legibilidad
desktop: tabla
```

Sin scroll horizontal para preservar columnas.

## Toolbar mobile

```txt
[Buscar por nombre                             ]
[Filtros (N)                     ] [Limpiar 44px]
[+ Nuevo sistema                             ]
```

El sheet contiene Estado y En uso, labels visibles, `Restablecer` y `Ver N resultados`.

- Controles `min-h-11`; input `text-base` para evitar zoom.
- Icon buttons `44×44px` con `aria-label`.
- Aplicar/cerrar no ejecuta red.
- Focus trap, Escape, retorno de foco, footer sticky y safe area.
- Habilitado `cursor-pointer`.

## Card

```txt
Nombre del sistema                    [Estado]
Equipos N · Asignaciones N       [ChevronRight]
```

- No mostrar aceites.
- Nombre `text-sm font-semibold`; estado/uso `text-xs`.
- Icono genérico consistente.
- `p-3`, borde suave, `rounded-lg`, sombra mínima.
- Card completa como botón accesible, `cursor-pointer`, foco y pressed.
- Target mayor de 44px; un solo foco; selección no solo por color.

## Flujo y scroll

```txt
cards → detalle full-screen → cards preservadas
```

- Una superficie principal a la vez.
- Retornar foco a card si sigue visible.
- Si sale del filtro tras guardar, anunciar y enfocar encabezado.
- Un scroll principal, safe areas y bottom nav.
- Teclado virtual no tapa acciones.

## Estados/viewports

- 4–6 skeleton cards.
- Error/reintento no modal.
- Vacío con Nuevo; sin coincidencias con Limpiar.

```txt
320px, 375px, 414px, 640px, 768px, 1024px
```

## Criterios de aceptación

- Sin tabla comprimida ni overflow horizontal.
- Búsqueda, Estado y En uso siguen disponibles.
- Cards no muestran aceites.
- Targets 44px y base visual `xs/sm`.
- Filtros/foco/posición se preservan.
- Clickable habilitado usa `cursor-pointer`.

