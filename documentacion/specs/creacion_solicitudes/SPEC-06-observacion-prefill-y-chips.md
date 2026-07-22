ESPECIFICACION COMPLEMENTARIA - OBSERVACION PREFILL Y CHIPS DE REFERENCIA
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 3 / Observaciones
FECHA DE CONTEXTO: 2026-06-26
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir la logica funcional y visual del campo `observacion` en el paso 3 del wizard de creacion de solicitudes.

Este ajuste busca:

- guiar la redaccion inicial del usuario
- reflejar los equipos seleccionados dentro de la observacion
- mostrar referencias visuales de seleccion encima del campo
- evitar sobreescrituras no deseadas cuando el usuario ya edito manualmente
- mantener el limite estricto de 250 caracteres

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- prefill automatico de observacion
- comportamiento al cambiar equipos seleccionados
- comportamiento despues de edicion manual
- chips de equipos
- chips de contexto de servicio
- contador de caracteres
- limite maximo de 250 caracteres

No incluye:

- cambios al contrato del RPC
- cambios al payload de `p_equipos`
- cambios al payload de `p_productos`
- cambios al payload de `p_servicios`
- redaccion automatica avanzada basada en IA

Referencias de contexto:

- `documentacion/specs/creacion_solicitudes/spec.md`
- `documentacion/specs/creacion_solicitudes/SPEC-03-servicios-ui-y-logica.md`
- `documentacion/specs/creacion_solicitudes/SPEC-05-contextos-servicio-catalogo.md`

=====================================================================
3. RESUMEN FUNCIONAL
=====================================================================

El paso 3 debe seguir teniendo los campos:

- `observacion`
- `solicitar_urgente`
- `motivo_urgencia`

Sobre el campo `observacion` se agrega una ayuda contextual obligatoria basada en las selecciones hechas en el paso 1.

La observacion debe iniciar con el prefijo:

- `Para uso en: `

Cuando existan equipos seleccionados, la UI debe intentar completar automaticamente la observacion con los codigos de esos equipos.

Ejemplo:

- equipos seleccionados: `422006`, `422018`
- observacion autogenerada: `Para uso en: 422006, 422018`

Cuando no existan equipos seleccionados o la seleccion relevante provenga solo del catalogo de contexto de servicio, la observacion debe quedar solo con:

- `Para uso en: `

=====================================================================
4. REGLAS DEL PREFILL
=====================================================================

4.1 Prefijo base

El prefijo base del campo debe ser siempre:

- `Para uso en: `

4.2 Recalculo automatico por cambio de equipos

Cada vez que cambie la lista de equipos seleccionados, la UI debe recalcular el prefill de observacion, pero solo si el campo sigue en estado autogenerado.

4.3 Estado autogenerado

Se considera que la observacion sigue en estado autogenerado cuando:

- el usuario aun no ha modificado manualmente el contenido, o
- el contenido actual coincide exactamente con el ultimo valor autogenerado por la UI

4.4 Estado editado manualmente

Se considera que la observacion fue editada manualmente cuando el usuario:

- escribe texto adicional
- borra parte del contenido
- reemplaza texto existente

Una vez que el campo entra en estado editado manualmente:

- cambios posteriores en equipos NO deben sobreescribir la observacion
- la UI debe preservar el texto del usuario

4.5 Caso sin equipos

Si no hay equipos seleccionados y la observacion sigue autogenerada, el valor debe quedar:

- `Para uso en: `

=====================================================================
5. FUENTES DE CHIPS
=====================================================================

Encima del campo `observacion` deben mostrarse chips de referencia visual.

La logica de los chips NO depende del tipo de solicitud.

La logica depende del origen de cada seleccion.

Debe poder haber dos tipos de chips coexistiendo:

1. chips de equipos seleccionados
2. chips de contexto de servicio seleccionados

=====================================================================
6. CHIPS DE EQUIPOS
=====================================================================

6.1 Fuente

Provienen de los equipos reales seleccionados por el usuario en el paso 1.

6.2 Label visible

Cada chip de equipo debe mostrar solo:

- `cod_equipo`

No debe mostrar descripcion, marca ni modelo dentro del chip.

6.3 Validacion visual

Cada chip de equipo debe validarse contra el string actual de `observacion`.

La regla de coincidencia debe ser:

- coincidencia exacta por substring

Eso significa que si el valor del `cod_equipo` aparece literalmente dentro del string de observacion, el chip se considera presente.

Ejemplo:

- chip: `422006`
- observacion: `Para uso en: 422006, 422018`
- resultado: presente

6.4 Estados visuales

- verde: el `cod_equipo` aparece en la observacion
- rojo: el `cod_equipo` no aparece en la observacion

6.5 Naturaleza de la validacion

Los chips rojo/verde funcionan como guia visual de redaccion.

No forman parte por si solos de una validacion bloqueante del submit, salvo que otra especificacion futura lo indique.

=====================================================================
7. CHIPS DE CONTEXTO DE SERVICIO
=====================================================================

7.1 Fuente

Provienen de items seleccionados desde `public.catalogo_servicio_contexto`, segun las reglas definidas en `SPEC-05-contextos-servicio-catalogo.md`.

7.2 Label visible

Cada chip de contexto de servicio debe mostrar:

- `nombre`

No debe mostrar `codigo`.

7.3 Persistencia

