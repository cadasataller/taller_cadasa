ESPECIFICACION COMPLEMENTARIA — MODAL DE BORRADORES / UI / COMPORTAMIENTO
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Entrada a crear con borradores existentes
FECHA DE CONTEXTO: 2026-06-30
PROYECTO: gestion operativa / solicitudes compras

Referencia logica relacionada:

- `documentacion/specs/creacion_solicitudes/SPEC-08-borradores-carga-hidratacion-y-creacion.md`

=====================================================================
1. OBJETIVO
=====================================================================

Definir la experiencia visual y de interaccion del modal que aparece despues de presionar `Crear` cuando el usuario tiene borradores disponibles.

La intencion del modal es:

- evitar mandar al usuario directo a un formulario vacio si ya tiene trabajo guardado
- ofrecer una decision rapida y clara
- permitir continuar uno de los borradores recientes o iniciar uno nuevo

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- modal de decision previo a la navegacion
- estructura visual desktop y mobile
- jerarquia de contenido
- comportamiento de acciones principales
- reglas de cards de borrador
- tratamiento visual del mensaje de adjuntos no restaurados
- lineamientos tipograficos

No incluye:

- pantalla independiente de administracion de borradores
- descarte o eliminacion desde este modal
- inactivacion visual por estado futuro

=====================================================================
3. REFERENCIA DE INTENCION VISUAL
=====================================================================

La referencia es la idea compartida en la imagen inicial:

- modal centrado grande
- encabezado simple
- dos CTAs destacados arriba
- seccion de borradores recientes debajo
- cards limpias con accion `Continuar`
- CTA secundario para empezar nueva de todos modos

La implementacion final no necesita copiar pixel por pixel la imagen, pero si debe conservar:

- claridad inmediata
- jerarquia de decision
- lectura rapida de cada borrador
- sensacion de continuidad de trabajo

=====================================================================
4. REGLA DE APARICION
=====================================================================

El modal solo debe abrirse si el RPC devuelve al menos un borrador disponible para el usuario actual.

Si no hay borradores:

- no abrir modal
- navegar directo a creacion nueva

=====================================================================
5. ESTRUCTURA GENERAL DEL MODAL
=====================================================================

Orden visual obligatorio:

1. encabezado
2. bloque de acciones principales
3. bloque de borradores recientes
4. CTA inferior para empezar nuevo de todos modos

5.1 Encabezado

Contenido minimo:

- titulo: `Crear solicitud`
- subtitulo: `Tienes borradores guardados. Elige como deseas continuar.`
- accion de cierre: icono `X`

Comportamiento del cierre:

- cierra el modal
- no navega
- devuelve el foco al boton `Crear`

5.2 Acciones principales

Dos tarjetas grandes de accion:

1. `Nueva solicitud`
- descripcion: `Crea una solicitud desde cero.`

2. `Ver borradores`
- descripcion: `Revisa y continua solicitudes guardadas.`

Nota de UX:

- aunque el mismo modal ya muestre borradores, el bloque `Ver borradores` sigue siendo util como ancla visual para llevar foco a la lista o expandirla si luego crece

=====================================================================
6. JERARQUIA DE ACCIONES
=====================================================================

Debe existir una accion primaria clara.

Recomendacion:

- si existe un borrador mas reciente y el producto quiere empujar continuidad, la accion primaria visual puede ser `Continuar` sobre ese borrador
- `Nueva solicitud` sigue estando disponible, pero no debe sentirse escondida

Regla obligatoria:

- nunca forzar la continuidad
- crear nuevo debe ser siempre una salida visible

=====================================================================
7. BLOQUE DE BORRADORES RECIENTES
=====================================================================

Titulo sugerido:

- `Borradores recientes`

Orden de items:

- del mas reciente al menos reciente
- usar `updated_at` como prioridad visual recomendada

Limite sugerido en primera vista:

- mostrar entre 3 y 5 borradores
- si luego se requiere, agregar navegacion a lista completa en una iteracion futura

