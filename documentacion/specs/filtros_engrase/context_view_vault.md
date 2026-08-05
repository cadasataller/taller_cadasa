# Consulta de equipos e imágenes en Engrase

## Vista disponible

**Nombre completo:** `engrase.vw_equipos_con_imagen_main`

La vista se utiliza para consultar los equipos de Engrase junto con la metadata de su imagen principal `main.webp`.

No devuelve columnas de `public.equipos`. Solo combina:

- Datos de `engrase.equipo`.
- Nombre del tipo desde `engrase.tipo_equipo`.
- Metadata de la imagen principal desde `public.equipo_imagen`.

## Columnas

| Posición | Columna | Tipo | Descripción |
|---:|---|---|---|
| 1 | `id` | `bigint` | Identificador del equipo en `engrase.equipo`. |
| 2 | `codigo` | `text` | Código único del equipo. |
| 3 | `tipo_equipo_id` | `bigint` | Identificador del tipo de equipo. |
| 4 | `tipo_equipo` | `text` | Nombre del tipo de equipo. |
| 5 | `subtipo` | `text` | Subtipo o clasificación específica del equipo. |
| 6 | `estado` | `text` | Estado del equipo: activo o descartado. |
| 7 | `creado_en` | `timestamp with time zone` | Fecha de creación del equipo. |
| 8 | `actualizado_en` | `timestamp with time zone` | Fecha de última actualización del equipo. |
| 9 | `imagen_id` | `uuid` | Identificador de la metadata de la imagen principal. Es nulo cuando el equipo no tiene imagen. |
| 10 | `main_storage_path` | `text` | Ruta de la imagen principal dentro del bucket `imagenes-equipos`. |
| 11 | `tiene_imagen_main` | `boolean` | Indica si el equipo tiene registrada una imagen principal. |
| 12 | `imagen_actualizada_en` | `timestamp with time zone` | Fecha de última actualización de la imagen principal. |

## Comportamiento de la imagen

La vista devuelve únicamente la ruta estable del archivo, por ejemplo:

`484097/main.webp`

No devuelve una URL pública ni una URL firmada.

Como el bucket `imagenes-equipos` es privado, la aplicación debe generar una URL firmada temporal utilizando `main_storage_path` cuando necesite mostrar la imagen.

Cuando `tiene_imagen_main` sea falso:

- `imagen_id` será nulo.
- `main_storage_path` será nulo.
- `imagen_actualizada_en` será nulo.
- La interfaz debe mostrar una imagen o ícono predeterminado.

## Uso previsto

La vista puede utilizarse para:

- Listar equipos.
- Buscar equipos.
- Mostrar miniaturas de `main.webp`.
- Identificar equipos que todavía no tienen imagen.
- Abrir el detalle de un equipo sin realizar otra consulta para obtener la ruta de la imagen.
