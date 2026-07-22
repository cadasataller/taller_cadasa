ESPECIFICACION COMPLEMENTARIA - ADJUNTOS UI, VALIDACION Y PREVIEW
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 3 / Adjuntos / Carga local y visualizacion previa
FECHA DE CONTEXTO: 2026-06-30
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir el comportamiento funcional, tecnico y visual del bloque de `adjuntos` dentro del paso 3 del wizard de creacion de solicitudes de compra.

Este ajuste busca:

- incorporar adjuntos dentro del flujo visual del wizard sin crear un paso nuevo
- mantener los adjuntos como opcion siempre no obligatoria
- permitir seleccion multiple de archivos desde un formulario aparte
- validar archivos en el momento de agregarlos al formulario
- conservar los archivos solo en estado local hasta el submit final de envio
- mostrar previsualizacion diferenciada para imagenes y documentos
- reutilizar el patron UI de drawer desktop y bottom sheet mobile ya usado en otros subflujos

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- bloque de adjuntos dentro del paso 3
- nuevo orden visual del paso 3
- CTA permanente `Agregar archivo`
- formulario aparte para seleccion multiple de archivos
- drawer en desktop
- bottom sheet en mobile y tablet
- validacion local de archivos al confirmar el formulario
- limite maximo de cantidad de archivos
- renombrado opcional por archivo antes de confirmar
- previas locales antes del submit
- modal de preview para imagenes
- modal de preview para PDF con `iframe` y fallback
- iconografia y representacion resumida para DOCX
- eliminacion de archivos agregados
- visualizacion de adjuntos en el paso 4 de resumen
- reglas de no duplicidad

No incluye:

- carga de adjuntos al guardar borrador
- metadata adicional por archivo
- categorias de adjunto
- edicion de archivos ya agregados
- reemplazo directo de archivo existente
- soporte para tipos fuera del set permitido
- generacion de thumbnails reales para PDF

Referencias de contexto:

- `documentacion/specs/creacion_solicitudes/spec.md`
- `documentacion/specs/creacion_solicitudes/SPEC-03-servicios-ui-y-logica.md`
- `documentacion/specs/creacion_solicitudes/SPEC-06-observacion-prefill-y-chips.md`

=====================================================================
3. RESUMEN FUNCIONAL
=====================================================================

El paso 3 del wizard debe quedar en este orden:

1. `observacion`
2. `adjuntos`
3. `urgencia`

Los adjuntos:

- siempre son opcionales
- no se suben al momento de agregarlos
- no se persisten si el usuario cancela el formulario aparte
- se mantienen solo como archivos locales mientras la solicitud no haya sido enviada
- solo deben disparar flujo de subida cuando la accion final sea `Enviar`

`Guardar borrador`:

- no sube archivos
- no debe exigir adjuntos
- no debe convertir la presencia de archivos locales en requisito de persistencia remota

`Enviar solicitud`:

- si existen archivos locales validos, debe disparar la subida de adjuntos
- solo despues de una subida exitosa debe construirse `p_adjuntos`
- si la subida falla, el envio completo debe abortarse

=====================================================================
4. REGLAS DEL PASO 3
=====================================================================

4.1 Estructura visible

Debajo del bloque de `observacion` y antes del bloque de `urgencia` debe aparecer una nueva seccion de adjuntos.

La seccion debe mostrar:

1. Titulo del bloque
2. Texto de ayuda corto
3. Tarjeta fija `Agregar archivo`
4. Listado de archivos ya agregados
5. Mensajes de error por archivos invalidos cuando corresponda

4.2 Texto guia del bloque

El bloque fijo de agregar archivo debe incluir:

- icono `FilePlusCorner`
- texto principal `Agregar archivo`
- placeholder o ayuda visible indicando que se pueden agregar:
  - imagenes
  - PDF
  - DOCX

Texto sugerido base:

- `Puedes agregar imagenes, PDF u otros archivos permitidos`

4.3 Naturaleza opcional

- no debe mostrarse asterisco de obligatorio
- no debe bloquear avanzar al siguiente paso por ausencia de archivos
- no debe bloquear enviar si no hay adjuntos

=====================================================================
5. FORMULARIO APARTE DE ADJUNTOS
=====================================================================

Debe existir un formulario aparte dedicado unicamente a seleccionar archivos.

5.1 Apertura

El formulario debe abrirse desde la tarjeta fija `Agregar archivo`.

No debe abrirse para edicion de un archivo existente.

5.2 Variante responsive

Desktop `lg`:

- abrir drawer lateral derecho

Tablet y mobile `md` / `sm`:

