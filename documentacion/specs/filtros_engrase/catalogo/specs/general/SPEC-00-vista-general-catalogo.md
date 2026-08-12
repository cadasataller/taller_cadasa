# SPEC-00 — Vista general y estructura base del Catálogo

> Módulo: Equipos / Engrase / Filtros / Catálogo  
> Entrega: shell de navegación y UI base  
> Datos: sin integración de RPC  
> Responsive: mobile-first, con densidad ERP en desktop

## 1. Objetivo

Crear la estructura general que permitirá implementar progresivamente:

```txt
Tipos de filtro
Filtros
Aceites
Sistemas
```

Esta entrega resuelve únicamente:

- entrada al Catálogo desde la vista existente de Filtros de Engrase;
- ruta, permisos y retorno a la vista de equipos;
- encabezado compacto;
- selector de sección responsive;
- contenedor común para contenido futuro;
- estado honesto de sección todavía no implementada;
- límites entre el shell y las pestañas futuras.

No implementa contenido interno de ninguna pestaña.

## 2. Contexto obligatorio

Antes de implementar, leer completamente:

```txt
documentacion/specs/filtros_engrase/catalogo/contexto.md
documentacion/specs/filtros_engrase/catalogo/catalogo_tipo_filtro.png
documentacion/specs/filtros_engrase/catalogo/catalogo_filtro.png
documentacion/specs/filtros_engrase/catalogo/catalogo_aceite.png
documentacion/specs/filtros_engrase/catalogo/catalogo_sistemas.png
documentacion/specs/filtros_engrase/catalogo/catalogo_modal_confirmacion.png
documentacion/specs/filtros_engrase/SPEC-00-base-navegacion-permisos.md
documentacion/specs/filtros_engrase/SPEC-07-integracion-responsive-estados.md
```

Jerarquía de fuentes:

1. `contexto.md` define el comportamiento funcional vigente.
2. Este spec define la estructura general.
3. Las imágenes definen composición, ritmo y jerarquía visual.
4. Cada spec futuro define el contenido de su pestaña.

## 3. Alcance

### Incluido

```txt
ruta base del catálogo
protección de acceso
acción Ver catálogo
encabezado y acción Volver
navegación entre cuatro secciones
área común de contenido
responsive desktop/tablet/mobile
accesibilidad del shell
placeholder temporal de sección
contratos de extensión
```

### Excluido

```txt
RPC o consultas a Supabase
services, mappers o contratos de payload
stores de datos del catálogo
tablas o listados reales
cards de registros mobile
búsqueda, filtros, ordenamiento o paginación
panel/drawer de detalles
formularios de creación o edición
modal de confirmación
validación o guardado
reglas particulares de cada pestaña
```

## 4. Ubicación y nomenclatura

La jerarquía funcional es:

```txt
Engrase
└── Filtros
    ├── Vista operativa de equipos
    └── Catálogo de filtros y engrase
```

No pertenece a:

```txt
/catalogo
module_catalog
src/views/CatalogoView.vue
src/components/catalogo/**
```

Etiquetas:

- Desktop/tablet: `Catálogo de filtros y engrase`.
- Mobile: `Catálogo de engrase` si el ancho no permite el título largo.
- Contexto opcional: `Engrase / Filtros`.

No usar solamente `Catálogo` si el layout no muestra el módulo padre.

## 5. Ruta y navegación

### Ruta base

```txt
/engrase/filtros/catalogo
```

Nombre sugerido:

```txt
CatalogoEngrase
```

### Entrada desde Equipos

El botón existente `Ver Catalogo` del menú del panel Equipos debe:

1. cambiar su etiqueta a `Ver catálogo`;
2. emitir una intención de navegación;
3. cerrar el menú;
4. navegar a `CatalogoEngrase` desde la vista responsable;
5. usar `cursor-pointer` cuando esté habilitado.

Contrato sugerido:

```txt
emit: open-catalogo
```

