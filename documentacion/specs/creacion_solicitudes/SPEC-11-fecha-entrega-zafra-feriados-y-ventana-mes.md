ESPECIFICACION COMPLEMENTARIA — FECHA DE ENTREGA / ZAFRA ACTIVA / FERIADOS GLOBALES
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Crear solicitud nueva, guardar borrador y continuar borrador
FECHA DE CONTEXTO: 2026-07-06
PROYECTO: gestion operativa / solicitudes compras

Referencia principal:

- `documentacion/specs/creacion_solicitudes/spec.md`

Referencias complementarias:

- `documentacion/specs/creacion_solicitudes/SPEC-08-borradores-carga-hidratacion-y-creacion.md`
- `documentacion/specs/creacion_solicitudes/SPEC-09-modal-borradores-ui-y-flujo.md`
- `documentacion/specs/creacion_solicitudes/SPEC-10-validacion-stepper-y-saneamiento-borradores.md`

=====================================================================
1. OBJETIVO
=====================================================================

Definir la logica funcional y tecnica para controlar la `fechaEntrega` de una solicitud de compra bajo estas condiciones:

- regla normal con anticipacion minima de 12 dias habiles
- exclusion de sabados, domingos y feriados
- restriccion operativa para entregas solo entre los dias `1` y `24` de cada mes
- desplazamiento automatico al siguiente dia valido cuando el resultado cae entre `25` y `31`
- excepcion total cuando exista `zafra activa`
- comportamiento consistente entre:
  - seleccion visual de fecha
  - validacion del paso 1
  - guardado de borrador
  - autoguardado
  - envio final
  - rehidratacion de borradores
  - señalizacion de borradores que requieren revision

Este documento no define estilos cosmeticos arbitrarios. Define reglas de negocio, fuente de datos global para feriados y criterios de consistencia.

=====================================================================
2. CONTEXTO DEL PROBLEMA
=====================================================================

La implementacion actual solo valida que:

- la fecha exista
- la fecha sea parseable
- la fecha no sea menor a la fecha actual

Eso es insuficiente para la operacion real de compras, porque hoy no se contempla:

- anticipacion minima por dias habiles
- exclusion de feriados oficiales
- restriccion de fin de mes del dia `25` al `31`
- cruce de mes y cruce de año al buscar el siguiente dia valido
- suspension temporal de todas las restricciones durante zafra activa

Tambien existe una brecha funcional en borradores:

- un borrador puede seguir viendose valido aunque su fecha ya no cumpla las reglas nuevas
- la revision de borradores hoy solo detecta fechas anteriores a hoy

=====================================================================
3. DEFINICIONES OPERATIVAS
=====================================================================

3.1 Dia habil

Para este flujo, un `dia habil` es cualquier fecha que cumpla simultaneamente:

- no sea sabado
- no sea domingo
- no exista dentro del calendario global de feriados cargado para Panama

3.2 Dia invalido de entrega

Una fecha es invalida para entrega en modo normal si ocurre cualquiera de estos casos:

- es sabado
- es domingo
- es feriado
- su dia del mes esta entre `25` y `31`
- ocurre antes de la fecha minima calculada

3.3 Zafra activa

`zafra activa` es una condicion global del negocio, independiente de `tipoSolicitud`.

No significa:

- que la solicitud sea de tipo `zafra`
- que el usuario tenga un permiso especial por rol

Si `zafra activa = true`, se deshabilitan todas las restricciones normales de fecha para cualquier tipo de solicitud.

=====================================================================
4. REGLA DE NEGOCIO PRINCIPAL
=====================================================================

4.1 Modo normal

Cuando `zafra activa = false`, la fecha de entrega debe cumplir todas estas reglas:

- debe existir
- debe ser una fecha valida
- no puede ser menor a hoy
- debe ser al menos el resultado de sumar 12 dias habiles a partir de hoy
- no puede caer en sabado
- no puede caer en domingo
- no puede caer en un feriado
- no puede caer del dia `25` al `31` del mes

4.2 Modo zafra activa

Cuando `zafra activa = true`, la fecha de entrega:

- debe existir
- debe ser una fecha valida

Y se ignoran estas restricciones:

- anticipacion minima de 12 dias habiles
- exclusion de sabados
- exclusion de domingos
- exclusion de feriados
- restriccion de dias `1` a `24`

Resultado funcional:

- el usuario puede seleccionar cualquier fecha valida del calendario

=====================================================================
5. CALCULO DE FECHA MINIMA EN MODO NORMAL
=====================================================================

5.1 Regla base

La fecha minima permitida debe calcularse sumando 12 dias habiles a partir de la fecha actual operativa.

5.2 Regla de conteo

El conteo debe:

- ignorar sabados
- ignorar domingos
- ignorar feriados globales

