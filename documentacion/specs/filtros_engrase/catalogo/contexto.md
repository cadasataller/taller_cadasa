# Contexto definitivo — Catálogo de filtros, aceites, sistemas y tipos de filtro

## 1. Objetivo

Este documento consolida las decisiones tomadas para el módulo **Catálogo** del esquema `engrase` del proyecto Supabase `equipos`.

El catálogo tendrá como objetivo **administrar los objetos maestros** utilizados posteriormente en los equipos, sin modificar desde estas pantallas las asociaciones existentes entre esos objetos y los equipos.

Las cuatro secciones definitivas del catálogo serán:

1. **Tipos de filtro**
2. **Filtros**
3. **Aceites**
4. **Sistemas**

La regla principal es:

> **El Catálogo edita los datos propios del objeto. La edición de equipos administra las asociaciones entre equipos y esos objetos.**

Por lo tanto, desde el Catálogo se podrá cambiar información como nombres, códigos, estado o si un filtro está en la lista de compras, pero **no se crearán, modificarán ni eliminarán asociaciones de `equipo_filtro` o `equipo_aceite`**.

---

# 2. Modelo actual relevante

Las tablas principales involucradas son:

```text
engrase.tipo_filtro
engrase.filtro
engrase.aceite
engrase.sistema_aceite

engrase.equipo
engrase.tipo_equipo
engrase.equipo_filtro
engrase.equipo_aceite
```

Las primeras cuatro son objetos de catálogo.

Las últimas cuatro se utilizan para conocer el uso actual de esos objetos y, en las pantallas de edición de equipos, para administrar asociaciones.

---

# 3. Principio de separación entre Catálogo y Equipos

## 3.1. Catálogo

El Catálogo podrá escribir únicamente sobre:

```text
tipo_filtro
filtro
aceite
sistema_aceite
```

Según el objeto, se podrán modificar campos como:

```text
nombre
codigo
activo
esta_en_lista_compras
```

## 3.2. Relaciones de equipos

Desde las pantallas del Catálogo solamente se podrán **leer**:

```text
equipo
tipo_equipo
equipo_filtro
equipo_aceite
```

Estas tablas se utilizarán para mostrar:

- Cuántos equipos utilizan un objeto.
- Cuántas asignaciones existen.
- Qué tipos de equipo utilizan un objeto.
- Cuántos equipos de cada tipo están afectados.
- Qué sistemas están relacionados actualmente con un aceite.
- Qué tipos de filtro se han usado actualmente con un código de filtro.

## 3.3. Qué NO debe hacer el Catálogo

Ninguna RPC específica del Catálogo deberá:

```text
INSERT / UPDATE / DELETE equipo
INSERT / UPDATE / DELETE equipo_filtro
INSERT / UPDATE / DELETE equipo_aceite
INSERT / UPDATE / DELETE equipo_etapa
INSERT / UPDATE / DELETE equipo_filtro_historial
```

Las asociaciones seguirán administrándose exclusivamente desde la lógica de edición de equipos.

---

# 4. Comportamiento general de uso e impacto

Cada objeto del Catálogo debe cargarse junto con información agregada de su uso actual.

Para cualquiera de los objetos se quiere conocer:

```text
Tipos de equipo asociados
Cantidad de equipos por cada tipo
Cantidad total de equipos afectados
Cantidad total de asignaciones cuando aplique
```

Ejemplo conceptual:

```text
Filtro B7030

Usado en:
- Cosechadora: 12 equipos
- Tractor: 4 equipos
- Combinada: 2 equipos

Total: 18 equipos
```

Al editar un objeto, antes de guardar se debe poder mostrar un mensaje como:

> **Esta actualización se reflejará en 18 equipos.**

Este mensaje **no significa que se actualizarán 18 registros de equipos**.

La razón es que las asociaciones guardan los `id` de los objetos maestros. Por ejemplo:

```text
equipo_filtro.filtro_id -> filtro.id
equipo_filtro.tipo_filtro_id -> tipo_filtro.id
equipo_aceite.aceite_id -> aceite.id
equipo_aceite.sistema_aceite_id -> sistema_aceite.id
```

Por lo tanto, cambiar el nombre o código del objeto modifica lo que se muestra en todas las consultas relacionadas, pero **no cambia la asociación**.

---

# 5. Estrategia de objetos activos y desactivados

Se acordó utilizar el campo:

```sql
activo boolean NOT NULL DEFAULT true
```

en los objetos que necesiten desactivación.

Actualmente `aceite` y `sistema_aceite` ya tienen `activo`.

Se decidió agregarlo también a:

```text
tipo_filtro
filtro
```

## 5.1. Regla funcional

Cuando un objeto esté desactivado:

- No debe ofrecerse para crear una nueva asociación con un equipo.
- Debe seguir apareciendo si ya existe una asociación con un equipo.
- Debe poder visualizarse en el Catálogo utilizando el filtro de estado correspondiente.
- La edición de un equipo debe poder cargar sus asociaciones aunque alguno de sus objetos esté desactivado.

Conceptualmente:

```text
Objeto desactivado
│
├── Nueva asociación -> NO disponible
│
└── Asociación existente -> SE MANTIENE Y SE MUESTRA
```

## 5.2. RPC actuales relacionadas

La estrategia ya existe parcialmente para:

```text
aceite
sistema_aceite
```

porque `rpc_obtener_auxiliares_edicion_equipo()` carga únicamente:

```sql
WHERE activo
```

para ofrecer opciones nuevas.

En cambio, `rpc_obtener_equipo_para_edicion()` carga las asociaciones existentes sin ocultarlas por estado.

La misma lógica deberá aplicarse posteriormente a:

```text
filtro
tipo_filtro
```

---

# 6. Cambios implementados en `engrase.filtro`

## 6.1. Trigger para `actualizado_en`

La tabla `filtro` ya tenía:

```text
actualizado_en
```

pero no tenía un trigger que actualizara automáticamente este valor.

Se implementó:

```sql
CREATE TRIGGER trg_establecer_filtro_actualizado_en
BEFORE UPDATE ON engrase.filtro
FOR EACH ROW
EXECUTE FUNCTION engrase.establecer_equipo_actualizado_en();
```

A partir de este cambio, cualquier actualización del filtro actualizará automáticamente `actualizado_en`.

---

## 6.2. Restricción de código único normalizado

Antes ya existía una restricción única sobre:

```text
filtro.codigo
```

pero esta diferencia mayúsculas, minúsculas y espacios externos.

Por ejemplo, técnicamente podían considerarse diferentes:

```text
B7030
b7030
 B7030
B7030 
```

Antes de crear la nueva restricción se verificó que no existieran duplicados al normalizar los datos.

Después se creó:

```sql
CREATE UNIQUE INDEX filtro_codigo_normalizado_uidx
ON engrase.filtro (lower(btrim(codigo)));
```

Ahora esos valores se consideran el mismo código lógico.

### Razón

Las funciones existentes ya resuelven filtros utilizando:

```sql
lower(btrim(codigo))
```

La restricción de base de datos debía seguir la misma lógica y evitar que una RPC o una operación directa pudiera crear registros que las funciones posteriormente interpretaran como equivalentes.