El panel Equipos no debe conocer consultas ni lógica interna del Catálogo.

### Acción Volver

Destino:

```txt
/engrase/filtros
```

Reglas:

- icono `ArrowLeft` y nombre accesible;
- `cursor-pointer`;
- target mínimo `32px` desktop y `44px` mobile;
- no reiniciar manualmente el store de la vista anterior;
- usar historial solo si el destino previo pertenece a Engrase; en otro caso navegar a `FiltrosEngrase`.

### Secciones internas

Identificadores estables:

```ts
type CatalogoEngraseSection =
  | "tipos-filtro"
  | "filtros"
  | "aceites"
  | "sistemas";
```

Orden obligatorio:

```txt
Tipos de filtro → Filtros → Aceites → Sistemas
```

La URL es la fuente de verdad de la sección activa. Rutas reservadas:

```txt
/engrase/filtros/catalogo/tipos-filtro
/engrase/filtros/catalogo/filtros
/engrase/filtros/catalogo/aceites
/engrase/filtros/catalogo/sistemas
```

La ruta base redirige de forma determinista a `tipos-filtro`. Mientras una sección no tenga spec propio, muestra el estado temporal de la sección 11.

## 6. Permisos

No crear permisos ni reutilizar `module_catalog`.

Aplicar:

```txt
module_engrase
ver_filtros_engrase
editar_filtros_engrase
```

- Los dos primeros mantienen acceso al módulo padre.
- `editar_filtros_engrase` controla `Ver catálogo` y el acceso directo al Catálogo en esta primera definición.
- Ocultar el botón no sustituye la protección de ruta.
- No mostrar el shell mientras se resuelven permisos.
- Permitir modo de solo lectura en el futuro requiere otro spec; no inferirlo aquí.

## 7. Mapa de componentes

```txt
CatalogoEngraseView
├── CatalogoEngraseHeader
│   ├── acción Volver
│   └── título contextual
├── CatalogoEngraseNavigation
│   ├── tabs desktop/tablet
│   └── selector mobile
└── CatalogoEngraseSectionShell
    └── RouterView o contenido temporal
```

### `CatalogoEngraseView`

- Superficie delgada de composición.
- Conecta navegación y sección activa.
- No consulta Supabase.
- No transforma colecciones.
- No contiene markup de tablas, cards, formularios o drawers.

### `CatalogoEngraseHeader`

- Presenta contexto y retorno.
- No conoce stores de datos.
- Emite `back`.

### `CatalogoEngraseNavigation`

- Recibe configuración tipada y sección activa.
- Usa enlaces de router o emite `select-section`.
- No contiene reglas particulares de una pestaña.

### `CatalogoEngraseSectionShell`

- Reserva el área de contenido sin imponer columnas.
- Presenta estados estructurales comunes.
- Permite que cada pestaña defina toolbar, listado y detalle.

## 8. Archivos previstos

```txt
src/router/index.ts
src/views/engrase/catalogo/CatalogoEngraseView.vue
src/components/engrase/catalogo/CatalogoEngraseHeader.vue
src/components/engrase/catalogo/CatalogoEngraseNavigation.vue
src/components/engrase/catalogo/CatalogoEngraseSectionShell.vue
src/components/engrase/filtros/EquiposEngrasePanel.vue
src/views/engrase/FiltrosEngraseView.vue
src/stores/dbequipos/engrase/catalogo/catalogoEngrase.types.ts
```

En esta fase, `catalogoEngrase.types.ts` contiene solo tipos estructurales de navegación. No declarar items, filtros, impacto o payloads.

## 9. Composición visual