=====================================================================
8. CARD DE BORRADOR
=====================================================================

Cada borrador debe presentarse como card clickeable o semiactiva con CTA explicito.

8.1 Contenido minimo por card

- contexto principal del uso o equipos
- fecha de entrega
- fecha de creacion o ultima actualizacion
- tipo de solicitud
- paso actual
- contadores de elementos relevantes
- accion `Continuar`

8.2 Campo principal recomendado

Texto principal sugerido:

- `Para uso en: <codigos de equipos o contextos>`

Si hay varios equipos:

- mostrar resumen compacto
- truncar con criterio visual si se vuelve demasiado largo

8.3 Metadata secundaria

Debe mostrar de forma breve:

- `Entrega: dd MMM yyyy`
- `Creado:` o `Actualizado:`
- chip o badge de `tipo_solicitud`

8.4 Paso actual

Debe mostrarse como lectura humana:

- `Paso 2 de 4`
- `Paso 3 de 4`
- `Paso 4 de 4`

Puede reforzarse con:

- mini stepper
- barra de progreso simple

8.5 Contadores auxiliares

Segun el tipo:

- cantidad de equipos o contextos
- cantidad de productos
- cantidad de servicios

No deben saturar la card.

=====================================================================
9. ESTADO DESTACADO DEL BORRADOR MAS RECIENTE
=====================================================================

El borrador mas reciente puede llevar un badge:

- `Mas reciente`

Tratamiento visual:

- badge discreto
- no competir con el CTA principal

La card mas reciente puede usar:

- borde o fondo levemente acentuado

Pero sin romper legibilidad ni parecer un estado de sistema distinto.

=====================================================================
10. MENSAJE DE ADJUNTOS NO RESTAURADOS
=====================================================================

Cuando el usuario vaya a continuar un borrador, la experiencia debe advertir que los adjuntos previos no se restauran.

Regla visual confirmada:

- usar un label opaco gris

Ubicaciones validas:

1. dentro de cada card de borrador
2. o dentro del formulario ya cargado al abrir el wizard

Recomendacion:

- mostrarlo en ambos lugares si el equipo lo considera util
- si solo se muestra una vez, priorizar el wizard cargado

Copy sugerido:

- `Los archivos adjuntos no se restauran al continuar un borrador.`

Tratamiento visual:

- fondo gris muy suave
- texto gris medio
- tamano pequeno, sin competir con la data principal

=====================================================================
11. REGLAS TIPOGRAFICAS
=====================================================================

Regla explicitamente solicitada:

- el texto por defecto que deba leerse con normalidad debe usar tamano `xs`

Aplicacion recomendada:

- cuerpo base del modal: `text-xs`
- metadata de cards: `text-xs`
- labels auxiliares: `text-xs`

Escala recomendada:

- titulo modal: `text-2xl` o equivalente
- subtitulo modal: `text-xs`
- titulo card: `text-sm` o `text-base` segun densidad final
- metadata y texto normal de lectura: `text-xs`
- microcopy secundario o notas: `text-[11px]` si hace falta afinar densidad

Regla adicional:

- no bajar de `xs` para contenido importante
- usar tamaños menores solo para micro etiquetas no esenciales

=====================================================================
12. COMPORTAMIENTO DE LAS ACCIONES
=====================================================================

12.1 CTA `Nueva solicitud`

Accion:

- cerrar modal
- abrir wizard nuevo

12.2 CTA `Continuar`

Accion:

- cerrar modal
- hidratar store con el borrador elegido
- navegar al wizard ya cargado

12.3 CTA inferior `Empezar nueva de todos modos`

Accion:

- misma salida que `Nueva solicitud`

Uso:

- ofrecer una alternativa siempre visible incluso al final del scroll de borradores

12.4 Accion `Ver borradores`

Si se mantiene en la implementacion:

- puede hacer scroll a la lista
- puede enfocar el primer item
- o puede abrir estado expandido si luego se agrega

