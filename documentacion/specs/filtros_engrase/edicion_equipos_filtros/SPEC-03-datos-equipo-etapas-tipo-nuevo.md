# SPEC-03 — Datos del equipo, etapas y nuevo tipo de equipo

## 1. Objetivo

Implementar la primera sección editable de la pantalla: código, tipo de equipo, subtipo, estado y etapas, incluyendo la creación temporal de un tipo de equipo mediante drawer en escritorio y bottom sheet en móvil.

## 2. Referencias

- `view_edit_equipo.png`: composición general y sección “Datos del equipo”.
- `drawer_new_equipo_type.png`: intención visual del overlay.
- `context_view.md`: reglas de campos y persistencia diferida.
- `context_payload_rpc.md`: forma de `datos_equipo`, tipos existentes/nuevos y operaciones de etapas.

Las imágenes no autorizan campos como marca, fabricante, año, serie o capacidad. No implementarlos.

## 3. Dependencias

- Requiere `SPEC-01` y `SPEC-02`.
- Debe terminarse antes de `SPEC-08`.

## 4. Alcance

Incluye:

- formulario de datos generales;
- selector buscable de tipo de equipo con `vue-multiselect`;
- sugerencias locales y entrada libre de subtipo con `vue-multiselect`;
- estado activo/descartado;
- multiselección buscable de etapas con `vue-multiselect`;
- drawer/bottom sheet para tipo nuevo;
- validación local y accesible;
- operaciones del borrador.

No incluye:

- guardado RPC final;
- filtros;
- aceites;
- imagen.

## 5. Archivos

Crear:

```text
src/components/engrase/edicion/datos/EquipoDatosForm.vue
src/components/engrase/edicion/datos/EquipoEtapasField.vue
src/components/engrase/edicion/datos/EquipoTipoField.vue
src/components/engrase/edicion/datos/EquipoTipoNuevoForm.vue
src/components/engrase/edicion/datos/EquipoTipoNuevoOverlay.vue
src/components/engrase/edicion/seleccion/EquipoCatalogSelect.vue
src/components/engrase/edicion/seleccion/EquipoCatalogMultiSelect.vue
src/components/engrase/edicion/seleccion/EquipoTextSuggestionSelect.vue
src/components/engrase/edicion/seleccion/equipoMultiselect.types.ts
src/components/engrase/edicion/seleccion/EquipoCatalogSelect.test.ts
src/components/engrase/edicion/datos/EquipoDatosForm.test.ts
src/components/engrase/edicion/datos/EquipoTipoNuevoOverlay.test.ts
```

Modificar:

```text
src/views/engrase/EquipoEngraseEditarView.vue
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types.ts
src/main.ts
src/index.css
package.json
pnpm-lock.yaml
```

## 6. Dependencia `vue-multiselect`

Instalar la versión compatible con Vue 3 de forma exacta:

```text
pnpm add vue-multiselect@3.5.0 --save-exact
```

Importar una sola vez:

```ts
import "vue-multiselect/dist/vue-multiselect.css"
```

No registrar globalmente el componente. Los adaptadores locales importan `VueMultiselect` desde `vue-multiselect` y exponen contratos propios.

La dependencia usa internamente Options API, pero los componentes de la aplicación continúan usando Composition API. Confirmar que Options API no esté deshabilitada en la configuración de Vue/Vite. Debido a la compatibilidad declarada por el paquete con determinadas versiones de `@vitejs/plugin-vue`, este spec debe ejecutar un smoke test de montaje y `pnpm build`; no degradar Vite o el plugin silenciosamente si aparece una incompatibilidad.

## 7. Adaptadores tipados

`EquipoCatalogSelect.vue` se responsabiliza de selección simple. `EquipoCatalogMultiSelect.vue` se responsabiliza de múltiples valores. `EquipoTextSuggestionSelect.vue` maneja cadenas sugeridas con entrada libre.

Contrato base recomendado:

```ts
export interface EquipoMultiselectOption {
  key: string
  label: string
  $isDisabled: boolean
  pendingCreation: boolean
}
```

Reglas obligatorias:

- `track-by="key"` y `label="label"`;
- `:searchable="true"`;
- búsqueda interna/local para catálogos ya cargados;
- `:allow-empty="false"` en campos simples obligatorios;
- `:allow-empty="false"` en etapas para impedir quitar la última selección desde el propio control;
- `:close-on-select="false"` para etapas múltiples;
- `:hide-selected="true"` para etapas;
- `:use-teleport="true"`, `teleport-target="body"` y una `content-wrapper-class` propia cuando el selector esté dentro de drawer/bottom sheet;
- textos `placeholder`, `selectLabel`, `selectedLabel`, `deselectLabel`, `tagPlaceholder`, `noOptions` y `noResult` en español;
- mapear valores del dominio a opciones y de vuelta mediante funciones puras;
- el wrapper emite valores concretos del dominio, no el objeto crudo recibido de la librería;
- si los tipos publicados por la librería son laxos, no copiarlos ni ampliarlos con `any`/`unknown`; mantener la frontera en el wrapper y declarar handlers con los tipos concretos de esta funcionalidad.

