# SPEC-07 — Administrar imagen principal y sincronizar Storage

## 1. Objetivo

Implementar un drawer/bottom sheet sencillo para administrar la imagen principal del equipo mediante las operaciones `agregar`, `actualizar` y `eliminar`, además de preparar el movimiento físico del archivo cuando cambia el código del equipo.

La imagen se persiste inmediatamente y es independiente del botón general `Guardar cambios`.

## 2. Referencias

- `context.md`: separación entre archivo físico y registro.
- `context_payload_rpc.md`: payloads, respuestas y reglas de `rpc_administrar_imagen_equipo`.
- `view_edit_equipo.png`: ubicación general de la acción; no existe una maqueta final del drawer.
- Estilo de los demás drawers de esta carpeta.

## 3. Dependencias

- Requiere `SPEC-01` y `SPEC-02`.
- Debe completarse antes de `SPEC-08`, que coordina el cambio de código.

## 4. Alcance

Incluye:

- UI simple de administrar imagen;
- miniatura actual;
- agregar, cambiar y eliminar;
- preparación/conversión a WebP;
- subida y eliminación en `imagenes-equipos`;
- RPC de imagen;
- compensaciones y reintentos;
- actualización inmediata del estado persistido;
- helper de movimiento por cambio de código.

No incluye:

- galería;
- múltiples imágenes;
- edición avanzada, recorte manual o filtros;
- guardar la imagen dentro de `rpc_actualizar_equipo_completo`;
- nuevas tablas o RPC.

## 5. Archivos

Crear:

```text
src/components/engrase/edicion/imagen/EquipoImagenTrigger.vue
src/components/engrase/edicion/imagen/EquipoImagenOverlay.vue
src/components/engrase/edicion/imagen/EquipoImagenForm.vue
src/components/engrase/edicion/imagen/EquipoImagenPreview.vue
src/components/engrase/edicion/imagen/EquipoImagenCropper.vue
src/composables/engrase/useEquipoImagenManager.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseImagen.service.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseImagen.types.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseImagen.service.test.ts
src/components/engrase/edicion/imagen/EquipoImagenOverlay.test.ts
```

Modificar store y pantalla de edición para mantener `imagenPersistidaActual`.

## 6. Estados de UI

El drawer conserva densidad ERP: texto y acciones en `text-sm`, metadatos/ayudas/estados en `text-xs`, mínimo absoluto de 12 px, `gap-2` entre controles y `gap-3` entre bloques. La miniatura no debe forzar una tarjeta sobredimensionada.

### Sin imagen

Mostrar:

- placeholder con icono;
- dos entradas de archivo: “Galería” y “Tomar foto”;
- vista previa local;
- acción `Agregar imagen`.

### Con imagen

Mostrar:

- miniatura actual;
- ruta o descripción sólo si ayuda al diagnóstico;
- `Cambiar imagen`;
- `Eliminar imagen`.

### Procesando

- bloquear acciones incompatibles;
- mostrar progreso o spinner;
- mantener dimensiones para evitar saltos;
- no permitir doble envío.

### Error recuperable

- explicar qué etapa falló;
- conservar selección o datos necesarios;
- ofrecer reintento específico.

## 7. Persistencia inmediata

Mostrar permanentemente dentro del overlay:

> Los cambios de imagen se aplican inmediatamente y no dependen de “Guardar cambios”.

Después de una operación exitosa:

- actualizar `imagenPersistidaActual` en el store de edición;
- actualizar los tres campos de imagen del equipo en el store del listado;
- no marcar el borrador general como sucio por esa operación ya persistida;
- conservar cualquier otro cambio general pendiente.

## 8. Preparación de archivo

Reglas:

- “Galería” abre un selector normal de imágenes;
- “Tomar foto” usa un selector de archivo independiente con `accept="image/*"` y `capture="environment"`; en dispositivos compatibles solicita la cámara trasera y en los demás conserva el selector nativo;
- el archivo proveniente de cualquiera de las dos entradas sigue exactamente la misma validación, preparación WebP, vista previa, persistencia y compensaciones;
- después de elegir desde galería o cámara, mostrar obligatoriamente un recortador previo a la vista previa final;
- el recortador usa marco fijo de aspecto `1:1`, permite desplazar la imagen por arrastre y ampliar/reducir mediante control de zoom, sin permitir zonas vacías dentro del marco;
- al confirmar se exporta únicamente el área cuadrada seleccionada y ese resultado continúa por el flujo WebP; al cancelar no se modifica la imagen persistida;
- limpiar el valor de cada input después de seleccionar para permitir elegir de nuevo el mismo archivo;
- aceptar formatos de imagen soportados por el navegador;
- validar MIME y tamaño antes de procesar;
- generar salida `.webp`;
- no confiar sólo en la extensión original;
- preservar proporción;
- definir resolución máxima y calidad como constantes documentadas;
- revocar URLs `blob:` cuando se reemplacen o desmonte el componente;
- no subir el original si no termina en WebP válido.

