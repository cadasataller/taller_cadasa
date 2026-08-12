# SPEC-03 — Toolbar y tabla desktop ERP

## Objetivo

Construir el listado desktop de Tipos de filtro siguiendo la composición de la imagen y la densidad de un ERP.

## Dependencias

Implementar después de `SPEC-02` y del shell general.

## Archivos

```txt
src/views/engrase/catalogo/CatalogoTiposFiltroSection.vue
src/components/engrase/catalogo/tipos-filtro/TiposFiltroToolbar.vue
src/components/engrase/catalogo/tipos-filtro/TiposFiltroTable.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroEstadoBadge.vue
src/components/engrase/catalogo/tipos-filtro/TiposFiltroListState.vue
```

## Mapa de componentes

```txt
CatalogoTiposFiltroSection
├── TiposFiltroToolbar
├── encabezado de resultados
├── TiposFiltroTable (desktop)
└── TiposFiltroListState
```

La vista de sección consume `useCatalogoTiposFiltro()` y conecta props/emits. No llama servicios ni contiene filtrado inline.

## Toolbar

Orden desktop:

```txt
[Buscar por nombre] [Estado] [Nuevo tipo de filtro] [Limpiar filtros]
```

### Búsqueda

- Label accesible: `Buscar tipo de filtro`.
- Placeholder: `Buscar por nombre`.
- Icono `Search` decorativo.
- Aplica filtro local al escribir.
- Botón de limpiar dentro del campo solo cuando existe texto.
- `autocomplete="off"` y sin botón submit.

### Estado

Opciones:

```txt
Activos
Desactivados
Todos
```

Label accesible visible o asociada: `Estado`.

### Nuevo tipo de filtro

- Acción primaria de la toolbar.
- Icono `Plus` y texto completo.
- Emite `create`.
- No guarda directamente.
- `cursor-pointer` y feedback hover/focus/pressed.

### Limpiar filtros

- Icono `Eraser` y texto.
- Restaura activos, búsqueda vacía y orden nombre asc.
- Deshabilitado cuando no hay cambios respecto del estado inicial.
- Habilitado: `cursor-pointer`.
- Deshabilitado: `cursor-not-allowed`.

## Dimensiones desktop

```txt
toolbar gap: gap-2 o gap-3
controles: h-8 o h-9
input búsqueda: min 240px, flexible hasta 420px
select estado: 150px–190px
botones: px-3, text-xs o text-sm
iconos: h-4 w-4
```

No usar botones de `44px`–`48px` en desktop salvo que el componente base lo requiera por accesibilidad.

## Encabezado de resultados

Mostrar:

```txt
Tipos de filtro
N resultados
```

- Título `text-sm font-bold` o equivalente.
- Conteo `text-xs` y `aria-live="polite"`.
- El conteo corresponde a `itemsVisibles.length`.
- No mostrar el resumen global como KPI cards.

## Tabla

Visible desde `md` o el breakpoint en que las tres columnas tengan lectura cómoda. No renderizarla en mobile.

Columnas:

```txt
selección/icono | Nombre | Estado | Resumen de uso | abrir
```

La semántica de negocio visible se limita a:

```txt
Nombre
Estado
Resumen de uso
```

### Nombre

- Mostrar `item.nombre`.
- `font-semibold text-xs/sm`.
- No renombrar a código o posición.
- Puede acompañarse de icono consistente de filtro; es decorativo.

### Estado

- Texto `Activo` o `Desactivado`.
- Acompañar color con texto y punto/icono.
- Activo usa tono semántico positivo del sistema.
- Desactivado usa gris visible, no opacidad que vuelva ilegible la fila.

### Resumen de uso

Mostrar:

```txt
0 equipos
1 equipo
N equipos
```

Usar `Intl.NumberFormat("es")` y cifras tabulares. No mostrar tipos de equipo dentro de la fila.

### Selección

- La fila completa es seleccionable con mouse/touch y usa `cursor-pointer`.
- Debe responder a Enter y Space.
- Comunicar selección mediante `aria-selected` y un indicador visual adicional al color.
- El chevron final refuerza la acción de abrir Detalles.
- No exigir pulsar un radio pequeño.
- La fila seleccionada mantiene resaltado suave, sin cambiar altura.

Si se mantiene el círculo visual de la imagen, debe ser decorativo o formar parte de un control accesible con target suficiente; no crear dos focos que hagan la misma acción.

## Ordenamiento

Encabezados ordenables:

```txt
Nombre
Estado
Resumen de uso
```

- Botón real dentro de `th`.
- `cursor-pointer`.
- Icono `ArrowUpDown`, `ArrowUp` o `ArrowDown`.
- `aria-sort` en la columna activa.
- Repetir click alterna dirección.
- No ordenar al seleccionar una fila.

## Densidad de tabla

```txt
thead: 32px–36px
fila: 44px–52px
texto: text-xs predominante; text-sm para nombre si es necesario
padding: px-3 py-2
borde: border-gray-200 o token existente
radio del contenedor: rounded-md/lg
sombra: shadow-sm
```

Objetivo: mostrar aproximadamente 8–12 filas en un viewport desktop común, según altura disponible.

## Estados

### Cargando

- Skeleton de toolbar y 6–8 filas.
- Mantener anchos de columnas para evitar salto.
- No mostrar datos anteriores como actuales si es carga inicial.

### Error inicial

- Mensaje compacto dentro del área de resultados.
- Acción `Reintentar` con `cursor-pointer`.
- No ocultar el shell general.

### Catálogo vacío

```txt
No hay tipos de filtro registrados.
[Nuevo tipo de filtro]
```

### Sin resultados por filtros

```txt
No encontramos tipos de filtro con los filtros actuales.
[Limpiar filtros]
```

No confundir catálogo vacío con filtro sin coincidencias.

## Footer

Mostrar:

```txt
Mostrando N de M tipos de filtro
```

No implementar paginación mientras el contrato entregue el conjunto completo.

## Criterios de aceptación

- La toolbar mantiene orden y acciones de la referencia.
- La tabla solo muestra nombre, estado y resumen de uso.
- Todos los filtros y ordenamientos son locales.
- La fila abre Detalles sin otra consulta.
- La UI desktop usa escala `xs/sm` y filas compactas.
- Todo control habilitado y clickeable usa `cursor-pointer`.
- Carga, error, vacío y sin resultados son distinguibles.

