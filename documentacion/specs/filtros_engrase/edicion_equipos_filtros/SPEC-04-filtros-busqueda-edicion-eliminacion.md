# SPEC-04 — Filtros: listado, búsqueda, alta, edición, quitar y deshacer

## 1. Objetivo

Implementar la administración completa de asignaciones de filtros dentro del borrador del equipo: listar, agregar un filtro existente por código original, abrir el flujo de creación cuando no existe, editar una asignación existente, quitar y deshacer.

La creación detallada de un código o tipo nuevo se completa en `SPEC-05`; este spec deja preparados sus contratos y navegación interna.

## 2. Referencias

- `view_edit_equipo.png`: sección y filas de filtros.
- `drawer_add_filter.png`: búsqueda y resultados; ignorar cualquier mención visual de equivalencias.
- `drawer_add_new_filters.png`: estado al no encontrar código, desarrollado en `SPEC-05`.
- `context_view.md` y `context_payload_rpc.md`: reglas reales.

## 3. Dependencias

- Requiere `SPEC-01`, `SPEC-02` y `SPEC-03`.
- Debe implementarse antes de `SPEC-05` y `SPEC-08`.

## 4. Reglas funcionales cerradas

- La búsqueda es únicamente por código original.
- La lista muestra `Editar` y `Quitar` para una asignación activa.
- Al quitar, `Editar` desaparece y sólo queda `Deshacer`.
- El drawer de agregar valida `ya_asignado_al_equipo`.
- El drawer de editar no permite cambiar el filtro/código asociado.
- En edición sólo pueden cambiar el tipo de filtro y la cantidad.
- El motivo de cambio se genera automáticamente en lenguaje humano.
- Debe permanecer al menos un filtro activo.

## 5. Archivos

Crear:

```text
src/components/engrase/edicion/filtros/EquipoFiltrosSection.vue
src/components/engrase/edicion/filtros/EquipoFiltroDraftRow.vue
src/components/engrase/edicion/filtros/EquipoFiltroOverlay.vue
src/components/engrase/edicion/filtros/EquipoFiltroBuscarForm.vue
src/components/engrase/edicion/filtros/EquipoFiltroEditarForm.vue
src/components/engrase/edicion/filtros/EquipoFiltrosSection.test.ts
src/components/engrase/edicion/filtros/EquipoFiltroOverlay.test.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseFiltroMotivo.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseFiltroMotivo.test.ts
```

Modificar store y tipos de edición.

## 6. Sección y filas

La sección usa densidad ERP: contenido y valores en `text-sm`, etiquetas auxiliares/badges en `text-xs`, filas compactas con padding vertical moderado y sin texto menor a 12 px. En escritorio debe priorizar lectura horizontal; por debajo de `sm` se reorganiza sin scroll horizontal.

Cada fila debe mostrar:

- tipo de filtro;
- código original;
- cantidad;
- estado en lista de compras;
- cantidad de equivalencias sólo como dato informativo si aporta contexto;
- estado local de operación;
- acciones.

Estado activo:

```text
[Editar] [Quitar]
```

Estado pendiente de eliminación:

```text
[Pendiente de eliminación] [Deshacer]
```

La fila pendiente debe conservar lectura suficiente y no desaparecer. El estado no puede comunicarse sólo con color.

## 7. Quitar y deshacer

Asignación existente:

- `Quitar` cambia el estado local a `pendiente_eliminacion`;
- se excluye del conteo de filtros activos;
- se serializa después como `filtros.eliminados`;
- `Deshacer` restaura su estado previo, incluido `actualizado` si ya tenía cambios.

Asignación nueva:

- también puede marcarse pendiente para permitir deshacer;
- si continúa eliminada al guardar, no se envía ni como nueva ni como eliminada;
- deshacerla recupera el mismo `temp_id` y valores.

No permitir quitar el último filtro activo. Mostrar mensaje claro junto a la sección.

## 8. Overlay en modo agregar

Se abre desde `Agregar filtro`.

Flujo:

1. Campo de código original.
2. Normalizar espacios y mayúsculas según la convención del sistema.
3. Ejecutar la RPC sólo al enviar la búsqueda; evitar llamadas por cada tecla.
4. Mostrar loading dentro del formulario.
5. Resolver uno de cuatro estados:
   - encontrado con un tipo;
   - encontrado con varios tipos;
   - encontrado sin tipos registrados;
   - no encontrado.