Aunque el chip muestre `nombre`, la persistencia en `p_equipos` sigue usando `codigo`, segun `SPEC-05`.

7.4 Estado visual

Los chips de contexto de servicio deben mostrarse:

- en gris
- como referencia informativa

7.5 Sin validacion textual

Los chips de contexto de servicio NO deben evaluarse contra el string de observacion.

No pueden cambiar a verde o rojo.

Siempre deben mantenerse como chips informativos grises.

=====================================================================
8. REGLAS DE COEXISTENCIA
=====================================================================

Si el usuario selecciona al mismo tiempo:

- equipos reales
- contextos de servicio

la UI debe mostrar ambos tipos de chips encima de la observacion.

Orden recomendado:

1. chips de equipos
2. chips de contexto de servicio

Los chips de equipos siguen validandose por substring exacto.

Los chips de contexto de servicio siguen siendo solo informativos.

=====================================================================
9. LIMITE Y CONTADOR DE CARACTERES
=====================================================================

9.1 Limite duro

La observacion debe aceptar un maximo de:

- `250` caracteres

La UI no debe permitir escribir mas de ese limite.

9.2 Contador obligatorio

Debe mostrarse un contador visible asociado al campo.

Ejemplo:

- `128/250`

9.3 Comportamiento del prefill frente al limite

Si el texto autogenerado por equipos supera el limite de 250 caracteres, la UI debe truncar el valor autogenerado al maximo permitido.

El truncamiento debe respetar el maximo de 250 aun si no logra listar todos los equipos.

En ese caso:

- la observacion queda truncada
- algunos chips de equipo pueden quedar en rojo porque no alcanzaron a entrar al string final

Ese comportamiento es valido y debe entenderse como una senal visual para que el usuario ajuste manualmente la redaccion.

=====================================================================
10. COMPORTAMIENTO ESPERADO DEL USUARIO
=====================================================================

Escenario A - campo autogenerado

1. El usuario selecciona equipos.
2. La observacion se llena sola con `Para uso en: ` mas los `cod_equipo`.
3. Si agrega o quita equipos y aun no ha editado manualmente, el texto se recalcula.

Escenario B - campo editado manualmente

1. El usuario modifica la observacion.
2. La UI marca el campo como editado manualmente.
3. Si luego cambia equipos, la observacion no se reemplaza.
4. Los chips de equipo actualizan su color segun el contenido actual del texto.

Escenario C - solo contexto de servicio

1. El usuario selecciona uno o varios contextos del catalogo de servicio.
2. Encima del campo aparecen chips grises con `nombre`.
3. La observacion parte de `Para uso en: `
4. Los chips no se validan contra el texto.

Escenario D - equipos y contexto combinados

1. El usuario selecciona equipos y contextos.
2. Se muestran ambos grupos de chips.
3. Solo los equipos participan en el prefill automatico.
4. Solo los equipos participan en la validacion verde/rojo.

=====================================================================
11. IMPACTO EN ESTADO FRONTEND
=====================================================================

Se recomienda agregar estado explicito para distinguir si la observacion sigue siendo autogenerada o ya fue editada manualmente.

Referencia conceptual:

```ts
type ObservacionState = {
  value: string;
  lastAutofillValue: string;
  wasManuallyEdited: boolean;
  maxLength: 250;
};
```

Notas:

- `lastAutofillValue` permite saber si el texto actual coincide con el ultimo prefill
- `wasManuallyEdited` evita sobreescrituras al cambiar equipos
- el limite de `250` debe aplicarse tanto al tipeo del usuario como al texto autogenerado

=====================================================================
12. VALIDACIONES
=====================================================================

Se mantienen las reglas base del paso 3:

- `observacion` obligatoria
- `solicitar_urgente` boolean
- `motivo_urgencia` requerido solo al enviar con urgencia activa

Validaciones adicionales de esta especificacion:

- la observacion no puede exceder 250 caracteres
- los chips de equipos usan coincidencia exacta por substring
- los chips de contexto de servicio no se validan contra el texto

Importante:

- la ausencia de coincidencia en chips de equipo no bloquea por si sola el submit
- es una ayuda visual, no una validacion de negocio dura en esta fase

=====================================================================
13. CRITERIOS DE ACEPTACION
=====================================================================

1. El campo `observacion` inicia con el prefijo `Para uso en: `.
2. Si existen equipos seleccionados y el campo no fue editado manualmente, la observacion se autocompleta con sus `cod_equipo`.
3. Si la lista de equipos cambia y el campo sigue autogenerado, el texto se recalcula.
4. Si el usuario edita manualmente la observacion, cambios posteriores en equipos no deben sobreescribirla.
5. Encima del campo se muestran chips de equipos con label igual a `cod_equipo`.
6. Los chips de equipos se marcan verdes cuando su codigo aparece como substring exacto en la observacion.
7. Los chips de equipos se marcan rojos cuando su codigo no aparece en la observacion.
8. Si hay contextos seleccionados desde `catalogo_servicio_contexto`, se muestran chips grises con `nombre`.
9. Los chips de contexto de servicio no deben validarse contra el texto de observacion.
10. La observacion no permite mas de 250 caracteres.
11. La UI muestra un contador visible de caracteres usados sobre el maximo.
12. Si el autofill excede el maximo, la observacion se trunca a 250 caracteres sin romper la UI.
