# Contexto del módulo de equipos y filtros

## 1. Propósito

Este documento describe el contexto funcional y técnico del módulo de filtros de equipos almacenado en Supabase.

El módulo debe permitir consultar qué filtros utiliza cada equipo y qué equipos utilizan un código de filtro determinado. También debe permitir administrar equipos, tipos de filtro, cantidades, etapas, equivalencias y cambios del filtro original.

La información inicial proviene del archivo `Filtros Taller (1).xlsx` y está almacenada en el proyecto Supabase `equipos`, dentro del esquema `engrase`.

## 2. Estado actual de la base de datos

| Elemento | Valor actual |
| --- | ---: |
| Tipos de equipo | 12 |
| Equipos | 124 |
| Equipos activos | 109 |
| Equipos descartados | 15 |
| Tipos de filtro | 17 |
| Códigos de filtro | 295 |
| Asignaciones equipo-filtro | 751 |
| Etapas | 2 |
| Relaciones equipo-etapa | 0 |
| Equivalencias registradas | 0 |
| Registros en el historial | 0 |

Las etapas existentes son `ZAFRA` y `CULTIVO`. Todavía no se ha indicado a qué equipos corresponde cada etapa.

## 3. Hojas importadas

Solo se importaron datos de estas hojas:

1. Combinadas
2. Grabs
3. Tractores
4. Camecos
5. Forklift
6. Cargadores
7. Pickup´s
8. Jaivas
9. Buses
10. Trailers
11. Camiones
12. Equipos Pesados

Cada hoja se convirtió en un registro de `tipo_equipo` y cada fila válida se convirtió en un equipo.

## 4. Modelo de datos

### 4.1. `engrase.tipo_equipo`

Catálogo de tipos generales de equipo. Corresponde principalmente al nombre de la hoja de origen.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador interno. |
| `nombre` | text | Nombre único del tipo de equipo. |
| `creado_en` | timestamptz | Fecha de creación. |

### 4.2. `engrase.equipo`

Contiene cada equipo, incluso si está descartado o todavía no tiene filtros registrados.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador interno. |
| `codigo` | text | Código único del equipo. |
| `tipo_equipo_id` | bigint | Relación con `tipo_equipo`. |
| `subtipo` | text | Subtipo, modelo o descripción procedente del Excel. |
| `estado` | text | `activo` o `descartado`. |
| `creado_en` | timestamptz | Fecha de creación. |
| `actualizado_en` | timestamptz | Fecha de la última actualización. |

Reglas importantes:

- Los equipos descartados no se eliminan.
- Los equipos descartados conservan sus asignaciones de filtros.
- El equipo `4-58-014` permanece activo, con subtipo `Forklift`, aunque no tenga filtros.
- Los equipos `4-16-001`, `4-22-009` y `4-58-007` están registrados como descartados.

### 4.3. `engrase.etapa`

Catálogo abierto de etapas operativas.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador interno. |
| `nombre` | text | Nombre único de la etapa. Puede contener cualquier valor válido. |
| `creado_en` | timestamptz | Fecha de creación. |

Las etapas no están limitadas a Zafra y Cultivo. Se pueden crear nuevas etapas cuando sea necesario.

### 4.4. `engrase.equipo_etapa`

Relación de muchos a muchos entre equipos y etapas.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `equipo_id` | bigint | Equipo relacionado. |
| `etapa_id` | bigint | Etapa relacionada. |
| `creado_en` | timestamptz | Fecha de creación de la relación. |

Si un equipo trabaja en Zafra y Cultivo, se crean dos registros. No se guarda una etapa llamada `AMBAS`.

### 4.5. `engrase.tipo_filtro`

Catálogo de la función o posición del filtro dentro del equipo.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador interno. |
| `nombre` | text | Nombre único del tipo de filtro. |
| `creado_en` | timestamptz | Fecha de creación. |

Tipos actuales:

- Filtro de aceite 1
- Filtro de aceite 2
- Filtro de aire acondicionado
- Filtro de aire primario
- Filtro de aire secundario
- Filtro de cabina
- Filtro de coolant
- Filtro de diferencial
- Filtro de elemento
- Filtro de gasolina
- Filtro de transmisión
- Filtro diésel 1
- Filtro diésel 2
- Filtro diésel 3
- Filtro hidráulico 1
- Filtro hidráulico 2
- Filtro hidráulico de tanque

No existe una columna separada llamada `posicion`. Las posiciones se representan mediante el tipo de filtro, por ejemplo, aceite 1, aceite 2 o hidráulico de tanque.

### 4.6. `engrase.filtro`

Catálogo de códigos de filtros originales y códigos que posteriormente puedan utilizarse como equivalentes.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador interno. |
| `codigo` | text | Código único conservado como texto. |
| `esta_en_lista_compras` | boolean | Indica si aparece en la lista de la aplicación de compras. |
| `creado_en` | timestamptz | Fecha de creación. |
| `actualizado_en` | timestamptz | Fecha de actualización. |

Significado de `esta_en_lista_compras`:

- `true`: el código puede seleccionarse desde la lista de la aplicación de compras.
- `false`: el código debe escribirse manualmente.

Todos los códigos importados comenzaron con valor `true`.

Los códigos se conservan como aparecen en el Excel. Por ejemplo:

- `LINEAL DE 1/2` se conserva con la palabra `DE`.
- `STRAINER 65456` se conserva exactamente así.
- `4T-6788` y `4t-6788` son registros diferentes porque el Excel los presenta con distinta capitalización.

### 4.7. `engrase.equipo_filtro`

Representa el filtro original que utiliza un equipo para un tipo de filtro determinado.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador de la asignación. |
| `equipo_id` | bigint | Equipo que utiliza el filtro. |
| `tipo_filtro_id` | bigint | Función o posición del filtro. |
| `filtro_id` | bigint | Código del filtro original. |
| `cantidad` | smallint | Cantidad de unidades que utiliza el equipo. |
| `creado_en` | timestamptz | Fecha de creación. |
| `actualizado_en` | timestamptz | Fecha de actualización. |

La combinación de equipo y tipo de filtro es única.

Si un valor del Excel contiene `(2)`, `(3)` o `(4)`, el número se guarda en `cantidad`. Cuando no aparece un número entre paréntesis, la cantidad es 1.

### 4.8. `engrase.filtro_equivalencia`

Relaciona un filtro original con un código equivalente.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador de la equivalencia. |
| `filtro_original_id` | bigint | Filtro original. |
| `filtro_equivalente_id` | bigint | Código equivalente. |
| `activo` | boolean | Permite desactivar una equivalencia sin eliminarla. |
| `observacion` | text | Nota opcional. |
| `registrado_por` | uuid | Usuario de Supabase Auth que registró la equivalencia. |
| `creado_en` | timestamptz | Fecha de creación. |
| `actualizado_en` | timestamptz | Fecha de actualización. |

Las equivalencias escritas en el Excel no se importaron. Las equivalencias se agregarán manualmente desde el sistema.

Agregar una equivalencia no modifica el filtro original y no genera un registro en `equipo_filtro_historial`.

### 4.9. `engrase.equipo_filtro_historial`

Registra los cambios del filtro original asignado a un equipo.

| Columna | Tipo | Descripción |
| --- | --- | --- |
| `id` | bigint | Identificador del cambio. |
| `equipo_filtro_id` | bigint | Asignación modificada. |
| `filtro_original_anterior_id` | bigint | Código original anterior. |
| `filtro_original_nuevo_id` | bigint | Código original nuevo. |
| `motivo` | text | Explicación opcional del cambio. |
| `cambiado_por` | uuid | Usuario de Supabase Auth que realizó el cambio. |
| `cambiado_en` | timestamptz | Fecha y hora del cambio. |

Este historial es exclusivamente para cambios del filtro original. No se utiliza para registrar la creación de equivalencias.

## 5. Relaciones principales