5.3 Regla de ventana mensual

Si la fecha obtenida despues de contar 12 dias habiles cae entre los dias `25` y `31` del mes:

- no se puede usar esa fecha
- debe moverse hacia adelante al siguiente dia valido permitido
- ese siguiente dia valido puede pertenecer al siguiente mes

5.4 Regla de desplazamiento adicional

Si la fecha cae entre `1` y `24` pero ese dia es:

- sabado
- domingo
- feriado

tambien debe moverse hacia adelante hasta el siguiente dia valido.

5.5 Regla de cruce de año

El calculo debe soportar que la fecha minima cruce de:

- un mes a otro
- un año a otro

Ejemplo conceptual:

- si hoy es una fecha de diciembre y el conteo llega a enero del siguiente año
- la validacion debe seguir siendo correcta usando feriados del nuevo año

=====================================================================
6. ALGORITMO FUNCIONAL ESPERADO
=====================================================================

En modo normal, la logica debe comportarse de esta manera:

1. tomar la fecha actual operativa
2. recorrer dias calendario hacia adelante
3. contar solo los dias habiles
4. detener el conteo al llegar al dia habil numero 12
5. evaluar si la fecha resultante es fecha permitida para entrega
6. si no es permitida, seguir avanzando hasta encontrar la primera fecha permitida

Una fecha permitida para entrega en modo normal es la primera que cumpla simultaneamente:

- dia del mes entre `1` y `24`
- no sabado
- no domingo
- no feriado

=====================================================================
7. CASOS EJEMPLO DE NEGOCIO
=====================================================================

7.1 Caso normal sin cruce de mes

Si hoy es dia habil y al contar 12 dias habiles se llega a una fecha entre `1` y `24` que no es fin de semana ni feriado:

- esa fecha es la minima permitida

7.2 Caso que cae en fin de mes

Si al contar 12 dias habiles se obtiene `2026-07-29`:

- esa fecha no es permitida
- se debe buscar la siguiente fecha valida
- si la siguiente valida es `2026-08-03`, esa pasa a ser la minima permitida

7.3 Caso que cae en feriado o fin de semana

Si al contar 12 dias habiles se obtiene una fecha del `1` al `24`, pero ese dia es feriado o domingo:

- se debe seguir avanzando hasta la siguiente fecha valida

7.4 Caso con zafra activa

Si `zafra activa = true`:

- una fecha de mañana es aceptable
- una fecha en sabado es aceptable
- una fecha feriada es aceptable
- una fecha `27` del mes es aceptable

=====================================================================
8. FUENTE GLOBAL DE FERIADOS
=====================================================================

8.1 Naturaleza del estado

Los feriados deben manejarse como estado global de aplicacion.

Eso significa:

- una sola fuente de verdad para toda la instancia viva de la app
- reutilizable por cualquier store, schema, helper o vista que lo necesite

8.2 Alcance geografico

La app opera unicamente para Panama.

Por tanto:

- no se requiere logica multi-pais
- la fuente de feriados puede fijar internamente `country = PA`
- la fuente de feriados puede fijar internamente `type = national`

8.3 Contrato esperado de la Edge Function

La funcion `functions/v1/dias_feriado` debe aceptar:

- `year` opcional

Si `year` no se envia:

- debe usar el año actual de Panama

La respuesta util para frontend debe ser minima:

- `year`
- `holidays`

Donde `holidays` es un arreglo de fechas ISO `YYYY-MM-DD`.

Ejemplo conceptual:

```json
{
  "year": 2026,
  "holidays": [
    "2026-01-01",
    "2026-01-09",
    "2026-11-03"
  ]
}
```

8.4 Regla de cache global por año

El store global de feriados no debe pensar en una sola carga total.

Debe cachear por `year`.

Implicacion:

- `2026` puede estar cargado
- `2027` puede no estar cargado aun
- si una validacion cruza de año, el store debe poder cargar `2027` una sola vez y reutilizarlo despues

8.5 Regla de deduplicacion por instancia

Dentro de una misma instancia viva de la app:

- no debe dispararse mas de una peticion concurrente para el mismo `year`
- si varios consumidores piden el mismo año al mismo tiempo, deben compartir la misma promesa en vuelo

=====================================================================
9. ESTADO GLOBAL DE ZAFRA ACTIVA
=====================================================================

9.1 Fuente de verdad

`zafra activa` debe resolverse como estado global del negocio.

No debe inferirse desde:

- `tipoSolicitud`
- seleccion manual del usuario en el formulario

9.2 Naturaleza de la bandera

La bandera debe ser unica y global para la app.

Su intencion funcional es:

- `false`: aplicar reglas normales de fecha
- `true`: suspender reglas normales de fecha

9.2.1 Clave funcional confirmada

La `feature_key` asociada a esta condicion global es:

- `temporada_zafra_activa`

9.3 Efecto obligatorio sobre la validacion

Cualquier punto que valide `fechaEntrega` debe mirar primero el estado global de `zafra activa`.

Eso incluye:

- selector de fecha
- paso 1
- guardado de borrador
- autoguardado
- envio final
- rehidratacion de borradores
- etiquetas de revision en el listado de borradores

=====================================================================
10. FUENTE DE VERDAD DE VALIDACION
=====================================================================

La logica de fecha no debe quedar duplicada entre:

- componente visual de fecha
- schema zod de creacion
- schema zod de borrador
- store del wizard
- card de borradores

Debe existir una unica fuente de verdad reutilizable para resolver:

- si una fecha es valida
- cual es la fecha minima permitida en modo normal
- si un borrador requiere revision

Implicacion:

- la UI puede ayudar a restringir visualmente
- pero la validacion final debe vivir en una capa compartida y deterministica

=====================================================================
11. EFECTO SOBRE EL DATEPICKER
=====================================================================

11.1 Objetivo

El datepicker debe guiar al usuario hacia fechas validas, sin convertirse en la unica barrera de negocio.

11.2 En modo normal

Debe reflejar visualmente la fecha minima calculada y bloquear seleccion de fechas anteriores a ella.

Adicionalmente, debe impedir seleccionar:

- sabados
- domingos
- feriados
- dias `25` a `31`

11.3 En modo zafra activa

Debe relajarse la restriccion anterior y permitir cualquier fecha valida del calendario.

11.4 Regla de seguridad

Aunque el datepicker bloquee visualmente fechas invalidas, el schema y el store deben volver a validar.

=====================================================================
12. EFECTO SOBRE VALIDACION DEL PASO 1
=====================================================================

El paso 1 solo puede considerarse valido si `fechaEntrega` cumple la regla correspondiente al estado actual de zafra activa.

12.1 En modo normal

`fechaEntrega` es valida solo si:

- es fecha valida
- no es anterior a hoy
- respeta el minimo calculado
- no cae en sabado, domingo, feriado ni dias `25` a `31`

12.2 En modo zafra activa

`fechaEntrega` es valida solo si:

- existe
- es fecha valida

12.3 Consecuencia

El stepper, el boton `Siguiente`, `canSaveDraft`, `buildPayload` y `buildDraftUpdateSnapshot` deben depender de esa misma evaluacion.

=====================================================================
13. EFECTO SOBRE BORRADORES
=====================================================================

13.1 Regla general

Un borrador no debe requerir revision solo cuando la fecha quedo en el pasado.

Debe requerir revision si su `fechaEntrega` ya no cumple la regla vigente al momento de abrirlo.

13.2 Casos que deben marcar revision en modo normal

Un borrador requiere revision si su fecha:

- quedo antes de hoy
- quedo antes de la nueva minima calculada
- cae en sabado
- cae en domingo
- cae en feriado
- cae del dia `25` al `31`

13.3 Caso con zafra activa

Si `zafra activa = true`, un borrador solo deberia requerir revision si:

- la fecha es invalida como string o parseo
- existe alguna regla basal adicional que siga vigente

No deberia requerir revision por:

- anticipacion insuficiente
- fin de semana
- feriado
- fin de mes

13.4 Comportamiento al hidratar

Si el borrador se abre cuando `zafra activa = false` y la fecha guardada ya no cumple la regla vigente:

- el sistema no debe conservar la fecha invalida como fecha activa editable
- el sistema debe reemplazar automaticamente `fechaEntrega` por la nueva fecha minima valida calculada al momento de la hidratacion
- el wizard debe abrir en el paso 1
- debe mostrarse un mensaje en rojo indicando el cambio automatico
- el mensaje debe usar este contenido base:
  - `Fecha de entrega cambiada; fecha anterior establecida {fecha-entrega-anterior}`
- `{fecha-entrega-anterior}` representa la fecha que traia el borrador antes del ajuste automatico

Objetivo:

- evitar que el usuario continúe con una fecha ya invalida en modo normal
- dejar trazabilidad visible del cambio automatico realizado por el sistema

13.4.1 Caso especial con zafra activa

Si el borrador se abre cuando `zafra activa = true`:

- debe mantenerse el comportamiento actual
- no debe reemplazarse automaticamente la fecha por una minima nueva
- la fecha original del borrador puede conservarse
- no debe mostrarse el mensaje rojo de cambio automatico por las reglas suspendidas de zafra

13.4.2 Alcance del mensaje de cambio

El mensaje rojo de cambio automatico aplica solo cuando:

- el borrador fue hidratado en modo normal
- la fecha previa ya no cumplia la regla vigente
- el sistema la sustituyo automaticamente por una fecha valida nueva