---

# 7. Cambios de tabla decididos pero pendientes

## 7.1. `engrase.tipo_filtro`

### Estado inicial

Actualmente contiene conceptualmente:

```text
id
nombre
creado_en
```

### Estado decidido

Debe quedar:

```text
id
nombre
activo
creado_en
actualizado_en
```

Cambios:

```sql
activo boolean NOT NULL DEFAULT true
actualizado_en timestamptz
```

Además deberá tener el trigger correspondiente para actualizar `actualizado_en`.

### Razón

Se necesita poder desactivar un tipo de filtro sin eliminarlo ni romper asociaciones existentes.

---

## 7.2. `engrase.filtro`

### Estado inicial

```text
id
codigo
esta_en_lista_compras
creado_en
actualizado_en
```

### Estado decidido

```text
id
codigo
esta_en_lista_compras
activo
creado_en
actualizado_en
```

### No se agregará `nombre`

Inicialmente la imagen mostraba:

```text
Código original
Nombre / etiqueta
Tipo de filtro
```

Se analizó la intención y se descartó agregar un campo `nombre` o `nombre_etiqueta` a `filtro`.

El objetivo del Catálogo de filtros será editar **únicamente información propia de `filtro`**.

El tipo de filtro no pertenece directamente a `filtro`, sino a la asociación:

```text
equipo_filtro
```

Por esa razón no debe agregarse:

```text
tipo_filtro_id
```

a `filtro`.

---

## 7.3. `engrase.aceite`

La tabla actual ya tiene una estructura apropiada:

```text
id
nombre
activo
creado_en
actualizado_en
```

No se agregará ninguna relación directa con sistema.

### Razón

Un aceite no pertenece a un sistema de forma global.

La relación existe en:

```text
equipo_aceite
```

y depende del equipo.

---

## 7.4. `engrase.sistema_aceite`

La tabla actual también ya tiene la estructura necesaria:

```text
id
nombre
activo
creado_en
actualizado_en
```

No requiere una relación directa con un aceite.

---

# 8. Cambio general de navegación

## Diseño inicial

Las imágenes iniciales tenían tres pestañas:

```text
Tipos de filtro
Filtros
Aceites
```

## Diseño definitivo

Se agregará una cuarta pestaña:

```text
Tipos de filtro
Filtros
Aceites
Sistemas
```

### Razón

Los sistemas son objetos independientes de catálogo:

```text
engrase.sistema_aceite
```

y ya tienen:

```text
nombre
activo
```

Por lo tanto, deben administrarse igual que aceites y tipos de filtro en lugar de quedar ocultos dentro de la edición de aceite.

---

# 9. Pantalla: Tipos de filtro

## 9.1. Diseño inicial de la imagen

La imagen mostraba una tabla similar a:

```text
Nombre para mostrar | Estado | En uso
```

y un panel lateral con:

```text
Nombre para mostrar
Estado
Usado en tipos de equipo
```

También mostraba chips con tipos de equipo asociados.

## 9.2. Diseño definitivo

La pantalla mantiene prácticamente la misma estructura.

### Tabla

Debe mostrar principalmente:

```text
Nombre
Estado
Resumen de uso
```

Ejemplo:

```text
Filtro de aire 1 | Activo | 18 equipos
```

El resumen puede representar la métrica que finalmente resulte más útil para el listado, mientras que el detalle debe contener la información completa.

### Panel de detalle

Debe mostrar:

```text
Nombre
Estado

Tipos de equipo asociados:
- Tipo A: N equipos
- Tipo B: N equipos
- Tipo C: N equipos

Total de equipos afectados
```

### Campos editables

Únicamente:

```text
nombre
activo
```

### Información de solo lectura

```text
tipos de equipo asociados
cantidad por tipo
total de equipos afectados
```

### Confirmación al guardar

Antes de actualizar:

> Esta actualización se reflejará en N equipos.

### Razón del cambio

El tipo de filtro es un objeto maestro y los equipos lo referencian por `id`.

Cambiar su nombre no requiere modificar las asociaciones.

---

# 10. Pantalla: Filtros

Esta es la pantalla que más cambió respecto a la imagen inicial.

## 10.1. Diseño inicial de la imagen

La tabla mostraba:

```text
Código original
Nombre / etiqueta
Tipo de filtro
En compras
Estado
```

El panel lateral mostraba:

```text
Código del filtro
Tipo de filtro
En compras
Estado
Usado en tipos de equipo
```

## 10.2. Cambios conceptuales

Se decidió que:

1. `filtro` no tendrá un nombre adicional.
2. El `tipo_filtro` no es una propiedad directa de `filtro`.
3. El tipo de filtro solamente existe al relacionar un filtro con un equipo mediante `equipo_filtro`.
4. No se deben editar asociaciones desde el Catálogo.
5. En las filas del listado tampoco se quieren mostrar los tipos de filtro.
6. Los tipos de filtro relacionados se mostrarán únicamente dentro de **Detalles**.

---

## 10.3. Tabla definitiva

La fila debe centrarse exclusivamente en los datos propios del objeto.

Debe mostrar algo similar a:

```text
Código
En compras
Estado
Resumen de uso
```

Ejemplo:

```text
B7030 | Sí | Activo | 18 equipos
```

No mostrar en la fila:

```text
Tipo(s) de filtro
Tipos de equipo
```

Estos datos estarán disponibles al abrir el detalle.

---

## 10.4. Filtros superiores de la pantalla

Se mantiene el selector:

```text
Tipo de filtro
```

pero únicamente como **filtro del listado**.

También pueden mantenerse:

```text
En compras
Estado
```

### Regla importante

El filtrado se realizará en el **frontend**.

La RPC de listado cargará el conjunto de datos requerido y Vue realizará localmente los filtros por:

```text
código
tipo de filtro relacionado
en compras
estado
```

No se quiere hacer una llamada nueva a la BD por cada cambio de filtro visual.

---

## 10.5. Panel de detalle definitivo

Campos editables:

```text
Código del filtro
En compras
Estado
```

Información de solo lectura:

```text
Tipos de filtro en los que actualmente se utiliza
Tipos de equipo asociados
Cantidad de equipos por tipo
Cantidad total de equipos
Cantidad total de asignaciones
```

Ejemplo conceptual:

```text
Código
[B7030]

En compras
[Sí] [No]

Estado
[Activo] [Desactivado]

Tipos de filtro donde se utiliza
- Filtro de aire 1
- Filtro de aire 2

Tipos de equipo
- Cosechadora: 12
- Tractor: 4
- Combinada: 2

Total equipos: 18
Total asignaciones: 20
```

### Confirmación al guardar

> Esta actualización se reflejará en 18 equipos.

---

## 10.6. Nuevo filtro

Crear un filtro no debe pedir:

```text
Tipo de filtro
Equipo
```

Debe crear únicamente el objeto maestro.

Formulario:

```text
Código
En compras
Estado
```

Inicialmente podrá tener:

```text
0 equipos
0 asignaciones
```

Posteriormente las asociaciones se crean desde la edición del equipo.

---

## 10.7. Razón

Actualmente existen códigos de filtro utilizados en más de un `tipo_filtro`.

