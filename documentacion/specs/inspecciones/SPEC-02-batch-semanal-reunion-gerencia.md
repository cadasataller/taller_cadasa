ESPECIFICACION — BATCH SEMANAL DE REUNION CON GERENCIA
MODULO: Inspecciones / Calificaciones de supervisores
SUBFLUJO: Validacion batch semanal de reunion
FECHA DE CONTEXTO: 2026-06-25
PROYECTO: gestion operativa

=====================================================================
1. OBJETIVO
=====================================================================

Definir el flujo batch semanal que permite a gerencia revisar, validar y ajustar la calificacion de reunion de cada supervisor antes de la reunion semanal, sin modificar la logica base de inspeccion diaria normal.

Este flujo trabaja solo sobre la parte de reunion.

Base ya implementada a respetar:

- el criterio de reunion vigente es `id_criterio = 5`
- la reunion vive sobre el mismo `id_inspeccion` de la inspeccion diaria base
- la UI puede mostrar reunion como fila separada, pero BD mantiene una sola cabecera `inspecciones`

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- vista o formulario batch semanal para reunion
- lectura de la puntuacion actual de reunion de cada supervisor
- lectura de la observacion registrada por supervisor
- ajuste de la puntuacion final por gerencia
- captura de observacion de gerencia
- creacion de reunion si aun no existe
- actualizacion de la observacion reservada de reunion

No incluye:

- cambios a criterios normales de inspeccion diaria
- cambios a fotos
- cambios al formulario normal de inspeccion
- borrado de inspecciones completas desde el batch

=====================================================================
3. CONTEXTO FUNCIONAL
=====================================================================

Antes de la reunion semanal de viernes, gerencia consulta la veracidad de la informacion de cada supervisor.

Con base en eso, el sistema debe permitir:

- ver la calificacion de reunion actual
- ver lo que ya se registro a nivel individual
- corregir la puntuacion final si hace falta
- agregar una observacion propia de gerencia

La puntuacion final visible de reunion debe ser una sola.

=====================================================================
4. RELACION CON EL FLUJO INDIVIDUAL
=====================================================================

El flujo batch semanal no reemplaza al flujo individual; lo complementa.

Secuencia esperada:

1. el flujo individual crea la base de reunion
2. gerencia revisa en batch
3. gerencia puede confirmar o corregir la puntuacion final
4. gerencia puede agregar su propia observacion reservada

Ajuste por implementacion actual:

- la base de reunion nace sobre una inspeccion diaria ya existente
- el batch semanal no debe asumir una cabecera paralela exclusiva para reunion

=====================================================================
5. MODELO LOGICO DE OBSERVACION DE REUNION
=====================================================================

La observacion reservada de reunion debe soportar dos subbloques:

- `supervisor`
- `gerencia`

Reglas:

- ambos viven dentro del bloque reservado de reunion
- ambos son independientes
- el flujo individual solo toca `supervisor`
- el batch semanal solo toca `gerencia`
- el bloque reservado vigente usa exactamente:
  - apertura `[[GO_REUNION]]`
  - cierre `[[/GO_REUNION]]`

Importante:

- si se elimina una reunion individual desde la card de calificaciones, debe eliminarse todo el bloque reservado de reunion completo, incluyendo `supervisor` y `gerencia`

=====================================================================
6. REGLAS DE PUNTUACION FINAL
=====================================================================

Debe existir una sola puntuacion final de reunion visible para el sistema.

Reglas:

- la puntuacion nace en el flujo individual
- el batch semanal de gerencia puede cambiarla
- si gerencia la cambia, la puntuacion vigente pasa a ser la de gerencia
- si gerencia no la cambia, se mantiene la individual

No deben coexistir dos puntuaciones visibles de reunion para el mismo supervisor y fecha.

Implementacion compatible requerida:

- el valor final de reunion debe seguir viviendo en un solo detalle `inspecciones_detalle`
- el batch debe actualizar el criterio `5` existente o crearlo dentro del mismo `id_inspeccion`

=====================================================================
7. REGLAS DEL FORMULARIO BATCH
=====================================================================

El formulario batch debe mostrar un bloque por supervisor.

Cada bloque debe incluir como minimo:

- nombre del supervisor
- email del supervisor
- dia asignado de reunion
- fecha de la reunion evaluada
- puntuacion actual de reunion
- observacion del subbloque `supervisor` en solo lectura
- control para ajustar la puntuacion final
- campo para agregar o editar observacion de `gerencia`

La observacion del supervisor debe mostrarse como contexto, no como campo editable en batch.

=====================================================================
8. REGLAS DE CREACION DESDE BATCH
=====================================================================

Si al entrar al batch no existe reunion previa para un supervisor:

- el batch puede crear la parte de reunion solo si ya existe inspeccion diaria base para esa fecha
- debe crear la puntuacion de reunion con el valor definido por gerencia dentro del mismo `id_inspeccion`
- debe agregar observacion de `gerencia` si el usuario la escribe
- no debe inventar observacion de `supervisor`
- no debe crear una segunda fila fisica en `inspecciones` solo para reunion si la base ya existe

Resultado:

- la reunion puede nacer desde gerencia aunque no haya habido registro individual previo
- pero debe seguir asociada a una inspeccion base existente

=====================================================================
9. REGLAS DE ACTUALIZACION DESDE BATCH
=====================================================================

Si ya existe reunion previa:

- puede actualizar la puntuacion final de reunion
- puede crear el subbloque `gerencia` si no existe
- puede editar el subbloque `gerencia` si ya existe
- no debe tocar el subbloque `supervisor`
- no debe tocar la observacion normal de inspeccion fuera del bloque reservado de reunion
- no debe tocar otros criterios normales de inspeccion
- no debe borrar ni reemplazar en bloque todos los `inspecciones_detalle`
- debe actualizar solo el detalle del criterio `5`

=====================================================================
10. REGLAS DE OBSERVACION DE GERENCIA
=====================================================================

Si gerencia escribe observacion:

- debe guardarse en el subbloque reservado `gerencia`

Si gerencia deja la observacion vacia:

- no debe crearse bloque `gerencia`

Si ya existia bloque `gerencia` y se borra intencionalmente:

- debe eliminarse solo el subbloque `gerencia`
- no debe eliminarse el subbloque `supervisor`
- no debe eliminarse la reunion completa

=====================================================================
11. REGLAS DE ELIMINACION EN CONTEXTO BATCH
=====================================================================

El batch no debe ofrecer eliminacion de inspeccion completa.

Si existe una accion de quitar observacion de gerencia:

- debe eliminar solo el subbloque `gerencia`

Si el usuario necesita eliminar toda la reunion:

- esa accion corresponde al flujo de reunion en la card principal, no al batch

=====================================================================
12. REGLAS DE VISUALIZACION DEL BATCH
=====================================================================

El batch debe ser legible y comparativo.

Cada supervisor debe verse como una fila o bloque independiente con:

- identidad clara
- dia asignado
- estado actual de reunion
- puntuacion editable
- observacion del supervisor visible
- observacion de gerencia editable

La meta del batch no es navegar historico, sino revisar y ajustar rapidamente varios supervisores.

Regla de consistencia visual:

- aunque en BD reunion comparta `id_inspeccion` con la inspeccion diaria, el batch debe tratar la reunion como un bloque visual separado y entendible

=====================================================================
13. REGLAS DE ORDEN
=====================================================================

Los supervisores del batch deben poder ordenarse por prioridad operativa.

Orden recomendado:

1. lunes
2. martes
3. miercoles
4. jueves
5. viernes

Usando la configuracion actual:

- `ivanp@cadasa.com`
- `joseim@cadasa.com`
- `sergioq@cadasa.com`
- `testjl@cadasa.com`
- `eladiop@cadasa.com`

=====================================================================
14. RESULTADO ESPERADO
=====================================================================

Al finalizar este flujo:

- gerencia puede revisar en bloque la informacion semanal de reunion
- cada supervisor conserva su observacion individual separada
- gerencia puede agregar su propia observacion separada
- la reunion mantiene una sola puntuacion final visible
- la reunion sigue usando el criterio `5`
- la reunion sigue asociada al mismo `id_inspeccion` de la inspeccion base
- la inspeccion diaria normal no cambia
- el sistema soporta tanto registro individual como correccion batch sin mezclar responsabilidades