El CSS de la librería se personaliza en una capa global específica o mediante clases contenedoras para respetar altura mínima de 44 px, foco visible, tokens de color, estados inválido/deshabilitado y stacking dentro de drawers. No duplicar el CSS base por componente.

`$isDisabled` sólo existe en la opción privada del adaptador porque es el contrato requerido por la librería. El modelo de dominio continúa usando nombres propios como `yaAsignadoAlEquipo`; el mapper es responsable de convertir ese estado a `$isDisabled`.

## 8. Campos permitidos

### Código

- Obligatorio.
- Texto visible y editable.
- Normalizar espacios exteriores.
- No validar unicidad con una consulta adicional; la RPC final resuelve `CODIGO_EQUIPO_YA_EXISTE`.
- Mientras no se guarde, `codigoOriginal` permanece inmutable y el nuevo valor sólo vive en el borrador.

### Tipo de equipo

- Obligatorio.
- Puede ser existente o temporal.
- Los existentes provienen de auxiliares.
- Un tipo temporal no se inserta inmediatamente.
- Usar `EquipoCatalogSelect` en modo simple y buscable.
- No habilitar `taggable` aquí: la creación se realiza exclusivamente mediante el drawer “Nuevo tipo de equipo”.
- Al cerrar el drawer con éxito, agregar la opción temporal al arreglo local y seleccionarla en el multiselect.

### Subtipo

- Obligatorio.
- Es el mismo concepto que modelo o descripción del equipo.
- Debe etiquetarse “Modelo / subtipo”.
- Puede escribirse libremente.
- Las sugerencias se filtran localmente desde `subtipos_sugeridos` del tipo seleccionado.
- Elegir una sugerencia no crea otra entidad.
- Usar `EquipoTextSuggestionSelect` con selección simple, búsqueda y `taggable`.
- `@tag` adopta el texto como valor de `subtipo`; no genera ID, `temp_id` ni catálogo nuevo.

### Estado

- Obligatorio.
- Valores: `activo` y `descartado`.
- La UI usa etiquetas legibles “Activo” y “Descartado”.
- Usar un select nativo o control existente de la aplicación; no usar `vue-multiselect` para dos valores estáticos.

### Etapas

- Debe existir al menos una activa.
- Puede haber varias.
- Los chips deben permitir quitar con control accesible.
- Agregar y quitar modifica únicamente el borrador.
- Usar `EquipoCatalogMultiSelect` con `multiple`, búsqueda local, chips y claves estables.
- La librería controla selección/deselección; el store continúa recibiendo operaciones explícitas por ID.

## 9. Nuevo tipo de equipo

Se abre desde `Crear nuevo tipo de equipo`.

Formulario:

- nombre obligatorio;
- espacios normalizados;
- comparación local insensible a mayúsculas, espacios duplicados y acentos;
- no permitir duplicar un tipo existente o temporal en el mismo borrador;
- mostrar estado “Pendiente de creación”.

Al confirmar:

1. Crear referencia temporal con `estado: "nuevo"`.
2. Asignar `temp_id` estable.
3. Incorporarla a las opciones locales.
4. Seleccionarla en el formulario principal.
5. Cerrar overlay.
6. No llamar Supabase.

Si se cancela, no modificar el borrador.

## 10. Overlay responsive

- Escritorio `lg+`: drawer lateral derecho.
- Móvil y tablet: bottom sheet.
- Usar un único formulario interno compartido.
- Renderizar mediante `<Teleport to="body">` para escapar del layout y cubrir la vista de edición.
- El backdrop debe mostrar exclusivamente la pantalla de edición debajo.
- Nunca debe verse el listado como contexto del overlay.
- Bloquear scroll del body mientras esté abierto.
- Sólo puede existir un overlay de edición activo.
- Cerrar por botón visible, cancelar y Escape cuando no haya cambios internos.
- Si el nombre fue modificado, confirmar antes de descartar.

## 11. Contrato de componentes

```text
EquipoDatosForm
├── EquipoTipoField
│   └── abre EquipoTipoNuevoOverlay
├── campo Modelo / subtipo
├── campo Estado
└── EquipoEtapasField

EquipoTipoNuevoOverlay
└── EquipoTipoNuevoForm
```