Por lo tanto, convertir el tipo de filtro en una propiedad directa del objeto `filtro` sería incorrecto y perdería flexibilidad del modelo actual.

La UI debe respetar la relación real:

```text
filtro
   ↑
equipo_filtro
   ↓
tipo_filtro
```

---

# 11. Pantalla: Aceites

## 11.1. Diseño inicial de la imagen

La tabla mostraba:

```text
Nombre
Sistema asociado
Estado
Resumen de uso
```

El panel lateral permitía editar:

```text
Nombre para mostrar
Sistema asociado
Estado
```

y luego mostraba información de equipos.

## 11.2. Problema detectado

El sistema **no pertenece directamente al aceite**.

La relación real es:

```text
equipo_aceite
├── equipo_id
├── sistema_aceite_id
└── aceite_id
```

Por lo tanto, un mismo aceite puede utilizarse en diferentes sistemas dependiendo del equipo.

---

## 11.3. Cambio del formulario

Se elimina completamente el selector editable:

```text
Sistema asociado
```

del formulario de aceite.

Campos editables:

```text
nombre
activo
```

Información de solo lectura:

```text
sistemas asociados actualmente
cantidad por sistema
tipos de equipo asociados
cantidad por tipo de equipo
total de equipos
total de asignaciones
```

---

## 11.4. Tabla definitiva de aceites

La tabla sí debe mostrar sistemas asociados, pero de forma compacta.

### Regla acordada

Mostrar como máximo:

```text
2 sistemas
```

sin cantidades.

Si existen más:

```text
+N
```

Ejemplo:

```text
15W40 | MOTOR · TRANSMISIÓN · +2 | Activo | 18 equipos
```

No mostrar en la fila:

```text
MOTOR 18
TRANSMISIÓN 4
```

Las cantidades se reservan para Detalles.

---

## 11.5. Panel de detalle

Ejemplo:

```text
Nombre
[15W40]

Estado
[Activo] [Desactivado]

Sistemas donde se utiliza
- MOTOR: 18
- TRANSMISIÓN: 4
- HIDRÁULICO: 1

Tipos de equipo asociados
- Cosechadora: 10
- Tractor: 5
- Generador: 3

Total equipos: 18
Total asignaciones: 23
```

### Confirmación al actualizar

> Esta actualización se reflejará en 18 equipos.

---

## 11.6. Razón

El Catálogo administra el nombre y estado del aceite.

Las asociaciones sistema–aceite pertenecen al equipo y no deben modificarse desde esta pantalla.

---

# 12. Pantalla: Sistemas

Esta pestaña no estaba en las imágenes iniciales.

Se agrega como consecuencia de reconocer `sistema_aceite` como un objeto independiente.

## 12.1. Tabla

Debe mostrar:

```text
Nombre
Estado
Resumen de uso
```

No es necesario mostrar todos los aceites relacionados directamente en cada fila.

La fila debe mantenerse compacta.

## 12.2. Panel de detalle

Campos editables:

```text
nombre
activo
```

Información de solo lectura:

```text
aceites relacionados actualmente
cantidad por aceite si resulta útil
tipos de equipo asociados
cantidad por tipo de equipo
total de equipos
total de asignaciones
```

### Confirmación al actualizar

> Esta actualización se reflejará en N equipos.

---

# 13. Datos que deben cargar las RPC de listado

La estrategia acordada es **cargar datos suficientes una sola vez y filtrar en frontend**.

Por lo tanto, las RPC de listado no deben devolver solamente las columnas visibles.

También deben incluir datos auxiliares utilizados para:

- Filtros locales.
- Apertura rápida del detalle.
- Conteos.
- Mensajes de impacto.
- Chips y resúmenes.

Ejemplo conceptual de un filtro:

```json
{
  "id": 10,
  "codigo": "B7030",
  "esta_en_lista_compras": true,
  "activo": true,
  "total_equipos": 18,
  "total_asignaciones": 20,
  "tipos_filtro": [
    {
      "id": 1,
      "nombre": "Filtro de aire 1"
    }
  ],
  "tipos_equipo": [
    {
      "id": 2,
      "nombre": "Cosechadora",
      "cantidad_equipos": 12
    },
    {
      "id": 4,
      "nombre": "Tractor",
      "cantidad_equipos": 6
    }
  ]
}
```

La UI podrá ocultar `tipos_filtro` en la tabla, pero utilizarlo para el filtro local.

---

# 14. Filtrado en frontend

Se acordó que los filtros visuales deben trabajar con los datos ya cargados desde la BD.

Ejemplo para Filtros:

```text
Buscar por código
Tipo de filtro
En compras
Estado
```

Vue aplicará los filtros al arreglo local.

La RPC no debe ejecutarse nuevamente cada vez que el usuario:

```text
selecciona un estado
cambia un tipo de filtro
limpia un filtro
escribe una búsqueda
```

La RPC deberá volver a ejecutarse solamente cuando sea necesario refrescar los datos reales, por ejemplo después de crear o modificar un objeto.

---

# 15. RPC orientadas al Catálogo

Las RPC nuevas estarán orientadas al **objeto maestro**, no a las asociaciones de equipos.

Propuesta:

```text
rpc_catalogo_tipos_filtro_listar
rpc_catalogo_tipo_filtro_guardar

rpc_catalogo_filtros_listar
rpc_catalogo_filtro_guardar

rpc_catalogo_aceites_listar
rpc_catalogo_aceite_guardar

rpc_catalogo_sistemas_listar
rpc_catalogo_sistema_guardar

rpc_catalogo_auxiliares
```

---

# 16. Responsabilidad de las RPC `listar`

Pueden leer:

```text
tipo_filtro
filtro
aceite
sistema_aceite
equipo
tipo_equipo
equipo_filtro
equipo_aceite
```

para calcular:

```text
uso
impacto
tipos de equipo
cantidades
asociaciones actuales
```

Pero nunca modificar relaciones.

---

# 17. Responsabilidad de las RPC `guardar`

## Tipo de filtro

Puede modificar únicamente:

```text
tipo_filtro.nombre
tipo_filtro.activo
```

## Filtro

Puede modificar únicamente:

```text
filtro.codigo
filtro.esta_en_lista_compras
filtro.activo
```

## Aceite

Puede modificar únicamente:

```text
aceite.nombre
aceite.activo
```

## Sistema

Puede modificar únicamente:

```text
sistema_aceite.nombre
sistema_aceite.activo
```

---

# 18. Confirmación de impacto antes de guardar

El frontend debe conocer antes de guardar:

```text
total_equipos
tipos_equipo
cantidad por tipo
```

La confirmación puede mostrar:

```text
Guardar cambios

Esta actualización se reflejará en 18 equipos.

Cosechadora: 12
Tractor: 4
Combinada: 2

[Cancelar] [Confirmar]
```

Esto es especialmente importante cuando se cambia:

```text
nombre
codigo
estado
```

porque permite al usuario comprender el alcance visual del cambio sin confundirlo con una actualización masiva de asociaciones.

---

# 19. Cambio de código de filtro

Se confirmó que cambiar el código de un filtro no requiere cambiar asociaciones.

Las relaciones utilizan:

```text
filtro.id
```

y no `filtro.codigo`.

Por ejemplo:

```text
Antes:
id = 25
codigo = B7030

Después:
id = 25
codigo = B7030-A
```

Las asociaciones continúan apuntando a:

```text
filtro_id = 25
```

Por lo tanto, únicamente cambia el valor mostrado.

---

# 20. Criterio visual general

El listado debe mantenerse compacto.

La información compleja de relaciones se concentra en el panel **Detalles**.

## En las filas

Mostrar principalmente:

```text
datos propios del objeto
estado
resumen simple de uso
```

## En Detalles

Mostrar:

```text
todas las asociaciones derivadas
tipos de equipo
cantidades
sistemas
tipos de filtro
impacto total
```

Esta decisión evita que las tablas se vuelvan demasiado anchas o visualmente saturadas.

---

# 21. Resumen de cambios respecto a las imágenes iniciales

## Tipos de filtro

### Inicial

```text
Nombre
Estado
En uso
```

### Definitivo

Se mantiene el concepto.

Se refuerza el detalle con:

```text
tipos de equipo
cantidad por tipo
total afectados
```

---

## Filtros

### Inicial

```text
Código original
Nombre / etiqueta
Tipo de filtro
En compras
Estado
```

### Definitivo

```text
Código
En compras
Estado
Resumen de uso
```

Se eliminan de la fila:

```text
Nombre / etiqueta
Tipo de filtro
```

El tipo de filtro se mantiene únicamente:

- como filtro superior del listado;
- como información dentro de Detalles.

El formulario no permite editar asociaciones de tipo de filtro.

---

## Aceites

### Inicial

```text
Nombre
Sistema asociado
Estado
Resumen de uso
```

Formulario:

```text
Nombre
Sistema asociado
Estado
```

### Definitivo

Tabla:

```text
Nombre
Sistemas asociados
Estado
Resumen de uso
```

Con máximo:

```text
2 sistemas + indicador +N
```

sin cantidades.

Formulario:

```text
Nombre
Estado
```

Los sistemas aparecen en Detalles como solo lectura y con cantidades.

---

## Sistemas

### Inicial

No existía pestaña.

### Definitivo

Se agrega una pestaña propia para administrar:

```text
sistema_aceite.nombre
sistema_aceite.activo
```

Las relaciones con aceites y equipos son únicamente informativas.

---

# 22. Estado de implementación

## Ya implementado

En `engrase.filtro`:

- Trigger automático para `actualizado_en`.
- Índice único normalizado para evitar códigos duplicados ignorando mayúsculas/minúsculas y espacios externos.

## Decidido, todavía pendiente

- Agregar `activo DEFAULT true` a `filtro`.
- Agregar `activo DEFAULT true` a `tipo_filtro`.
- Agregar `actualizado_en` a `tipo_filtro`.
- Crear trigger de actualización para `tipo_filtro`.
- Ajustar las RPC actuales de selección para no ofrecer objetos desactivados en nuevas asociaciones.
- Implementar en Supabase las RPC específicas del Catálogo definidas en este documento.
- Implementar la cuarta pestaña Sistemas.
- Adaptar las tres pantallas iniciales a la lógica definitiva descrita en este documento.

---

# 23. Regla definitiva del módulo

```text
CATÁLOGO
│
├── Tipo de filtro
│   └── Edita nombre / activo
│
├── Filtro
│   └── Edita código / en compras / activo
│
├── Aceite
│   └── Edita nombre / activo
│
└── Sistema
    └── Edita nombre / activo


RELACIONES CON EQUIPOS
│
├── equipo_filtro
└── equipo_aceite

Se consultan desde Catálogo.
Se modifican únicamente desde la edición del equipo.
```

Esta separación mantiene la integridad del modelo y evita que una pantalla de mantenimiento del catálogo cambie accidentalmente la configuración técnica de uno o varios equipos.


---

# 24. Contrato definitivo de RPC para el Catálogo

Esta sección define las RPC necesarias para implementar completamente las cuatro pestañas del Catálogo y el contrato entre Supabase y el frontend.

A la fecha de esta definición, las RPC `rpc_catalogo_*` aquí descritas son el **contrato objetivo** y todavía deben implementarse en Supabase.

Las RPC se diseñan con estas reglas:

1. Las RPC de listado cargan los datos completos necesarios para la tabla, filtros locales, panel de detalles y cálculo de impacto.
2. El filtrado visual se realiza en el frontend.
3. Abrir el panel de detalles no requiere una segunda consulta si el objeto ya fue cargado por la RPC de listado.
4. Las RPC de guardado solamente escriben en la tabla maestra correspondiente.
5. Las RPC de guardado nunca modifican relaciones de equipos.
6. Después de guardar, la RPC devuelve el objeto completo con el mismo formato utilizado por la RPC de listado.
7. No existirán RPC de eliminación física para estos catálogos. La baja funcional se realiza con `activo = false`.
8. Todos los textos ingresados deben normalizarse al menos con `btrim(...)`.
9. Las validaciones de duplicados deben ser insensibles a mayúsculas/minúsculas y espacios externos.
10. Todas las RPC deben exigir un usuario autenticado.

---

# 25. RPC necesarias

El conjunto definitivo será:

```text
rpc_catalogo_tipos_filtro_listar()
rpc_catalogo_tipo_filtro_guardar(p_data jsonb)

rpc_catalogo_filtros_listar()
rpc_catalogo_filtro_guardar(p_data jsonb)

rpc_catalogo_aceites_listar()
rpc_catalogo_aceite_guardar(p_data jsonb)

rpc_catalogo_sistemas_listar()
rpc_catalogo_sistema_guardar(p_data jsonb)

rpc_catalogo_auxiliares()
```

No se requiere una RPC `detalle` por cada catálogo porque las RPC `listar` devolverán también la información necesaria para abrir el panel de detalles.

---

# 26. Estructura común de impacto

Todos los objetos deben devolver una estructura común denominada conceptualmente `impacto`.

```json
{
  "total_equipos": 18,
  "total_asignaciones": 20,
  "tipos_equipo": [
    {
      "id": 1,
      "nombre": "COMBINADAS",
      "cantidad_equipos": 11
    },
    {
      "id": 2,
      "nombre": "TRACTORES",
      "cantidad_equipos": 7
    }
  ]
}
```

## Significado

### `total_equipos`

Cantidad de equipos distintos que actualmente utilizan el objeto.

Debe calcularse con equipos distintos y no con cantidad de filas de relación.

Conceptualmente:

```sql
count(distinct equipo_id)
```

### `total_asignaciones`

Cantidad de relaciones donde aparece el objeto.

Dependiendo del objeto puede ser mayor que `total_equipos`.

Por ejemplo, un mismo código de filtro puede utilizarse en más de un tipo de filtro dentro del mismo equipo.

### `tipos_equipo`

Agrupación por `engrase.tipo_equipo`.

Cada elemento debe devolver:

```text
id
nombre
cantidad_equipos
```

La cantidad debe representar equipos distintos de ese tipo.

---

# 27. Mensaje de impacto antes de actualizar

El frontend no necesita consultar nuevamente la BD para conocer el impacto antes de guardar.

