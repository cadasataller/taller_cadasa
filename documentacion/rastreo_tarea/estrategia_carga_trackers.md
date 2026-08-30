# Estrategia técnica de trackers: mapeo de datos y reutilización de carga

## Objetivo

Obtener la lista completa de dispositivos una sola vez por sesión activa, conservar la respuesta original para diagnóstico y derivar a partir de ella estructuras más pequeñas y seguras para consumo de la interfaz.

## Principios

1. La respuesta original del proveedor externo debe preservarse íntegra en memoria.
2. La transformación para uso interno debe hacerse en una capa separada.
3. La interfaz no debe volver a pedir la lista si ya existe una versión vigente en memoria.
4. Las solicitudes concurrentes del mismo recurso deben consolidarse en una sola operación en curso.
5. Los registros incompletos no deben bloquear toda la carga; deben omitirse y reportarse como observaciones de calidad.

## Flujo de adquisición

1. Antes de consultar el listado de dispositivos, el cliente obtiene una credencial temporal del backend.
2. Esa credencial se guarda en memoria y se reutiliza durante la vida útil de la sesión del cliente.
3. Con esa credencial, el cliente solicita la lista completa al proveedor externo.
4. La respuesta completa se conserva en memoria sin recortarla ni mutarla.
5. Las vistas derivadas se construyen a partir de esa respuesta ya cargada.

## Endpoints involucrados

La estrategia utiliza dos puntos de entrada diferenciados:

1. Origen del endpoint de credenciales: backend interno expuesto mediante Supabase Edge Functions
2. Endpoint interno para obtener la credencial efímera del proveedor externo: `navixy-key`
3. Origen del endpoint de dispositivos: API externa de Navixy
4. Endpoint externo para obtener la lista completa de dispositivos: `https://api.us.navixy.com/v2/tracker/list`

La secuencia esperada es:

1. el cliente solicita la credencial al endpoint interno `navixy-key`;
2. con esa credencial consulta el endpoint externo de listado de dispositivos;
3. la respuesta externa se conserva en memoria y se reutiliza en adelante.

## Cómo evitar cargar la lista cuando ya está cargada

La regla principal es simple:

- si la respuesta completa ya existe en memoria, se reutiliza;
- si todavía no existe pero ya hay una solicitud en curso, se reutiliza esa misma solicitud;
- solo si no existe ni respuesta almacenada ni solicitud activa, se inicia una nueva carga remota.

Con esto se evita:

- duplicar tráfico hacia el proveedor externo;
- inconsistencias entre componentes que piden el mismo recurso al mismo tiempo;
- esperas innecesarias en pantallas que ya cuentan con datos disponibles.

## Consolidación de solicitudes concurrentes

Cuando varias partes del sistema piden la lista casi al mismo tiempo, no deben abrir procesos independientes.

La estrategia correcta es mantener una referencia única a la carga activa y entregar ese mismo resultado a todos los consumidores interesados. Al finalizar, esa referencia transitoria se libera para permitir una futura recarga controlada si realmente hiciera falta.

## Estrategia de mapeo de datos

La respuesta externa contiene más campos de los necesarios para la interfaz. Por eso se recomienda derivar un contrato interno reducido con solo los atributos operativos esenciales.

Para cada dispositivo, el mapeo debe producir una estructura con:

1. identificador del dispositivo;
2. nombre visible;
3. identificador de la fuente operativa asociada.

## Validación durante el mapeo

Antes de aceptar cada registro, deben validarse al menos estas condiciones:

1. el identificador del dispositivo existe y es numérico válido;
2. el nombre visible existe y no está vacío;
3. el identificador de la fuente asociada existe y es numérico válido.

Si un registro incumple alguna de estas reglas:

- el registro se omite del resultado derivado;
- se agrega una observación de validación;
- la respuesta completa original se conserva sin alterar.

## Separación entre dato fuente y dato derivado

Mantener dos niveles de datos evita mezclar responsabilidades:

- dato fuente: la respuesta completa recibida del proveedor externo;
- dato derivado: la lista reducida y validada que usa la interfaz.

Esa separación permite:

- depurar problemas sin perder contexto original;
- recalcular vistas filtradas sin volver a consultar al proveedor;
- endurecer validaciones internas sin destruir evidencia de origen.

## Filtrado por contexto operativo sin recarga remota

Cuando una pantalla necesita solo un subconjunto de dispositivos, el filtro debe aplicarse sobre la respuesta ya cargada en memoria, no mediante una nueva consulta al proveedor externo.

El flujo recomendado es:

1. reutilizar la respuesta completa en memoria;
2. obtener las reglas internas de asociación del contexto solicitado;
3. filtrar localmente la lista completa;
4. mapear y validar solo el subconjunto resultante.

## Manejo de errores

La estrategia distingue entre dos clases de error:

1. Error de carga remota: impide obtener la lista completa y debe marcar la operación como fallida.
2. Error de calidad de registro individual: no impide usar los demás dispositivos válidos, pero debe quedar informado.

Esto mejora la resiliencia porque evita que un solo registro defectuoso inutilice toda la funcionalidad.

## Beneficios operativos

Este enfoque aporta:

- menor consumo de red;
- menor tiempo de respuesta en vistas repetidas;
- consistencia entre componentes;
- trazabilidad de la respuesta externa original;
- validación controlada antes del consumo interno;
- posibilidad de filtrar localmente sin repetir la consulta remota.

## Regla de diseño

Si se refactoriza este flujo en el futuro, deben preservarse estas propiedades:

1. reutilización de la credencial por sesión;
2. reutilización de la respuesta completa ya cargada;
3. consolidación de solicitudes simultáneas;
4. mapeo a un contrato interno mínimo;
5. omisión segura de registros incompletos con observaciones de validación;
6. filtrado local a partir de la respuesta ya disponible.
