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
- los menús dentro de drawers y bottom sheets deben usar el soporte `useTeleport` de la librería hacia `body`, con una clase de contenido y `z-index` controlados para no quedar recortados;
- el CSS base de `vue-multiselect` se importa una sola vez y se adapta a los tokens visuales existentes;
- el componente debe ser operable con teclado, conservar foco visible y mostrar mensajes vacíos y sin resultados en español;
- no usar `vue-multiselect` para código del equipo, búsqueda exacta de código original, estado del equipo, cantidad ni archivos de imagen.

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
