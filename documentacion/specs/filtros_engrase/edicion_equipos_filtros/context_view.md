# Vista de edición de equipos

## Objetivo

Permitir editar un equipo de Engrase en una pantalla completa y guardar todos los cambios mediante una sola operación.

## Apertura

La edición se abre desde la vista principal de equipos mediante la acción **Editar equipo**.

En escritorio y móvil se utiliza una pantalla completa. Los formularios secundarios se abren dentro de esta pantalla:

- Escritorio: drawers laterales.
- Móvil: bottom sheets.

## Controles de selección

Los campos de catálogo de esta funcionalidad deben usar la librería `vue-multiselect` compatible con Vue 3 como control base, manteniendo adaptadores locales estrictamente tipados para no propagar tipos abiertos de la dependencia.

Se utiliza en:

- tipo de equipo: selección simple con búsqueda local;
- modelo o subtipo: sugerencias locales y entrada libre mediante modo `taggable`, sin crear una entidad de catálogo;
- etapas: selección múltiple con búsqueda local;
- tipo de filtro: selección simple con búsqueda local;
- sistema de aceite: selección simple, búsqueda local y creación temporal mediante `taggable`;
- aceite: selección simple, búsqueda local y creación temporal mediante `taggable`.

Reglas:

- `label` muestra el nombre legible y `track-by` usa una clave estable basada en ID o `temp_id`;
- las entidades nuevas generadas por `@tag` sólo se agregan al borrador y nunca se insertan inmediatamente;
- el tipo de equipo no usa `taggable` en el formulario principal porque se crea mediante su drawer dedicado;
- el tipo de filtro usa `taggable` únicamente en el flujo que permite crear o asociar un tipo nuevo;
- una etiqueta libre de subtipo representa sólo texto y no crea una entidad temporal;
- las opciones bloqueadas deben mapearse a `$isDisabled: true`, que es la marca de opción deshabilitada de `vue-multiselect`, y explicar la razón;
- los menús dentro de drawers y bottom sheets deben usar el soporte `useTeleport` hacia `body`, con una clase de contenido y `z-index` controlados para no quedar recortados;
- el CSS base de `vue-multiselect` se importa una sola vez y se adapta exclusivamente a los tokens visuales de `src/index.css`;
- el componente debe ser operable con teclado, conservar foco visible y mostrar mensajes vacíos y sin resultados en español;
- no usar `vue-multiselect` para código del equipo, búsqueda exacta de código original, estado del equipo, cantidad ni archivos de imagen.

## Tema cromático principal

El bloque `@theme` de `src/index.css` es la única fuente de verdad para colores, tipografía, sombras y radios. Sólo se consideran las declaraciones incluidas dentro de ese bloque. No copiar sus valores hexadecimales a componentes ni crear una paleta paralela.

Usar las utilidades Tailwind generadas por `@theme` o, cuando una integración de terceros exija CSS, las mismas variables `var(--color-*)`:

- `main`, `main-light` y `main-dark`: texto principal fuerte, encabezados y acciones primarias;
- `accent`, `accent-light` y `accent-dark`: foco, selección y énfasis interactivo;
- `second`, `second-dark` y `second-deep`: fondo de vista, superficies, divisores y bordes;
- `gray-50` a `gray-900`: jerarquía neutral de texto y superficies auxiliares;
- `success`/`success-bg`, `warning`/`warning-bg`, `danger`/`danger-bg` e `info`/`info-bg`: estados semánticos y sus fondos.

Aplicaciones mínimas:

- vista: `bg-second text-gray-900`;
- tarjetas, drawers y bottom sheets: `bg-white` o `bg-second`, borde `border-second-deep` y sombras `shadow-sm`/`shadow-md` del tema;
- acción primaria: `bg-main text-white`, con hover/focus basado en `main-light`, `main-dark` o `accent` según el patrón existente;
- acción secundaria: superficie `second`/`second-dark`, texto `main` y borde `second-deep`;
- acción destructiva: `danger` y `danger-bg`;
- avisos y estados: el par semántico correspondiente, siempre con icono o texto además del color;
- foco: anillo visible basado en `accent` y con contraste suficiente.

Queda prohibido en los archivos de esta funcionalidad:

- agregar colores hex, RGB, HSL u otros valores cromáticos literales;
- usar colores arbitrarios de Tailwind, como `bg-[#...]`;
- usar paletas ajenas al tema para resolver rápidamente un estado (`blue-*`, `red-*`, `slate-*`, etc.);
- redefinir los tokens de `src/index.css` dentro de un componente.

Se permiten modificadores de opacidad sobre tokens del tema, por ejemplo `bg-main-dark/40`, siempre que el contraste resultante sea accesible.

### Tema en overlays y menús teletransportados

Drawers, bottom sheets, diálogos, backdrops y menús teletransportados usan los mismos tokens base de `@theme`. Los menús de `vue-multiselect` pueden teletransportarse a `body` y deben recibir una `content-wrapper-class` propia para aplicar su estilo sin quedar limitados por el CSS `scoped` del componente.

La personalización global de esa clase usa `var(--color-second)`, `var(--color-gray-900)`, `var(--color-second-deep)`, `var(--color-accent)`, `var(--shadow-md)` y `var(--radius-md)` definidos en `@theme`. Debe cubrir estados normal, hover, seleccionado, foco, deshabilitado, inválido, vacío y sin resultados. El `z-index` del menú queda por encima del panel, pero dentro de la capa modal. No duplicar valores de color ni estilos base en cada drawer.

## Escala visual compacta tipo ERP

