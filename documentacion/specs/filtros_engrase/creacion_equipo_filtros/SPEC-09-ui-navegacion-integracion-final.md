# SPEC-09 — UI, navegación e integración final del wizard

## 1. Objetivo

Implementar la interfaz completa del flujo de creación de equipos de Engrase y conectar, sin duplicar lógica de negocio, todos los contratos construidos en `SPEC-01` a `SPEC-08`.

Este spec entrega la pantalla fullscreen, la ruta protegida, el acceso desde el listado, el shell visual, el stepper de cinco pasos, los formularios, las listas, los overlays responsive, la revisión, la creación transaccional, la imagen opcional y la finalización.

La UI debe conservar el lenguaje visual de la edición de equipos, pero representar con claridad un flujo de creación secuencial. No debe convertir el wizard en pestañas ni trasladar validaciones o reglas de persistencia a los componentes.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: modelo local, referencias y estado inicial.
- `SPEC-02-validaciones-payload-creacion.md`: validaciones, vigencia del código y payload.
- `SPEC-03-contratos-mappers-servicios.md`: auxiliares, validación remota, búsqueda y creación.
- `SPEC-04-store-maquina-estados-wizard.md`: navegación, pasos accesibles, overlays y salida segura.
- `SPEC-05-logica-filtros-borrador.md`: editor local de filtros, badges y ocupación por tipo.
- `SPEC-06-logica-aceites-borrador.md`: editor local de aceites y ocupación por sistema.
- `SPEC-07-creacion-transaccional-integracion-listado.md`: submit único, bloqueo e inserción local.
- `SPEC-08-imagen-posterior-finalizacion.md`: procesamiento, subida, registro y omisión de imagen.
- `context_ui.md`: intención visual y flujo funcional.
- `context_bd.md`: contexto de los contratos existentes de base de datos, sin autorizar cambios de esquema.
- La pantalla actual de edición como referencia visual y fuente de componentes reutilizables.

Ante una diferencia con recomendaciones antiguas de `context_ui.md`, prevalecen las decisiones confirmadas y formalizadas en los specs anteriores:

- la validación del código es manual, no automática por debounce ni blur;
- `Validar código` aparece únicamente cuando el código normalizado tiene más de cuatro caracteres;
- el código de filtro puede repetirse si se asigna a un tipo diferente;
- un código ya usado muestra `Ya asignado`, pero no queda bloqueado por ese solo hecho;
- un tipo de filtro ocupado muestra `Asignado` y sí queda deshabilitado;
- creación omite `p_codigo_equipo` al buscar filtros porque el parámetro remoto tiene `NULL` por defecto;
- el stepper permite volver a pasos alcanzados mientras el equipo no se haya creado;
- al entrar a Imagen, los pasos 1–4 quedan bloqueados de forma irreversible;
- creación utiliza temporalmente `editar_filtros_engrase`.

## 3. Dependencias y orden

- Requiere que `SPEC-01` a `SPEC-08` estén implementados.
- Es el último spec funcional de esta serie.
- No debe redefinir contratos de dominio, validaciones, payloads, servicios, store o imagen.
- Si durante la implementación falta un contrato, debe ampliarse el módulo dueño de ese contrato y sus pruebas; no debe resolverse con lógica ad hoc dentro de una vista.
- No requiere cambios en Supabase, nuevas RPC, nuevas tablas, cambios de Storage ni revisión adicional de base de datos.

## 4. Alcance

Incluye:

- ruta fullscreen de creación;
- protección de ruta por funcionalidades;
- navegación desde el botón `+` del listado;
- vista orquestadora del wizard;
- shell, header, stepper, área de contenido y footer sticky;
- estados de carga inicial y error recuperable;
- UI de Datos, Filtros, Aceites, Revisión e Imagen;
- integración del botón manual para validar código;
- variantes de creación para componentes reutilizados desde edición;
- drawers en escritorio y bottom sheets en móvil;
- confirmación de descarte del borrador;
- manejo visual de errores locales y remotos;
- bloqueo de toda interacción incompatible durante operaciones asíncronas;
- finalización y retorno al listado;
- responsive mobile-first;
- accesibilidad de teclado, foco y anuncios;
- pruebas de componentes, ruta e integración del flujo.

No incluye:

- cambios de reglas de negocio ya definidas;
- persistencia parcial antes de Revisar;
- edición del equipo después de crearlo;
- navegación de regreso a pasos 1–4 desde Imagen;
- carga adicional del listado después de crear;
- consultas directas a Supabase desde componentes;
- permisos nuevos;
- autosave o persistencia del borrador entre sesiones;
- recuperación del wizard después de recargar;
- reemplazar la UI general del módulo Engrase.

## 5. Archivos previstos

Crear:

```text
src/views/engrase/
├── EquipoEngraseCrearView.vue
└── EquipoEngraseCrearView.test.ts

src/components/engrase/creacion/
├── EquipoCreacionShell.vue
├── EquipoCreacionHeader.vue
├── EquipoCreacionStepper.vue
├── EquipoCreacionFooter.vue
├── EquipoCreacionLoadingState.vue
├── EquipoCreacionErrorState.vue
├── EquipoCreacionExitDialog.vue
├── datos/
│   ├── EquipoCreacionDatosStep.vue
│   └── EquipoCreacionCodigoField.vue
├── filtros/
│   ├── EquipoCreacionFiltrosStep.vue
│   ├── EquipoCreacionFiltroRow.vue
│   └── EquipoCreacionFiltroOverlay.vue
├── aceites/
│   ├── EquipoCreacionAceitesStep.vue
│   ├── EquipoCreacionAceiteRow.vue
│   └── EquipoCreacionAceiteOverlay.vue
├── revision/
│   └── EquipoCreacionRevisionStep.vue
└── imagen/
    └── EquipoCreacionImagenStep.vue
```

Ampliar:

```text
src/router/index.ts
src/views/engrase/FiltrosEngraseView.vue
src/components/engrase/filtros/EquiposEngrasePanel.vue
```

Crear o ampliar pruebas de ruta según el patrón actual:

```text
src/router/equipoEngraseCreacion.routes.test.ts
```

