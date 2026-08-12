# SPEC-03 — Toolbar y tabla desktop ERP

## Objetivo

Construir el listado desktop según la referencia, con densidad ERP y sin exponer relaciones en las filas.

## Dependencias

Implementar después de `SPEC-02` y del shell general.

## Archivos

```txt
src/views/engrase/catalogo/CatalogoFiltrosSection.vue
src/components/engrase/catalogo/filtros/FiltrosToolbar.vue
src/components/engrase/catalogo/filtros/FiltrosTable.vue
src/components/engrase/catalogo/filtros/FiltroComprasBadge.vue
src/components/engrase/catalogo/filtros/FiltroEstadoBadge.vue
src/components/engrase/catalogo/filtros/FiltrosListState.vue
```

## Mapa

```txt
CatalogoFiltrosSection
├── FiltrosToolbar
├── encabezado de resultados
├── FiltrosTable (desktop)
└── FiltrosListState
```

La sección consume `useCatalogoFiltros()` y conecta props/emits. No llama servicios ni filtra en el template.

## Toolbar

Orden desktop:

```txt
[Buscar por código] [Tipo de filtro] [En compras] [Estado] [Nuevo filtro] [Limpiar filtros]
```

Puede envolver en dos líneas antes de comprimir controles o provocar overflow.

### Búsqueda

- Label accesible: `Buscar filtro por código`.
- Placeholder: `Buscar por código`.
- Icono `Search` decorativo.
- Filtrado local al escribir, sin submit ni request.
- Limpiar dentro del campo solo cuando tenga texto.
- `autocomplete="off"`.

### Tipo de filtro

- Opciones derivadas de `items[].tiposFiltro`, no de una consulta nueva.
- Primera opción: `Todos los tipos`.
- Filtra por relación existente; no asigna ni edita el tipo.
- Label accesible: `Tipo de filtro relacionado`.

### En compras

```txt
Todos
En compras
Fuera de compras
```

Label accesible: `Estado en lista de compras`.

### Estado

```txt
Activos
Desactivados
Todos
```

### Acciones

- `Nuevo filtro`: primario, icono `Plus`, emite `create`.
- `Limpiar filtros`: icono `Eraser`, restaura defaults completos.
- Limpiar queda deshabilitado cuando no hay cambios.
- Habilitado: `cursor-pointer`; deshabilitado: `cursor-not-allowed`.

## Dimensiones

```txt
toolbar: gap-2 o gap-3
controles: h-8/h-9
búsqueda: min 220px; flexible hasta 360px
selects: 140px–180px
botones: px-3 text-xs/text-sm
iconos: h-4 w-4
```

## Resultados

Mostrar:

```txt
Filtros
N resultados
```

Conteo `text-xs` con `aria-live="polite"`. No usar tarjetas KPI; el resumen global permanece en datos para lógica y futuros usos.

## Tabla definitiva

Columnas:

```txt
selección/icono | Código | En compras | Estado | Resumen de uso | abrir
```

La semántica visible se limita a:

```txt
Código
En compras
Estado
Resumen de uso
```

No mostrar `tiposFiltro`, tipos de equipo, nombre, marca ni equivalencias.

### Código

- `font-semibold text-xs/sm`.
- Conservar el valor retornado y permitir wrap controlado; nunca truncar sin tooltip accesible.
- Icono `Droplet` o `Filter` solo decorativo y consistente con el sistema.

### En compras

- Badge textual `Sí` o `No`.
- El significado no depende únicamente de color.

### Estado

- `Activo` o `Desactivado` con texto y punto/icono.
- Desactivado sigue siendo legible; no bajar opacidad de toda la fila.

### Resumen de uso

Mostrar dos líneas compactas como en la referencia:

```txt
Equipos                 18
Total asignaciones      20
```

Usar `Intl.NumberFormat("es")`, cifras tabulares y mantener la diferencia conceptual: equipos distintos frente a relaciones.

## Selección

- Toda la fila abre detalle, usa `cursor-pointer` y responde a Enter/Space.
- `aria-selected` y resaltado/indicador no dependiente solo de color.
- Chevron final decorativo o integrado en la única acción.
- No crear radio y fila como dos focos equivalentes.
- Seleccionar no dispara una consulta.

## Ordenamiento

Headers ordenables:

```txt
Código
En compras
Estado
Resumen de uso
```

En `Resumen de uso`, un control accesible permite elegir/alternar `equipos` y `asignaciones`; no ocultar qué métrica está activa. Cada encabezado usa botón real, `cursor-pointer`, icono y `aria-sort`.

## Densidad

```txt
thead: 32px–36px
fila: 52px–64px por las dos líneas de uso
texto predominante: text-xs
padding: px-3 py-2
contenedor: rounded-md/lg border shadow-sm
```

Objetivo: 8–12 filas visibles en desktop común si la altura disponible lo permite.

## Estados

- Carga: skeleton de toolbar y 6–8 filas conservando anchos.
- Error inicial: mensaje compacto y `Reintentar`.
- Catálogo vacío: `No hay filtros registrados.` + `Nuevo filtro`.
- Sin coincidencias: explicación + `Limpiar filtros`.
- No confundir vacío real con filtros sin resultados.

Footer:

```txt
Mostrando N de M filtros
```

No implementar paginación mientras el contrato cargue el conjunto completo.

## Criterios de aceptación

- Los seis controles de toolbar existen y filtran localmente.
- La fila solo muestra campos propios y conteos de uso.
- Tipos relacionados se omiten de la fila.
- Apertura sin request y ordenamiento accesible.
- Escala `xs/sm`, layout compacto y cursores correctos.
- Carga, error, vacío y sin resultados son distinguibles.