### Encontrado con tipos

Mostrar:

- código;
- estado en lista de compras;
- tipos posibles;
- tipos de equipo donde se usa cada tipo;
- asignación actual cuando `ya_asignado_al_equipo` sea verdadero.

Los tipos ya asignados quedan deshabilitados sólo en modo agregar. Deben incluir texto explicativo, no sólo una apariencia gris.

La selección de tipo debe usar `EquipoCatalogSelect`, el adaptador tipado de `vue-multiselect` creado en `SPEC-03`:

- modo simple y buscable;
- `track-by` mediante clave estable de tipo;
- opciones con `ya_asignado_al_equipo` mapeadas a `$isDisabled: true` dentro del adaptador;
- slot de opción o texto auxiliar para explicar “Ya asignado a este equipo”;
- sin `taggable` en este flujo cuando la RPC ya devuelve tipos posibles;
- el estado deshabilitado debe bloquear mouse y teclado.

Si todos los tipos están asignados, deshabilitar `Agregar al equipo`.

### Encontrado con múltiples tipos

- Exigir selección explícita.
- No preseleccionar arbitrariamente.
- Mantener el CTA deshabilitado hasta elegir un tipo permitido y una cantidad válida.

### Encontrado sin tipos

- Permitir seleccionar un tipo existente o continuar a crear uno temporal.
- El filtro continúa siendo existente.
- La nueva asociación se guarda únicamente al final.

### No encontrado

- Mostrar el código buscado y que puede crearse.
- Ofrecer `Crear filtro nuevo`.
- Continuar dentro del mismo overlay hacia el formulario de `SPEC-05`.

## 9. Overlay en modo editar

Se abre desde `Editar` en una fila activa.

Debe mostrar:

- código original en control de sólo lectura o deshabilitado;
- estado en compras de sólo lectura;
- selector de tipo de filtro editable mediante `EquipoCatalogSelect`/`vue-multiselect`;
- cantidad editable.

No permite:

- buscar otro código;
- cambiar `filtro_id`;
- cambiar `esta_en_lista_compras`;
- editar una fila pendiente de eliminación.

Al cambiar tipo, validar contra las demás asignaciones activas. Excluir de la validación el propio `equipo_filtro_id` o `temp_id` editado.

En edición, el multiselect recibe todos los tipos disponibles y deshabilita los ocupados por otra asignación activa. El tipo actual permanece seleccionable. El control bloqueado es el filtro/código, no el selector de tipo.

## 10. Cantidad

- Entero mayor que cero.
- Control táctil con botones disminuir/aumentar y entrada numérica si el diseño lo usa.
- Nunca permitir cero o negativos.
- Los botones de incremento deben tener nombre accesible.

## 11. Motivo de cambio

Generar sólo para asignaciones existentes realmente modificadas.

Formato:

```text
Tipo de filtro: Filtro de aceite → Filtro hidráulico; Cantidad: 1 → 2
```

Reglas:

- orden estable: tipo y cantidad;
- incluir sólo campos modificados;
- no usar IDs ni nombres técnicos;
- si sólo cambia cantidad: `Cantidad: 1 → 2`;
- si el usuario revierte todos los cambios, eliminar la operación `actualizado` y el motivo.

## 12. Store y acciones

Acciones mínimas:

```ts
agregarFiltroExistente(entrada: AgregarFiltroExistenteDraft): void
actualizarAsignacionFiltro(entrada: EditarAsignacionFiltroDraft): void
marcarFiltroParaEliminar(draftId: string): void
deshacerEliminacionFiltro(draftId: string): void
```

El `draftId` es estable tanto para existentes como nuevos. Los componentes no deben mutar arreglos del store directamente.

## 13. Overlay responsive

