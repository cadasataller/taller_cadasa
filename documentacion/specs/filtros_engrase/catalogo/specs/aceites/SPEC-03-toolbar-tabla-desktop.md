# SPEC-03 — Toolbar y tabla desktop ERP

## Objetivo

Construir el listado desktop de Aceites según la composición visual y las correcciones del dominio.

## Dependencias

Implementar después de `SPEC-02` y del shell general.

## Archivos

```txt
src/views/engrase/catalogo/CatalogoAceitesSection.vue
src/components/engrase/catalogo/aceites/AceitesToolbar.vue
src/components/engrase/catalogo/aceites/AceitesTable.vue
src/components/engrase/catalogo/aceites/AceiteSystemsSummary.vue
src/components/engrase/catalogo/aceites/AceiteEstadoBadge.vue
src/components/engrase/catalogo/aceites/AceitesListState.vue
```

## Mapa

```txt
CatalogoAceitesSection
├── AceitesToolbar
├── encabezado de resultados
├── AceitesTable (desktop)
└── AceitesListState
```

La sección consume `useCatalogoAceites()` y conecta props/emits. No contiene llamadas ni transformaciones inline.

## Toolbar

Orden desktop:

```txt
[Buscar por nombre] [Sistema] [Estado] [En uso] [Nuevo aceite] [Limpiar filtros]
```

Puede envolver antes de comprimir o desbordar.

### Controles

- Búsqueda: label `Buscar aceite por nombre`, placeholder `Buscar por nombre de aceite`, local al escribir, `autocomplete="off"`.
- Sistema: `Todos los sistemas` + opciones relacionadas; solo filtra, nunca asigna.
- Estado: `Activos`, `Desactivados`, `Todos`.
- En uso: `Todos`, `En uso`, `Sin uso`.
- `Nuevo aceite`: acción primaria con `Plus`, emite `create`.
- `Limpiar filtros`: `Eraser`, restaura defaults y se deshabilita si no hay cambios.

Todo trigger/botón habilitado usa `cursor-pointer`; deshabilitado `cursor-not-allowed`.

## Dimensiones

```txt
toolbar: gap-2/gap-3
controles: h-8/h-9
búsqueda: min 230px; flexible hasta 380px
selects: 140px–180px
botones: px-3 text-xs/text-sm
iconos: h-4 w-4
```

## Encabezado

```txt
Aceites
N resultados
```

Conteo `text-xs` con `aria-live="polite"`. Sin KPI cards.

## Tabla definitiva

Columnas:

```txt
Nombre | Sistemas asociados | Estado | Resumen de uso | abrir
```

### Nombre

- Valor íntegro, `font-semibold text-xs/sm`.
- Icono `Droplet` decorativo.
- Wrap controlado; si se trunca, ofrecer nombre completo accesible.

### Sistemas asociados

- Mostrar `item.sistemas.slice(0, 2)` solo por nombre.
- Si sobran, mostrar botón/chip `+N`.
- No mostrar `cantidadEquipos` en la fila.
- `+N` abre una vista accesible compacta o el detalle; debe tener acción inequívoca y `cursor-pointer`.
- Si no hay sistemas: `Sin sistemas asociados`.

### Estado

- Texto `Activo` o `Desactivado` con punto/icono.
- No depender solo del color ni volver ilegible una fila desactivada.

### Resumen de uso

Dos líneas:

```txt
Equipos                 18
Total asignaciones      23
```

Usar `Intl.NumberFormat("es")` y cifras tabulares. Equipos son distintos; asignaciones son filas de relación.

## Selección

- Toda la fila abre Detalles con mouse, Enter y Space.
- `cursor-pointer`, `aria-selected` y señal adicional al color.
- Un solo foco principal por acción; chevron decorativo.
- No ejecutar request al seleccionar.

## Ordenamiento

Headers ordenables:

```txt
Nombre
Sistemas asociados
Estado
Resumen de uso
```

Para resumen, hacer explícita la métrica activa (`equipos` o `asignaciones`). Cada header usa botón real, icono, `cursor-pointer` y `aria-sort`.

## Densidad

```txt
thead: 32px–36px
fila: 52px–64px
texto predominante: text-xs
padding: px-3 py-2
contenedor: border rounded-md/lg shadow-sm
```

Objetivo: 8–12 filas visibles en un viewport común cuando la altura lo permita.

## Estados

- Skeleton de toolbar y 6–8 filas.
- Error inicial con `Reintentar`.
- Vacío: `No hay aceites registrados.` + `Nuevo aceite`.
- Sin coincidencias: explicación + `Limpiar filtros`.
- Footer: `Mostrando N de M aceites`.

No implementar paginación mientras la RPC entregue el conjunto completo.

## Criterios de aceptación

- Los seis controles existen y filtran localmente.
- La fila muestra máximo dos sistemas y `+N`, sin cantidades.
- No hay selector editable de sistema.
- Detalle abre sin request.
- Escala `xs/sm`, densidad ERP y cursores correctos.
- Estados de listado son distinguibles.

