# SPEC-05 — Crear filtro y tipo de filtro temporal

## 1. Objetivo

Completar el flujo iniciado en `SPEC-04` cuando el código original no existe o cuando un filtro existente no tiene tipos registrados. El usuario podrá preparar un filtro nuevo y, cuando sea necesario, un tipo de filtro nuevo, sin escribir en Supabase hasta guardar toda la edición.

## 2. Referencias

- `drawer_add_new_filters.png`: estructura visual aproximada.
- `drawer_add_filter.png`: transición desde búsqueda.
- `context_view.md`: creación temporal.
- `context_payload_rpc.md`: combinaciones de entidades existentes y nuevas.

La imagen es guía de estilo. Sólo se implementan código, tipo de filtro, estado en lista de compras, cantidad y contexto de uso respaldado por contrato.

## 3. Dependencias

- Requiere `SPEC-01` a `SPEC-04`.
- Debe terminarse antes de `SPEC-08`.

## 4. Alcance

Incluye:

- formulario para código no encontrado;
- selección de tipo existente;
- creación temporal de tipo de filtro;
- asociación de filtro existente sin tipos;
- estado en lista de compras para filtros nuevos;
- cantidad;
- incorporación al borrador;
- regreso a búsqueda sin perder contexto cuando sea seguro.

No incluye:

- inserción inmediata de filtros o tipos;
- edición del catálogo global;
- búsqueda por equivalencia o nombre;
- guardado integral.

## 5. Archivos

Crear:

```text
src/components/engrase/edicion/filtros/EquipoFiltroNuevoForm.vue
src/components/engrase/edicion/filtros/EquipoTipoFiltroNuevoField.vue
src/components/engrase/edicion/filtros/EquipoFiltroNuevoForm.test.ts
```

Modificar:

```text
src/components/engrase/edicion/filtros/EquipoFiltroOverlay.vue
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types.ts
```

## 6. Modos de entrada

### Código no encontrado

Entrada recibida de la RPC:

```text
encontrado = false
puede_crearse = true
codigo_buscado = <código>
```

El formulario debe:

- precargar el código buscado;
- mantenerlo visible;
- permitir corregirlo regresando a búsqueda;
- marcar el filtro como `nuevo`;
- solicitar tipo, estado en compras y cantidad.

### Filtro existente sin tipos registrados

Entrada:

```text
encontrado = true
sin_tipos_registrados = true
tipos_posibles = []
```

El formulario debe:

- mantener el filtro como `existente` con su ID;
- mostrar código y estado en compras de sólo lectura;
- permitir seleccionar tipo existente o crear tipo temporal;
- solicitar cantidad;
- no crear otro código de filtro.

## 7. Tipo de filtro existente

Las opciones provienen de `auxiliares.tipos_filtro`.

Usar `EquipoCatalogSelect`, basado en `vue-multiselect`, en modo simple, buscable y `taggable`. Las opciones existentes usan ID como clave estable; una etiqueta nueva se procesa por `@tag` y se transforma en la referencia temporal descrita abajo.

Al seleccionar, mostrar cuando esté disponible:

- nombre;
- tipos de equipo donde se utiliza.

Validar localmente que el equipo no tenga otra asignación activa para ese tipo, incluyendo filtros nuevos del borrador. Las asignaciones pendientes de eliminación no cuentan como activas, pero si se deshace una eliminación debe volver a ejecutarse la validación global.

## 8. Tipo de filtro nuevo con `taggable`

Puede capturarse dentro del mismo formulario mediante `vue-multiselect` con `:taggable="true"`; no abrir un segundo overlay encima del primero.

Campos:

- nombre obligatorio.

Reglas:

- normalizar espacios;
- comparación local insensible a mayúsculas y acentos;
- impedir duplicado contra catálogo y tipos temporales;
- generar `temp_id` estable;
- mostrar badge “Pendiente de creación”;
- conservar estado local si se alterna temporalmente entre tipo existente y nuevo mientras el usuario no cierre el formulario.
- `@tag` debe normalizar y validar el nombre antes de incorporarlo a las opciones locales;
- la opción temporal se agrega con clave basada en `temp_id`, se selecciona inmediatamente y muestra “Pendiente de creación”;
- `tag-placeholder` y mensajes sin resultado deben estar en español;
- crear una etiqueta no debe emitir todavía la asignación completa ni llamar Supabase.

No llamar a Supabase al crear el tipo.

## 9. Filtro nuevo

Referencia esperada en borrador:

```ts
interface FiltroNuevoDraftReference {
  estado: "nuevo"
  id: null
  tempId: string
  codigo: string
  estaEnListaCompras: boolean
}
```

El código debe:

- ser obligatorio;
- conservar la normalización usada por la búsqueda;
- coincidir con el código cuya RPC devolvió no encontrado;
- volver a verificarse si el usuario lo cambia antes de crear; no asumir que sigue inexistente.