Los nombres pueden ajustarse al estándar definitivo del repositorio. La separación mínima debe preservar una vista orquestadora pequeña y pasos visuales independientes.

Si un componente de edición ya es neutral y acepta el contrato requerido, se reutiliza directamente. Si está acoplado al store o a estados persistidos de edición, se extrae primero una pieza presentacional compartida o se crea una variante explícita de creación.

## 6. Ruta de creación

Agregar como hermana de la ruta de edición:

```ts
{
  path: "engrase/filtros/equipos/crear",
  name: "EquipoEngraseCrear",
  component: () => import("@/views/engrase/EquipoEngraseCrearView.vue"),
  meta: {
    requiredFeatures: [
      "module_engrase",
      "ver_filtros_engrase",
      "editar_filtros_engrase",
    ],
    layout: "fullscreen",
  },
}
```

Reglas:

- declarar esta ruta antes de cualquier ruta dinámica que pudiera interpretar `crear` como parámetro;
- mantener lazy loading;
- no agregar parámetros de equipo porque aún no existe;
- el acceso directo por URL queda cubierto por el guard global existente;
- no duplicar una comprobación remota de permisos dentro de la vista;
- la UI puede derivar el permiso para ocultar el acceso, pero la ruta sigue siendo la barrera efectiva.

## 7. Acceso desde el listado

El botón con `aria-label="Agregar equipo"` de `EquiposEngrasePanel.vue` debe emitir un evento semántico:

```ts
crearEquipo: []
```

La vista `FiltrosEngraseView.vue` recibe el evento y navega:

```ts
router.push({ name: "EquipoEngraseCrear" })
```

Reglas:

- conservar la visibilidad actual basada en `editar_filtros_engrase`;
- no hacer que el componente de panel conozca nombres de rutas;
- no inicializar el wizard desde el botón;
- no precargar auxiliares en el listado;
- evitar doble navegación si el usuario activa el botón repetidamente;
- mantener `title` y `aria-label` descriptivos; preferir `Crear equipo` sobre `Agregar equipo` si se actualiza el texto accesible.

## 8. Responsabilidad de la vista orquestadora

`EquipoEngraseCrearView.vue` debe:

1. obtener las referencias públicas del store mediante `storeToRefs`;
2. utilizar el composable de ciclo de vida definido desde `SPEC-04`;
3. inicializar el wizard al montar;
4. renderizar carga, error inicial o shell;
5. seleccionar el componente del paso actual;
6. conectar eventos visuales con acciones tipadas del store;
7. orquestar apertura y cierre de overlays sin duplicar su estado;
8. dirigir el foco después de errores y cambios de paso;
9. navegar al listado únicamente cuando el store autorice salida o finalización;
10. resetear el estado conforme al ciclo de vida ya definido.

La vista no debe:

- construir payloads;
- llamar servicios directamente;
- decidir duplicados;
- mutar arreglos anidados del borrador;
- volver a implementar `puedeAbrirPaso`;
- inferir éxito a partir de textos;
- administrar manualmente la lista global de equipos;
- procesar archivos de imagen.

## 9. Estado raíz de la pantalla

La jerarquía principal es:

```text
EquipoEngraseCrearView
├── EquipoCreacionLoadingState
├── EquipoCreacionErrorState
└── EquipoCreacionShell
    ├── EquipoCreacionHeader
    ├── EquipoCreacionStepper
    ├── Paso actual
    ├── EquipoCreacionFooter
    └── Overlays / diálogos
```

Sólo puede mostrarse uno de estos estados raíz:

- carga inicial;
- error inicial;
- wizard listo.

No renderizar formularios con auxiliares incompletos ni usar valores vacíos provisionales para aparentar que la pantalla está lista.

## 10. Carga inicial y error recuperable

Durante la carga:

- mostrar `Cargando creación de equipo…` con `role="status"`;
- mantener una estructura estable para reducir saltos visuales;
- no mostrar el footer operativo;
- no permitir interacciones.

Ante error inicial:

- mostrar `No se pudo iniciar la creación del equipo`;
- incluir el mensaje seguro entregado por el store;
- ofrecer `Volver a equipos` y `Reintentar`;
- `Reintentar` usa la acción de carga única/reintento del store;
- `Volver a equipos` no necesita confirmación si el borrador nunca adquirió contenido;
- no presentar controles del wizard parcialmente habilitados.

## 11. Shell visual

`EquipoCreacionShell.vue` define una pantalla fullscreen con cuatro zonas estables:

```text
Header
Stepper
Contenido desplazable
Footer sticky
```

Reglas visuales:

- fondo general `bg-second` o el token beige equivalente ya usado en edición;
- contenido centrado con ancho máximo consistente con `EquipoEdicionShell`;
- tarjetas blancas, bordes neutros, sombra ligera y radios existentes;
- densidad compacta de ERP;
- teal del sistema como color principal;
- rojo sólo para errores y acciones destructivas;
- no copiar el tablist de edición;
- el área de contenido debe reservar espacio inferior para que el footer no tape controles;
- respetar `env(safe-area-inset-bottom)` en móvil;
- evitar una altura fija dependiente de la ventana si produce doble scroll.

El shell debe recibir datos ya derivados y emitir eventos. No debe importar el store.

## 12. Header

El header muestra:

```text
← Volver a la lista de equipos | Nuevo equipo | Creación        ● Borrador
```

Después del éxito transaccional:

```text
← Volver a la lista de equipos | Nuevo equipo | Creación        ✓ Creado
```

Reglas:

- la acción Volver llama al flujo de salida segura, no navega directamente;
- `Borrador` deriva de la ausencia de `draft.equipoCreado`;
- `Creado` deriva de la presencia de `draft.equipoCreado`;
- no mostrar estados intermedios falsos como `Guardado parcialmente`;
- durante la creación, el estado puede anunciar `Creando…`, pero el layout no debe cambiar de tamaño;
- en móvil abreviar elementos secundarios visualmente sin perder el nombre accesible;
- mantener visible que el equipo ya fue creado durante todo el paso Imagen.

## 13. Stepper

El stepper contiene exactamente:

1. Datos del equipo.
2. Filtros.
3. Aceites.
4. Revisar.
5. Imagen.

Estados visuales:

- futuro: círculo y texto neutros;
- actual: círculo teal con número blanco y énfasis en el título;
- completado: círculo teal con `Check` y conector completado;
- bloqueado después de crear: conserva apariencia completada en pasos 1–4, pero no apariencia interactiva;
- Imagen actual: énfasis activo y señal de que el equipo ya existe.

### 13.1. Interacción antes de crear

Cada paso debe consultar:

```ts
store.puedeAbrirPaso(numero)
```

Comportamiento:

- actual: accesible;
- completado o ya alcanzado: clickable;
- futuro no alcanzado: bloqueado;
- Imagen: bloqueado;
- hacer clic llama únicamente `store.irAPaso(numero)`;
- no validar ni completar desde el componente;
- volver a un paso conserva su contenido;
- puede volver a avanzarse por clic sólo hasta el mayor paso alcanzado.

### 13.2. Interacción después de crear

Al entrar a Imagen:

- pasos 1–4 quedan no interactivos;
- no se renderizan como botones habilitados;
- no responden a mouse, touch, Enter ni Space;
- Imagen es el único paso accesible;
- no existe atajo visual o de teclado para regresar;
- el bloqueo persiste aunque falle la carga de imagen.

### 13.3. Accesibilidad

Usar una lista ordenada o navegación etiquetada:

```html
<nav aria-label="Progreso de creación del equipo">
```

El paso actual usa `aria-current="step"`. Los alcanzados interactivos son botones reales. Los no accesibles pueden ser elementos no interactivos o botones con `disabled` real.

Cada control debe comunicar por texto accesible:

- título;
- número o completado;
- estado actual, completado o no disponible.

No depender sólo de color ni de un icono `Check`.

## 14. Footer y matriz de acciones

El footer es sticky y sus controles dependen exclusivamente del paso y de los getters del store.

| Paso | Acción secundaria | Acción principal |
|---|---|---|
| 1 | Cancelar | Siguiente |
| 2 | Atrás | Siguiente |
| 3 | Atrás | Siguiente |
| 4 | Atrás | Crear equipo |
| 5 sin imagen aplicada | Omitir por ahora | Guardar imagen o Finalizar, según estado |
| 5 con imagen aplicada | — o Cerrar | Finalizar |

Reglas:

- `Siguiente` ejecuta la acción de avance del store;
- `Atrás` ejecuta `retroceder()`;
- `Cancelar` solicita salida segura;
- `Crear equipo` ejecuta la acción transaccional de `SPEC-07`;
- el primer submit bloquea navegación y doble submit;
- `Omitir por ahora` ejecuta la omisión explícita de `SPEC-08` y finaliza;
- `Guardar imagen` sólo aparece cuando existe un archivo preparado sin aplicar;
- después de guardar la imagen se ofrece `Finalizar`;
- no mostrar un botón Atrás en Imagen;
- no mostrar un guardado general en Imagen;
- la acción principal debe reflejar `Creando equipo…`, `Guardando imagen…` o el estado bloqueante correspondiente;
- controles bloqueados usan `disabled`, no sólo clases visuales.

Si `SPEC-08` mantiene guardar imagen y finalizar como acciones separadas, la UI no debe fusionarlas de forma que oculte un error de registro o limpieza. Finalizar sólo está disponible cuando el estado de imagen lo permita.

## 15. Cambio de paso y foco

Después de un cambio exitoso de paso:

- desplazar el contenedor principal al inicio sin animación obligatoria;
- enfocar el `h1` o `h2` del paso con `tabindex="-1"`;
- anunciar el nuevo paso en una región `aria-live="polite"`;
- no conservar foco dentro de un componente oculto.

Si el avance falla por validación:

- mantener el paso actual;
- mostrar un resumen breve cuando exista más de un error;
- enfocar el resumen o el primer campo inválido;
- asociar cada mensaje mediante `aria-describedby`;
- no abrir automáticamente overlays para corregir datos.

## 16. Paso 1 — Datos del equipo

`EquipoCreacionDatosStep.vue` presenta:

- Código.
- Tipo de equipo.
- Modelo / subtipo.
- Etapas.
- Estado.
- mensaje informativo de que la imagen se agregará después de crear.

No presenta imagen ni ejecuta persistencia.

El formulario puede reutilizar piezas neutrales de:

- `EquipoDatosForm.vue`;
- `EquipoTipoField.vue`;
- `EquipoTipoNuevoOverlay.vue`;
- `EquipoEtapasField.vue`;
- selectores de catálogo compartidos.

Debe adaptarse para:

- usar `CrearEquipoDraft`;
- no asumir un código persistido;
- no mostrar cambios pendientes de edición;
- enviar todas las mutaciones mediante acciones del store de creación;
- bloquear el formulario completo después del primer submit, aunque normalmente ya no sea visible tras el éxito.

## 17. Campo de código y validación manual

`EquipoCreacionCodigoField.vue` debe mantener separados el input y la validación remota.

### 17.1. Visibilidad del botón

El botón `Validar código` aparece cuando:

```text
longitud(código normalizado) > 4
```

Si la longitud es de cuatro caracteres o menos:

- el botón no aparece;
- puede mostrarse la ayuda `Escribe al menos 5 caracteres para validar`;
- `Siguiente` permanece bloqueado porque no existe una validación vigente.

### 17.2. Escritura

Cada cambio del input:

- llama la mutación de código del store;
- invalida inmediatamente el resultado anterior si cambió el valor normalizado;
- oculta cualquier estado `Disponible` obsoleto;
- no dispara RPC;
- no valida por debounce;
- no valida en blur;
- no muestra el botón si la operación transaccional ya comenzó.

### 17.3. Activación

Al presionar `Validar código`:

- llamar la acción asíncrona definida en `SPEC-04`;
- cambiar el texto a `Validando…`;
- bloquear activaciones repetidas mientras la solicitud esté vigente;
- conservar el input según el contrato del store;
- descartar visualmente respuestas obsoletas.

### 17.4. Resultados

Disponible:

```text
✓ Código disponible
El código está disponible para Engrase.
```

Ocupado:

```text
Este código ya existe en Engrase.
Modelo: {modelo}
Estado: {Activo|Descartado}
```

Error remoto:

- mensaje seguro del store;
- botón vuelve a `Validar código` para reintentar;
- no confundir error técnico con código ocupado;
- `Siguiente` permanece bloqueado.

El resultado debe utilizar texto e icono; no sólo borde verde o rojo.

## 18. Tipo de equipo, etapas y estado

Tipo de equipo:

- permite seleccionar un tipo existente;
- permite crear una referencia local nueva si los contratos anteriores lo admiten;
- el overlay de nuevo tipo no persiste por sí mismo;
- nombres duplicados se resuelven con la regla pura del dominio.

Etapas:

- multiselect de auxiliares ya cargados;
- al menos una etapa;
- chips removibles con nombre accesible;
- no permite crear etapas.

Estado:

- control segmentado `Activo` / `Descartado`;
- ambas opciones mantienen tratamiento de selección, no de acción destructiva;
- usa valores del dominio, no labels como estado interno.

## 19. Paso 2 — Filtros

`EquipoCreacionFiltrosStep.vue` muestra:

- título `Filtros del equipo`;
- ayuda `Debe existir al menos un filtro`;
- contador derivado;
- botón `Agregar filtro`;
- lista compacta de filas;
- estado vacío accionable;
- errores del paso.

Cada fila muestra:

- icono o representación del tipo;
- nombre del tipo de filtro;
- código original;
- cantidad;
- estado de lista de compras;
- editar;
- eliminar.

Reglas:

- `key` usa `draftId`, no índice;
- no mostrar IDs internos;
- editar abre el overlay con contexto y exclusión del propio `draftId`;
- eliminar usa la acción local del store;
- no mostrar `pendiente de eliminación` ni deshacer propio de edición;
- bloquear la eliminación del último filtro y explicar `Debe existir al menos un filtro`;
- no persistir al agregar, editar o eliminar;
- las cantidades se muestran y editan conforme a `SPEC-05`.

## 20. Overlay de filtros

`EquipoCreacionFiltroOverlay.vue` puede componer formularios neutrales extraídos de la edición, pero el estado y las decisiones pertenecen al store de creación.

Modos mínimos:

```ts
"buscar" | "resultado" | "nuevo" | "editar"
```

### 20.1. Responsive

- escritorio: drawer lateral derecho;
- móvil: bottom sheet;
- mismo contenido, validaciones y eventos;
- no duplicar un componente por breakpoint;
- transición respetuosa de `prefers-reduced-motion`;
- focus trap sólo cuando funciona como diálogo modal;
- restaurar foco al botón que abrió el overlay.

Los multiselect de tipo usados al buscar, crear o editar un filtro deben cumplir además el contrato específico de posicionamiento definido en `20.6`.

### 20.2. Búsqueda

La UI llama la acción de búsqueda del store con sólo el código. El servicio de creación debe omitir `p_codigo_equipo`.

No enviar:

```ts
{ p_codigo_equipo: null }
```

Enviar conceptualmente:

```ts
{ p_codigo: codigoNormalizado }
```

porque la RPC ya posee `p_codigo_equipo DEFAULT NULL`.

### 20.3. Código ya usado

Si un código aparece en otra asociación del borrador:

- mostrar badge `Ya asignado` junto al código;
- mantener la opción de abrir o seleccionar ese código;
- no deshabilitarlo sólo por estar usado;
- permitir asociarlo si existe al menos un tipo libre;
- si no hay tipos libres, explicar la razón y bloquear el CTA final.

### 20.4. Tipo ocupado

En el selector de tipos:

- mantener visible todo tipo ocupado;
- mostrar badge `Asignado` dentro de la opción;
- aplicar `disabled` real;
- impedir selección por mouse, touch y teclado;
- no ocultarlo, porque el usuario necesita comprender por qué no puede elegirlo;
- al editar, excluir la asociación actual del cálculo de ocupación.

La regla definitiva es:

```text
mismo código + tipo diferente → permitido
mismo tipo ya ocupado         → bloqueado
```

### 20.5. Resultado y alta local

- coincidencia exacta: elegir un tipo libre y cantidad;
- sugerencias: indicar `Ya asignado` sin convertirlo en bloqueo total;
- código nuevo: permitir referencia temporal conforme a `SPEC-05`;
- tipo nuevo: permitir referencia temporal si no duplica un tipo existente o temporal;
- confirmar agrega o actualiza el borrador y cierra el overlay;
- cancelar descarta únicamente el estado efímero del overlay.

### 20.6. Multiselect dentro del bottom sheet

Existe una restricción conocida de `vue-multiselect` dentro de un bottom sheet con encabezado fijo, altura máxima y contenido interno con `overflow-y-auto`.

Sin la adaptación, el componente puede calcular la dirección usando el espacio de toda la ventana, abrir la lista hacia arriba y quedar recortado detrás del encabezado por el contenedor con overflow. Elevar el `z-index` no resuelve el problema porque el recorte ocurre en el ancestro desplazable, no en el orden de apilamiento.

La creación debe reutilizar la corrección existente:

```text
src/composables/engrase/useEquipoOverlayMultiselect.ts
```

Aplicarla a:

- Tipo al buscar un filtro existente;
- Tipo al crear un filtro nuevo;
- Tipo al editar una asociación de filtro.

Contrato obligatorio:

1. el `VueMultiselect` expone la template ref `multiselect` esperada por el composable;
2. configura `open-direction="below"`;
3. conecta `@open="acomodarOpcionesEnOverlay"`;
4. el contenedor interno que realmente desplaza el contenido del overlay expone `data-equipo-overlay-scroll`;
5. en móvil, al abrir, se espera `nextTick()`;
6. se encuentra el ancestro desplazable mediante ese atributo;
7. se desplaza el sheet para colocar el control dentro del área visible, inmediatamente debajo del encabezado y con el margen definido por el helper;
8. se espera un segundo `nextTick()`;
9. se invoca `adjustPosition()` para que `vue-multiselect` recalcule la altura disponible;
10. si existen muchas opciones, el menú conserva su propio desplazamiento interno.

En escritorio el composable no debe mover el drawer. Si el selector no está dentro de un contenedor identificado, debe terminar sin error ni scroll global.