La ruta debe cumplir:

```text
equipos/<codigo-persistido>/main_thumb/<nombre-unico>.webp
```

El nombre debe evitar colisiones y caché obsoleta.

## 9. Agregar imagen

Precondición: `tieneImagenMain === false`.

Orden:

1. Preparar WebP.
2. Subir archivo nuevo al bucket.
3. Llamar RPC con `p_operacion: "agregar"`.
4. Actualizar stores con la respuesta.
5. Mostrar confirmación accesible.

Compensación:

- Si la subida falla, no llamar RPC.
- Si la subida funciona y la RPC falla, intentar eliminar el archivo recién subido.
- Si la compensación falla, registrar una tarea local de limpieza y mostrar un error recuperable sin afirmar que la imagen quedó asociada.

## 10. Cambiar imagen

Precondición: existe imagen principal.

Orden:

1. Conservar `storagePathAnterior` local.
2. Preparar y subir archivo nuevo con ruta distinta.
3. Llamar RPC con `p_operacion: "actualizar"`.
4. Actualizar stores a la nueva imagen.
5. Eliminar físicamente la ruta anterior devuelta por RPC.

Si falla el paso 5:

- la nueva imagen continúa siendo la oficial;
- no revertir la RPC;
- informar “Imagen actualizada; archivo anterior pendiente de limpieza”;
- permitir reintentar únicamente la limpieza.

Si la RPC falla después de subir la nueva:

- eliminar la nueva como compensación;
- conservar la imagen anterior como oficial.

## 11. Eliminar imagen

Precondición: existe imagen principal.

Requerir confirmación destructiva.

Orden:

1. Llamar RPC con `p_operacion: "eliminar"`.
2. Actualizar stores a estado sin imagen.
3. Eliminar físicamente `storage_path_anterior`.

Si falla la eliminación física:

- la base continúa correctamente sin imagen;
- conservar una tarea de limpieza recuperable;
- no restaurar visualmente la imagen como asociada;
- ofrecer reintento de limpieza.

## 12. Cambio de código del equipo

El cambio de código se guarda mediante la RPC general del `SPEC-08`. Esa RPC actualiza la ruta registrada en base antes de responder.

Después de una respuesta exitosa:

1. Obtener ruta fuente desde `imagenPersistidaActual.mainStoragePath` justo antes del guardado.
2. Obtener ruta destino desde `equipo_lista.main_storage_path`.
3. Si ambas existen y difieren, mover el archivo mediante la API de Storage.
4. Actualizar `imagenPersistidaActual` a la ruta destino.

Es importante usar la imagen persistida más reciente, no necesariamente la que existía al abrir la pantalla: el usuario pudo agregar o cambiar la imagen durante la edición.

Si el movimiento falla:

- la edición general permanece guardada;
- actualizar el store del listado con `equipo_lista`, porque representa la verdad de base;
- actualizar los metadatos persistidos de imagen a la ruta destino indicada por la base, pero conservar la ruta física fuente exclusivamente dentro del estado de recuperación;
- mostrar estado `imagen_pendiente_sincronizacion`;
- conservar ruta fuente y destino;
- ofrecer `Reintentar mover imagen`;
- deshabilitar temporalmente agregar, cambiar y eliminar imagen hasta resolver el movimiento, para no operar contra una ruta física y una ruta de base diferentes;
- no volver a llamar `rpc_actualizar_equipo_completo`;
- no afirmar que todo terminó sin advertencias.

## 13. Estado recuperable

Definir una unión explícita:

```ts
type ImagenSyncState =
  | { kind: "idle" }
  | { kind: "processing"; operation: OperacionImagenUi }
  | { kind: "cleanup_pending"; path: string }
  | { kind: "move_pending"; sourcePath: string; destinationPath: string }
  | { kind: "error"; message: string }
```

No persistir silenciosamente rutas pendientes en variables sueltas. El estado debe permitir reintento sin repetir pasos ya confirmados.

## 14. Storage y seguridad

- Usar el cliente `supabaseEquipos` existente.
- Bucket: `imagenes-equipos`.
- No usar `service_role`.
- Verificar que las políticas del usuario permitan insert/select/update/delete/move según la implementación.
- No usar `upsert` como sustituto de rutas únicas sin revisar permisos.
- No borrar una ruta que no haya sido devuelta por la RPC o conservada explícitamente como fuente.
- Evitar operaciones destructivas con paths derivados sin validación.

