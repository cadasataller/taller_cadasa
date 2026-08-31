ESPECIFICACION — BASE DE CALIFICACION DE REUNION
MODULO: Inspecciones / Calificaciones de supervisores
SUBFLUJO: Registro individual de reunion
FECHA DE CONTEXTO: 2026-06-25
PROYECTO: gestion operativa

=====================================================================
1. OBJETIVO
=====================================================================

Definir las reglas funcionales, visuales y de persistencia para registrar la calificacion individual de reunion de supervisores usando el mismo esquema actual de calificaciones, sin alterar la logica de inspeccion diaria normal.

La reunion:

- usa los mismos `niveles_calificacion`
- usa `criterios_evaluacion`
- forma parte de la calificacion diaria del dia en que se registra
- se muestra en la misma card/toggle de calificaciones del supervisor
- se edita y elimina con reglas distintas a la inspeccion diaria completa

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- registro individual de reunion
- uso del mismo esquema actual:
  - `empleados`
  - `inspecciones`
  - `inspecciones_detalle`
  - `niveles_calificacion`
  - `criterios_evaluacion`
- diferenciacion de reunion mediante criterio dedicado y observacion reservada
- visualizacion de reunion como una fila mas dentro de la card de calificaciones
- edicion parcial de reunion
- eliminacion parcial de reunion
- badges de reunion segun filtro actual de la vista

No incluye:

- cambios a la logica base de inspeccion diaria normal
- cambios a la logica de fotos
- cambios a los criterios normales de inspeccion fuera del criterio de reunion
- cambios al calculo general semanal salvo que la reunion ya se integre como criterio

=====================================================================
3. CONTEXTO FUNCIONAL
=====================================================================

La inspeccion diaria normal se mantiene igual.

La reunion es una calificacion adicional, registrada en otro momento del dia, pero integrada al mismo ecosistema de datos.

La reunion no debe mostrarse en otra vista separada como resultado final. Debe verse dentro de la misma card de calificaciones del supervisor.

La reunion debe impactar la calificacion diaria del dia en que se registra.

=====================================================================
4. CONFIGURACION SEMANAL DE SUPERVISORES
=====================================================================

La programacion del dia de reunion debe definirse por `email`.

Configuracion actual:

- `ivanp@cadasa.com` -> `Lunes`
- `joseim@cadasa.com` -> `Martes`
- `sergioq@cadasa.com` -> `Miercoles`
- `testjl@cadasa.com` -> `Jueves`
- `eladiop@cadasa.com` -> `Viernes`

Reglas:

- el `email` es la llave oficial de asignacion
- el `nombre` es solo visual
- el `area` es auxiliar y no debe ser la llave principal

=====================================================================
5. MODELO LOGICO DE LA REUNION
=====================================================================

La reunion reutiliza el esquema actual con estas reglas:

5.1 Criterio de reunion

- debe existir un criterio dedicado en `criterios_evaluacion`
- el criterio de reunion vigente es `id_criterio = 5`
- ese criterio representa la calificacion de reunion
- usa los mismos puntajes definidos en `niveles_calificacion`
- ese criterio no debe mostrarse en el formulario normal de inspeccion diaria

5.2 Persistencia

- la cabecera vive en `inspecciones`
- la puntuacion de reunion vive en `inspecciones_detalle`
- la trazabilidad textual vive en `inspecciones.observacion`
- la reunion no crea una cabecera paralela cuando ya existe inspeccion diaria base
- la reunion se asocia al mismo `id_inspeccion` de la fila base sobre la que se registra

5.3 Observacion reservada de reunion

La reunion debe usar un bloque reservado dentro de `observacion`.

Reglas:

- no se debe leer cualquier texto entre corchetes
- se debe usar un bloque fijo exacto:
  - apertura `[[GO_REUNION]]`
  - cierre `[[/GO_REUNION]]`
- dentro del bloque de reunion debe existir un subbloque `supervisor`
- este subbloque solo pertenece al flujo individual
- si no hay observacion de reunion, no se inserta bloque `supervisor`

=====================================================================
6. REGLAS DEL FLUJO INDIVIDUAL
=====================================================================

6.1 Proposito

Registrar la reunion individual del supervisor usando:

- puntuacion de reunion
- observacion de reunion del supervisor

6.2 Datos editables

El flujo individual solo puede editar:

- puntuacion de reunion
- observacion reservada de reunion del subbloque `supervisor`

No puede editar:

- fotos
- criterios normales de inspeccion
- observacion normal fuera del bloque reservado de reunion
- logica normal de inspeccion diaria

6.3 Creacion

Si una inspeccion diaria base aun no tiene reunion:

