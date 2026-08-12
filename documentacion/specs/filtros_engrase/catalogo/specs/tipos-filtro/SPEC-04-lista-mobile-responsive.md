# SPEC-04 — Lista mobile y comportamiento responsive

## Objetivo

Adaptar Tipos de filtro a teléfono y tablet sin comprimir la tabla ERP.

## Dependencia

Implementar después de `SPEC-03`.

## Archivos

```txt
src/components/engrase/catalogo/tipos-filtro/TiposFiltroMobileList.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroMobileCard.vue
```

## Principio responsive

```txt
mobile: cards apiladas
tablet estrecha: cards o tabla según ancho real
desktop: tabla compacta
```

No usar scroll horizontal para conservar la tabla en teléfono.

## Toolbar mobile

Orden:

```txt
[Buscar por nombre                         ]
[Estado                  ] [Limpiar icono]
[+ Nuevo tipo de filtro                   ]
```

Reglas:

- Una columna en `320px`–`374px`.
- Desde `375px`, Estado y Limpiar pueden compartir fila.
- Botón Nuevo de ancho completo.
- Inputs/selects con `min-h-11`.
- Texto del input mínimo `16px` en mobile para evitar zoom automático; desde `md` puede ser `text-sm`.
- Icon buttons mínimo `44×44px` y `aria-label`.
- Todo control habilitado usa `cursor-pointer` incluso en navegadores móviles con puntero.

## Card

Contenido:

```txt
Nombre del tipo de filtro          [Estado]
Usado en N equipos                 [ChevronRight]
```

Opcionalmente puede mostrar `N asignaciones` como metadato secundario si el ancho lo permite, pero no tipos de equipo individuales.

### Jerarquía

- Nombre: `text-sm font-semibold`.
- Estado: badge `text-xs` con texto e indicador.
- Uso: `text-xs` secundario con cifras tabulares.
- Card: `p-3`, borde suave, `rounded-lg`, sin sombra pesada.

### Interacción

- Toda la card abre Detalles.
- `button` de ancho completo o patrón semántico equivalente; no `div` clickeable.
- `cursor-pointer`.
- Target mínimo 44px, aunque la card será mayor.
- Estado pressed visible en menos de 100ms.
- Foco visible.
- Comunicar selección con `aria-pressed` o estado equivalente.

## Flujo mobile

```txt
lista de cards
  ↓ seleccionar
detalle/formulario full-screen
  ↓ cerrar o cancelar
lista preservando filtros y posición lógica
```

- Solo una superficie principal a la vez.
- El detalle no debe quedar como columna angosta.
- Al cerrar, devolver foco a la card que lo abrió cuando siga visible.
- Si el guardado cambia el estado y el item sale del filtro `Activos`, cerrar detalle y mostrar éxito antes de remover visualmente o anunciar el cambio mediante `aria-live`.

## Scroll y navegación global

- Usar scroll natural de la página o un único contenedor claramente definido.
- No crear scroll dentro de cada card.
- Añadir padding inferior para que `DefaultLayout` no tape la última card.
- Mantener `overscroll-behavior` coherente y evitar doble scroll.
- No ocultar el botón Nuevo detrás del bottom nav.

## Estados mobile

- Skeleton de 4–6 cards.
- Error y reintento en card de estado, no modal bloqueante.
- Vacío real con CTA Nuevo.
- Sin coincidencias con acción Limpiar filtros.
- Conteo de resultados antes de la lista.

## Breakpoints de validación

```txt
320px
375px
414px
640px
768px
1024px
```

La decisión tabla/cards puede usar el breakpoint del proyecto, pero debe comprobarse por legibilidad real y no solo copiar `md`.

## Criterios de aceptación

- No existe tabla horizontal en mobile.
- No hay scroll horizontal de página.
- Cards muestran nombre, estado y uso sin saturación.
- Todos los targets alcanzan 44px.
- Tipografía base visual permanece `xs/sm`.
- Filtros y posición lógica sobreviven al abrir/cerrar Detalles.
- Todo elemento clickeable habilitado usa `cursor-pointer`.