```text
tipo_equipo 1 ─── N equipo
equipo N ─── N etapa                  mediante equipo_etapa
equipo 1 ─── N equipo_filtro
tipo_filtro 1 ─── N equipo_filtro
filtro 1 ─── N equipo_filtro
filtro N ─── N filtro                 mediante filtro_equivalencia
equipo_filtro 1 ─── N equipo_filtro_historial
```

## 6. Reglas aplicadas durante la importación

- Los colores, rellenos y comentarios de las celdas no se utilizaron como datos.
- La letra roja se utilizó únicamente para identificar equipos descartados.
- Los equipos no se eliminaron; se guardaron como activos o descartados.
- De un texto con la estructura `FILTRO ORIGINAL / código / EQUIVALENCIA`, solo se importó el código posterior a `FILTRO ORIGINAL` y anterior a `EQUIVALENCIA`.
- Un código escrito directamente, sin el texto `FILTRO ORIGINAL`, también se tomó como filtro original. Esto indica que no tenía equivalencias documentadas.
- `Filtro de aciete`, `Filtro de aceite` y `Filtro aceite` representan el mismo concepto.
- Filtro de cabina, aire primario, aire secundario y aire acondicionado son tipos diferentes.
- Filtro de aire secundario corresponde a `FILTRO SEG`.
- Filtro de aire primario corresponde a `FILTRO AIRE`.
- Filtro de aire acondicionado corresponde a `FILTRO A/C`.
- En Grabs se ignoró la última columna repetida de filtro hidráulico de tanque.
- En Cargadores se interpretaron las columnas como filtro hidráulico 1, filtro hidráulico 2 y filtro hidráulico de tanque.
- Los textos de estado como `DAÑADA` o `FUERA DEL SISTEMA` no se importaron como códigos de filtro.

## 7. Funcionalidades requeridas

### 7.1. Búsqueda por código de filtro

El usuario puede escribir un código y obtener todos los equipos que lo utilizan.

El resultado debe mostrar, como mínimo:

- Código del equipo.
- Tipo de equipo.
- Subtipo.
- Estado del equipo.
- Tipo de filtro.
- Código del filtro original.
- Cantidad utilizada.
- Etapas relacionadas.

La búsqueda debe distinguir entre el código original y sus equivalencias, pero permitir encontrar el equipo usando cualquiera de los dos.

### 7.2. Consulta y filtrado de equipos

La lista de equipos debe permitir filtrar por:

- Tipo de equipo.
- Subtipo.
- Estado activo o descartado.
- Etapa.
- Tipo de filtro.
- Código de filtro.

Debe ser posible mostrar u ocultar equipos descartados sin eliminarlos.

### 7.3. Detalle de un equipo

La vista de detalle debe mostrar:

- Código, tipo, subtipo y estado.
- Todas sus etapas.
- Todos los tipos de filtro asociados.
- Código original de cada filtro.
- Cantidad utilizada.
- Equivalencias activas.
- Indicación de si cada código está en la lista de compras.
- Historial de cambios del filtro original.

### 7.4. Registro de equipos

El sistema debe permitir crear un equipo nuevo con:

- Código único.
- Tipo de equipo existente o nuevo.
- Subtipo.
- Estado inicial.
- Una o varias etapas.

Debe permitirse guardar el equipo sin filtros y agregar sus filtros posteriormente.

### 7.5. Administración de filtros de un equipo

Para un equipo se debe poder:

- Agregar un tipo de filtro existente.
- Crear un nuevo tipo de filtro cuando sea necesario.
- Seleccionar un código existente.
- Registrar un nuevo código.
- Indicar la cantidad utilizada.
- Cambiar el filtro original.
- Retirar una asignación que ya no corresponda.

Cuando cambia el filtro original, el sistema debe registrar primero el valor anterior y el nuevo en `equipo_filtro_historial`.

### 7.6. Administración de equivalencias

El sistema debe permitir:

- Buscar o registrar el código equivalente.
- Relacionarlo con el filtro original.
- Guardar una observación.
- Identificar al usuario que creó la relación.
- Desactivar y reactivar la equivalencia.