La RPC de listado ya debe haber enviado:

```text
impacto.total_equipos
impacto.tipos_equipo
```

Antes de llamar a la RPC de guardado, la UI muestra una confirmación.

Ejemplo:

```text
Guardar cambios

Esta actualización se reflejará en 18 equipos.

COMBINADAS: 11
TRACTORES: 7

[Cancelar] [Confirmar]
```

Este mensaje es informativo.

No significa que la RPC actualizará 18 equipos.

Las relaciones continuarán apuntando al mismo `id`.

---

# 28. RPC `rpc_catalogo_tipos_filtro_listar`

## Objetivo

Cargar todos los tipos de filtro necesarios para:

- Tabla de Tipos de filtro.
- Filtro local de estado.
- Panel de detalles.
- Conteo de equipos afectados.
- Agrupación por tipo de equipo.
- Confirmación de impacto antes de editar.

La RPC debe devolver tanto registros activos como desactivados.

El frontend podrá mostrar inicialmente solo activos si así se configura la vista, pero debe tener disponibles los desactivados para el filtro de estado.

## Firma

```sql
engrase.rpc_catalogo_tipos_filtro_listar()
returns jsonb
```

## Payload enviado

No requiere parámetros.

```json
{}
```

En Supabase JS:

```ts
supabase
  .schema('engrase')
  .rpc('rpc_catalogo_tipos_filtro_listar')
```

## Payload retornado

```json
{
  "ok": true,
  "items": [
    {
      "id": 7,
      "nombre": "Filtro de aire 1",
      "activo": true,
      "creado_en": "2026-08-01T14:00:00Z",
      "actualizado_en": "2026-08-11T20:00:00Z",
      "impacto": {
        "total_equipos": 18,
        "total_asignaciones": 18,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "COMBINADAS",
            "cantidad_equipos": 11
          },
          {
            "id": 2,
            "nombre": "TRACTORES",
            "cantidad_equipos": 7
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 17,
    "activos": 17,
    "desactivados": 0
  }
}
```

## Datos utilizados

Tabla principal:

```text
engrase.tipo_filtro
```

Solo lectura para calcular uso:

```text
engrase.equipo_filtro
engrase.equipo
engrase.tipo_equipo
```

---

# 29. RPC `rpc_catalogo_tipo_filtro_guardar`

## Objetivo

Crear o actualizar únicamente el objeto `tipo_filtro`.

No debe crear ni modificar asociaciones en `equipo_filtro`.

## Firma

```sql
engrase.rpc_catalogo_tipo_filtro_guardar(
  p_data jsonb
)
returns jsonb
```

## Regla crear / actualizar

```text
p_data.id = null o no enviado
→ crear

p_data.id con valor
→ actualizar
```

## Payload para crear

```json
{
  "p_data": {
    "id": null,
    "nombre": "Filtro de aire primario",
    "activo": true
  }
}
```

## Payload para actualizar

```json
{
  "p_data": {
    "id": 7,
    "nombre": "Filtro de aire primario",
    "activo": true
  }
}
```

## Campos permitidos

```text
nombre
activo
```

No aceptar campos relacionados con:

```text
equipo
tipo_equipo
equipo_filtro
filtro
```

## Validaciones

- Usuario autenticado.
- `nombre` no vacío después de `btrim`.
- No permitir otro `tipo_filtro` con el mismo nombre normalizado.
- En actualización, verificar que `id` exista.
- Si se desactiva, conservar todas las asociaciones existentes.

## Payload retornado al crear

```json
{
  "ok": true,
  "operacion": "creado",
  "codigo": "TIPO_FILTRO_CREADO",
  "mensaje": "El tipo de filtro se creó correctamente.",
  "afecta_equipos": 0,
  "item": {
    "id": 18,
    "nombre": "Filtro de aire primario",
    "activo": true,
    "creado_en": "2026-08-11T21:00:00Z",
    "actualizado_en": "2026-08-11T21:00:00Z",
    "impacto": {
      "total_equipos": 0,
      "total_asignaciones": 0,
      "tipos_equipo": []
    }
  }
}
```

## Payload retornado al actualizar

```json
{
  "ok": true,
  "operacion": "actualizado",
  "codigo": "TIPO_FILTRO_ACTUALIZADO",
  "mensaje": "El tipo de filtro se actualizó correctamente.",
  "afecta_equipos": 18,
  "item": {
    "id": 7,
    "nombre": "Filtro de aire primario",
    "activo": true,
    "creado_en": "2026-08-01T14:00:00Z",
    "actualizado_en": "2026-08-11T21:05:00Z",
    "impacto": {
      "total_equipos": 18,
      "total_asignaciones": 18,
      "tipos_equipo": [
        {
          "id": 1,
          "nombre": "COMBINADAS",
          "cantidad_equipos": 11
        },
        {
          "id": 2,
          "nombre": "TRACTORES",
          "cantidad_equipos": 7
        }
      ]
    }
  }
}
```

---

# 30. RPC `rpc_catalogo_filtros_listar`

## Objetivo

Cargar todos los códigos de filtro con la información necesaria para:

- Tabla.
- Búsqueda local por código.
- Filtro local por tipo de filtro.
- Filtro local por `En compras`.
- Filtro local por estado.
- Panel de detalles.
- Tipos de filtro asociados actualmente.
- Tipos de equipo asociados.
- Cantidades por tipo de equipo.
- Total de equipos y asignaciones.
- Confirmación de impacto.

## Firma

```sql
engrase.rpc_catalogo_filtros_listar()
returns jsonb
```

## Payload enviado

```json
{}
```

## Payload retornado

```json
{
  "ok": true,
  "items": [
    {
      "id": 25,
      "codigo": "B7030",
      "esta_en_lista_compras": true,
      "activo": true,
      "creado_en": "2026-08-01T14:00:00Z",
      "actualizado_en": "2026-08-11T20:00:00Z",
      "tipos_filtro": [
        {
          "id": 7,
          "nombre": "Filtro de aire 1",
          "cantidad_equipos": 14
        },
        {
          "id": 8,
          "nombre": "Filtro de aire 2",
          "cantidad_equipos": 4
        }
      ],
      "impacto": {
        "total_equipos": 18,
        "total_asignaciones": 20,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "COMBINADAS",
            "cantidad_equipos": 11
          },
          {
            "id": 2,
            "nombre": "TRACTORES",
            "cantidad_equipos": 7
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 270,
    "activos": 270,
    "desactivados": 0,
    "en_compras": 250,
    "fuera_compras": 20
  }
}
```

## Uso en la tabla

La fila **no debe mostrar `tipos_filtro`**.

La fila consume principalmente:

```text
codigo
esta_en_lista_compras
activo
impacto.total_equipos
```

## Uso en filtros frontend

El selector superior `Tipo de filtro` utiliza internamente:

```text
item.tipos_filtro[].id
```

o:

```text
item.tipos_filtro[].nombre
```

sin volver a consultar Supabase.

## Uso en Detalles

Al abrir el panel se muestran:

```text
tipos_filtro
impacto.tipos_equipo
impacto.total_equipos
impacto.total_asignaciones
```

---