La vista debe sentirse como una herramienta operativa de alta densidad, no como una landing page ni como una interfaz móvil sobredimensionada. `xs` y `sm` en esta sección se refieren a tamaños tipográficos de Tailwind (`text-xs` y `text-sm`), no a breakpoints.

### Tipografía

- `text-sm` (14 px) es el tamaño predeterminado para valores, contenido general, inputs, selects, filas y botones con texto en escritorio.
- `text-xs` (12 px) es el tamaño mínimo permitido y se reserva para labels, ayudas, badges, estados, metadatos y acciones secundarias compactas.
- No usar tamaños inferiores a 12 px, incluidos `text-[10px]` o valores arbitrarios equivalentes.
- `text-base` (16 px) se usa para títulos de sección y para inputs/selectores en móvil, evitando zoom automático del navegador.
- `text-lg` (18 px) se reserva para el título principal o código destacado del equipo.
- No usar `text-xl` o superiores dentro de esta funcionalidad salvo una decisión visual posterior explícita.

### Densidad y altura

- En escritorio, inputs, selectores y botones de formulario deben tener una altura visual compacta de 36 a 40 px.
- En móvil y dispositivos táctiles deben alcanzar un área interactiva mínima de 44 × 44 px.
- Un botón de icono puede mostrar un icono de 14 a 16 px, pero debe conservar un área interactiva accesible.
- Las filas operativas deben priorizar lectura horizontal compacta en escritorio y reorganizarse en bloques en móvil, sin reducir el texto debajo de `text-xs`.
- El contenido nunca se comprime hasta provocar solapamiento, truncado irreversible o scroll horizontal.

### Espaciado y superficies

- Usar una escala de 4/8 px: `gap-1`, `gap-2`, `gap-3`, `p-2`, `p-3` y `p-4` según jerarquía.
- El espaciado normal entre controles relacionados es `gap-2`; entre grupos o secciones es `gap-3` o `gap-4`.
- Las tarjetas operativas usan normalmente `p-3` en móvil y `p-3`/`p-4` en escritorio.
- Evitar espacios verticales decorativos grandes, tarjetas gigantes y radios excesivos.
- Usar `rounded-md` o `rounded-lg`, bordes sutiles y sombras discretas coherentes con el módulo.
- Los drawers y bottom sheets deben mantener la misma densidad; no agrandar controles por ser overlays.

### Responsive

- Por debajo del breakpoint `sm`, los campos se apilan cuando ya no caben, pero conservan la jerarquía `text-sm`/`text-xs`.
- En móvil, inputs y búsquedas de `vue-multiselect` usan al menos 16 px; labels, ayudas y badges pueden permanecer en 12 px.
- La densidad ERP no justifica objetivos táctiles pequeños, falta de foco visible ni pérdida de contraste.

## Secciones de la pantalla

### Datos del equipo

Permite modificar:

- Código.
- Tipo de equipo.
- Modelo o subtipo.
- Estado.
- Una o más etapas.

El tipo de equipo puede ser existente o nuevo. Un tipo nuevo no se guarda inmediatamente; queda en estado local hasta guardar toda la edición.

El modelo corresponde directamente al campo `subtipo`.

### Filtros del equipo

Muestra los filtros actualmente asignados con:

- Tipo de filtro.
- Código original.
- Cantidad.
- Estado en lista de compras.
- Acción para quitar.

Debe mantenerse como mínimo un filtro.

Al quitar un filtro, no se elimina de la base inmediatamente. Se marca como pendiente de eliminación y puede deshacerse antes de guardar.

### Aceites asociados

Permite:

- Agregar un aceite.
- Cambiar un aceite.
- Quitar un aceite.
- Usar sistemas o aceites existentes.
- Crear sistemas o aceites nuevos de forma temporal.

Los cambios se procesan únicamente al guardar la edición.

## Drawers internos

### Nuevo tipo de equipo

Permite escribir un nuevo tipo de equipo.

El nuevo valor:

- Se mantiene localmente.
- Se selecciona en el formulario principal.
- Se crea dentro de la RPC al guardar.
- No genera una inserción inmediata.

### Agregar filtro

La búsqueda se realiza únicamente por código original.

Cuando el código existe, muestra:

- Código.
- Estado en lista de compras.
- Tipos de filtro relacionados.
- Tipos de equipo donde se utiliza.
- Si el equipo ya tiene asignado ese tipo.

Después se define la cantidad y se agrega al borrador local.

### Crear filtro nuevo

Se utiliza cuando el código original no existe.

Permite indicar:

- Código.
- Tipo de filtro existente o nuevo.
- Estado en lista de compras.
- Cantidad.

Si el tipo de filtro es nuevo, también queda pendiente hasta guardar.

### Agregar aceite

Permite seleccionar o crear temporalmente:

- Sistema.
- Aceite.

Todos los sistemas y aceites disponibles se cargan previamente y la búsqueda se realiza en el frontend.

### Cambiar imagen

La imagen se administra en un drawer independiente de la edición general.

Permite:

- Agregar imagen.
- Reemplazar imagen.
- Eliminar imagen.

El archivo se administra en Supabase Storage y la RPC actualiza únicamente el registro de imagen y devuelve los campos necesarios para actualizar el store.

## Guardado

Al presionar **Guardar cambios**:

- Se envían solo los datos modificados.
- Las etapas se agrupan en agregadas y eliminadas.
- Los filtros se agrupan en nuevos, actualizados y eliminados.
- Los aceites se agrupan en nuevos, actualizados y eliminados.
- Los elementos nuevos incluyen su estado interno.
- Todo se procesa dentro de una sola transacción.

La respuesta devuelve `equipo_lista`, compatible con `EquipoEngraseListItem`, para reemplazar directamente el equipo actualizado en el store.