13.5 Comportamiento al corregir

Cuando el usuario seleccione una nueva fecha valida:

- debe limpiarse el estado de aviso de ajuste automatico si seguia visible
- cualquier bandera de revision asociada a fecha debe limpiarse

=====================================================================
14. EFECTO SOBRE MODAL Y CARD DE BORRADORES
=====================================================================

La tarjeta resumida del borrador debe usar la misma regla central para decidir si muestra un badge tipo:

- `Cambie entrega`

No debe usar una logica simplificada distinta basada solo en `fecha < hoy`.

Objetivo:

- evitar inconsistencias entre listado y wizard
- evitar que un borrador parezca sano en la card pero falle al abrirse

=====================================================================
15. EFECTO SOBRE AUTOGUARDADO Y GUARDADO MANUAL
=====================================================================

15.1 Regla de consistencia

Las nuevas reglas de fecha deben aplicar tanto a:

- guardado manual de borrador
- autoguardado silencioso
- envio final

15.2 Implicacion

No debe existir un estado donde:

- el paso 1 sea invalido
- pero el borrador igual se persista como si estuviera correcto

15.3 Consideracion operativa

Si la fecha deja de ser valida por cambio de contexto global:

- feriados del nuevo año
- cambio de `zafra activa`
- paso del tiempo

el borrador puede requerir correccion la proxima vez que se abra, aunque antes haya sido guardado sin problemas

=====================================================================
16. ORDEN TECNICO DE RESOLUCION
=====================================================================

La evaluacion de fecha debe seguir este orden:

1. conocer estado global de `zafra activa`
2. conocer o cargar los feriados de los años necesarios
3. calcular minima permitida si aplica modo normal
4. validar o restringir la fecha elegida
5. decidir si el paso 1 es valido
6. decidir si el borrador requiere revision

=====================================================================
17. CRITERIOS DE ACEPTACION
=====================================================================

17.1 Modo normal

- una solicitud nueva no permite elegir fechas antes de la minima calculada
- el conteo de 12 dias omite sabados, domingos y feriados
- si la fecha calculada cae entre `25` y `31`, se mueve al siguiente dia valido
- si la fecha calculada cae en feriado o fin de semana, se mueve al siguiente dia valido

17.2 Zafra activa

- al activar `zafra activa`, desaparecen las restricciones de 12 dias habiles
- al activar `zafra activa`, se permite cualquier dia del mes
- al activar `zafra activa`, se permiten sabados, domingos y feriados

17.3 Borradores

- un borrador invalido por las nuevas reglas, abierto con `zafra activa = false`, abre en paso 1 con fecha ajustada automaticamente a la nueva minima valida
- ese mismo caso muestra un mensaje rojo con la fecha anterior reemplazada
- la card del borrador tambien indica que la fecha debe revisarse
- al corregir la fecha, el borrador vuelve a comportarse normalmente
- si `zafra activa = true`, al continuar un borrador se mantiene el comportamiento actual y no se fuerza reemplazo automatico de la fecha

17.4 Cache global de feriados

- los feriados de un año ya cargado no vuelven a consultarse en la misma instancia
- dos consumidores concurrentes del mismo año no disparan peticiones duplicadas
- si el calculo cruza a un año no cargado, ese año se consulta y queda cacheado

=====================================================================
18. CASOS BORDE OBLIGATORIOS
=====================================================================

- hoy es viernes y el siguiente lunes es feriado
- hoy es fin de mes y el conteo cruza al mes siguiente
- el resultado del dia habil 12 cae en sabado
- el resultado del dia habil 12 cae en feriado
- el resultado del dia habil 12 cae en `25`, `26`, `27`, `28`, `29`, `30` o `31`
- el conteo cruza de diciembre a enero
- un borrador guardado en modo normal se reabre cuando `zafra activa = true`
- un borrador guardado durante zafra activa se reabre cuando `zafra activa = false`

=====================================================================
19. DECISIONES CERRADAS EN ESTA ITERACION
=====================================================================

- la app opera solo para Panama
- la fuente de feriados sera una Edge Function propia
- la Edge Function devuelve solo `year` y `holidays`
- el calendario de feriados se considera global para la app
- la cache debe vivir por instancia de app y por año
- `zafra activa` es global y no depende de `tipoSolicitud`
- en modo zafra activa se ignoran:
  - dias habiles minimos
  - feriados
  - sabados y domingos
  - restriccion del dia `25` al `31`

=====================================================================
20. FUERA DE ALCANCE DE ESTE SPEC
=====================================================================

- definicion del mecanismo exacto de persistencia de `zafra activa`
- disenio visual final del calendario
- internacionalizacion multi-pais
- manejo de medias jornadas o calendarios especiales internos distintos de feriados nacionales
- reglas horarias intra-dia