No copiar esta secuencia en cada formulario. `EquipoCatalogSelect.vue`, `EquipoTipoFiltroNuevoField.vue` o sus extracciones neutrales deben seguir siendo los puntos de integración compartidos. `append-to-body` o un `z-index` mayor no sustituyen este contrato.

## 21. Paso 3 — Aceites

`EquipoCreacionAceitesStep.vue` muestra:

- título `Aceites asociados`;
- texto `Los aceites son opcionales`;
- contador derivado;
- botón `Agregar aceite`;
- filas o estado vacío;
- errores de conflicto si existen.

Cada fila muestra:

- sistema;
- aceite;
- editar;
- eliminar.

Reglas:

- una asociación por sistema;
- el estado vacío no bloquea Siguiente;
- eliminación inmediata del borrador;
- no mostrar estados de persistencia de edición;
- `draftId` como identidad visual;
- editar excluye la fila actual del cálculo de ocupación.

## 22. Overlay de aceites

`EquipoCreacionAceiteOverlay.vue` reutiliza el patrón responsive del editor existente:

- drawer lateral en escritorio;
- bottom sheet en móvil;
- sistema existente o nuevo;
- aceite existente o nuevo;
- aviso `La asociación se aplicará al crear el equipo`;
- CTA `Agregar` o `Actualizar` según modo.

Los multiselect de Sistema y Aceite, tanto al agregar como al editar, deben reutilizar `useEquipoOverlayMultiselect.ts` y cumplir el contrato completo de `20.6`. El contenedor con `overflow-y-auto` de este overlay también debe exponer `data-equipo-overlay-scroll`.

Los sistemas ocupados:

- permanecen visibles;
- muestran badge `Asignado`;
- usan `disabled` real;
- no pueden seleccionarse con teclado;
- muestran una explicación cuando todos están ocupados.

Agregar, editar o eliminar sólo modifica el borrador local.

## 23. Paso 4 — Revisar y crear

`EquipoCreacionRevisionStep.vue` no contiene inputs editables. Presenta una confirmación operativa dividida en:

- Datos del equipo.
- Filtros.
- Aceites.
- Resumen de cantidades.
- aviso de que la imagen se agregará en el siguiente paso.

### 23.1. Datos

Mostrar:

- código;
- tipo de equipo;
- modelo/subtipo;
- etapas como chips o lista breve;
- estado con badge textual.

### 23.2. Filtros

Mostrar cada asociación con:

- tipo;
- código;
- cantidad;
- estado de lista de compras.

No ocultar filtros detrás de un único contador. Puede resumirse visualmente, pero toda la configuración debe poder revisarse antes de crear.

### 23.3. Aceites

Mostrar cada sistema y aceite. Si no hay asociaciones:

```text
Sin aceites asociados — esta sección es opcional.
```

### 23.4. Resumen

Mostrar contadores de etapas, filtros y aceites. No convertirlos en navegación si el store no autoriza el destino; si se agregan enlaces `Editar`, deben usar `irAPaso` y respetar exactamente las reglas del stepper.

## 24. Submit de creación

El botón `Crear equipo`:

- se habilita sólo si el store indica que el borrador integral es válido;
- al primer submit bloquea footer, stepper, formularios, overlays y salida;
- muestra `Creando equipo…`;
- no admite doble activación;
- ejecuta la acción de `SPEC-07`;
- no construye ni modifica el argumento RPC en la vista.

En éxito:

1. el equipo se inserta en el store del listado mediante la acción ya definida;
2. el header cambia a `Creado`;
3. pasos 1–4 quedan completados y bloqueados;
4. se entra automáticamente a Imagen;
5. se anuncia `Equipo {codigo} creado correctamente`;
6. no se recarga la lista.

En error:

- mantener el usuario en Revisar, salvo que el store dirija a un paso corregible;
- reactivar navegación cuando el estado transaccional lo permita;
- mostrar el mensaje tipado de `SPEC-07`;
- si el código quedó ocupado, llevar a Datos y enfocar el campo de código;
- si hay catálogo obsoleto, dirigir a la sección correspondiente según el error mapeado;
- no limpiar el borrador;
- permitir reintento explícito;
- no mostrar éxito parcial si la RPC falló.

## 25. Paso 5 — Imagen

`EquipoCreacionImagenStep.vue` deja claro que el equipo ya existe.

Debe mostrar:

- banner `Equipo {codigo} creado correctamente`;
- código, tipo y modelo del equipo creado;
- placeholder o preview;
- acciones `Galería` y `Tomar foto`;
- cropper cuando corresponda;
- estado de preparación y subida;
- errores recuperables;
- acciones de guardar, omitir y finalizar conforme a `SPEC-08`.

Puede reutilizar piezas neutrales de:

- `EquipoImagenCropper.vue`;
- `EquipoImagenPreview.vue`;
- controles de selección/captura;
- servicio y procesador desacoplados en `SPEC-08`.

No debe reutilizar sin adaptación un manager que asuma edición o reemplazo de una imagen existente.

### 25.1. Estados visuales

Sin archivo:

```text
Aún no hay imagen
Agrega una imagen para identificar este equipo.
```

Preparando:

```text
Preparando imagen…
```

Lista para guardar:

- preview local;
- opción de reemplazar selección;
- CTA `Guardar imagen`.

Subiendo o registrando:

- progreso indeterminado accesible;
- bloqueo de selección, omisión y finalización.

Guardada:

- preview persistida o URL firmada;
- confirmación `Imagen agregada`;
- CTA `Finalizar`.

Error:

- explicar si falló preparación, subida, registro o limpieza;
- ofrecer sólo acciones válidas según la unión de estado;
- reiterar que el equipo ya fue creado;
- nunca ofrecer regresar a Revisar.

### 25.2. Omisión

`Omitir por ahora`:

- sólo está disponible cuando no existe una operación bloqueante;
- pide confirmación únicamente si existe un archivo preparado que se perderá, según `SPEC-08`;
- no llama RPC de imagen;
- no genera error;
- finaliza el wizard y vuelve al listado.

### 25.3. Limpieza pendiente

Si queda un archivo físico pendiente de limpiar:

