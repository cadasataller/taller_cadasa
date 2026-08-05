# Contexto funcional: equipos e imagen principal de Engrase

## 1. Objetivo

La implementación permite administrar los equipos del módulo de Engrase y asociarles una imagen principal reconocible, sin duplicar el catálogo general de equipos ni almacenar la misma imagen en más de un lugar.

El módulo de Engrase trabaja con su propia información operativa, mientras que `public.equipos` continúa funcionando como catálogo general compartido por otros módulos. Ambos registros se relacionan mediante el código del equipo.

## 2. Cambios implementados

### 2.1. Administración de equipos de Engrase

Los usuarios autenticados pueden realizar todas las operaciones sobre los equipos de Engrase:

- Consultar equipos.
- Registrar equipos.
- Modificar equipos.
- Eliminar equipos.

La tabla mantiene la seguridad por filas activa y las operaciones están habilitadas únicamente para usuarios autenticados.

### 2.2. Sincronización con el catálogo público

Todo equipo registrado en Engrase debe existir también en `public.equipos`.

Cuando se intenta registrar un equipo nuevo en Engrase, la base de datos verifica automáticamente si su código existe en el catálogo público. Cuando no existe, se crea un registro mínimo en `public.equipos` antes de completar el registro de Engrase.

El registro mínimo conserva:

- El código del equipo.
- El estado activo o inactivo derivado del estado registrado en Engrase.

Los campos de tipo, marca y modelo pueden quedar vacíos hasta que exista información confiable para completarlos.

Si el equipo ya existe en `public.equipos`, el proceso no reemplaza la información existente.

### 2.3. Integridad entre los dos esquemas

Se estableció una relación obligatoria entre:

- `engrase.equipo.codigo`
- `public.equipos.cod_equipo`

Esta relación evita que quede un equipo de Engrase sin su correspondiente registro público.

La creación automática y la relación obligatoria cumplen funciones distintas:

- La creación automática resuelve el atraso del catálogo público.
- La relación obligatoria evita inconsistencias posteriores.

Cuando se cambia el código de un equipo en Engrase, el sistema primero asegura que el nuevo código exista en el catálogo público y después valida la relación.

Eliminar un equipo de Engrase no elimina automáticamente el equipo del catálogo público, porque ese equipo puede seguir siendo utilizado por otros módulos.

### 2.4. Almacenamiento de imágenes

Se creó un bucket privado llamado `imagenes-equipos`.

Características:

- Solo acepta imágenes WebP.
- Tamaño máximo por archivo: 5 MB.
- Los usuarios autenticados pueden consultar, subir, reemplazar y eliminar imágenes.
- Los archivos no son públicos y requieren una sesión autenticada para acceder.

### 2.5. Registro de metadata

Las imágenes se almacenan físicamente en Storage, mientras que su relación con el equipo se registra en `public.equipo_imagen`.

Esta tabla pertenece al esquema público porque las imágenes deben estar disponibles para cualquier módulo que consulte el catálogo general, no solamente para Engrase.

La tabla admite diferentes funciones de imagen para futuras ampliaciones, pero Engrase utilizará inicialmente solo la imagen principal en formato miniatura.

### 2.6. Vista para Engrase

Se creó una vista de consulta en el esquema Engrase que combina:

- La información operativa de `engrase.equipo`.
- El nombre del tipo de equipo de Engrase.
- La metadata relacionada con la imagen principal.
- La ruta de la imagen principal.
- Un indicador que señala si el equipo tiene imagen.
- La fecha de actualización de la imagen.

La vista no devuelve columnas de `public.equipos`. La relación con el catálogo público continúa existiendo para garantizar la integridad del código y permitir que la misma imagen pueda utilizarse desde otros módulos, pero esos datos no forman parte del resultado de la vista.

La vista devuelve la ruta del archivo, pero no descarga la imagen. Esto permite cargar todos los registros de equipos sin descargar todas sus imágenes al mismo tiempo.

## 3. Nomenclatura de la imagen principal

La imagen principal de cada equipo debe almacenarse con la siguiente estructura lógica:

- Carpeta: código del equipo.
- Nombre del archivo: `main.webp`.

La ruta resultante identifica de manera única la miniatura principal de cada equipo.

La imagen principal cumple estas funciones:

- Facilitar el reconocimiento del equipo en listados.
- Servir como imagen predeterminada en búsquedas.
- Aparecer cuando todavía no existe una galería de imágenes.
- Mantener un peso reducido para no afectar la carga del listado.

No debe utilizarse otro nombre para la imagen principal inicial.

## 4. Flujo de registro de un equipo

### 4.1. Captura de datos

El usuario autenticado registra en Engrase:

- Código.
- Tipo de equipo.
- Subtipo.
- Estado.

### 4.2. Validación del catálogo general

Antes de completar el registro:

1. La base de datos comprueba si el código existe en `public.equipos`.
2. Si no existe, crea el registro público mínimo.
3. La relación entre ambos catálogos valida que el código público ya esté disponible.
4. Se completa el registro en `engrase.equipo`.

Este proceso ocurre dentro de la base de datos. La aplicación puede continuar conectada al esquema Engrase y no necesita realizar una inserción separada en el esquema público.

### 4.3. Resultado

Al finalizar:

- El equipo existe en Engrase.
- El código existe en el catálogo público.
- El equipo puede relacionarse con una imagen.
- Otros módulos pueden reconocer el mismo código.

## 5. Flujo de carga de la imagen principal

### 5.1. Condición previa

La imagen solo debe cargarse después de que el equipo haya sido registrado correctamente.

Esto garantiza que exista el código necesario tanto en Engrase como en el catálogo público.