```txt
┌──────────────────────────────────────────────────────────┐
│ Volver  Catálogo de filtros y engrase                    │
├──────────────────────────────────────────────────────────┤
│ Tipos de filtro | Filtros | Aceites | Sistemas           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Área de contenido de la sección activa                   │
│ definida posteriormente por su propio spec               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

El panel derecho de Detalles visible en las imágenes no pertenece al shell general. Cada pestaña decidirá después cuándo se abre y qué contiene.

### Superficies

- Fondo coherente con `bg-second`.
- Superficie principal blanca o `#FAF9F5`, con borde suave.
- Sombra ligera y radio `rounded-md` o `rounded-lg`.
- Sin hero, KPIs globales ni introducciones extensas.

### Dimensiones

- Usar todo el ancho útil de `DefaultLayout`.
- Mantener `min-w-0` en flex/grid.
- Mantener `min-h-0` cuando luego exista scroll interno.
- No bloquear el scroll natural mobile.
- No copiar anchos fijos de las imágenes de `1672px`.

## 10. Densidad ERP y responsive

### Desktop: desde `1024px`

```txt
texto base: 12px–13px (`text-xs` / `text-sm`)
título: 16px–18px semibold/bold
tabs: 12px–13px
header: 44px–52px
barra de tabs: 36px–40px
padding exterior: 12px–16px
gap principal: 8px–12px
radio: 6px–8px
```

Los controles futuros usarán normalmente `32px`–`36px`. No usar escala de landing page ni espaciado excesivo.

### Tablet: `640px`–`1023px`

- Mantener tabs si caben sin truncamiento.
- Reducir gaps antes de reducir legibilidad.
- No reservar un panel derecho fijo; los detalles futuros serán drawer.
- Mantener targets táctiles suficientes.

### Mobile: menor que `640px`

- Encabezado compacto en una fila.
- Botón Volver mínimo `44×44px`.
- Sustituir tabs por selector de sección de ancho completo o menú accesible.
- Mostrar claramente sección activa y opciones.
- No comprimir cuatro nombres ni producir scroll horizontal de página.
- Área de contenido en una columna.
- El shell no impone tabla mobile; cada pestaña definirá cards o filas apiladas.
- Reservar padding inferior para la navegación móvil global.

La tipografía permanece `text-sm`, pero los targets son mayores que el contenido visual. Densidad compacta no significa targets pequeños.

## 11. Estados del shell

### Sección pendiente

Mientras una pestaña no tenga implementación propia:

```txt
[icono Library o Construction]
{Nombre de sección}
Esta sección se implementará en una entrega posterior.
```

- Mensaje breve y sin registros simulados.
- Sin botones `Nuevo`, `Guardar`, `Editar` o `Reintentar`.
- Sin tabla vacía que parezca una respuesta real.
- Sin consultas a Supabase.
- Usar `role="status"` solo si el estado cambia dinámicamente.

### Carga futura

El shell admite prop o slot de carga, pero no la activa artificialmente.

- Reservar espacio para evitar saltos.
- Mostrar skeleton solo después de una carga real.
- No mostrar carga y vacío al mismo tiempo.
- Usar `aria-busy="true"` en el contenedor.

### Error futuro

El shell debe admitir título, descripción recuperable y acción `Reintentar`. La gestión concreta pertenece a cada pestaña.

## 12. Interacciones y cursores

Todo elemento interactivo habilitado declara `cursor-pointer`:

```txt
botón Volver
tab o enlace de sección
trigger del selector mobile
opciones del selector mobile
botón Reintentar futuro
cualquier fila, chip o icono interactivo futuro
```

| Estado | Cursor | Comportamiento |
|---|---|---|
| Habilitado | `cursor-pointer` | Hover, focus y pressed visibles |
| Cargando | `cursor-wait` | Sin doble activación |
| Deshabilitado | `cursor-not-allowed` | `disabled` y `aria-disabled` si aplica |
| Texto | normal | No aparenta interacción |

No asignar `cursor-pointer` a superficies no clickeables.

## 13. Accesibilidad