- se registra solo la parte de reunion usando el esquema actual
- se agrega la puntuacion del criterio de reunion
- se agrega el subbloque `supervisor` si hay observacion
- la operacion usa el `id_inspeccion` de la fila base seleccionada
- no debe crear una inspeccion visualmente separada en base de datos para el mismo caso

Si no existe inspeccion diaria base:

- este flujo individual no debe crear reunion desde un boton global independiente
- primero debe existir la inspeccion base sobre la cual se asociara la reunion

6.4 Edicion

Si ya existe reunion para ese supervisor y fecha:

- se actualiza la puntuacion de reunion
- se actualiza o reemplaza solo el subbloque `supervisor`
- no se toca nada fuera del bloque reservado de reunion

6.5 Observacion vacia

Si el usuario no escribe observacion:

- no se debe insertar bloque `supervisor`
- si antes existia y ahora se limpia, debe eliminarse el subbloque `supervisor`
- deben mantenerse intactos:
  - la observacion general normal
  - el subbloque `gerencia` si existe

=====================================================================
7. REGLAS DE ELIMINACION DE REUNION
=====================================================================

Eliminar reunion individual no equivale a eliminar inspeccion.

Regla obligatoria:

- al eliminar reunion individual, se debe eliminar toda la informacion reservada de reunion, tanto `supervisor` como `gerencia`, dentro de observacion
- se debe eliminar el detalle asociado al criterio de reunion
- no se debe eliminar la fila base de `inspecciones`
- no se deben eliminar otros detalles normales de inspeccion

Esto es distinto a eliminar una inspeccion diaria completa.

=====================================================================
8. REGLAS DE VISUALIZACION EN LA CARD DE CALIFICACIONES
=====================================================================

La reunion debe mostrarse como una fila mas dentro del toggle/card del supervisor.

Debe convivir con la fila normal de inspeccion, pero distinguirse visualmente.

Regla de representacion:

- una misma `inspeccion` puede producir dos filas visuales:
  - una fila normal con criterios diarios
  - una fila de reunion si existe el criterio `5`
- ambas filas comparten el mismo `id_inspeccion` en base de datos
- la separacion es visual, no una duplicacion fisica de la cabecera en BD

Cada fila de reunion debe mostrar:

- fecha
- hora de registro
- inspector
- puntuacion de reunion
- observacion de reunion
- acciones de editar y eliminar

La observacion visible en esa fila debe corresponder a la reunion, no a toda la observacion general mezclada.

Si no existe observacion reservada de reunion:

- mostrar `Sin observacion de reunion`

En la fila normal:

- no debe mostrarse el bloque crudo `[[GO_REUNION]]...[[/GO_REUNION]]`
- solo debe verse la observacion general no reservada

=====================================================================
9. BADGES DE REUNION SEGUN FILTRO
=====================================================================

Cuando el filtro actual de la vista sea:

1. `Hoy`
- mostrar badge `Reunion Hoy`

2. `Ayer`
- mostrar badge `Reunion Ayer`

3. `Esta semana`
- mostrar badge `Reunion Lunes`, `Reunion Martes`, `Reunion Miercoles`, etc.

4. `Semana pasada`
- mostrar badge con nombre del dia correspondiente

5. `Todas`
- se puede mostrar nombre del dia o nombre del dia + fecha si hace falta mas claridad

El badge complementa la agrupacion actual; no la reemplaza.

=====================================================================
10. ACCIONES DE LA FILA DE REUNION
=====================================================================

10.1 Editar

Editar reunion debe abrir una experiencia corta y especifica de reunion.

No debe abrir el formulario completo de inspeccion diaria.

Reglas adicionales del modal de reunion:

- fecha y hora deben verse bloqueadas porque dependen de la inspeccion asociada
- el supervisor debe seleccionarse visualmente desde un selector tipo dropdown hecho con `div`
- el selector de supervisor debe mostrar badge del dia asignado de reunion
- el inspector solo puede ser editable si el area del usuario es `ALL`

10.2 Eliminar

Eliminar reunion debe tener una confirmacion explicita.

El mensaje funcional debe dejar claro:

- se eliminara solo la reunion
- no se eliminara la inspeccion diaria base
- se eliminara la puntuacion de reunion
- se eliminara toda la observacion reservada de reunion

=====================================================================
11. RESULTADO ESPERADO
=====================================================================

Al finalizar este flujo:

- la inspeccion diaria normal sigue funcionando igual
- la reunion se registra con el mismo sistema de puntajes
- la reunion queda integrada a la calificacion diaria
- la reunion se muestra como una fila diferenciada dentro de la misma card
- la reunion usa el criterio `5`
- la reunion queda asociada al mismo `id_inspeccion` de la fila base
- editar reunion toca solo reunion
- eliminar reunion elimina toda la informacion reservada de reunion y el detalle del criterio, pero no la inspeccion completa