# 31. RPC `rpc_catalogo_filtro_guardar`

## Objetivo

Crear o actualizar exclusivamente un registro de:

```text
engrase.filtro
```

Nunca modificar:

```text
engrase.equipo_filtro
engrase.filtro_equivalencia
engrase.equipo_filtro_historial
```

El cambio de código mantiene el mismo `filtro.id`, por lo que las asociaciones siguen siendo válidas.

## Firma

```sql
engrase.rpc_catalogo_filtro_guardar(
  p_data jsonb
)
returns jsonb
```

## Payload para crear

```json
{
  "p_data": {
    "id": null,
    "codigo": "B7030",
    "esta_en_lista_compras": true,
    "activo": true
  }
}
```

## Payload para actualizar

```json
{
  "p_data": {
    "id": 25,
    "codigo": "B7030-A",
    "esta_en_lista_compras": true,
    "activo": true
  }
}
```

## Campos permitidos

```text
codigo
esta_en_lista_compras
activo
```

## Campos que NO deben aceptarse para escritura

```text
tipo_filtro
tipo_filtro_id
tipos_filtro
equipos
tipos_equipo
equivalencias
```

Las asociaciones que aparezcan en el detalle son informativas.

## Validaciones

- Usuario autenticado.
- Código requerido.
- `btrim(codigo)` no vacío.
- Código único utilizando la normalización:

```sql
lower(btrim(codigo))
```

- En actualización, verificar que el `id` exista.
- El índice ya implementado `filtro_codigo_normalizado_uidx` debe seguir siendo la protección final contra duplicados.
- `actualizado_en` se actualiza mediante el trigger ya implementado.
- Si `activo` cambia a `false`, las asociaciones existentes se conservan.

## Payload retornado

```json
{
  "ok": true,
  "operacion": "actualizado",
  "codigo": "FILTRO_ACTUALIZADO",
  "mensaje": "El filtro se actualizó correctamente.",
  "afecta_equipos": 18,
  "item": {
    "id": 25,
    "codigo": "B7030-A",
    "esta_en_lista_compras": true,
    "activo": true,
    "creado_en": "2026-08-01T14:00:00Z",
    "actualizado_en": "2026-08-11T21:10:00Z",
    "tipos_filtro": [
      {
        "id": 7,
        "nombre": "Filtro de aire 1",
        "cantidad_equipos": 14
      },
      {
        "id": 8,
        "nombre": "Filtro de aire 2",
        "cantidad_equipos": 4
      }
    ],
    "impacto": {
      "total_equipos": 18,
      "total_asignaciones": 20,
      "tipos_equipo": [
        {
          "id": 1,
          "nombre": "COMBINADAS",
          "cantidad_equipos": 11
        },
        {
          "id": 2,
          "nombre": "TRACTORES",
          "cantidad_equipos": 7
        }
      ]
    }
  }
}
```

Para creación, el mismo formato debe regresar:

```text
operacion = "creado"
codigo = "FILTRO_CREADO"
afecta_equipos = 0
tipos_filtro = []
impacto.total_equipos = 0
impacto.total_asignaciones = 0
```

---

# 32. RPC `rpc_catalogo_aceites_listar`

## Objetivo

Cargar todos los aceites con:

- Datos propios.
- Sistemas donde actualmente se utilizan.
- Cantidad por sistema.
- Tipos de equipo.
- Cantidad por tipo de equipo.
- Total de equipos.
- Total de asignaciones.

## Firma

```sql
engrase.rpc_catalogo_aceites_listar()
returns jsonb
```

## Payload enviado

```json
{}
```

## Payload retornado

```json
{
  "ok": true,
  "items": [
    {
      "id": 3,
      "nombre": "15W40",
      "activo": true,
      "creado_en": "2026-08-01T14:00:00Z",
      "actualizado_en": "2026-08-11T20:00:00Z",
      "sistemas": [
        {
          "id": 3,
          "nombre": "MOTOR",
          "cantidad_equipos": 18
        },
        {
          "id": 4,
          "nombre": "TRANSMISIÓN",
          "cantidad_equipos": 4
        },
        {
          "id": 5,
          "nombre": "HIDRÁULICO",
          "cantidad_equipos": 1
        }
      ],
      "impacto": {
        "total_equipos": 18,
        "total_asignaciones": 23,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "COMBINADAS",
            "cantidad_equipos": 11
          },
          {
            "id": 2,
            "nombre": "TRACTORES",
            "cantidad_equipos": 7
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 2,
    "activos": 2,
    "desactivados": 0
  }
}
```

## Uso en la tabla

La tabla muestra como máximo los primeros **2 sistemas**, únicamente por nombre.

Ejemplo:

```text
MOTOR
TRANSMISIÓN
+1
```

La cantidad no se muestra en la fila.

El frontend puede calcular:

```text
sistemas_visibles = sistemas.slice(0, 2)
sistemas_restantes = max(sistemas.length - 2, 0)
```

No se necesita otra propiedad específica de la BD para este comportamiento visual.

## Uso en Detalles

En Detalles sí se muestra:

```text
MOTOR: 18 equipos
TRANSMISIÓN: 4 equipos
HIDRÁULICO: 1 equipo
```

y también:

```text
impacto.tipos_equipo
impacto.total_equipos
impacto.total_asignaciones
```

---

# 33. RPC `rpc_catalogo_aceite_guardar`

## Objetivo

Crear o actualizar únicamente:

```text
engrase.aceite
```

No asociar sistemas ni equipos.

## Firma

```sql
engrase.rpc_catalogo_aceite_guardar(
  p_data jsonb
)
returns jsonb
```

## Payload para crear

```json
{
  "p_data": {
    "id": null,
    "nombre": "15W40",
    "activo": true
  }
}
```

## Payload para actualizar

```json
{
  "p_data": {
    "id": 3,
    "nombre": "15W-40",
    "activo": true
  }
}
```

## Campos permitidos

```text
nombre
activo
```

## Campos que NO deben aceptarse para escritura

```text
sistema
sistema_id
sistemas
equipo
equipos
tipos_equipo
```

## Validaciones

- Usuario autenticado.
- Nombre requerido.
- `btrim(nombre)` no vacío.
- No permitir otro aceite con el mismo nombre normalizado:

```sql
lower(btrim(nombre))
```

- Si se desactiva, mantener `equipo_aceite` sin cambios.
- En actualización, verificar que `id` exista.

## Payload retornado

```json
{
  "ok": true,
  "operacion": "actualizado",
  "codigo": "ACEITE_ACTUALIZADO",
  "mensaje": "El aceite se actualizó correctamente.",
  "afecta_equipos": 18,
  "item": {
    "id": 3,
    "nombre": "15W-40",
    "activo": true,
    "creado_en": "2026-08-01T14:00:00Z",
    "actualizado_en": "2026-08-11T21:15:00Z",
    "sistemas": [
      {
        "id": 3,
        "nombre": "MOTOR",
        "cantidad_equipos": 18
      },
      {
        "id": 4,
        "nombre": "TRANSMISIÓN",
        "cantidad_equipos": 4
      }
    ],
    "impacto": {
      "total_equipos": 18,
      "total_asignaciones": 22,
      "tipos_equipo": [
        {
          "id": 1,
          "nombre": "COMBINADAS",
          "cantidad_equipos": 11
        },
        {
          "id": 2,
          "nombre": "TRACTORES",
          "cantidad_equipos": 7
        }
      ]
    }
  }
}
```

