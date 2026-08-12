# SPEC-03 — Toolbar y tabla desktop ERP

## Objetivo

Construir el listado desktop compacto mostrado en la referencia.

## Dependencias

Implementar después de `SPEC-02` y del shell general.

## Archivos

```txt
src/views/engrase/catalogo/CatalogoSistemasSection.vue
src/components/engrase/catalogo/sistemas/SistemasToolbar.vue
src/components/engrase/catalogo/sistemas/SistemasTable.vue
src/components/engrase/catalogo/sistemas/SistemaEstadoBadge.vue
src/components/engrase/catalogo/sistemas/SistemasListState.vue
```

## Mapa

```txt
CatalogoSistemasSection
├── SistemasToolbar
├── encabezado de resultados
├── SistemasTable (desktop)
└── SistemasListState
```

La sección consume el composable; no llama servicios ni transforma colecciones en template.

## Toolbar

```txt
[Buscar por nombre] [Estado] [En uso] [Nuevo sistema] [Limpiar filtros]
```

- Búsqueda: label `Buscar sistema por nombre`, placeholder `Buscar por nombre de sistema`, local, `autocomplete="off"`.
- Estado: `Activos`, `Desactivados`, `Todos`.
- En uso: `Todos`, `En uso`, `Sin uso`.
- Nuevo sistema: primario, icono `Plus`, emite `create`.
- Limpiar: `Eraser`, restaura defaults y se deshabilita sin cambios.
- Toolbar envuelve antes de desbordar.

Habilitado `cursor-pointer`; deshabilitado `cursor-not-allowed`.

## Dimensiones

```txt
controles: h-8/h-9
gap: gap-2/gap-3
búsqueda: min 260px; flexible hasta 420px
selects: 150px–180px
botones: px-3 text-xs/text-sm
iconos: h-4 w-4
```

## Resultados

```txt
Sistemas
N resultados
```

Conteo `text-xs`, `aria-live="polite"`; sin KPI cards.

## Tabla

Columnas:

```txt
Nombre | Estado | Resumen de uso | abrir
```

### Nombre

- `text-xs/sm font-semibold`.
- Icono genérico `Cog`, `Settings2` o equivalente del sistema, siempre el mismo.
- No mapear Motor/Transmisión/Hidráulico a iconos por texto.

### Estado

- `Activo`/`Desactivado` con texto y punto/icono.
- No depender solo de color ni reducir opacidad de toda la fila.

### Resumen de uso

```txt
Equipos                 22
Total asignaciones      22
```

`Intl.NumberFormat("es")`, cifras tabulares y métricas conceptualmente separadas.

No mostrar aceites relacionados en la fila.

## Selección y orden

- Toda la fila abre detalle con mouse, Enter y Space.
- `cursor-pointer`, `aria-selected`, señal adicional al color.
- Un solo foco; chevron decorativo.
- Sin request al seleccionar.
- Headers ordenables: Nombre, Estado y Resumen de uso.
- Para Resumen explicitar si ordena equipos o asignaciones.
- Botón real en `th`, icono, `cursor-pointer`, `aria-sort`.

## Densidad/estados

```txt
thead: 32px–36px
fila: 52px–64px
texto predominante: text-xs
padding: px-3 py-2
contenedor: border rounded-md/lg shadow-sm
```

- Skeleton toolbar + 6–8 filas.
- Error con `Reintentar`.
- Vacío: `No hay sistemas registrados.` + Nuevo.
- Sin coincidencias + Limpiar.
- Footer: `Mostrando N de M sistemas`.
- Sin paginación mientras se cargue todo el conjunto.

## Criterios de aceptación

- Los cinco controles funcionan localmente.
- Tabla solo muestra nombre, estado y uso.
- Aceites quedan fuera de la fila.
- Icono genérico, sin inferencia por nombre.
- Apertura sin request, base `xs/sm` y cursores correctos.