=====================================================================
13. COMPORTAMIENTO RESPONSIVE
=====================================================================

13.1 Desktop

Modal recomendado:

- ancho amplio, centrado
- max width aproximado de panel mediano a grande
- altura controlada con scroll interno en la zona de borradores

13.2 Tablet

- mantener modal centrado
- reducir paddings
- simplificar densidad visual de las cards

13.3 Mobile

Dos opciones validas:

1. modal centrado adaptado
2. sheet alto con encabezado fijo

Recomendacion:

- priorizar un panel alto con scroll interno si el contenido se vuelve largo

En mobile:

- las cards deben apilar la metadata
- evitar 4 columnas
- mantener CTA `Continuar` siempre visible

=====================================================================
14. ACCESIBILIDAD Y FOCO
=====================================================================

Reglas obligatorias:

- focus trap mientras el modal esta abierto
- cerrar con `Escape`
- restaurar foco al boton `Crear` al cerrar
- marcar correctamente titulo y descripcion para lectores de pantalla
- botones con labels claros

La card completa puede ser interactiva, pero el CTA `Continuar` debe seguir existiendo como accion explicita.

=====================================================================
15. ESTADOS DE UI
=====================================================================

15.1 Loading

Al consultar borradores despues de presionar `Crear`:

- mostrar estado de espera breve
- no abrir un modal vacio sin contenido

15.2 Empty

Si la respuesta final es vacia:

- no mostrar modal
- abrir nueva solicitud

15.3 Error

Si falla la consulta:

- mostrar feedback ligero
- permitir continuar con nueva solicitud

15.4 Lista larga

Si hay muchos borradores:

- mantener scroll solo en lista
- encabezado y acciones principales deben seguir visibles

=====================================================================
16. COPY RECOMENDADO
=====================================================================

Titulo:

- `Crear solicitud`

Subtitulo:

- `Tienes borradores guardados. Elige como deseas continuar.`

Accion principal nueva:

- `Nueva solicitud`

Descripcion:

- `Crea una solicitud desde cero.`

Accion secundaria superior:

- `Ver borradores`

Descripcion:

- `Revisa y continua solicitudes guardadas.`

Bloque:

- `Borradores recientes`

CTA card:

- `Continuar`

CTA inferior:

- `Empezar nueva de todos modos`

Mensaje adjuntos:

- `Los archivos adjuntos no se restauran al continuar un borrador.`

=====================================================================
17. COMPONENTES SUGERIDOS
=====================================================================

Se recomienda separar al menos:

1. modal contenedor
2. card de borrador

Opcionales si el equipo quiere mas orden:

3. encabezado de modal
4. bloque de acciones superiores
5. list wrapper

=====================================================================
18. CRITERIOS DE ACEPTACION
=====================================================================

1. Si existen borradores, el usuario ve un modal antes de entrar al wizard.

2. El modal deja clara la diferencia entre crear nuevo y continuar.

3. El usuario puede continuar un borrador especifico desde su card.

4. El usuario puede empezar una solicitud nueva sin ambiguedad.

5. El contenido normal de lectura usa `xs` como tamano base.

6. El mensaje sobre adjuntos no restaurados aparece con tratamiento gris opaco y no compite con las acciones principales.

7. El modal funciona bien en desktop y mobile sin perder claridad.

8. El foco queda controlado correctamente al abrir y cerrar.

=====================================================================
19. CHECKLIST VISUAL DE IMPLEMENTACION
=====================================================================

- titulo y subtitulo claros
- `text-xs` como base de lectura normal
- dos acciones superiores bien diferenciadas
- lista de borradores recientes ordenada por recencia
- card con paso actual, fechas, tipo y accion `Continuar`
- badge discreto de `Mas reciente`
- mensaje gris opaco de adjuntos no restaurados
- CTA inferior para empezar nuevo de todos modos
- scroll interno limpio y accesible
