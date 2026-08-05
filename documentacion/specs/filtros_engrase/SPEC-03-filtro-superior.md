# SPEC-03 — Filtro superior

## Objetivo

Implementar el bloque superior de búsqueda y filtrado que controla el listado de equipos.

## Dependencia

Implementar después de `SPEC-02`.

## Archivos a crear

```txt
src/components/engrase/filtros/FiltrosEngraseToolbar.vue
src/components/engrase/filtros/FiltroCodigoAutocomplete.vue
```

Unificar ambos archivos solamente si el autocomplete sigue siendo pequeño y claramente testeable.

## Campos

```txt
Buscar por código de filtro
Tipo de equipo
Modelo
Etapa
Tipo de filtro
Estado
```

Cambios terminológicos confirmados:

- No usar `Grupo de equipos`.
- Mostrar **Tipo de equipo**.
- Mostrar **Modelo** para el dato `subtipo`.

## Contrato del componente

Props sugeridas:

```txt
filters
tiposEquipo
tiposFiltro
etapas
sugerenciasCodigo
loading
loadingSugerencias
```

Emits sugeridos:

```txt
update-filters
search-code-suggestions
select-code-suggestion
clear-code
```

## Autocomplete de código

- El texto libre busca sugerencias parciales, no resultados finales.
- Longitud mínima recomendada: 2 caracteres.
- Debounce recomendado: 250–350 ms.
- Mostrar el código preservando capitalización.
- Identificar visualmente `Original` y `Equivalente` cuando aplique.
- Usar navegación con flechas, Enter, Escape y selección por clic/tap.
- Al seleccionar una sugerencia:
  1. establecer su código como valor seleccionado;
  2. cerrar sugerencias;
  3. ejecutar búsqueda exacta;
  4. mostrar una forma clara de limpiar la selección.
- Presionar Enter solo ejecuta búsqueda exacta cuando existe una sugerencia activa o una coincidencia exacta validada.
- Si el usuario modifica el texto seleccionado, volver al modo de sugerencias y retirar el filtro exacto anterior.
- No ejecutar una búsqueda definitiva con `%texto%`.

## Filtros

- `Tipo de equipo` usa `tipo_equipo_id`.
- `Modelo` filtra el campo `subtipo`; puede ser texto o selector derivado, pero debe admitir valores nulos.
- `Etapa` usa `etapa_id`; ofrecer opción `Sin etapa` si se requiere encontrar equipos sin relaciones.
- `Tipo de filtro` usa `tipo_filtro_id`.
- `Estado` inicia en `activo`.
- Debe existir una opción explícita para ver `descartado`.
- No eliminar ni reinterpretar los descartados.
- Los filtros combinan entre sí con semántica AND.

## Diseño desktop

- Mantener la jerarquía y lenguaje visual del mockup.
- Barra compacta dentro de una superficie clara.
- Labels visibles; no depender únicamente de placeholders.
- Controles alineados y sin saltos al cargar.
- El autocomplete debe superponerse sin desplazar los paneles inferiores.

## Diseño móvil

- Distribuir controles en una columna legible o en bloque expandible.
- Áreas táctiles mínimas de 44 px.
- El autocomplete debe caber en el viewport.
- No comprimir todos los campos en una sola fila horizontal.

## Accesibilidad

- Autocomplete con semántica de combobox/listbox.
- Asociar labels e inputs.
- Indicar carga sin bloquear lectores de pantalla.
- Estados de foco visibles.
- Botones de estado no dependen solo del color.

## No hacer

- No llamar al store o Supabase desde componentes presentacionales si la vista/composable ya orquesta.
- No incluir acciones de creación o edición.
- No mostrar fabricantes.
- No renombrar columnas de BD.

## Criterios de aceptación

- El label dice Tipo de equipo y subtipo se presenta como Modelo.
- Activos es la selección inicial.
- Puede elegirse Descartados.
- El texto produce sugerencias parciales.
- Seleccionar sugerencia produce búsqueda exacta.
- La selección exacta puede limpiarse.
- Todos los filtros pueden combinarse.

