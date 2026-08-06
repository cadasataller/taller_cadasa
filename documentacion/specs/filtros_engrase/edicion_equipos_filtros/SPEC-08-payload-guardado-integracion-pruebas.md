# SPEC-08 — Payload diferencial, guardado, sincronización e integración final

## 1. Objetivo

Completar el flujo de edición construyendo un `p_cambios` mínimo desde el snapshot y el borrador, ejecutar `rpc_actualizar_equipo_completo`, sincronizar el listado y sus cachés, coordinar el movimiento de imagen por cambio de código y validar la experiencia completa en desktop y móvil.

## 2. Dependencias

- Requiere `SPEC-01` a `SPEC-07` terminados.
- Es el spec final de la funcionalidad.

## 3. Fuentes de verdad

- `context_payload_rpc.md` para payload y respuesta.
- `context_view.md` para guardado único y reglas del borrador.
- Todas las decisiones funcionales incorporadas en `SPEC-01` a `SPEC-07`.
- Las cinco imágenes de la carpeta como guía de composición y estilo, nunca como fuente de campos adicionales.

## 4. Alcance

Incluye:

- comparador snapshot/borrador;
- constructor de payload mínimo;
- validación integral;
- guardado y estados de envío;
- mapeo de errores;
- actualización puntual del listado;
- invalidación de caché del detalle;
- coordinación con Storage al cambiar código;
- navegación posterior;
- pruebas unitarias, de componentes e integración;
- auditoría responsive y accesible.

No incluye:

- cambios de base de datos;
- nuevas RPC;
- control de concurrencia, porque el contrato no lo ofrece;
- campos fuera del contrato.

## 5. Archivos

Crear:

```text
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.payload.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.validation.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.payload.test.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.validation.test.ts
src/views/engrase/EquipoEngraseEditarView.test.ts
```

Modificar:

```text
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.ts
src/stores/dbequipos/engrase/filtrosEngrase.store.ts
src/composables/engrase/useEquipoEngraseEditor.ts
src/components/engrase/edicion/EquipoEdicionFooter.vue
src/views/engrase/EquipoEngraseEditarView.vue
```

## 6. Regla del payload mínimo

`p_cambios` debe incluir únicamente secciones con cambios reales.

Ejemplo, sólo subtipo:

```json
{
  "p_codigo_equipo": "410002",
  "p_cambios": {
    "datos_equipo": {
      "subtipo": "Bus urbano"
    }
  }
}
```

No enviar en este caso:

- `etapas`;
- `filtros`;
- `aceites`;
- propiedades de datos que no cambiaron;
- `estado_operacion` si la RPC no lo requiere para ese payload mínimo.

## 7. Datos del equipo

Construir `datos_equipo` propiedad por propiedad:

- `codigo_nuevo` sólo si cambió el código;
- `subtipo` sólo si cambió el valor normalizado;
- `estado` sólo si cambió;
- `tipo_equipo` sólo si cambió la referencia.

Tipo existente:

```json
{
  "estado": "existente",
  "id": 1,
  "nombre": "Buses"
}
```

Tipo nuevo:

```json
{
  "estado": "nuevo",
  "id": null,
  "temp_id": "tmp_tipo_equipo_1",
  "nombre": "Tractores"
}
```

Omitir `datos_equipo` si queda vacío.

## 8. Etapas

Comparar como conjuntos de IDs.

- IDs presentes sólo en borrador → `agregadas`.
- IDs presentes sólo en snapshot → `eliminadas`.
- IDs en ambos → no enviar.

Omitir arreglos vacíos y omitir la sección completa si no hay operaciones.

Validar el estado final, no sólo las operaciones: debe quedar al menos una etapa activa.

## 9. Filtros

### Nuevos

Incluir asignaciones nuevas activas. Respetar las combinaciones:

- tipo existente/nuevo;
- filtro existente/nuevo.

### Actualizados

Incluir sólo asignaciones existentes cuyo tipo o cantidad difieran del snapshot.

El filtro asociado conserva su ID y código; la edición no permite cambiarlo.

Incluir motivo humano:

```text
Tipo de filtro: Filtro de aceite → Filtro hidráulico; Cantidad: 1 → 2
```

### Eliminados

Incluir sólo asignaciones existentes pendientes de eliminación.

### Operaciones canceladas

Una asignación nueva pendiente de eliminación no se envía.

Omitir colecciones vacías y la sección si no queda ninguna operación.

Validar el estado final:

- mínimo un filtro activo;
- cantidades enteras mayores que cero;
- un filtro por tipo.

## 10. Aceites

### Nuevos

Incluir asociaciones nuevas activas con sistema y aceite existentes o nuevos.

### Actualizados

Incluir asociaciones existentes cuyo sistema o aceite cambió.

### Eliminados

