ESPECIFICACION COMPLEMENTARIA — VALIDACION DEL PASO 2 / STEPPER / SANEAMIENTO DE BORRADORES
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Crear solicitud nueva o continuar borrador
FECHA DE CONTEXTO: 2026-07-01
PROYECTO: gestion operativa / solicitudes compras

Referencia principal:

- `documentacion/specs/creacion_solicitudes/spec.md`

Referencias complementarias:

- `documentacion/specs/creacion_solicitudes/SPEC-08-borradores-carga-hidratacion-y-creacion.md`
- `documentacion/specs/creacion_solicitudes/SPEC-09-modal-borradores-ui-y-flujo.md`

=====================================================================
1. OBJETIVO
=====================================================================

Definir las reglas funcionales y tecnicas para:

- unificar la validacion del paso 2 segun `tipoSolicitud`
- impedir convivencia entre `productos` y `servicios`
- controlar la navegacion manual del stepper segun pasos realmente desbloqueados
- sanear borradores heredados o inconsistentes al momento de hidratar

Este documento no implementa cambios cosmeticos arbitrarios ni explora variantes abiertas de estilos. Define reglas de negocio, UX del stepper y saneamiento de estado.

=====================================================================
2. PROBLEMA A RESOLVER
=====================================================================

Hoy existe una validacion parcial del paso 2:

- el schema obliga servicios cuando la solicitud es de tipo `servicio`
- la vista bloquea el boton `Siguiente` cuando faltan productos para tipos `zafra`, `cultivo` u `otros`
- el store, el schema y el stepper no comparten una unica fuente de verdad para decidir si el paso 2 esta completo

Ademas, los borradores pueden venir con data inconsistente respecto al tipo de solicitud:

- una solicitud de tipo producto podria traer `productos` y `servicios`
- una solicitud de tipo servicio podria traer `servicios` y `productos`

En esos casos el sistema debe privilegiar `tipoSolicitud` como fuente de verdad y limpiar el arreglo que no corresponde.

=====================================================================
3. REGLA DE NEGOCIO DEL PASO 2
=====================================================================

La regla obligatoria es:

3.1 Solicitudes de tipo producto

Aplica cuando `tipoSolicitud` sea alguno de estos valores:

- `zafra`
- `cultivo`
- `otros`

Condiciones obligatorias:

- debe existir al menos un item en `productos`
- `servicios` debe estar vacio

3.2 Solicitudes de tipo servicio

Aplica cuando `tipoSolicitud === servicio`.

Condiciones obligatorias:

- debe existir al menos un item en `servicios`
- `productos` debe estar vacio

3.3 Regla de exclusividad

`productos` y `servicios` no pueden convivir al mismo tiempo en una misma solicitud.

Esta exclusividad aplica para:

- validacion del paso 2
- envio final
- guardado de borrador
- carga e hidratacion de borradores existentes

=====================================================================
4. FUENTE DE VERDAD DE VALIDACION
=====================================================================

La validacion del paso 2 no debe quedar repartida entre vista, stepper y store.

Debe existir una unica verdad funcional, centralizada en la capa de schema y consumida por el store.

Implicacion:

- la vista no debe definir reglas paralelas distintas a las del schema
- el boton `Siguiente`
- el stepper clickable
- el desbloqueo del paso 4
- la hidratacion de borradores

todos deben depender de la misma evaluacion de validez.

=====================================================================
5. REGLAS DE NAVEGACION DEL STEPPER
=====================================================================

5.1 Regla general

El stepper debe permitir click solo sobre pasos accesibles segun avance real.

Definicion operativa:

- un paso esta accesible si ya fue alcanzado secuencialmente o si su prerrequisito inmediato esta completo
- el movimiento libre total solo se habilita cuando el usuario ya puede estar en el paso 4 de forma valida

5.2 Comportamiento esperado

Si el usuario esta en:

- paso 1: solo puede permanecer en 1
- paso 2: puede navegar a 1 y 2
- paso 3: puede navegar a 1, 2 y 3
- paso 4: puede navegar a 1, 2, 3 y 4

Pero el acceso al paso 4 solo debe habilitarse si el paso 3 ya esta completo y los anteriores tambien siguen siendo validos.

5.2.1 Tabla explicita de desbloqueo

La implementacion debe asumir una regla secuencial unica.

Tabla:

| Validacion secuencial actual | Maximo paso desbloqueado | Pasos clickeables |
| --- | --- | --- |
| Paso 1 invalido | 1 | 1 |
| Paso 1 valido | 2 | 1, 2 |
| Paso 1 y paso 2 validos | 3 | 1, 2, 3 |
| Paso 1, paso 2 y paso 3 validos | 4 | 1, 2, 3, 4 |

Regla de lectura:

- `maximo paso desbloqueado` no significa que el usuario deba ser movido automaticamente a ese paso
- significa unicamente hasta donde puede navegar manualmente desde el stepper
- si un paso posterior deja de ser valido por cambios del usuario, el maximo paso desbloqueado debe recalcularse

5.3 Caso especial de observacion autocompletada

El paso 3 puede quedar valido de manera automatica cuando la observacion se completa por prefill al agregar equipos o contexto.

Eso no autoriza saltar al paso 4 si el paso 2 sigue incompleto.

La navegacion siempre debe ser secuencial respecto al maximo paso desbloqueado.

=====================================================================
6. REGLAS DE CURSOR Y FEEDBACK DEL STEPPER
=====================================================================

En desktop, cada item del stepper debe comunicar si es navegable o no antes del click.

6.1 Cuando el paso es navegable

- debe mostrar `cursor-pointer`
- no debe tener `aria-disabled`
- debe responder a click

6.2 Cuando el paso no es navegable

- debe mostrar `cursor-not-allowed`
- debe exponerse como no disponible para interaccion
- el click debe ser ignorado

6.3 Regla de coherencia visual

El cursor por si solo no sustituye la logica funcional.

Si el cursor indica no permitido, el componente no debe navegar aunque el usuario haga click.

6.4 Comportamiento responsive del stepper

La representacion visual del stepper cambia segun breakpoint, pero no debe cambiar la logica funcional de navegacion ni desbloqueo.

6.4.1 Mobile menor a `sm`

En pantallas menores a `sm`:

- cada paso debe renderizarse como un bloque vertical compacto
- arriba debe mostrarse un circulo con el numero del paso
- si el paso ya fue completado, el circulo debe mostrar icono de check en lugar del numero
- debajo del circulo debe mostrarse `shortLabel`
- no debe mostrarse el texto `Paso X`
- no debe mostrarse el numero repetido fuera del circulo
- el contenedor puede usar scroll horizontal si los 4 pasos no caben
- el `shortLabel` debe ser pequeno, centrado y truncable si no cabe

6.4.2 Tablet y layout intermedio desde `sm` hasta antes de `lg`

En pantallas desde `sm` hasta antes de `lg`:

- debe mostrarse un resumen superior con `Paso actual de 4` y el label activo
- debe mostrarse indicador de `maximo paso desbloqueado`
- los 4 pasos deben renderizarse en grid de 4 columnas
- cada paso debe mostrar circulo a la izquierda y texto a la derecha
- el texto debe incluir:
  - `Paso X`
  - `shortLabel`
- si el paso ya fue completado, el circulo debe mostrar icono de check
- si el paso no esta completado, el circulo debe mostrar el numero
- no debe existir una variante intermedia donde se vea texto sin circulo

6.4.3 Desktop `lg` o superior

En `lg` o superior:

- se mantiene el stepper desktop con conectores horizontales
- cada paso muestra circulo, estado visual y label completo
- los pasos accesibles siguen siendo clickeables
- los pasos bloqueados siguen mostrando cursor de no permitido y no deben navegar

=====================================================================
7. SANEAMIENTO DE BORRADORES AL HIDRATAR
=====================================================================

7.1 Fuente de verdad

Si un borrador trae data incompatible entre `tipoSolicitud`, `productos` y `servicios`, se debe tomar `tipoSolicitud` como autoridad.

7.2 Regla de saneamiento

Al hidratar:

- si `tipoSolicitud === servicio`, se debe vaciar `productos`
- si `tipoSolicitud` es `zafra`, `cultivo` u `otros`, se debe vaciar `servicios`

7.3 Prioridad del saneamiento

El saneamiento debe ocurrir antes de:

- asignar el estado definitivo al store
- calcular hashes de snapshot
- decidir el paso accesible
- renderizar el wizard editable

7.4 Objetivo del saneamiento

Evitar que un borrador viejo, defectuoso o generado bajo reglas anteriores:

- abra un estado ambiguo
- permita convivencia invalida entre productos y servicios
- desbloquee pasos de forma incorrecta
- produzca autoguardados inconsistentes

=====================================================================
8. EFECTO SOBRE EL PASO INICIAL DE UN BORRADOR
=====================================================================

Despues del saneamiento, el sistema debe recalcular la capacidad real de avance.

Regla:

- `currentStep` persistido en el borrador no debe asumirse como automaticamente valido
- el wizard debe abrir como maximo en el mayor paso realmente desbloqueado tras normalizar y validar la data

Ejemplos:

- si el borrador venia en paso 4 pero al vaciar `servicios` queda sin `productos` para un tipo `zafra`, no debe conservar acceso libre a 4
- si el borrador es de tipo `servicio` y venia con ambos arreglos, al vaciar `productos` puede conservar su paso solo si sigue cumpliendo la validacion secuencial