Props hacia abajo, eventos hacia arriba. Eventos mínimos:

- `update-codigo`;
- `select-tipo-equipo`;
- `update-subtipo`;
- `update-estado`;
- `toggle-etapa`;
- `open-new-type`;
- `cancel`;
- `create-and-select`.

No mutar objetos recibidos por props.

## 12. Operaciones del borrador

El store debe exponer acciones explícitas:

```ts
actualizarCodigo(codigo: string): void
seleccionarTipoEquipo(tipo: TipoEquipoDraftReference): void
actualizarSubtipo(subtipo: string): void
actualizarEstado(estado: EquipoEstado): void
agregarEtapa(etapaId: number): void
quitarEtapa(etapaId: number): void
crearYSeleccionarTipoEquipo(nombre: string): void
```

No exponer el borrador para mutación arbitraria desde componentes.

## 13. Detección de cambios

Comparar valores semánticos:

- código normalizado;
- tipo por ID o `temp_id`;
- subtipo normalizado;
- estado;
- conjunto de etapas sin depender del orden.

No marcar el formulario como modificado por reordenar opciones o etapas.

## 14. Validaciones y mensajes

Mensajes mínimos:

- “El código es obligatorio.”
- “Selecciona un tipo de equipo.”
- “El modelo o subtipo es obligatorio.”
- “Selecciona al menos una etapa.”
- “Ya existe un tipo de equipo con este nombre.”

Validar al perder foco y al intentar guardar. El error aparece junto al campo y usa `aria-describedby`; los errores activos deben anunciarse.

## 15. Reglas visuales

- Mantener la densidad y paleta actuales de Engrase.
- Etiquetas siempre visibles; no usar placeholder como única etiqueta.
- Chips de etapa con texto y control `X` de Lucide.
- Estado mostrado con texto, no sólo color.
- Tipo nuevo con badge “Pendiente de creación”.
- No copiar campos extra de las maquetas.

## 16. Botones e iconos

- Todo botón habilitado debe usar `cursor-pointer`.
- Todo botón deshabilitado usa `disabled` y `cursor-not-allowed`.
- Usar Lucide:
  - `Plus` para crear tipo;
  - `X` para cerrar o quitar chip;
  - `Info` para el aviso de persistencia diferida;
  - `Check` o `Save` para “Crear y seleccionar” si se usa icono.
- Botones sólo con icono requieren `aria-label`.
- No usar emojis ni caracteres como sustitutos de iconos.

## 17. TypeScript y Vue

- Vue 3 con `<script setup lang="ts">`.
- Prohibido usar `any` y `unknown` en código, eventos, props, tests o casts.
- No crear ni modificar tipos `Database` para acciones del borrador o futuras RPC; los componentes sólo usan tipos locales de dominio y las firmas de servicio definidas en `SPEC-01`.
- Usar contratos importados desde la carpeta de edición.
- Estado derivado con `computed`.
- `watch` sólo para side effects, no para duplicar datos derivados.
- Estilos específicos con `scoped` y selectores de clase.
- No usar `v-html`.

## 18. Pruebas

Cubrir:

- render de valores iniciales;
- edición independiente del snapshot;
- sugerencias según tipo;
- subtipo libre;
- mínimo una etapa;
- creación temporal sin llamada RPC;
- selección simple de tipo mediante `vue-multiselect`;
- subtipo sugerido y subtipo libre mediante `@tag`;
- etapas múltiples con selección y deselección por teclado;
- traducción tipada dominio ↔ opción sin propagar objetos crudos de la librería;
- CSS base cargado una sola vez;
- montaje y build con la versión actual de Vite y `@vitejs/plugin-vue`;
- duplicado local de tipo;
- selección inmediata del tipo creado;
- cancelar sin cambios;
- confirmación al cerrar overlay sucio;
- drawer desktop y bottom sheet responsive;
- accesibilidad básica de labels y botones.

## 19. Criterios de aceptación

- Sólo existen los cinco campos permitidos.
- Tipo nuevo queda temporal hasta guardar.
- Subtipo representa modelo/descripción.
- Las etapas nunca se escriben inmediatamente en Supabase.
- No se puede considerar válido un borrador sin etapas.
- Tipo de equipo, subtipo y etapas usan los adaptadores tipados de `vue-multiselect`.
- `vue-multiselect` está fijado en `3.5.0`, su CSS se importa una vez y el build confirma compatibilidad.
- El overlay cubre la edición, no el listado.
- Todo botón disponible tiene `cursor-pointer`.
- Los iconos necesarios son de Lucide.
- No existe `any` ni `unknown` en archivos creados o modificados.
- Pruebas y `pnpm typecheck` pasan.