Incluir asociaciones existentes pendientes de eliminación.

Una asociación nueva luego quitada no se envía.

Omitir colecciones y sección vacías.

Validar el estado final: un aceite activo por sistema.

## 11. Sin cambios

Si `p_cambios` queda vacío:

- `canSave` debe ser falso;
- no llamar RPC;
- el botón `Guardar cambios` debe estar deshabilitado;
- si se intenta mediante teclado o código, mostrar “No hay cambios pendientes”.

La imagen no cuenta como cambio general después de persistirse inmediatamente.

## 12. Guardado

Flujo:

1. Cerrar o confirmar cualquier overlay con cambios locales.
2. Ejecutar validación integral.
3. Enfocar el primer campo inválido y mostrar resumen si hay varios errores.
4. Construir payload mínimo.
5. Deshabilitar acciones y mostrar estado de guardado.
6. Llamar `rpc_actualizar_equipo_completo` con `codigoOriginal`.
7. Procesar respuesta exitosa.
8. Sincronizar store del listado.
9. Coordinar imagen si cambió el código.
10. Navegar al listado o permanecer mostrando éxito según el comportamiento definido abajo.

Durante el guardado:

- impedir doble envío;
- no permitir cancelar;
- no cerrar la pestaña silenciosamente;
- mantener el borrador en memoria.

## 13. Sincronización del store existente

Agregar acciones públicas al store de listado:

```ts
aplicarEquipoActualizado(equipo: EquipoEngraseListItem): void
invalidarDetalleEquipo(equipoId: number): void
actualizarImagenEquipo(
  equipoId: number,
  imagen: EquipoImagenPersistida,
): void
```

`aplicarEquipoActualizado`:

- reemplaza por ID;
- no recarga toda la lista;
- conserva filtros y selección cuando siga siendo válida;
- utiliza `equipo_lista` como fuente.

`invalidarDetalleEquipo`:

- elimina el equipo de `filtrosCache`;
- limpia el detalle visible si corresponde o fuerza su recarga al regresar;
- evita mostrar filtros anteriores después de guardar.

No acceder a variables privadas del store desde otro módulo.

## 14. Resultado y navegación

Si RPC y sincronización de imagen terminan correctamente:

- anunciar éxito;
- establecer el nuevo snapshot desde la respuesta y el borrador persistido;
- limpiar `isDirty`;
- volver al listado conservando filtros y posición lógica.

Si la RPC termina pero el movimiento de imagen queda pendiente:

- actualizar igualmente store y snapshot con la respuesta;
- mostrar éxito parcial explícito;
- permanecer en edición hasta que el usuario reintente o decida volver;
- ofrecer `Reintentar mover imagen`;
- mantener deshabilitadas las operaciones de administrar imagen mientras exista esa sincronización pendiente;
- permitir volver sin tratar el cambio general como no guardado;
- no repetir la RPC general.

## 15. Errores RPC

Mapear como mínimo:

- autenticación requerida;
- equipo no encontrado;
- código duplicado;
- subtipo requerido;
- etapa inexistente o mínima;
- filtro mínimo;
- asignación inexistente;
- cantidad inválida;
- aceite inexistente;
- conflicto de duplicados;
- payload inválido.

Reglas:

- conservar íntegro el borrador;
- habilitar reintento;
- no limpiar operaciones;
- mostrar error junto a la sección cuando pueda identificarse;
- usar error general sólo para fallos no atribuibles a un campo;
- no exponer mensajes técnicos crudos como única explicación.

## 16. Concurrencia

La RPC no recibe versión ni fecha de actualización. Este spec no inventará control optimista.

- No enviar `imagen_actualizada_en` como versión.
- No realizar una recarga silenciosa que borre el borrador.
- Documentar la limitación en pruebas y entrega.
- Si el backend agrega versión en el futuro, tratarlo en otro spec.

## 17. Integración responsive

Desktop:

- formulario completo con secciones claras;
- drawers laterales sobre edición;
- footer de acciones visible;
- no mostrar listado detrás.

Móvil/tablet:

- pantalla de edición completa;
- secciones apiladas;
- overlays como bottom sheets;
- CTA accesibles sin scroll horizontal;
- footer respetando safe area;
- contenido no oculto tras acciones fijas.

En todos los tamaños:

- sólo un overlay activo;
- backdrop y foco correctos;
- sin scroll anidado innecesario;
- animaciones de transform/opacity y respeto a reducción de movimiento.

## 18. Botones e iconografía

- Todo botón disponible debe declarar `cursor-pointer`.
- Todo botón deshabilitado usa `disabled` y `cursor-not-allowed`.
- Mantener texto junto a iconos en acciones principales.
- Lucide:
  - `Save` para guardar;
  - `X` para cancelar;
  - `ArrowLeft` para volver;
  - `Loader2` durante guardado;
  - `CheckCircle2` para éxito;
  - `AlertTriangle` para éxito parcial/error;
  - `RefreshCw` para reintentar.