- Drawer lateral en desktop.
- Bottom sheet en móvil/tablet.
- `<Teleport to="body">`.
- El menú de `vue-multiselect` se teletransporta a `body`, usa una clase global propia y queda fuera del contenedor con overflow.
- Se superpone siempre a la vista de edición.
- Formulario interno compartido.
- Scroll interno sólo en el contenido, con encabezado y acciones visibles.
- Bloqueo de scroll del body.
- Restauración de foco al botón `Agregar filtro` o `Editar` que lo abrió.
- Confirmar descarte si el formulario cambió.
- Mantener `text-sm` para campos/acciones y `text-xs` para ayuda/estado; inputs de búsqueda usan `text-base` en móvil.
- Controles visuales de 36–40 px en escritorio y área táctil mínima de 44 px en móvil.
- Usar `gap-2` en formularios y `gap-3` entre bloques de resultado.
- Aplicar exclusivamente tokens de `src/index.css`: `main*`/`accent*` para interacción, `second*`/`gray-*` para superficies y `danger*`/`warning*`/`info*` para estados. No usar colores literales ni paletas externas.

## 14. Estados y errores

Contemplar:

- búsqueda sin ejecutar;
- buscando;
- encontrado;
- no encontrado;
- error recuperable;
- equipo no encontrado;
- código inválido;
- tipo duplicado;
- cantidad inválida.

Una búsqueda fallida no debe cerrar el drawer ni borrar el código escrito.

## 15. Botones e iconografía

- Todos los botones disponibles usan `cursor-pointer`.
- Los deshabilitados usan `disabled` y `cursor-not-allowed`.
- Usar Lucide:
  - `Plus` para agregar;
  - `Search` para buscar;
  - `Pencil` para editar;
  - `Trash2` para quitar;
  - `Undo2` para deshacer;
  - `X` para cerrar;
  - `Info`, `AlertTriangle` y `CheckCircle2` para estados;
  - `Minus` y `Plus` para cantidad.
- No usar emojis.
- Acciones sólo con icono requieren `aria-label` y tooltip cuando el significado no sea evidente.

## 16. TypeScript y Vue

- `<script setup lang="ts">` y Composition API.
- Prohibido `any` y `unknown` en archivos, mocks, props, emits, eventos DOM y casts.
- La búsqueda RPC se tipa en la firma `buscarFiltroOriginalParaAsignar(codigo, codigoEquipo?)`; no crear un tipo `Database` ni una interfaz global para sus dos argumentos simples.
- El service construye `{ p_codigo, p_codigo_equipo }` internamente y devuelve el tipo local concreto de resultado.
- Eventos DOM deben tener tipos concretos.
- Usar uniones discriminadas para modo `add | edit` y estado de búsqueda.
- Derivados con `computed`.
- Props hacia abajo y eventos hacia arriba.
- No hacer consultas desde componentes presentacionales.
- No usar `v-html`.

## 17. Pruebas

Cubrir:

- render de filas activas;
- quitar oculta editar y muestra deshacer;
- deshacer restaura estado anterior;
- no quitar último filtro;
- nuevo quitado no genera operación;
- búsqueda sólo por código original;
- tipos asignados deshabilitados en agregar;
- opciones deshabilitadas no seleccionables por teclado en `vue-multiselect`;
- múltiples tipos exigen selección;
- todos asignados bloquean CTA;
- modo editar bloquea el filtro/código;
- modo editar permite tipo y cantidad;
- modo editar usa selección simple buscable y conserva el tipo actual;
- duplicidad excluye la propia asignación;
- motivo legible por uno o varios campos;
- reversión elimina motivo;
- errores conservan datos del formulario;
- restauración de foco.
- filas y drawer respetan la escala tipográfica y de densidad ERP.
- filas, drawer y menú de tipo usan el tema principal y no contienen colores fuera del bloque `@theme` de `src/index.css`.

## 18. Criterios de aceptación

- Cada filtro activo tiene `Editar` y `Quitar`.
- Un filtro quitado sólo muestra `Deshacer`.
- La búsqueda no usa equivalencias.
- `ya_asignado_al_equipo` sólo bloquea altas.
- La edición no cambia el filtro asociado.
- Tipo y cantidad sí pueden editarse.
- La selección de tipo está implementada con el adaptador tipado de `vue-multiselect`.
- Los motivos son automáticos y no técnicos.
- Nunca queda menos de un filtro activo.
- El overlay está sobre la vista de edición.
- Filas y formulario conservan densidad ERP sin texto menor a 12 px ni controles táctiles menores a 44 px.
- El overlay y su multiselect usan únicamente los tokens base de `@theme`.
- Todo botón disponible usa `cursor-pointer`.
- Los iconos son Lucide.
- No existe `any` ni `unknown` en archivos creados o modificados.
- Pruebas y typecheck pasan.