## 15. Overlay responsive

- Drawer en desktop y bottom sheet en móvil/tablet.
- `<Teleport to="body">`.
- El overlay teletransportado usa los mismos tokens base de `@theme` que la vista.
- Superpuesto sobre la vista de edición.
- Bloqueo de scroll y manejo de foco.
- No cerrar mientras una operación está en curso.
- Si sólo existe una vista previa no persistida, confirmar antes de cerrar.
- Eliminar requiere confirmación separada.
- Controles visuales de 36–40 px en escritorio y áreas táctiles de al menos 44 px en móvil.
- Mantener `rounded-md`/`rounded-lg`, `p-3`/`p-4` y sombras discretas.
- Usar sólo tokens de `src/index.css`: superficies `second*`/`white`, jerarquía `main*`/`gray-*`, selección `accent*` y acciones destructivas `danger`/`danger-bg`. No usar colores literales ni paletas externas.

## 16. Botones e iconos

- Todo botón disponible debe usar `cursor-pointer`.
- Procesando/deshabilitado: `disabled` y `cursor-not-allowed`.
- Usar Lucide:
- `ImagePlus` para agregar;
- `FolderOpen` para Galería;
- `Camera` para Tomar foto;
  - `Image` para placeholder;
  - `RefreshCw` o `Replace` equivalente disponible para cambiar;
  - `Trash2` para eliminar;
  - `Upload` para subir;
  - `Loader2` para procesar;
  - `RotateCcw` para reintentar;
  - `AlertTriangle` para advertencias;
  - `X` para cerrar.
- No usar emojis.
- Botones sólo con icono requieren `aria-label`.

## 17. TypeScript y Vue

- Composition API y `<script setup lang="ts">`.
- Prohibido usar `any` y `unknown` en código, File helpers, canvas, eventos, servicios y tests.
- `administrarImagenEquipo` recibe un objeto local discriminado porque su argumento es complejo; no registrar sus parámetros en `Database` ni modificar tipos generados de Supabase.
- El service traduce ese objeto a `p_codigo_equipo`, `p_operacion`, `p_storage_path` y `p_descripcion` dentro de la función.
- Tipar eventos como `Event` y estrechar mediante comprobaciones concretas sin casts inseguros.
- Usar uniones discriminadas para operación y sincronización.
- Guardar instancias opacas o archivos en `shallowRef` cuando no necesiten reactividad profunda.
- Limpiar recursos en `onBeforeUnmount`.
- No usar `v-html`.

## 18. Pruebas

Cubrir:

- estado sin/con imagen;
- validación de archivo;
- salida WebP;
- agregar exitoso;
- compensación si RPC de agregar falla;
- actualizar exitoso;
- limpieza pendiente del archivo anterior;
- eliminación confirmada;
- limpieza pendiente tras eliminar;
- actualización inmediata de stores;
- borrador general no se pierde;
- cambio de código mueve desde la última ruta persistida;
- fallo de movimiento crea estado reintentable;
- reintento no repite RPC general;
- botones bloqueados durante proceso;
- revocación de previews.
- selección desde galería y captura de cámara pasan por el mismo flujo de preparación;
- recorte 1:1 conserva el encuadre elegido al exportar, permite mover y zoom, y libera su URL temporal al cancelar o confirmar;
- densidad ERP sin texto menor a 12 px ni controles móviles pequeños.
- tema principal aplicado al drawer, confirmación y estados de imagen sin valores cromáticos literales.

## 19. Criterios de aceptación

- El drawer administra agregar, cambiar y eliminar.
- La imagen se persiste inmediatamente.
- La salida subida es `.webp`.
- Galería y Tomar foto están disponibles y producen la misma vista previa local antes de persistir.
- Toda imagen seleccionada pasa por el recortador 1:1 antes de la vista previa y la subida.
- Los stores reflejan cada RPC exitosa.
- Existen compensaciones para archivos huérfanos.
- El cambio de código mueve el archivo después del guardado general.
- Un fallo de movimiento es recuperable sin repetir la edición.
- El administrador de imagen usa superficies compactas, mínimo tipográfico de 12 px y controles responsive 36–40/44 px.
- El drawer y sus confirmaciones usan exclusivamente los tokens base del bloque `@theme` de `src/index.css`.
- Todo botón disponible tiene `cursor-pointer`.
- Se usan iconos Lucide.
- No existe `any` ni `unknown`.
- Pruebas y typecheck pasan.