- No usar emojis.
- Icon-only requiere `aria-label`.

## 19. TypeScript y arquitectura

- Prohibido usar `any` o `unknown` en cualquier archivo creado o modificado, incluyendo pruebas, mocks, errores, eventos y casts.
- `CambiosEquipoPayload` y `ActualizarEquipoCompletoArgumento` son tipos locales exclusivos del argumento complejo de la función de servicio; no forman parte de `Database`.
- No crear, generar ni modificar `database.types.ts` para registrar `rpc_actualizar_equipo_completo` ni ninguna otra RPC de esta serie.
- El service convierte el argumento local al objeto `{ p_codigo_equipo, p_cambios }` y convierte la respuesta al tipo local después de validar `error`.
- Usar tipos concretos importados de la capa de edición.
- El generador de payload es una función pura.
- La validación es una función pura o conjunto de helpers puros.
- El store coordina estado y servicios.
- La vista sólo compone.
- Componentes presentacionales no llaman Supabase.
- Props inmutables y emits tipados.
- Vue 3, Composition API y `<script setup lang="ts">`.
- No usar `v-html`.

## 20. Matriz mínima de pruebas de payload

Debe incluir:

- sólo código;
- sólo subtipo;
- sólo estado;
- sólo tipo existente;
- tipo nuevo;
- etapas agregadas;
- etapas eliminadas;
- filtro nuevo con cada combinación de entidades;
- filtro actualizado sólo en tipo;
- filtro actualizado sólo en cantidad;
- filtro actualizado en ambos y motivo concatenado;
- filtro eliminado;
- filtro nuevo eliminado localmente;
- aceite nuevo con cada combinación;
- aceite actualizado;
- aceite eliminado;
- múltiples secciones simultáneas;
- payload vacío.
- traducción del argumento local a `{ p_codigo_equipo, p_cambios }` dentro del service;
- ausencia de cambios en tipos globales `Database`.

## 21. Pruebas de integración

Cubrir:

- abrir desde listado;
- cargar borrador;
- modificar cada sección;
- abrir cada drawer sobre edición;
- verificar tipo de equipo, subtipo, etapas, tipo de filtro, sistema y aceite mediante los adaptadores de `vue-multiselect`;
- verificar navegación por teclado, búsqueda local, opciones deshabilitadas y creación por `@tag`;
- guardar exitosamente;
- reemplazar `equipo_lista` sin recarga global;
- invalidar filtros cacheados;
- conservar filtros del listado al volver;
- error RPC conserva borrador;
- prevenir doble guardado;
- cambio de código sin imagen;
- cambio de código con movimiento exitoso;
- cambio de código con movimiento pendiente y reintento;
- imagen inmediata no altera otros cambios;
- confirmación al salir;
- navegación móvil completa;
- teclado y manejo de foco.

## 22. Comandos de verificación

Ejecutar al finalizar:

```text
pnpm typecheck
pnpm test:run
pnpm build
```

Además:

- buscar `any` y `unknown` en todos los archivos creados o modificados por la funcionalidad;
- comprobar manualmente desktop, tablet y móvil;
- confirmar que `vue-multiselect@3.5.0` monta y compila con las versiones actuales de Vue, Vite y `@vitejs/plugin-vue` sin deshabilitar Composition API ni degradar dependencias silenciosamente;
- confirmar que el CSS base se importa una sola vez y que los menús no quedan recortados dentro de drawers/bottom sheets;
- comprobar que los dropdowns teletransportados mantienen el `z-index`, el foco y la navegación por teclado dentro del flujo modal;
- verificar agregar/cambiar/eliminar imagen contra un entorno autorizado;
- verificar que Storage y base coincidan tras cambiar código.

## 23. Criterios de aceptación final

- La edición funciona como pantalla completa.
- Todos los drawers se superponen sobre edición.
- Sólo se envían secciones y campos modificados.
- La RPC general se ejecuta una sola vez por guardado.
- Se mantienen al menos una etapa y un filtro.
- No existen filtros duplicados por tipo ni aceites duplicados por sistema.
- Quitar/deshacer funciona para existentes y nuevos.
- Los motivos de filtro son legibles.
- La imagen se administra inmediatamente.
- El cambio de código sincroniza la ruta física o deja un reintento explícito.
- El listado se actualiza con `equipo_lista` sin recarga completa.
- La caché del detalle queda invalidada.
- Errores conservan el borrador.
- Todos los botones disponibles usan `cursor-pointer`.
- Todos los iconos funcionales requeridos son Lucide.
- No existe `any` ni `unknown` en archivos creados o modificados.
- Typecheck, pruebas y build terminan correctamente.