- mostrar el estado con texto, no sólo color;
- ofrecer reintento de limpieza;
- no afirmar que el equipo no fue creado;
- impedir una finalización silenciosa si `SPEC-08` exige resolver o reconocer explícitamente el pendiente;
- mantener pasos 1–4 bloqueados.

## 26. Finalización

La finalización exitosa u omisión debe:

1. marcar el wizard como finalizado mediante la acción del store;
2. liberar previews locales y recursos de imagen;
3. navegar a `{ name: "FiltrosEngrase" }`;
4. resetear el store de creación en el momento seguro definido por el composable;
5. conservar el equipo ya insertado en el store del listado;
6. no ejecutar una recarga global;
7. permitir que el usuario encuentre el equipo en la lista aunque los filtros actuales pudieran ocultarlo, usando el comportamiento de integración establecido en `SPEC-07`.

No navegar automáticamente a edición. La acción esperada al cerrar creación es regresar al listado.

## 27. Salida y descarte

Antes de crear, Volver, Cancelar y navegación externa deben consultar la salida segura del store.

Si el borrador contiene información:

```text
Descartar creación
Los datos ingresados todavía no se han creado y se perderán.

[Seguir creando] [Descartar y salir]
```

Reglas:

- `Seguir creando` cierra el diálogo y restaura foco;
- `Descartar y salir` resetea y navega;
- cerrar por Escape equivale a seguir creando, si no hay operación bloqueante;
- clic fuera no descarta directamente;
- durante creación no se puede confirmar salida;
- `beforeunload` usa el mecanismo de navegador definido en `SPEC-04`.

Después de crear:

- salir no debe advertir que se perderá el equipo;
- si hay archivo preparado o limpieza pendiente, aplicar las decisiones específicas de `SPEC-08`;
- nunca presentar `Cancelar creación` en Imagen.

## 28. Overlays y capas

El orden de capas debe ser consistente:

```text
pantalla
footer sticky
scrim
drawer / bottom sheet
diálogo de confirmación
avisos globales
```

Reglas:

- usar `Teleport to="body"` cuando sea necesario para evitar recortes;
- no permitir que el footer quede por encima de un diálogo modal;
- bloquear scroll de fondo sólo en overlays modales móviles;
- restaurar el overflow original al desmontar;
- no cerrar un overlay durante una operación bloqueante;
- Escape solicita cierre cuando sea seguro;
- todos los overlays tienen título mediante `aria-labelledby`;
- formularios largos tienen footer interno sticky sin tapar campos.

Para overlays que contienen `vue-multiselect`:

- el nodo con `overflow-y-auto` debe ser el mismo identificado por `data-equipo-overlay-scroll`;
- abrir una lista en móvil debe acomodar el selector debajo del header antes de recalcular su posición;
- listas extensas desplazan sus opciones internamente y no deben expandir el sheet más allá de su altura máxima;
- no intentar corregir un recorte por overflow únicamente aumentando `z-index`.

## 29. Responsive mobile-first

### 29.1. XS

- una columna;
- padding compacto y seguro;
- header simplificado sin eliminar la acción Volver;
- stepper horizontal con scroll si no cabe;
- el paso actual debe entrar en el viewport al cambiar;
- footer con botones de alto mínimo táctil y ancho útil;
- formularios en una columna;
- filas convertidas en cards compactas, no tablas rígidas;
- chips con wrap;
- overlays como bottom sheets de altura limitada y contenido desplazable;
- al abrir un multiselect, el sheet desplaza su contenido para mantener el control y la lista debajo del encabezado fijo;
- respetar teclado virtual y safe areas;
- Galería y Tomar foto permanecen accesibles.

### 29.2. SM y MD

- dos columnas en Datos sólo cuando los labels y errores mantengan legibilidad;
- listas conservan acciones visibles;
- stepper puede seguir desplazable;
- overlays pueden usar sheet o drawer según el breakpoint ya adoptado por edición.

### 29.3. Escritorio

- contenido centrado y ancho máximo controlado;
- formulario de Datos en dos columnas;
- validación de código puede ocupar un panel lateral secundario;
- Revisión puede usar tres subcards y resumen lateral;
- overlays como drawer derecho;
- footer sticky alineado con el contenido;
- evitar espacios vacíos propios de un dashboard cuando el formulario es corto.

No mantener dos árboles de UI distintos para móvil y escritorio salvo que una presentación semántica realmente lo requiera.

## 30. Estados asíncronos y bloqueo

La UI debe derivar estados de las uniones y getters del store, no combinar flags locales contradictorios.

| Operación | Bloquea paso | Bloquea stepper | Bloquea salida |
|---|---:|---:|---:|
| Carga inicial | Sí | Sí | No aplica |
| Validar código | Campo/CTA relacionado | Avance | No necesariamente |
| Buscar filtro | Overlay relacionado | No | No |
| Crear equipo | Sí | Sí | Sí |
| Preparar imagen | Controles de imagen | Pasos 1–4 ya bloqueados | Según SPEC-08 |
| Subir/registrar imagen | Sí | Sí | Sí |
| Limpiar archivo | Controles relacionados | Sí | Según SPEC-08 |

Cada loading debe tener texto contextual. No usar un único spinner global para búsquedas locales que haga desaparecer todo el wizard.

## 31. Mensajes, errores y éxito

- errores de campo junto al control;
- errores de paso en un resumen enfocable;
- errores remotos generales en `role="alert"`;
- estados de carga en `role="status"` o `aria-live="polite"`;
- éxito de creación anunciado una vez al entrar a Imagen;
- éxito de imagen anunciado una vez al confirmarse;
- evitar toasts como única fuente de información crítica;
- no exponer nombres de RPC, payloads, rutas de Storage o errores técnicos crudos al usuario;
- mantener mensajes accionables y específicos.

## 32. Accesibilidad obligatoria

- navegación completa por teclado;
- foco visible;
- objetivos táctiles de al menos 44 px en móvil cuando sea viable;
- labels asociados a inputs;
- `aria-invalid` y `aria-describedby` en errores;
- badges con texto real;
- opciones ocupadas con `disabled` real;
- botones de icono con nombre que incluya el elemento, por ejemplo `Editar filtro B7030`;
- stepper con `aria-current="step"`;
- diálogos con foco inicial, contención y restauración;
- no depender únicamente de color, posición o iconos;
- animaciones desactivables con `prefers-reduced-motion`;
- contraste compatible con los tokens existentes;
- regiones de scroll con foco accesible cuando corresponda;
- orden DOM coherente con el orden visual.

