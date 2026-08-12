# Contexto actual de RPC para edición de equipos

## RPC de lectura

### `engrase.rpc_obtener_equipo_para_edicion`

Recibe:

- Código del equipo.

Devuelve:

- Datos generales.
- Tipo de equipo.
- Modelo o subtipo.
- Estado.
- Etapas.
- Filtros asignados.
- Cantidad de equivalencias.
- Aceites asociados.

Se utiliza para construir el borrador inicial de edición.

### `engrase.rpc_obtener_auxiliares_edicion_equipo`

Devuelve en una sola llamada:

- Tipos de equipo.
- Subtipos sugeridos.
- Etapas.
- Tipos de filtro.
- Tipos de equipo donde se utiliza cada tipo de filtro.
- Sistemas de aceite.
- Aceites.

Los aceites y sistemas se filtran localmente en el frontend.

### `engrase.rpc_buscar_filtro_original_para_asignar`

Busca únicamente por código original.

Recibe:

- Código del filtro.
- Código del equipo, opcional.

Devuelve:

- Si el código existe.
- Datos del filtro.
- Tipos de filtro relacionados.
- Tipos de equipo donde se utiliza.
- Si el equipo ya tiene ese tipo asignado.
- Permiso para crear el código cuando no existe.

No busca por equivalencias ni por nombre.

## RPC de actualización

### `engrase.rpc_actualizar_equipo_completo`

Es la única RPC que guarda la edición general.

Procesa:

- Datos principales del equipo.
- Tipo de equipo existente o nuevo.
- Etapas agregadas y eliminadas.
- Filtros nuevos.
- Filtros actualizados.
- Filtros eliminados.
- Tipos de filtro nuevos.
- Códigos de filtro nuevos.
- Aceites nuevos.
- Aceites actualizados.
- Aceites eliminados.
- Sistemas de aceite nuevos.

No recibe fecha de actualización ni controla concurrencia.

Los filtros y aceites se envían agrupados por operación:

- `nuevos`
- `actualizados`
- `eliminados`

Los elementos internos pueden usar estados como:

- `existente`
- `nuevo`
- `actualizado`
- `eliminado`

La RPC valida:

- Al menos una etapa.
- Al menos un filtro.
- Cantidades mayores que cero.
- Un solo filtro por tipo.
- Un solo aceite por sistema.
- Nombres y códigos nuevos válidos.

La respuesta devuelve:

- Resultado general.
- Resumen de operaciones.
- Indicadores de cambios.
- `equipo_lista` compatible con `EquipoEngraseListItem`.

`equipo_lista` se usa para reemplazar directamente el registro actualizado dentro del store sin recargar todos los equipos.

## RPC de imagen

### `engrase.rpc_administrar_imagen_equipo`

Administra únicamente la imagen principal del equipo.

Operaciones:

- `agregar`
- `actualizar`
- `eliminar`

Recibe:

- Código del equipo.
- Operación.
- Ruta de Storage, cuando corresponde.
- Descripción opcional.

Devuelve:

- `main_storage_path`
- `tiene_imagen_main`
- `imagen_actualizada_en`
- Ruta anterior, cuando corresponde.

Estos campos permiten actualizar directamente el equipo dentro del store.

La subida y eliminación física del archivo se realizan desde el frontend en Supabase Storage.