=====================================================================
9. EFECTO SOBRE AUTOGUARDADO Y GUARDADO MANUAL
=====================================================================

Una vez saneado el borrador en memoria:

- el siguiente guardado manual debe persistir el estado ya normalizado
- el siguiente autoguardado debe persistir el estado ya normalizado
- el snapshot y su hash deben construirse sobre la version saneada

Esto evita reintroducir en base de datos mezclas invalidas entre `productos` y `servicios`.

=====================================================================
10. CASOS DE ACEPTACION
=====================================================================

10.1 Solicitud de tipo producto valida

Dado:

- `tipoSolicitud = zafra`
- `productos` con al menos un item
- `servicios = []`

Entonces:

- el paso 2 es valido

10.2 Solicitud de tipo producto invalida por falta de productos

Dado:

- `tipoSolicitud = cultivo`
- `productos = []`
- `servicios = []`

Entonces:

- el paso 2 es invalido
- no se habilita avance al paso 3 o 4 mediante stepper

10.3 Solicitud de tipo producto invalida por convivencia

Dado:

- `tipoSolicitud = otros`
- `productos` con items
- `servicios` con items

Entonces:

- el paso 2 es invalido

10.4 Solicitud de tipo servicio valida

Dado:

- `tipoSolicitud = servicio`
- `servicios` con al menos un item
- `productos = []`

Entonces:

- el paso 2 es valido

10.5 Solicitud de tipo servicio invalida por convivencia

Dado:

- `tipoSolicitud = servicio`
- `servicios` con items
- `productos` con items

Entonces:

- el paso 2 es invalido

10.6 Borrador inconsistente de tipo producto

Dado un borrador con:

- `tipoSolicitud = zafra`
- `productos` con items
- `servicios` con items

Entonces al hidratar:

- `servicios` debe vaciarse
- `productos` debe conservarse
- el resto del flujo debe continuar usando solo la data saneada

10.7 Borrador inconsistente de tipo servicio

Dado un borrador con:

- `tipoSolicitud = servicio`
- `productos` con items
- `servicios` con items

Entonces al hidratar:

- `productos` debe vaciarse
- `servicios` debe conservarse

10.8 Cursor del stepper

Cuando un paso sea accesible:

- debe mostrar cursor interactivo

Cuando no lo sea:

- debe mostrar cursor de no permitido

10.9 Stepper mobile menor a `sm`

Dado:

- viewport menor a `sm`
- stepper con 4 pasos

Entonces:

- cada paso debe mostrar solo circulo + `shortLabel`
- no debe mostrarse `Paso X`
- no debe mostrarse numero duplicado fuera del circulo
- si un paso esta completado, el circulo debe mostrar check

10.10 Stepper responsive entre `sm` y antes de `lg`

Dado:

- viewport desde `sm` hasta antes de `lg`

Entonces:

- el stepper debe renderizarse en grid de 4 columnas
- cada paso debe mostrar circulo + `Paso X` + `shortLabel`
- no debe aparecer una variante intermedia de solo texto
- los pasos completados deben mostrar check dentro del circulo

10.11 Consistencia visual de pasos bloqueados

Dado un paso bloqueado en cualquier breakpoint:

- debe mostrarse visualmente deshabilitado
- debe mantener `aria-disabled`
- no debe responder al click
- su representacion no debe confundirse con un paso actual ni con un paso completado

=====================================================================
11. RIESGOS Y COMPATIBILIDAD
=====================================================================

Riesgos controlados:

- borradores historicos pueden cambiar de forma visible al cargarse
- usuarios con borradores inconsistentes pueden reingresar a un paso anterior al esperado
- el estado visual de completado del stepper ya no puede depender solo de `currentStep`

Compatibilidad esperada:

- la nueva regla es compatible con solicitudes nuevas
- la nueva regla es compatible con borradores siempre que se aplique saneamiento antes de hidratar completamente
- el saneamiento privilegia consistencia funcional sobre fidelidad literal del payload historico

=====================================================================
12. DECISIONES CERRADAS
=====================================================================

- `tipoSolicitud` define si la solicitud usa `productos` o `servicios`
- `productos` y `servicios` son mutuamente excluyentes
- el paso 2 debe validarse con una unica fuente de verdad
- el stepper solo debe permitir click sobre pasos desbloqueados
- el cursor del stepper debe reflejar si el paso es navegable
- el stepper puede cambiar su layout por breakpoint, pero no su logica de navegacion
- en mobile `< sm` el stepper muestra circulo + `shortLabel`
- entre `sm` y `< lg` el stepper usa grid de 4 columnas con circulo + texto corto
- al cargar borradores inconsistentes se debe vaciar el arreglo que no corresponda segun `tipoSolicitud`
- despues del saneamiento se debe recalcular el paso realmente accesible