## 33. Reutilización de la UI de edición

Se permite reutilizar:

- tokens, espaciado y composición visual;
- campos de tipo de equipo y etapas si son presentacionales;
- selectores de catálogo;
- formularios internos de filtros y aceites;
- patrón drawer/bottom sheet;
- `useEquipoOverlayMultiselect.ts` para posicionar y recalcular selectores dentro de bottom sheets;
- filas e iconografía si aceptan un contrato neutral;
- cropper y preview de imagen;
- header como referencia visual, no necesariamente como componente directo.

Debe adaptarse:

- tabs por stepper;
- snapshot persistido por borrador local;
- eliminar marcado por eliminación inmediata;
- badges de edición por `Ya asignado` y `Asignado`;
- bloqueo por filtro ID por ocupación exclusiva del tipo;
- guardado general por creación transaccional única;
- imagen dentro de Datos por paso posterior a creación;
- cancelación de cambios por descarte de creación;
- navegación libre de edición por bloqueo irreversible en Imagen.

Evitar:

- propagar `isCreation` por toda la jerarquía;
- importar ambos stores en componentes compartidos;
- hacer `if` por modo para alterar reglas de dominio;
- reutilizar un componente sólo por similitud visual si su contrato contradice creación.

La preferencia es:

```text
componente presentacional neutral
    + contrato explícito de props/eventos
    + contenedor específico de creación
```

## 34. Integración con stores

Los componentes presentacionales:

- reciben valores inmutables o referencias tipadas por props;
- emiten intenciones;
- no importan Pinia;
- no llaman servicios;
- no mutan props.

La vista o contenedores de paso:

- llaman acciones públicas del store;
- usan getters para disabled, badges, contadores y accesibilidad;
- no duplican computados de identidad compleja ya definidos en `SPEC-05` y `SPEC-06`.

El store de creación:

- sigue siendo la única fuente mutable del wizard;
- delega la actualización de la lista al contrato de `SPEC-07`;
- delega imagen a `SPEC-08`;
- no contiene referencias a componentes ni al DOM.

## 35. Reglas Vue y TypeScript

- Vue 3 con Composition API y `<script setup lang="ts">`.
- TypeScript estricto.
- `defineProps` y `defineEmits` tipados.
- `storeToRefs` para referencias reactivas del store.
- `computed` para estado derivado visual.
- `shallowRef` para refs efímeras reemplazadas completamente.
- `useTemplateRef` para foco y paneles cuando aplique.
- no usar `any`, casts dobles ni contratos remotos sin tipos.
- no usar watchers profundos para sincronizar formularios.
- no copiar el borrador a un segundo estado local del formulario.
- no agregar una librería de stepper, formularios o overlays.
- iconos desde la dependencia ya existente.
- keys estables con `draftId` o ID persistido.
- eventos semánticos en lugar de callbacks genéricos.

## 36. Pruebas de ruta y acceso

Cubrir:

- `/engrase/filtros/equipos/crear` resuelve `EquipoEngraseCrear`;
- la ruta usa layout fullscreen;
- requiere `module_engrase`;
- requiere `ver_filtros_engrase`;
- requiere temporalmente `editar_filtros_engrase`;
- no se interpreta `crear` como código de edición;
- el botón de crear se oculta sin permiso;
- el botón emite y la vista navega a la ruta correcta;
- el acceso directo queda rechazado por el guard cuando falta una funcionalidad.

## 37. Pruebas del shell y stepper

Cubrir:

- cinco pasos en orden;
- estado actual, completado y futuro;
- clic en paso completado llama `irAPaso`;
- paso futuro no es interactivo;
- paso alcanzado puede reabrirse;
- antes de crear, Imagen no es accesible;
- después de crear, pasos 1–4 no son interactivos;
- `aria-current` correcto;
- footer correcto para cada paso;
- no aparece Atrás en Imagen;
- estado del header cambia de Borrador a Creado.

## 38. Pruebas de Datos

Cubrir:

- botón de validar oculto con 0–4 caracteres normalizados;
- visible desde 5 caracteres;
- escribir no ejecuta validación remota;
- blur no ejecuta validación remota;
- clic ejecuta una sola validación;
- loading impide doble clic;
- cambio de código invalida resultado anterior;
- resultado disponible se anuncia;
- resultado ocupado muestra modelo y estado;
- error remoto habilita reintento;
- Siguiente depende de validación vigente y demás campos;
- selección de tipo, etapas y estado emite mutaciones correctas;
- nuevo tipo permanece local.

## 39. Pruebas de Filtros

Cubrir:

- estado vacío y mínimo requerido;
- filas con código, tipo, cantidad y compras;
- editar y eliminar por `draftId`;
- último filtro no puede eliminarse;
- búsqueda no envía `p_codigo_equipo` desde la capa correspondiente;
- código usado muestra `Ya asignado` y sigue seleccionable;
- mismo código con tipo diferente puede agregarse;
- tipo ocupado muestra `Asignado` y está deshabilitado;
- todos los tipos ocupados explican el bloqueo;
- al editar, el tipo propio no se considera ocupado;
- cerrar overlay descarta estado efímero y restaura foco;
- drawer y bottom sheet comparten acciones.
- los selectores de tipo fuerzan `openDirection="below"`;
- al abrir en móvil, el contenedor `data-equipo-overlay-scroll` se desplaza para mostrar el selector bajo el header;
- `adjustPosition()` se ejecuta después de actualizar scroll y DOM;
- abrir el mismo selector en escritorio no modifica el scroll del drawer;
- ausencia del contenedor identificado no produce error ni desplaza la ventana;
- una lista extensa conserva scroll interno y no queda recortada detrás del encabezado.

## 40. Pruebas de Aceites

Cubrir:

- lista vacía permite continuar;
- sistema ocupado muestra `Asignado` y está deshabilitado;
- no puede agregarse un segundo aceite al mismo sistema;
- edición excluye su propio sistema;
- agregar, editar y eliminar sólo modifican borrador;
- referencias nuevas aparecen correctamente;
- mensaje indica que se aplicará al crear;
- accesibilidad del overlay y restauración de foco.
- los selectores de Sistema y Aceite reutilizan el mismo comportamiento de apertura hacia abajo;
- el caso móvil verifica scroll del sheet y recálculo de posición para ambos selectores;
- el comportamiento se conserva en agregar y editar sin implementar handlers duplicados.

## 41. Pruebas de Revisión y submit

Cubrir:

- revisión refleja exactamente el borrador;
- muestra todos los filtros y aceites;
- aceites vacíos se presentan como opcionales;
- contadores correctos;
- primer submit bloquea navegación;
- doble submit no llama dos veces;
- éxito cambia a Imagen y bloquea pasos anteriores;
- éxito no recarga lista;
- error conserva borrador;
- error de código enfoca Datos;
- reintento usa la acción transaccional sin duplicar equipo local.

## 42. Pruebas de Imagen y finalización

Cubrir:

- banner confirma que el equipo ya existe;
- Galería y Tomar foto activan entradas correctas;
- archivo preparado muestra preview y Guardar imagen;
- operación bloqueante deshabilita omisión y finalización;
- éxito permite finalizar;
- omitir sin imagen navega al listado sin RPC de imagen;
- omitir con archivo preparado respeta confirmación definida;
- error informa que el equipo sigue creado;
- limpieza pendiente ofrece reintento;
- nunca se habilitan pasos 1–4;
- finalizar resetea creación pero conserva el equipo en el listado;
- no se recarga el listado.

## 43. Pruebas responsive y accesibilidad

Cubrir al menos mediante componentes y atributos:

- stepper desplazable en viewport estrecho;
- overlay adopta comportamiento modal móvil y drawer de escritorio;
- controles mantienen nombres accesibles;
- opciones ocupadas tienen `disabled`;
- errores se asocian a campos;
- foco cambia al título al navegar;
- foco vuelve al trigger al cerrar overlay;
- diálogo de descarte contiene y restaura foco;
- animaciones respetan reducción de movimiento;
- footer incluye safe area y no tapa el último control.

No basar toda la verificación responsive en snapshots de clases. Probar también comportamiento y estructura semántica.

## 44. No hacer

- No crear una décima capa de lógica de negocio en la vista.
- No usar tabs para los cinco pasos.
- No validar el código automáticamente.
- No mostrar `Validar código` antes de cinco caracteres normalizados.
- No habilitar Siguiente con validación obsoleta.
- No bloquear un código de filtro sólo porque ya está asignado.
- No permitir seleccionar un tipo de filtro ocupado.
- No enviar explícitamente `p_codigo_equipo: null` en creación.
- No escribir en base de datos al agregar filtros, tipos, aceites o sistemas al borrador.
- No volver a pasos 1–4 después de entrar a Imagen.
- No recargar toda la lista después de crear o agregar imagen.
- No permitir doble submit.
- No confundir fallo de imagen con fallo de creación.
- No mostrar un botón Cancelar creación después de crear.
- No navegar desde componentes presentacionales.
- No duplicar DOM completo para móvil y escritorio.
- No duplicar en cada formulario la lógica de scroll y recálculo de `vue-multiselect`.
- No intentar resolver el recorte de listas dentro del bottom sheet sólo con `z-index`.
- No agregar permisos, RPC o dependencias.
- No usar estados de edición como `pendiente_eliminacion`.
- No depender sólo de color para estados o badges.
- No ocultar errores críticos únicamente en toasts.

## 45. Criterios de aceptación

- Existe una ruta fullscreen protegida para crear equipos.
- El botón `+` del listado abre esa ruta sólo cuando el usuario tiene el permiso temporal requerido.
- La pantalla conserva el lenguaje visual de edición y usa un wizard, no pestañas.
- Los cinco pasos se presentan en el orden acordado.
- El stepper permite navegar entre pasos alcanzados antes de crear.
- Los pasos futuros permanecen bloqueados.
- En Imagen, pasos 1–4 quedan bloqueados de forma irreversible.
- El header cambia correctamente entre Borrador y Creado.
- El código sólo se valida al presionar el botón visible desde cinco caracteres.
- Cambiar el código invalida el resultado anterior.
- Filtros exige al menos una asociación.
- Un código repetido muestra `Ya asignado` y puede usarse con otro tipo.
- Un tipo ocupado muestra `Asignado` y no puede seleccionarse.
- La búsqueda de filtros de creación omite `p_codigo_equipo`.
- Aceites es opcional y bloquea duplicados por sistema.
- Todos los cambios de pasos 1–3 permanecen locales.
- Revisar muestra la configuración completa antes del submit.
- El primer submit bloquea doble envío y navegación.
- El éxito agrega el equipo directamente al store del listado sin recarga.
- Imagen se gestiona sólo después de crear y puede omitirse.
- El éxito de imagen actualiza el mismo equipo local sin recarga.
- Un fallo de imagen nunca revierte ni oculta la creación exitosa.
- Finalizar u omitir vuelve al listado y limpia únicamente el store del wizard.
- Los overlays funcionan como drawer en escritorio y bottom sheet en móvil.
- Todos los multiselect de filtros y aceites dentro de bottom sheets abren hacia abajo, permanecen visibles bajo el encabezado y recalculan su posición mediante el composable compartido.
- Los menús con muchas opciones usan desplazamiento interno sin quedar recortados por el contenedor del sheet.
- La UI es operable con teclado, comunica estados sin depender de color y administra el foco.
- Existen pruebas de ruta, pasos, formularios, overlays, submit, imagen, salida y accesibilidad.

## 46. Resultado esperado

Al completar este spec, el usuario con permisos puede iniciar la creación desde el listado, completar un borrador local guiado, revisar y crear el equipo mediante una sola transacción, agregar u omitir una imagen y regresar al listado con el registro actualizado inmediatamente.

La implementación queda cerrada de la lógica a la UI: los componentes representan el estado y emiten intenciones; el store conserva las reglas; los servicios encapsulan las operaciones remotas; y la creación no hereda comportamientos persistidos incompatibles de la edición.