- abrir bottom sheet

5.3 Cierre

La unica salida segura debe ser `Cancelar`.

Si el usuario cancela:

- no se agrega ningun archivo al estado local
- no se preserva seleccion temporal del formulario

5.4 Campos y contenido

El formulario no lleva metadata adicional.

Debe incluir:

1. Zona de seleccion de archivos
2. Previsualizacion inmediata de los archivos seleccionados dentro del formulario
3. Campo opcional de nombre por archivo seleccionado
4. Mensajes de error por archivos invalidos
5. Acciones `Cancelar` y `Agregar archivo`

5.5 Seleccion multiple

Un mismo formulario debe permitir seleccionar varios archivos en una sola interaccion.

=====================================================================
6. TIPOS, LIMITES Y VALIDACION
=====================================================================

6.1 Tipos permitidos

Solo deben aceptarse estos formatos:

- `png`
- `jpg`
- `webp`
- `pdf`
- `docx`

6.2 Limite por archivo

Cada archivo puede pesar como maximo:

- `20 MB`

6.3 Límite de cantidad

El maximo de archivos locales permitidos en esta version debe ser:

- `5 archivos`

6.4 Duplicados

No se permiten archivos duplicados.

Para este spec, un archivo duplicado debe entenderse como un item repetido respecto a otro ya agregado en el estado local.

La implementacion puede resolverlo comparando al menos:

- nombre
- tamano
- tipo MIME
- ultima fecha de modificacion

6.5 Momento de validacion

La validacion debe ocurrir cuando el usuario presiona `Agregar archivo` dentro del formulario.

No debe agregarse automaticamente al seleccionar desde el picker del sistema.

6.6 Resultado mixto

Si en una seleccion multiple hay archivos validos e invalidos:

- los validos deben agregarse
- los invalidos no deben agregarse
- la UI debe reportar los invalidos al usuario

6.7 Mensaje de error

Cuando exista error de validacion de archivo, el mensaje visible base debe ser:

- `Archivo no valido`

Para archivos duplicados debe mostrarse especificamente:

- `Archivo repetido`

Para exceder el limite maximo de cantidad debe mostrarse:

- `Maximo 5 archivos`

6.8 Renombrado opcional antes de confirmar

Dentro del formulario aparte, cada archivo seleccionado puede recibir un nombre opcional antes de agregarse al estado local.

Reglas:

- si el usuario no escribe nombre, debe usarse uno por defecto con la forma `archivo[n]-[now()]`
- si el usuario escribe nombre manual, ese valor debe normalizarse
- los espacios deben reemplazarse por guion bajo `_`
- el nombre base debe limitarse a `50 caracteres`
- la extension real del archivo debe conservarse segun el tipo seleccionado

=====================================================================
7. REPRESENTACION VISUAL DE ARCHIVOS
=====================================================================

Cada archivo agregado debe mostrarse como card visual dentro del paso 3.

Cada card debe incluir:

- preview o icono
- nombre visible del archivo
- truncado visual cuando el nombre sea demasiado largo
- boton iconografico `X` para eliminar
- apertura de preview al hacer click sobre la card o miniatura

No debe existir accion `Editar`.

7.1 Layout de cards agregadas

La lista de adjuntos agregados debe:

- mantener tamano fijo de preview por item
- hacer `wrap` cuando no exista espacio horizontal suficiente
- evitar que las cards se encojan para forzar una sola fila

=====================================================================
8. PREVIEW DE IMAGENES
=====================================================================

Para imagenes permitidas:

- `png`
- `jpg`
- `webp`

la card debe mostrar miniatura real.

8.1 Fuente de preview

La miniatura debe construirse desde archivo local usando URL temporal en navegador.

8.2 Interaccion

Al hacer click sobre la miniatura o la card:

- debe abrirse un modal de pantalla completa

8.3 Modal de imagen

El modal de imagen debe:

- oscurecer el fondo
- centrar la imagen
- permitir cerrar explicitamente
- priorizar buena lectura tanto en desktop como mobile

=====================================================================
9. PREVIEW DE PDF
=====================================================================

Los PDF no deben mostrar thumbnail de pagina dentro de la card del paso 3.

En la card del listado:

- debe mostrarse icono `FileText`
- debe mostrarse debajo el nombre truncado si es largo

9.1 Apertura

Al hacer click sobre la card del PDF:

- debe abrirse un modal de pantalla completa

9.2 Estrategia de visualizacion

La primera estrategia obligatoria para PDF debe ser:

- intentar embebido con `iframe`

9.3 Fallback

Si el visor embebido falla:

- el modal debe mostrar fallback simple
- el fallback debe incluir una accion para abrir el documento en otra pestana o contexto del navegador

9.4 Consideraciones de plataforma

Se acepta que el `iframe` no funcione de forma consistente en todos los navegadores mobile.

En esta version:

- no debe incorporarse `pdf.js`
- no debe incorporarse render por canvas
- no deben generarse miniaturas reales de paginas PDF

La estrategia deliberada es mantener un visor liviano y de bajo acoplamiento tecnico.

=====================================================================
10. REPRESENTACION DE DOCX
=====================================================================

Para archivos `docx`:

- no debe existir preview real del contenido
- debe mostrarse icono `FileText`
- debe mostrarse nombre truncado
- la card puede abrir un modal simple de archivo no previsualizable o delegar a apertura del documento segun la implementacion final

Este spec solo exige representacion visual simple y consistente.

=====================================================================
11. ESTADO FRONTEND RECOMENDADO
=====================================================================

Ademas de los estados ya definidos en el flujo base, el subflujo de adjuntos debe distinguir al menos:

1. archivos locales agregados
2. errores de validacion recientes
3. archivo activo en preview
4. tipo de preview abierto
5. estado del modal de preview
6. estado del formulario aparte de adjuntos
7. nombres efectivos finales de archivos locales

Se recomienda separar:

- archivos listos para enviar
- errores de la ultima seleccion validada
- preview de imagen
- preview de PDF

=====================================================================
12. REGLAS DE SUBIDA
=====================================================================

12.1 Antes de enviar

Mientras el usuario solo esta agregando adjuntos en el paso 3:

- no debe ejecutarse upload a storage
- no debe llamarse RPC de preparacion

12.2 Al enviar

Solo cuando la accion final sea `Enviar`:

1. validar formulario completo
2. preparar upload session si hay archivos locales
3. subir archivos validos
4. construir metadata final de `p_adjuntos`
5. enviar solicitud principal

12.3 Al guardar borrador

Cuando la accion final sea `Guardar borrador`:

- no debe ejecutarse upload
- `p_adjuntos` debe mantenerse vacio en esta version

=====================================================================
13. RESUMEN EN PASO 4
=====================================================================

El paso 4 debe incorporar un bloque de adjuntos dentro del resumen final.

Debe mostrar:

- contador total de adjuntos agregados
- listado resumido de nombres
- diferenciacion visual simple por tipo si resulta util

Si no hay adjuntos:

- mostrar `Sin adjuntos`

=====================================================================
14. CRITERIOS DE ACEPTACION
=====================================================================

1. El paso 3 muestra `observacion`, luego `adjuntos`, luego `urgencia`.
2. El bloque de adjuntos siempre es visible aunque no existan archivos agregados.
3. Los adjuntos siguen siendo opcionales para borrador y envio.
4. El CTA `Agregar archivo` abre drawer en desktop y bottom sheet en mobile/tablet.
5. El formulario permite seleccionar varios archivos en una sola operacion.
6. El formulario permite renombrar opcionalmente cada archivo antes de confirmarlo.
7. Si el nombre se deja vacio, se genera uno por defecto con la forma `archivo[n]-[now()]`.
8. Si el usuario escribe espacios, deben reemplazarse por `_`.
9. El nombre base no supera `50 caracteres`.
10. El maximo local permitido es `5 archivos`.
11. Al confirmar, solo se agregan archivos validos.
12. Los invalidos muestran mensaje `Archivo no valido`.
13. Los duplicados muestran mensaje `Archivo repetido`.
14. Exceder el maximo muestra `Maximo 5 archivos`.
15. Ningun archivo se sube al agregarlo.
16. Solo `Enviar` dispara subida de adjuntos.
17. `Guardar borrador` no sube adjuntos.
18. Las imagenes muestran miniatura y modal fullscreen.
19. Los PDF usan `iframe` en modal y fallback si falla.
20. Los DOCX se representan sin preview real.
21. Cada archivo agregado se visualiza como card clickeable con `X` para eliminar.
22. El paso 4 resume los adjuntos agregados con el nombre efectivo final.

=====================================================================
15. NOTAS DE IMPLEMENTACION
=====================================================================

- La estrategia de PDF prioriza simpleza y compatibilidad razonable sobre fidelidad completa.
- Se acepta explicitamente la limitacion de `iframe` en algunos navegadores mobile.
- El flujo de adjuntos debe mantener una separacion clara entre:
  - seleccion local
  - preview local
  - subida real
  - persistencia final

FIN DE LA ESPECIFICACION.