### 5.2. Preparación de la imagen

Antes de subirla, la aplicación debe:

- Convertirla a WebP.
- Reducir sus dimensiones para uso como miniatura.
- Mantener una calidad suficiente para reconocer el equipo.
- Evitar conservar archivos originales innecesariamente grandes.
- Nombrarla siempre `main.webp`.

La imagen debe priorizar velocidad y reconocimiento visual, no alta definición.

### 5.3. Carga en Storage

La aplicación guarda la imagen dentro de la carpeta correspondiente al código del equipo.

Si ya existe una imagen principal para ese código, la nueva imagen la reemplaza.

### 5.4. Registro de la relación

Después de una carga correcta, se registra la ruta en la metadata de imágenes.

Solo puede existir una imagen principal de miniatura por equipo.

### 5.5. Manejo de fallos

La carga del archivo y el registro de metadata son operaciones separadas.

La aplicación debe controlar estos casos:

- Si falla la subida del archivo, no debe registrar metadata.
- Si el archivo se sube pero falla la metadata, debe intentar retirar el archivo recién cargado para evitar archivos sin relación.
- La interfaz debe confirmar el éxito solo cuando ambas operaciones terminen correctamente.

## 6. Consulta del listado de equipos

La aplicación puede consultar todos los equipos utilizando la vista de Engrase.

La respuesta incluye la ruta de la imagen principal cuando existe, pero consultar la vista no descarga los archivos.

Para el listado:

- Se muestran todos los equipos.
- Los equipos sin imagen utilizan una representación visual predeterminada.
- Solo se preparan enlaces de acceso para las imágenes que existan.
- Las miniaturas deben cargarse de forma diferida cuando estén próximas al área visible.
- No se deben cargar imágenes adicionales ni de mayor resolución en el listado.

Este comportamiento permite consultar el catálogo completo sin descargar todas las imágenes inmediatamente.

## 7. Consulta del detalle de un equipo

Durante esta etapa inicial, el detalle utilizará también `main.webp`, porque Engrase solo administrará una imagen principal.

En una ampliación futura se podrán agregar:

- Imagen principal de mayor resolución.
- Vista frontal.
- Vista lateral.
- Vista trasera.
- Interior.
- Motor.
- Placa.

La estructura actual ya admite estas funciones, pero no forman parte del flujo inicial de Engrase.

## 8. Actualización de la imagen principal

Cuando el usuario cambie la imagen principal:

1. Selecciona o captura una nueva fotografía.
2. La aplicación la convierte y reduce.
3. Se reemplaza el archivo `main.webp` del equipo.
4. Se actualiza la fecha de modificación de la metadata.
5. Los listados posteriores muestran la nueva miniatura.

La aplicación debe evitar mostrar una versión almacenada en caché después del reemplazo. Para ello, puede utilizar la fecha de actualización de la imagen como parte del control de refresco.

## 9. Eliminación de la imagen principal

Eliminar la imagen principal no elimina el equipo.

El proceso debe:

1. Eliminar el archivo del bucket.
2. Eliminar su registro de metadata.
3. Mantener el registro del equipo en ambos catálogos.
4. Hacer que la vista indique que el equipo ya no tiene imagen.
5. Mostrar la representación predeterminada en el listado.

## 10. Eliminación de equipos

La eliminación de un equipo de Engrase debe utilizarse con cuidado porque el equipo puede tener relaciones con filtros, etapas u otros datos operativos.

La base de datos impedirá la eliminación cuando existan relaciones que requieran conservar el equipo, salvo que esas relaciones hayan sido gestionadas previamente.

Cuando un equipo se elimina de Engrase:

- No se elimina automáticamente de `public.equipos`.
- No se debe asumir que dejó de existir para otros módulos.
- La eliminación de su imagen debe manejarse de forma explícita cuando corresponda.

## 11. Reglas de negocio principales

1. Todos los equipos de Engrase deben existir en `public.equipos`.
2. Registrar desde Engrase crea automáticamente el registro público mínimo cuando sea necesario.
3. La aplicación puede permanecer conectada al esquema Engrase durante el registro.
4. El código del equipo es el identificador compartido entre ambos esquemas.
5. La imagen pertenece al equipo público para que pueda reutilizarse desde cualquier módulo.
6. Engrase administra inicialmente una sola imagen principal.
7. La imagen principal siempre se llama `main.webp`.
8. Cada equipo puede tener como máximo una imagen principal de miniatura.
9. La imagen debe ser WebP y no superar 5 MB.
10. Solo usuarios autenticados pueden administrar equipos e imágenes.
11. Consultar equipos no debe descargar automáticamente todas las imágenes.
12. El listado utiliza carga diferida de miniaturas.
13. Eliminar una imagen no elimina el equipo.
14. Eliminar un equipo de Engrase no elimina automáticamente el registro público.
15. Los futuros ángulos de imagen podrán incorporarse sin modificar el modelo principal.

## 12. Estado actual

La implementación quedó configurada con:

- Operaciones completas para usuarios autenticados en `engrase.equipo`.
- Creación automática de equipos faltantes en `public.equipos`.
- Relación obligatoria entre los códigos de ambos esquemas.
- Cero equipos de Engrase sin correspondiente registro público.
- Bucket privado para imágenes de equipos.
- Restricción exclusiva a archivos WebP.
- Límite de 5 MB por imagen.
- Administración de Storage para usuarios autenticados.
- Tabla pública de metadata de imágenes.
- Vista de Engrase con datos operativos de Engrase y metadata de la imagen principal, sin columnas de `public.equipos`.
- Soporte inicial para una única miniatura `main.webp` por equipo.
