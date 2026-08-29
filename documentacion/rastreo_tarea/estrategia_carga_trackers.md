# Estrategia técnica de reutilización de claves del mapa

## Objetivo

Garantizar que la carga del mapa sea resiliente frente a límites temporales, cuotas agotadas o rechazo de autenticación, evitando solicitudes innecesarias de claves y permitiendo una recuperación automática desde el cliente.

## Modelo de claves

La estrategia opera con dos credenciales lógicas:

- Clave principal: se utiliza en la primera carga.
- Clave de respaldo: se reserva para reintentos cuando la principal falla o queda limitada.

Cada credencial se conserva en memoria de la sesión activa del cliente. Eso permite reutilizarla sin volver a pedirla en cada intento de carga, reduciendo latencia y evitando tráfico redundante hacia el backend.

## Endpoint involucrado

La obtención de credenciales del mapa se resuelve mediante un endpoint de backend expuesto a través de la capa de servicios del sistema.

- Origen del endpoint de credenciales: backend interno expuesto mediante Supabase Edge Functions
- Endpoint utilizado para clave principal o de respaldo: `maps-key`
- Origen del proveedor de render del mapa: servicio externo de Google Maps JavaScript

Ese endpoint recibe el contexto de la solicitud y responde con la credencial que corresponde al flujo normal o al flujo de respaldo.

## Flujo general de carga

1. El cliente intenta cargar el motor del mapa con la clave principal.
2. Si la carga se completa correctamente, la sesión continúa usando esa credencial.
3. Si la obtención de la clave principal falla o la carga del mapa no llega a completarse, el cliente solicita la clave de respaldo y repite la carga.
4. Si ambas rutas fallan, el cliente considera que la inicialización no pudo resolverse automáticamente.

## Cuándo debe pedirse la clave desde el frontend

El frontend debe pedir una clave al backend solo en estos casos:

1. Cuando la sesión aún no tiene en memoria la clave principal y se va a iniciar la primera carga del mapa.
2. Cuando se necesita activar el camino de respaldo y la sesión aún no tiene en memoria la clave secundaria.
3. Cuando se fuerza una recarga completa del proveedor del mapa tras detectar que la credencial activa ya no es válida para continuar.

Fuera de esos escenarios, la regla es reutilizar la clave ya disponible en memoria.

## Qué comportamientos disparan el cambio a la clave de respaldo

El paso a la clave secundaria no depende únicamente de una respuesta explícita del backend. También puede dispararse por señales observables en tiempo de ejecución del lado cliente.

Los disparadores relevantes son:

1. Error de autenticación de la credencial al intentar inicializar el proveedor del mapa.
2. Falla de carga del recurso remoto del mapa.
3. Mensajes de error que indiquen agotamiento de cuota, límite diario alcanzado o restricción equivalente de la credencial activa.
4. Inicialización incompleta del mapa acompañada de evidencia de límite de consumo detectada durante el arranque.

## Detección funcional del límite

La estrategia no espera solo un error formal al momento de crear el mapa. También observa el comportamiento del proceso de inicialización.

Se considera que la credencial principal debe abandonarse cuando ocurre alguno de estos patrones:

1. El proveedor emite mensajes compatibles con cuota agotada o límite diario alcanzado.
2. El mapa intenta construirse, pero antes de estabilizarse aparece una señal consistente con límite de consumo.
3. El proceso entra en un estado en el que la carga técnica ocurre, pero la instancia no queda operativa de manera confiable.

Esto es importante porque algunos límites no siempre se manifiestan como una única respuesta de error estructurada; a veces aparecen como mensajes laterales durante el arranque.

## Estrategia de recarga

Cuando se detecta que la clave principal quedó limitada:

1. Se invalida la instancia cargada del proveedor del mapa en el cliente.
2. Se eliminan residuos de la carga previa para evitar mezclar estados.
3. Se marca la sesión como operando con la clave secundaria.
4. Se recarga el proveedor del mapa usando la credencial de respaldo.
5. Se reconstruye la instancia visual del mapa con el mismo contexto funcional que tenía antes de la recarga.

## Control de concurrencia

La estrategia debe impedir recargas duplicadas al mismo tiempo. Si múltiples partes de la interfaz detectan el mismo problema, todas deben converger en un único proceso de recuperación en curso.

Esto evita:

- solicitar varias veces la misma clave de respaldo;
- recargar el proveedor remoto más de una vez;
- perder consistencia entre el estado visual y el estado interno del mapa.

## Beneficios operativos

Esta estrategia ofrece:

- menor número de solicitudes de credenciales;
- recuperación automática frente a límites temporales;
- continuidad de la experiencia del usuario sin intervención manual;
- aislamiento entre el flujo principal y el flujo de respaldo;
- mejor tolerancia a fallas parciales de autenticación o consumo.

## Regla de diseño

Si en el futuro se modifica el mecanismo de carga del mapa, debe conservarse un comportamiento equivalente que cumpla estas propiedades:

1. reutilización en memoria por sesión;
2. distinción entre credencial principal y credencial de respaldo;
3. detección de límites por error explícito y por comportamiento observado;
4. recarga controlada del proveedor del mapa;
5. prevención de recargas simultáneas.