Para creación:

```text
afecta_equipos = 0
sistemas = []
impacto = vacío
```

---

# 34. RPC `rpc_catalogo_sistemas_listar`

## Objetivo

Cargar todos los sistemas del catálogo con:

- Nombre.
- Estado.
- Aceites utilizados actualmente.
- Cantidad de equipos por aceite.
- Tipos de equipo.
- Cantidad por tipo.
- Total de equipos.
- Total de asignaciones.

## Firma

```sql
engrase.rpc_catalogo_sistemas_listar()
returns jsonb
```

## Payload enviado

```json
{}
```

## Payload retornado

```json
{
  "ok": true,
  "items": [
    {
      "id": 3,
      "nombre": "MOTOR",
      "activo": true,
      "creado_en": "2026-08-01T14:00:00Z",
      "actualizado_en": "2026-08-11T20:00:00Z",
      "aceites": [
        {
          "id": 3,
          "nombre": "15W40",
          "cantidad_equipos": 18
        },
        {
          "id": 7,
          "nombre": "10W30",
          "cantidad_equipos": 4
        }
      ],
      "impacto": {
        "total_equipos": 22,
        "total_asignaciones": 22,
        "tipos_equipo": [
          {
            "id": 1,
            "nombre": "COMBINADAS",
            "cantidad_equipos": 11
          },
          {
            "id": 2,
            "nombre": "TRACTORES",
            "cantidad_equipos": 8
          },
          {
            "id": 3,
            "nombre": "GENERADORES",
            "cantidad_equipos": 3
          }
        ]
      }
    }
  ],
  "resumen": {
    "total": 3,
    "activos": 3,
    "desactivados": 0
  }
}
```

## Uso en la tabla

La fila se mantiene compacta y utiliza principalmente:

```text
nombre
activo
impacto.total_equipos
```

Los aceites relacionados se muestran en el panel de Detalles.

---

# 35. RPC `rpc_catalogo_sistema_guardar`

## Objetivo

Crear o actualizar únicamente:

```text
engrase.sistema_aceite
```

No modificar `equipo_aceite`.

## Firma

```sql
engrase.rpc_catalogo_sistema_guardar(
  p_data jsonb
)
returns jsonb
```

## Payload para crear

```json
{
  "p_data": {
    "id": null,
    "nombre": "DIFERENCIAL",
    "activo": true
  }
}
```

## Payload para actualizar

```json
{
  "p_data": {
    "id": 3,
    "nombre": "MOTOR PRINCIPAL",
    "activo": true
  }
}
```

## Campos permitidos

```text
nombre
activo
```

## Validaciones

- Usuario autenticado.
- Nombre requerido.
- Nombre no vacío después de `btrim`.
- Evitar nombres duplicados normalizados:

```sql
lower(btrim(nombre))
```

- Verificar `id` en actualización.
- Desactivar no elimina relaciones existentes.

## Payload retornado

```json
{
  "ok": true,
  "operacion": "actualizado",
  "codigo": "SISTEMA_ACTUALIZADO",
  "mensaje": "El sistema se actualizó correctamente.",
  "afecta_equipos": 22,
  "item": {
    "id": 3,
    "nombre": "MOTOR PRINCIPAL",
    "activo": true,
    "creado_en": "2026-08-01T14:00:00Z",
    "actualizado_en": "2026-08-11T21:20:00Z",
    "aceites": [
      {
        "id": 3,
        "nombre": "15W40",
        "cantidad_equipos": 18
      },
      {
        "id": 7,
        "nombre": "10W30",
        "cantidad_equipos": 4
      }
    ],
    "impacto": {
      "total_equipos": 22,
      "total_asignaciones": 22,
      "tipos_equipo": [
        {
          "id": 1,
          "nombre": "COMBINADAS",
          "cantidad_equipos": 11
        },
        {
          "id": 2,
          "nombre": "TRACTORES",
          "cantidad_equipos": 8
        },
        {
          "id": 3,
          "nombre": "GENERADORES",
          "cantidad_equipos": 3
        }
      ]
    }
  }
}
```

---

# 36. RPC `rpc_catalogo_auxiliares`

## Objetivo

Cargar las listas dinámicas necesarias para controles de filtrado del Catálogo.

No se utiliza para crear asociaciones.

## Firma

```sql
engrase.rpc_catalogo_auxiliares()
returns jsonb
```

## Payload enviado

```json
{}
```

## Payload retornado

```json
{
  "ok": true,
  "tipos_filtro": [
    {
      "id": 7,
      "nombre": "Filtro de aire 1",
      "activo": true
    },
    {
      "id": 8,
      "nombre": "Filtro de aire 2",
      "activo": false
    }
  ],
  "sistemas": [
    {
      "id": 3,
      "nombre": "MOTOR",
      "activo": true
    },
    {
      "id": 4,
      "nombre": "TRANSMISIÓN",
      "activo": true
    }
  ]
}
```

## Por qué devuelve activos y desactivados

Esta RPC pertenece al **Catálogo**, no al formulario de nueva asociación de equipos.

Un filtro desactivado o un sistema desactivado puede continuar apareciendo en relaciones históricas o actuales.

Por lo tanto, el usuario debe poder utilizarlo como criterio de filtrado en el Catálogo.

Esto es diferente de:

```text
rpc_obtener_auxiliares_edicion_equipo()
```

que para una **nueva asociación** debe devolver solamente opciones activas.

---

# 37. Flujo frontend definitivo

## 37.1. Entrada al Catálogo

Al entrar al módulo:

```text
1. Cargar rpc_catalogo_auxiliares()
2. Cargar la pestaña inicial
```

Las demás pestañas pueden cargarse al abrirse por primera vez para evitar consultas que el usuario quizá no utilice.

Ejemplo:

```text
Tipos de filtro → rpc_catalogo_tipos_filtro_listar()
Filtros         → rpc_catalogo_filtros_listar()
Aceites         → rpc_catalogo_aceites_listar()
Sistemas        → rpc_catalogo_sistemas_listar()
```

---

## 37.2. Filtrar una tabla

No llamar nuevamente a Supabase.

Ejemplo en Filtros:

```text
texto
tipo_filtro_id
en_compras
estado
```

se aplican sobre:

```text
items[]
```

ya cargados.

---

## 37.3. Abrir Detalles

No llamar una RPC adicional.

La fila seleccionada ya contiene:

```text
datos propios
asociaciones informativas
impacto
```

La UI simplemente abre el panel lateral con ese objeto.

---

## 37.4. Editar

Flujo:

```text
Usuario modifica el formulario
        ↓
Frontend conoce item.impacto.total_equipos
        ↓
Muestra confirmación de impacto
        ↓
Usuario confirma
        ↓
Llama rpc_catalogo_*_guardar
        ↓
RPC actualiza solamente la tabla maestra
        ↓
RPC retorna item completo actualizado
        ↓
Frontend reemplaza el objeto dentro de items[]
```