Una equivalencia desactivada debe conservarse para auditoría, pero no debe aparecer como opción válida por defecto.

### 7.7. Administración de etapas

El sistema debe permitir crear cualquier etapa y relacionar un equipo con una o varias etapas.

Cuando un equipo pertenece a varias etapas se crea un registro en `equipo_etapa` por cada relación.

### 7.8. Integración con la lista de compras

El campo `esta_en_lista_compras` controla la forma de capturar un código:

- Si es `true`, el código aparece en el selector de la aplicación de compras.
- Si es `false`, el usuario debe escribirlo manualmente.

El estado pertenece al código del filtro y se comparte entre todos los equipos que utilizan ese código.

## 8. Seguridad actual

Todas las tablas del esquema `engrase` tienen RLS habilitado.

El estado actual de permisos es:

- `authenticated` puede ejecutar `SELECT` en las nueve tablas.
- `authenticated` no puede insertar, actualizar ni eliminar.
- `anon` no tiene acceso al esquema ni a las tablas.
- No se utiliza `app_metadata` para controlar áreas.

Si el frontend utiliza `supabase-js`, REST o GraphQL, el esquema `engrase` debe estar incluido en la configuración de esquemas expuestos de la Data API. Exponerlo crea la ruta de acceso; no desactiva RLS.

Las funcionalidades de registro y modificación descritas en este documento requieren políticas y permisos adicionales de `INSERT` y `UPDATE`. Los permisos de `DELETE` deben evaluarse por separado para evitar la eliminación accidental de catálogos, equipos o historial.

## 9. Consultas principales esperadas

### Equipos que utilizan un filtro

La consulta debe recorrer:

```text
filtro → equipo_filtro → equipo → tipo_equipo
```

Si la búsqueda se realiza mediante una equivalencia:

```text
filtro equivalente → filtro_equivalencia → filtro original
→ equipo_filtro → equipo
```

### Filtros de un equipo

La consulta debe recorrer:

```text
equipo → equipo_filtro → tipo_filtro → filtro
```

Las equivalencias se consultan posteriormente desde `filtro_equivalencia`.

### Equipos por etapa

La consulta debe recorrer:

```text
etapa → equipo_etapa → equipo
```

## 10. Criterios funcionales mínimos

- Buscar un código original y visualizar todos los equipos que lo utilizan.
- Buscar un código equivalente y llegar a los equipos del filtro original.
- Filtrar equipos por tipo, subtipo, estado, etapa y tipo de filtro.
- Conservar equipos descartados y permitir incluirlos en los resultados.
- Mostrar correctamente cantidades mayores que uno.
- Registrar equipos aunque todavía no tengan filtros.
- Registrar nuevos tipos de equipo, tipos de filtro y códigos.
- Agregar y desactivar equivalencias sin modificar el original.
- Guardar el historial cuando cambia el filtro original.
- Permitir varias etapas por equipo.
- Respetar `esta_en_lista_compras` al seleccionar o escribir códigos.
- Impedir que usuarios sin autenticación consulten el esquema.

## 11. Estado de implementación

### Implementado

- Esquema `engrase` y nueve tablas relacionadas.
- Catálogos y datos iniciales del Excel.
- Estados activo y descartado.
- Cantidad por asignación de filtro.
- Catálogo abierto de etapas.
- Tablas para equivalencias e historial.
- RLS de lectura para `authenticated`.
- Bloqueo de acceso para `anon`.

### Pendiente de implementación en la aplicación

- Pantallas de búsqueda y filtros.
- Vista de detalle del equipo.
- Formularios para equipos, tipos, filtros y etapas.
- Asignación de las etapas actuales a los equipos.
- Registro y desactivación de equivalencias.
- Flujo transaccional para cambiar el original y crear el historial.
- Integración con la lista de compras.
- Políticas de escritura para las operaciones autorizadas.
- Exposición de `engrase` en Data API, si el frontend utilizará `supabase-js`, REST o GraphQL.