Para evitar una carrera, si cambia el código se invalida el resultado anterior y debe ejecutarse nuevamente la búsqueda antes de habilitar `Agregar al equipo`.

## 10. Estado en lista de compras

- Sólo es editable al crear un filtro nuevo.
- Para filtro existente se presenta como sólo lectura.
- Usar checkbox o toggle accesible con etiqueta “En lista de compras”.
- No depender de color.

## 11. Cantidad

- Entero mayor que cero.
- Valor inicial `1`.
- No aceptar decimales, cero, negativos, vacío al confirmar ni texto.
- Controles táctiles mínimos de 44 px.

## 12. Incorporación al borrador

Al confirmar:

1. Validar resultado de búsqueda vigente.
2. Validar tipo.
3. Validar unicidad del tipo en el equipo.
4. Validar cantidad.
5. Crear asignación con `temp_id` de equipo-filtro.
6. Conservar referencias existentes o nuevas según corresponda.
7. Agregar al borrador.
8. Cerrar overlay y restaurar foco a `Agregar filtro`.
9. No llamar a RPC de escritura.

Combinaciones permitidas:

- filtro nuevo + tipo existente;
- filtro nuevo + tipo nuevo;
- filtro existente sin tipos + tipo existente;
- filtro existente sin tipos + tipo nuevo.

## 13. Navegación interna del overlay

Estados:

```text
buscar → resultado no encontrado → crear filtro
buscar → filtro sin tipos → asociar tipo
```

- Un solo overlay permanece montado.
- No apilar drawers.
- `Volver` retorna al resultado o búsqueda correspondiente.
- Si el formulario tiene cambios, confirmar antes de volver o cerrar.
- En móvil se mantiene como bottom sheet y no se transforma en una ruta.

## 14. Errores

Mensajes mínimos:

- “El código es obligatorio.”
- “Verifica nuevamente el código antes de agregarlo.”
- “Selecciona o crea un tipo de filtro.”
- “Ya existe una asignación activa para este tipo de filtro.”
- “La cantidad debe ser un entero mayor que cero.”
- “Ya existe un tipo de filtro con este nombre.”

Errores junto al campo y anunciables. Conservar datos ante fallo de búsqueda.

## 15. UI y estilo

- Mantener el lenguaje visual operativo de la pantalla.
- Mostrar el aviso de código no encontrado con icono y texto.
- Agrupar el tipo nuevo dentro de una tarjeta secundaria.
- Etiquetar claramente lo temporal.
- No mostrar conteos o campos que no estén en RPC.
- Desktop drawer y móvil bottom sheet sobre la edición.

## 16. Botones e iconos

- Todo botón disponible usa `cursor-pointer`.
- Botones deshabilitados: `disabled` y `cursor-not-allowed`.
- Lucide requerido donde corresponda:
  - `ArrowLeft` para volver;
  - `Plus` para crear tipo/agregar;
  - `Search` para verificar de nuevo;
  - `Filter` para representar filtro;
  - `AlertCircle` para código inexistente;
  - `Info` para persistencia diferida;
  - `X` para cerrar.
- No usar emojis.
- Botones sólo con icono requieren `aria-label`.

## 17. TypeScript y Vue

- Composition API y `<script setup lang="ts">`.
- Prohibido usar `any` o `unknown` en código y pruebas.
- Usar uniones discriminadas para las cuatro combinaciones de referencias.
- No usar casts para esconder contratos incompletos.
- Props de sólo lectura y emits tipados.
- Derivados mediante `computed`.
- No usar `v-html`.

## 18. Pruebas

Cubrir:

- código no encontrado precargado;
- invalidación al editar código;
- filtro nuevo con tipo existente;
- filtro nuevo con tipo nuevo;
- filtro existente sin tipos con tipo existente;
- filtro existente sin tipos con tipo nuevo;
- estado en compras editable sólo para nuevo;
- selección y creación de tipo mediante `vue-multiselect` y `@tag`;
- etiqueta temporal seleccionada con clave estable y badge pendiente;
- prevención de tipos duplicados;
- cantidad inválida;
- no se llama escritura al confirmar;
- temp IDs estables;
- volver/cerrar con confirmación;
- restauración de foco.

## 19. Criterios de aceptación

- El código no encontrado puede convertirse en filtro temporal.
- Un filtro existente sin tipos puede asociarse sin duplicar el filtro.
- Un tipo nuevo queda pendiente hasta el guardado general.
- El selector de tipo reutiliza el adaptador tipado de `vue-multiselect`.
- No se puede agregar un segundo filtro activo del mismo tipo.
- La UI no busca equivalencias.
- No se apilan overlays.
- Todo botón disponible usa `cursor-pointer`.
- Los iconos son Lucide.
- No existe `any` ni `unknown`.
- Pruebas y typecheck pasan.