- Usar `nav` con nombre accesible.
- Desktop/tablet: usar enlaces con `aria-current="page"` o un `tablist` completo; no mezclar patrones.
- Si se usa `tablist`, implementar `tab`, `aria-selected`, `aria-controls` y flechas.
- Mobile: etiqueta visible `Sección del catálogo`; no depender de placeholder.
- Volver conserva texto visible cuando haya espacio y siempre tiene `aria-label`.
- Foco visible y contraste AA.
- La sección activa no depende solo de una línea verde.
- Respetar `prefers-reduced-motion`.
- Transiciones de `150ms`–`200ms`, solo con opacidad/transform.

## 14. Estado Vue y flujo de datos

Usar:

```txt
Vue 3
Composition API
<script setup lang="ts">
props y emits tipados
estado fuente mínimo
computed para derivaciones
```

- La URL es la fuente de verdad de la sección.
- No duplicar la sección activa en Pinia.
- No sincronizar dos estados equivalentes mediante watchers.
- La configuración de navegación es estática y tipada.
- Props hacia abajo y eventos hacia arriba.
- No crear store para abrir/cerrar el selector mobile.
- Los stores por pestaña se definen después, solo si son necesarios.

## 15. Integración progresiva

```txt
SPEC general
  ↓
shell con cuatro destinos y placeholders honestos
  ↓
spec de una pestaña
  ↓
reemplazo exclusivo de su placeholder
  ↓
las demás permanecen pendientes
```

Cada pestaña futura será responsable de:

```txt
types de dominio
service y mapper
store/composable si aplica
toolbar
listado desktop
presentación mobile
detalle y formulario
confirmación
estados y pruebas
```

El shell solo provee navegación, encabezado, contenedor, responsive transversal y estados comunes.

## 16. No hacer

- No consultar ni verificar Supabase.
- No crear migraciones, SQL ni RPC.
- No copiar datos de las imágenes como mock permanente.
- No construir tablas, cards, filtros o detalles.
- No crear formularios ni modal de confirmación.
- No enlazar con `/catalogo`.
- No convertir `FiltrosEngraseView.vue` en mega componente.
- No usar escala visual `lg` predominante.
- No reducir targets mobile a `32px`.
- No usar tabla comprimida mobile.
- No dejar controles clickeables sin `cursor-pointer`.
- No usar `div` clickeable cuando corresponda `button` o `RouterLink`.

## 17. Pruebas mínimas

### Routing y permisos

- `Ver catálogo` abre la ruta base.
- La ruta base redirige a la sección inicial.
- Recargar conserva la sección activa.
- Volver regresa a `/engrase/filtros`.
- Sin permisos no existe acceso ni ruta directa.
- Nunca se confunde con `/catalogo`.

### Responsive

Verificar:

```txt
320px
375px
640px
768px
1024px
1440px
```

- Sin scroll horizontal de página.
- Mobile usa selector y no tabs comprimidos.
- El contenido no queda bajo la navegación inferior.
- Desktop conserva densidad ERP.

### Interacción y accesibilidad

- Toda acción habilitada muestra `cursor-pointer`.
- Navegación completa por teclado.
- Foco visible.
- Sección activa anunciada.
- Escape cierra el menú mobile.
- Al seleccionar, el foco vuelve al trigger o al encabezado de contenido.
- Reduced motion elimina movimiento no esencial.

## 18. Criterios de aceptación

- Existe ruta propia dentro de Engrase/Filtros.
- `Ver catálogo` abre esa ruta, no el Catálogo global.
- La vista tiene encabezado compacto, retorno y cuatro destinos ordenados.
- La URL representa la sección activa.
- Desktop/tablet usan navegación compacta; mobile usa selector táctil.
- No existe implementación funcional de pestañas.
- Cada sección pendiente muestra un placeholder explícito, no datos ficticios.
- No se llama a Supabase.
- La vista de ruta es delgada y los componentes están separados.
- Cada placeholder puede sustituirse de forma independiente.
- Predominan medidas `xs/sm` sin sacrificar targets mobile.
- Todo control clickeable habilitado usa `cursor-pointer`.