No es obligatorio volver a cargar todo el listado después de cada edición.

---

## 37.5. Crear

Flujo:

```text
Nuevo objeto
    ↓
Formulario
    ↓
rpc_catalogo_*_guardar con id = null
    ↓
RPC crea registro
    ↓
Retorna item con impacto 0
    ↓
Frontend agrega item a items[]
```

Las asociaciones aparecerán posteriormente cuando un equipo utilice ese objeto.

---

# 38. Tratamiento de desactivados en edición de equipos

La lógica del Catálogo y la lógica de edición de equipos deben diferenciarse.

## Nueva asociación

Las opciones deben limitarse a objetos activos.

Ejemplos:

```text
tipo_filtro.activo = true
filtro.activo = true
aceite.activo = true
sistema_aceite.activo = true
```

## Asociación existente

`rpc_obtener_equipo_para_edicion()` debe seguir cargando el objeto asociado aunque esté desactivado.

Ejemplo:

```text
Equipo 123
└── Filtro B7030
    └── activo = false
```

El filtro debe seguir apareciendo al editar ese equipo porque la relación existe.

No debe desaparecer de la UI ni eliminarse automáticamente.

---

# 39. Ajustes necesarios en RPC existentes cuando se agregue `activo`

Después de agregar:

```text
filtro.activo
tipo_filtro.activo
```

se deberán revisar las RPC actuales que sirven para nuevas asociaciones.

## `rpc_obtener_auxiliares_edicion_equipo()`

Para nuevas selecciones de tipo de filtro debe devolver únicamente:

```sql
tipo_filtro.activo = true
```

Aceites y sistemas ya siguen este patrón.

## `rpc_buscar_filtro_original_para_asignar(...)`

Para ofrecer un filtro como nueva asignación deberá considerar:

```sql
filtro.activo = true
```

Un filtro desactivado que ya esté asociado a un equipo no debe borrarse ni ocultarse de:

```text
rpc_obtener_equipo_para_edicion()
```

---

# 40. Errores funcionales esperados

Las RPC de guardado deben utilizar códigos de error consistentes.

## Generales

```text
AUTENTICACION_REQUERIDA
PAYLOAD_INVALIDO
REGISTRO_NO_ENCONTRADO
```

## Tipo de filtro

```text
TIPO_FILTRO_NOMBRE_REQUERIDO
TIPO_FILTRO_NOMBRE_DUPLICADO
TIPO_FILTRO_NO_ENCONTRADO
```

## Filtro

```text
CODIGO_FILTRO_REQUERIDO
CODIGO_FILTRO_DUPLICADO
FILTRO_NO_ENCONTRADO
```

## Aceite

```text
ACEITE_NOMBRE_REQUERIDO
ACEITE_NOMBRE_DUPLICADO
ACEITE_NO_ENCONTRADO
```

## Sistema

```text
SISTEMA_NOMBRE_REQUERIDO
SISTEMA_NOMBRE_DUPLICADO
SISTEMA_NO_ENCONTRADO
```

La UI debe convertir estos códigos en mensajes comprensibles para el usuario.

---

# 41. Seguridad de las RPC

Las RPC expuestas al frontend deben seguir el patrón:

```text
SECURITY DEFINER
SET search_path TO ''
```

y verificar al inicio:

```sql
auth.uid() is not null
```

Además, deben tener `EXECUTE` solamente para los roles permitidos.

Las funciones internas auxiliares que construyan los objetos JSON no necesitan exponerse directamente al frontend.

---

# 42. Funciones internas recomendadas

Para evitar duplicar la lógica de agregación entre las RPC `listar` y `guardar`, es recomendable crear funciones internas:

```text
fn_catalogo_tipo_filtro_item(p_id bigint)
fn_catalogo_filtro_item(p_id bigint)
fn_catalogo_aceite_item(p_id bigint)
fn_catalogo_sistema_item(p_id bigint)
```

Estas funciones devolverían exactamente el objeto individual utilizado dentro de `items[]`.

Ejemplo:

```text
rpc_catalogo_filtros_listar()
    └── llama fn_catalogo_filtro_item(id) para construir cada registro

rpc_catalogo_filtro_guardar()
    └── después de INSERT/UPDATE llama fn_catalogo_filtro_item(id)
```

Beneficios:

- Un único formato de respuesta.
- Menor duplicación de SQL.
- Menor riesgo de que listado y guardado devuelvan estructuras distintas.
- El frontend siempre recibe el mismo contrato.

Estas funciones son internas y no forman parte de la API pública del frontend.

---

# 43. Resumen de contratos

| RPC | Escritura | Devuelve asociaciones | Uso |
|---|---|---:|---|
| `rpc_catalogo_tipos_filtro_listar` | No | Sí | Tabla, filtros y detalles |
| `rpc_catalogo_tipo_filtro_guardar` | `tipo_filtro` | Sí, solo lectura en retorno | Crear/editar |
| `rpc_catalogo_filtros_listar` | No | Sí | Tabla, filtros y detalles |
| `rpc_catalogo_filtro_guardar` | `filtro` | Sí, solo lectura en retorno | Crear/editar |
| `rpc_catalogo_aceites_listar` | No | Sí | Tabla, filtros y detalles |
| `rpc_catalogo_aceite_guardar` | `aceite` | Sí, solo lectura en retorno | Crear/editar |
| `rpc_catalogo_sistemas_listar` | No | Sí | Tabla y detalles |
| `rpc_catalogo_sistema_guardar` | `sistema_aceite` | Sí, solo lectura en retorno | Crear/editar |
| `rpc_catalogo_auxiliares` | No | No | Selectores/filtros dinámicos |

---

# 44. Regla final de consistencia de payloads

Las cuatro RPC de listado deben devolver:

```json
{
  "ok": true,
  "items": [],
  "resumen": {}
}
```

Las cuatro RPC de guardado deben devolver:

```json
{
  "ok": true,
  "operacion": "creado | actualizado",
  "codigo": "CODIGO_FUNCIONAL",
  "mensaje": "Mensaje para UI",
  "afecta_equipos": 0,
  "item": {}
}
```

El objeto `item` retornado por una RPC de guardado debe tener **exactamente la misma estructura** que el elemento correspondiente de `items[]` retornado por su RPC de listado.

Esto permite que el frontend actualice su estado local sin transformar datos ni ejecutar una consulta adicional.

---

# 45. Límite definitivo de responsabilidad

Las nuevas RPC del Catálogo pueden consultar relaciones para responder preguntas como:

```text
¿Dónde se usa?
¿Cuántos equipos lo usan?
¿Qué tipos de equipo lo usan?
¿Qué sistemas están relacionados?
¿Qué tipos de filtro están relacionados?
```

Pero nunca deben responder a acciones como:

```text
Asociar este filtro a un equipo
Cambiar el tipo de filtro de un equipo
Cambiar el aceite de un sistema de un equipo
Eliminar una asociación
```

Esas acciones pertenecen a la edición del equipo y a sus RPC específicas.

La separación definitiva queda:

```text
CATÁLOGO
    administra objetos maestros

EQUIPOS
    administra relaciones con esos objetos
```
