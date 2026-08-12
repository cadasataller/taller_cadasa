# SPEC-06 — Aceites asociados, sistemas y edición local

## 1. Objetivo

Implementar la sección de aceites asociados y un único overlay responsive que permita agregar o editar asociaciones, seleccionar entidades existentes y crear temporalmente sistemas o aceites.

## 2. Referencias

- `view_edit_equipo.png`: sección de aceites.
- `drawer_add_aceite_to_equipo.png`: intención visual del drawer.
- `context_view.md`: creación temporal y persistencia diferida.
- `context_payload_rpc.md`: payloads nuevos, actualizados y eliminados.

Las propiedades visuales como viscosidad, proveedor, presentación o tipo no aparecen en el contrato actual y no deben implementarse como campos independientes.

## 3. Dependencias

- Requiere `SPEC-01` a `SPEC-03`.
- Puede implementarse después de filtros, pero no depende internamente de `SPEC-04` o `SPEC-05`.
- Debe completarse antes de `SPEC-08`.

## 4. Alcance

Incluye:

- listado de asociaciones;
- agregar;
- editar sistema y/o aceite;
- quitar y deshacer;
- sistemas existentes y temporales;
- aceites existentes y temporales;
- filtrado local;
- unicidad de sistema;
- operaciones del borrador.

No incluye:

- consultas adicionales por cada búsqueda;
- edición de catálogos globales;
- persistencia inmediata;
- propiedades no incluidas en las RPC.

## 5. Archivos

Crear:

```text
src/components/engrase/edicion/aceites/EquipoAceitesSection.vue
src/components/engrase/edicion/aceites/EquipoAceiteDraftRow.vue
src/components/engrase/edicion/aceites/EquipoAceiteOverlay.vue
src/components/engrase/edicion/aceites/EquipoAceiteForm.vue
src/components/engrase/edicion/aceites/EquipoAceitesSection.test.ts
src/components/engrase/edicion/aceites/EquipoAceiteOverlay.test.ts
```

Modificar el store y los tipos de edición.

## 6. Listado

Aplicar densidad ERP: valores en `text-sm`, labels/estados en `text-xs`, padding compacto y mínimo tipográfico de 12 px. En escritorio las asociaciones se leen horizontalmente; en móvil se apilan sin ocultar acciones.

Cada fila muestra únicamente:

- sistema;
- aceite;
- estado local;
- acciones.

Fila activa:

```text
[Editar] [Quitar]
```

Fila pendiente:

```text
[Pendiente de eliminación] [Deshacer]
```

`Editar` desaparece al quitar. Deshacer restaura el estado anterior.

Para una asociación nueva marcada para eliminar, mantenerla localmente para poder deshacer, pero no incluirla en el payload si continúa eliminada.

## 7. Overlay agregar/editar

Un único formulario recibe modo discriminado:

```ts
type EquipoAceiteFormMode =
  | { kind: "add" }
  | { kind: "edit"; draftId: string }
```

Modo agregar:

- campos vacíos;
- CTA “Agregar”.

Modo editar:

- sistema y aceite precargados;
- ambos pueden cambiar;
- CTA “Guardar cambios”.

No persistir al confirmar el overlay; sólo actualizar el borrador.

## 8. Sistemas y aceites existentes

- Todos se cargan previamente desde auxiliares.
- Búsqueda y filtrado son locales.
- No realizar RPC al escribir en los campos.
- Comparar por ID para existentes.
- Mostrar opción seleccionada de forma inequívoca.
- Reutilizar `EquipoCatalogSelect` de `SPEC-03` para ambos campos.
- Ambos son selección simple, buscable y `taggable`.
- Usar claves estables diferentes por catálogo para impedir colisiones entre sistema y aceite.

## 9. Entidades temporales

Tanto sistema como aceite pueden ser nuevos:

```ts
interface CatalogoTemporalReference {
  estado: "nuevo"
  id: null
  tempId: string
  nombre: string
}
```

Reglas:

- creación dentro del mismo formulario;
- no apilar un drawer adicional;
- nombre obligatorio y normalizado;
- comparación insensible a mayúsculas, espacios y acentos;
- impedir duplicados contra catálogos y temporales;
- badge “Pendiente de creación”;
- IDs temporales estables;
- sin escritura inmediata.
- cada `@tag` crea exclusivamente una referencia temporal del catálogo correspondiente;
- la nueva opción se agrega al arreglo local del multiselect y se selecciona inmediatamente;
- el texto se valida antes de agregarse;
- los mensajes de creación, vacío y sin resultados se muestran en español.

Combinaciones permitidas:

- sistema existente + aceite existente;
- sistema existente + aceite nuevo;
- sistema nuevo + aceite existente;
- sistema nuevo + aceite nuevo.

## 10. Regla de unicidad

Un equipo sólo puede tener un aceite activo por sistema.

Al agregar:

- revisar todas las asociaciones activas del borrador.

Al editar:

- excluir la propia asociación;
- validar el sistema nuevo contra las demás.

Las pendientes de eliminación no bloquean temporalmente el sistema. Si se deshace una eliminación que produce conflicto, impedir el deshacer y explicar qué asociación debe modificarse o quitarse primero.

## 11. Operaciones del store

Acciones mínimas:

```ts
agregarAceite(entrada: AgregarAceiteDraft): void
actualizarAceite(entrada: ActualizarAceiteDraft): void
marcarAceiteParaEliminar(draftId: string): void
deshacerEliminacionAceite(draftId: string): void
```

Estados:

- existente sin cambios;
- nuevo;
- actualizado;
- pendiente de eliminación.

Si una asociación existente se edita y vuelve exactamente a sus valores originales, regresar a estado existente.

## 12. Overlay responsive

- Drawer derecho en desktop.
- Bottom sheet en móvil/tablet.
- Usar `<Teleport to="body">`.
- Los menús de los dos multiselects se teletransportan a `body`, usan una clase global propia y quedan fuera del área con overflow.
- Cubrir la vista de edición, nunca el listado.
- Header y footer visibles; contenido con scroll interno.
- Bloquear scroll del body.
- Restaurar foco al disparador.
- Confirmar al cerrar si el formulario cambió.
- Un solo overlay activo.
- Mantener campos y acciones en `text-sm`, ayudas/badges en `text-xs` e inputs de búsqueda en `text-base` en móvil.
- Usar controles de 36–40 px en escritorio y área táctil mínima de 44 px en móvil.
- Usar `gap-2` entre campos y `gap-3` entre grupos.
- Usar exclusivamente tokens de `src/index.css`; no usar valores de color literales, utilidades arbitrarias ni paletas ajenas al tema.

## 13. Mensajes y estados

Mensajes mínimos:

- “Selecciona o crea un sistema.”
- “Selecciona o crea un aceite.”
- “Este equipo ya tiene un aceite asociado a ese sistema.”
- “Ya existe un sistema con este nombre.”
- “Ya existe un aceite con este nombre.”
- “La asociación se aplicará al guardar los cambios del equipo.”

Mostrar vacío útil cuando no existan aceites y ofrecer `Agregar aceite`.

## 14. Botones e iconos

- Todo botón disponible usa `cursor-pointer`.
- Botón deshabilitado usa `disabled` y `cursor-not-allowed`.
- Lucide:
  - `Plus` para agregar/crear;
  - `Pencil` para editar;
  - `Trash2` para quitar;
  - `Undo2` para deshacer;
  - `Droplet` para aceite;
  - `Cog` para sistema;
  - `Search` en filtrado;
  - `X` para cerrar;
  - `Info` para persistencia diferida.
- No usar emojis.
- Icon-only requiere `aria-label`.

## 15. TypeScript y Vue

- `<script setup lang="ts">`.
- Prohibido `any` y `unknown` en archivos y tests.
- No modelar sistemas, aceites ni operaciones como extensiones de `Database`; usar referencias y argumentos locales exclusivos de esta funcionalidad.
- Usar uniones discriminadas para existentes/nuevos y add/edit.
- Props inmutables y emits tipados.
- Filtros locales derivados con `computed`, no dentro del template.
- No usar watchers para copiar valores derivados.
- No usar `v-html`.

## 16. Pruebas

Cubrir:

- vacío con CTA;
- agregar combinación existente/existente;
- las cuatro combinaciones de entidades;
- editar sistema;
- editar aceite;
- editar ambos;
- revertir edición elimina estado actualizado;
- quitar/deshacer existente;
- nuevo quitado no se serializa;
- duplicidad al agregar;
- duplicidad al editar excluyendo la propia fila;
- conflicto al deshacer;
- filtrado sin consultas remotas;
- sistema y aceite seleccionados mediante `vue-multiselect`;
- creación de sistema y aceite mediante `@tag` sin persistencia inmediata;
- confirmación de cierre;
- accesibilidad y foco.
- densidad y escala tipográfica ERP en lista y overlay.
- tema principal preservado en lista, overlay y menús teletransportados.

## 17. Criterios de aceptación

- Se pueden agregar, editar, quitar y deshacer aceites.
- En edición pueden cambiar sistema y aceite.
- Sólo existe una asociación activa por sistema.
- Sistemas y aceites nuevos permanecen locales.
- Ambos selectores reutilizan el adaptador tipado de `vue-multiselect`.
- No aparecen propiedades ajenas al contrato.
- El overlay se muestra sobre edición.
- Lista y overlay mantienen densidad ERP, mínimo tipográfico de 12 px y objetivos táctiles móviles de 44 px.
- Lista, overlay y menús usan únicamente los tokens base del bloque `@theme` de `src/index.css`.
- Todo botón disponible tiene `cursor-pointer`.
- La iconografía es Lucide.
- No existe `any` ni `unknown`.
- Pruebas y typecheck pasan.
