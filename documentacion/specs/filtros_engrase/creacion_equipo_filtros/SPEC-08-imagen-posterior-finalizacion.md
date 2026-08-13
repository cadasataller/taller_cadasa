# SPEC-08 — Imagen posterior a la creación y finalización

## 1. Objetivo

Implementar el paso 5 del wizard, que permite agregar opcionalmente la imagen principal después de que el equipo fue creado correctamente. Este paso debe procesar la imagen en el frontend, subirla a Storage, registrarla mediante `engrase.rpc_administrar_imagen_equipo`, actualizar directamente el mismo equipo del store local y finalizar el flujo sin ejecutar un segundo guardado general.

La creación del equipo nunca debe revertirse por un fallo de imagen. El usuario siempre podrá reintentar u omitir la imagen y finalizar.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: `equipoCreado` y separación de imagen.
- `SPEC-03-contratos-mappers-servicios.md`: patrón de DTO, mapper, servicio y errores remotos.
- `SPEC-04-store-maquina-estados-wizard.md`: paso Imagen y bloqueo de pasos anteriores.
- `SPEC-07-creacion-transaccional-integracion-listado.md`: transición irreversible y equipo insertado localmente.
- `context_ui.md`: layout, acciones, mensajes y comportamiento opcional del paso 5.
- `context_bd.md`: bucket, ruta, RPC y respuesta de imagen.
- Implementación de edición existente:
  - `useEquipoImagenManager.ts`;
  - `equipoEngraseImagen.service.ts`;
  - `equipoEngraseImagen.types.ts`;
  - `EquipoImagenForm.vue`;
  - `EquipoImagenCropper.vue`;
  - `EquipoImagenPreview.vue`;
  - `EquipoImagenOverlay.vue`.

## 3. Dependencias y orden

- Requiere `SPEC-01` a `SPEC-07` implementados.
- Debe completarse antes de la integración visual final del wizard.
- No requiere cambios en Supabase, bucket, políticas, RPC o migraciones.
- Supone que `draft.equipoCreado` y el equipo del listado ya existen.

## 4. Alcance

Incluye:

- DTO, mapper y servicio de `rpc_administrar_imagen_equipo` para creación;
- reutilización del servicio de Storage existente;
- extracción de procesamiento WebP hacia una utilidad neutral;
- selección desde galería y cámara;
- recorte existente cuando corresponda;
- validación de tipo y tamaño;
- generación de ruta válida;
- subida física;
- registro de imagen mediante RPC;
- actualización directa del wizard y listado;
- limpieza compensatoria cuando falla la RPC después de subir;
- estados de procesamiento y error;
- reintentos;
- omitir imagen;
- finalización del wizard;
- protección de salida durante procesamiento;
- limpieza de URLs temporales;
- pruebas unitarias e integración lógica.

No incluye:

- creación o edición de datos, filtros y aceites;
- repetición de `rpc_crear_equipo_completo`;
- cambio o eliminación de una imagen persistida desde este flujo inicial;
- UI completa del shell, stepper o ruta;
- diseño definitivo del paso Imagen;
- cambios en Storage o backend.

## 5. Archivos previstos

Crear o extraer módulos neutrales:

```text
src/stores/dbequipos/engrase/imagen/
├── equipoEngraseImagen.types.ts
├── equipoEngraseImagen.processing.ts
├── equipoEngraseImagen.processing.test.ts
├── equipoEngraseImagen.storage.service.ts
└── equipoEngraseImagen.storage.service.test.ts
```

Crear para creación:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.imagen.dto.ts
├── equipoEngraseCreacion.imagen.mappers.ts
├── equipoEngraseCreacion.imagen.mappers.test.ts
├── equipoEngraseCreacion.imagen.service.ts
└── equipoEngraseCreacion.imagen.service.test.ts

src/composables/engrase/
├── useCrearEquipoImagen.ts
└── useCrearEquipoImagen.test.ts
```

Modificar:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store.ts
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
src/stores/dbequipos/engrase/filtrosEngrase.store.ts
```

Si se extraen archivos existentes de edición, conservar reexports compatibles para no romper imports ni pruebas.

## 6. Principio funcional

La imagen sólo puede administrarse cuando:

```text
draft.equipoCreado !== null
y
pasoActual === 5
```

Antes de eso:

- no existe código persistido garantizado;
- no se puede generar una operación de imagen válida;
- no debe mostrarse ni habilitarse subida;
- no debe almacenarse archivo dentro del borrador transaccional.

## 7. Regla de opcionalidad

Son finales válidos:

```text
equipo creado + imagen registrada
equipo creado + imagen omitida
equipo creado + fallo de imagen + usuario decide omitir
```

No exigir imagen para considerar creado el equipo.

No mostrar errores de validación del paso 5 por ausencia de archivo.

## 8. Reutilización y desacoplamiento

La implementación existente ya dispone de:

- validación de archivo;
- recorte;
- canvas;
- conversión WebP;
- límite de tamaño;
- generación de ruta;
- subida, eliminación y URL firmada;
- estados de limpieza.

Sin embargo, `useEquipoImagenManager` depende directamente del store de edición. No debe reutilizarse tal cual desde creación.

Extraer o compartir:

- constantes de imagen;
- tipos de archivo preparado;
- `prepararImagenEquipoWebp`;
- `crearRutaImagenEquipo`;
- validación de ruta;
- servicio físico de Storage.

Mantener separados:

- coordinación con store de edición;
- movimiento de imagen por cambio de código;
- eliminación o actualización de imagen existente;
- coordinación del paso de creación.

## 9. Constantes compartidas

Conservar los valores existentes como fuente única:

```ts
export const IMAGEN_EQUIPO_MAX_BYTES = 5 * 1024 * 1024
export const IMAGEN_EQUIPO_MAX_SIDE = 1600
export const IMAGEN_EQUIPO_WEBP_QUALITY = 0.86
export const IMAGEN_EQUIPO_BUCKET = "imagenes-equipos"
```

No duplicar valores distintos para creación y edición.

## 10. Archivo preparado

Definir o reutilizar:

```ts
export interface ImagenEquipoPreparada {
  file: File
  previewUrl: string
}
```

Reglas:

- `file.type === "image/webp"`;
- nombre terminado en `.webp`;
- lado máximo conforme a constante;
- preview mediante URL temporal;
- toda preview reemplazada o descartada debe revocarse;
- no guardar el objeto `File` en Pinia si no es necesario; preferir estado del composable.

## 11. Procesamiento neutral

Extraer una función:

```ts
prepararImagenEquipoWebp(
  archivo: File,
): Promise<ImagenEquipoPreparada>
```

Comportamiento:

1. Validar MIME `image/*`.
2. Validar máximo 5 MB antes de procesar.
3. Leer imagen.
4. Reducir proporcionalmente si supera el lado máximo.
5. Dibujar en canvas.
6. Convertir a WebP con calidad compartida.
7. Crear `File` y preview.
8. Revocar URL de origen en `finally`.

Errores legibles mínimos:

```text
Selecciona un archivo de imagen válido.
La imagen no puede superar 5 MB.
No se pudo leer la imagen seleccionada.
No se pudo preparar la imagen.
No se pudo convertir la imagen a WebP.
```

No importar store, router o Supabase.

## 12. Recorte

Reutilizar `EquipoImagenCropper` y su contrato de salida:

```text
archivo original
    |
    v
recorte local
    |
    v
archivo confirmado
    |
    v
prepararImagenEquipoWebp
```

Cancelar el recorte:

- no cambia preview persistente;
- no sube nada;
- limpia referencia al archivo pendiente.

La UI final decidirá la relación de aspecto siguiendo el comportamiento ya probado en edición.

## 13. Galería y cámara

La futura UI reutiliza dos inputs:

```text
Galería    → accept="image/*"
Tomar foto → accept="image/*" capture="environment"
```

Ambos siguen el mismo procesamiento y estado. No duplicar lógica para cámara.

Después de seleccionar, limpiar el valor del input para permitir volver a elegir el mismo archivo.

## 14. Ruta de Storage

Reutilizar:

```ts
crearRutaImagenEquipo(codigo: string): `${string}.webp`
```

Formato obligatorio:

```text
equipos/{codigoSeguro}/main_thumb/{archivoUnico}.webp
```

Reglas:

- usar el código confirmado de `equipoCreado`, no el campo editable anterior;
- sanitizar caracteres no permitidos según helper existente;
- nombre único con timestamp/UUID o estrategia ya implementada;
- validar ruta antes de cualquier operación de Storage;
- no sobrescribir mediante `upsert`.

## 15. Servicio físico de Storage

Reutilizar o extraer una interfaz neutral:

```ts
subir(path: string, file: File): Promise<void>
eliminar(path: string): Promise<void>
obtenerUrlFirmada(path: string, expiresIn?: number): Promise<string>
```

Para este paso se necesitan principalmente `subir` y `eliminar` compensatorio.

Subida:

```ts
{
  cacheControl: "3600",
  contentType: "image/webp",
  upsert: false,
}
```

No agregar lógica del wizard dentro del servicio físico.

## 16. RPC de imagen

Servicio:

```ts
agregarImagenEquipoCreado(
  entrada: AgregarImagenEquipoCreadoInput,
): Promise<AgregarImagenEquipoCreadoRespuesta>
```

Entrada local:

```ts
export interface AgregarImagenEquipoCreadoInput {
  codigoEquipo: string
  storagePath: `${string}.webp`
  descripcion: string | null
}
```

Llamada:

```ts
supabaseEquipos
  .schema("engrase")
  .rpc("rpc_administrar_imagen_equipo", {
    p_codigo_equipo: entrada.codigoEquipo,
    p_operacion: "agregar",
    p_storage_path: entrada.storagePath,
    p_descripcion: entrada.descripcion,
  })
```

Este flujo inicial sólo usa `agregar`. `actualizar` y `eliminar` continúan disponibles en edición, pero no deben exponerse como acciones del paso inicial.

## 17. DTO de imagen

Definir:

```ts
export interface AgregarImagenEquipoCreadoDto {
  ok: boolean
  codigo: string
  mensaje?: string
  equipo_id?: number
  operacion?: "agregar"
  imagen?: {
    main_storage_path: string | null
    tiene_imagen_main: boolean
    imagen_actualizada_en: string | null
  }
  storage_path_anterior?: string | null
}
```

Aunque los campos sean obligatorios en éxito, son opcionales en DTO para detectar respuestas incompletas.

## 18. Respuesta local

Definir:

```ts
export interface ImagenEquipoCreadoResultado {
  mainStoragePath: string
  tieneImagenMain: true
  imagenActualizadaEn: string | null
}

export interface AgregarImagenEquipoCreadoRespuesta {
  codigo: string
  equipoId: number
  operacion: "agregar"
  imagen: ImagenEquipoCreadoResultado
  storagePathAnterior: string | null
}
```

En una operación `agregar` exitosa:

- `mainStoragePath` no puede ser `null`;
- `tieneImagenMain` debe ser `true`;
- código e ID deben corresponder al equipo creado.

Una respuesta que viole estas reglas es incompleta/inconsistente y debe rechazarse.

## 19. Mapper

Implementar:

```ts
mapAgregarImagenEquipoCreado(
  dto: AgregarImagenEquipoCreadoDto,
): AgregarImagenEquipoCreadoRespuesta
```

Reglas:

- `ok: false` produce error funcional;
- exigir `equipo_id`, operación e imagen;
- exigir operación `agregar`;
- exigir ruta no nula y `tiene_imagen_main: true`;
- convertir snake_case a camelCase;
- conservar `storage_path_anterior`, aunque normalmente sea `null`;
- no actualizar stores desde el mapper.

## 20. Estado del paso Imagen

Definir:

```ts
export type CrearEquipoImagenState =
  | { kind: "idle" }
  | { kind: "preparing" }
  | { kind: "ready" }
  | { kind: "uploading"; path: string }
  | { kind: "registering"; path: string }
  | { kind: "success"; path: string }
  | { kind: "cleanup_pending"; path: string; message: string }
  | { kind: "error"; message: string }
```

La preview preparada vive separada:

```ts
const preparedImage = shallowRef<ImagenEquipoPreparada | null>(null)
```

No representar la secuencia con varios booleanos contradictorios.

## 21. Getters del paso

Derivar:

```text
isImageProcessing
hasPreparedImage
hasRegisteredImage
canSelectImage
canSaveImage
canSkipImage
canFinishWizard
```

Reglas:

- durante `preparing/uploading/registering`, bloquear selección adicional, salida y finalización;
- `canSaveImage` requiere preview lista y equipo creado;
- `canSkipImage` es true cuando no hay operación crítica en curso, incluso después de un error;
- `canFinishWizard` es true tras registro exitoso o cuando el usuario decide omitir;
- `hasRegisteredImage` debe derivarse también de `draft.equipoCreado.tiene_imagen_main`.

## 22. Seleccionar archivo

Acción del composable:

```ts
seleccionarImagen(archivo: File): Promise<void>
```

Flujo:

1. Comprobar paso 5 y equipo creado.
2. Rechazar si existe procesamiento.
3. Revocar preview anterior.
4. Establecer `preparing`.
5. Ejecutar procesamiento WebP.
6. Guardar preview y establecer `ready`.
7. Ante error, establecer `error` sin modificar equipo.

Seleccionar una nueva imagen reemplaza sólo la preview local no persistida.

## 23. Guardar imagen

Acción:

```ts
guardarImagen(): Promise<ResultadoGuardarImagenCreacion>
```

Resultado:

```ts
export type ResultadoGuardarImagenCreacion =
  | { kind: "success"; imagen: ImagenEquipoCreadoResultado }
  | { kind: "invalid" }
  | { kind: "busy" }
  | { kind: "error"; message: string }
  | { kind: "cleanup_pending"; path: string }
```

Precondiciones:

- equipo creado;
- paso 5;
- preview preparada;
- sin imagen ya registrada por este flujo;
- sin operación en curso.

## 24. Secuencia de guardado

Orden obligatorio:

1. Obtener código e ID del equipo creado.
2. Crear ruta única.
3. Establecer `uploading` antes del primer `await`.
4. Subir WebP a Storage.
5. Establecer `registering` con la misma ruta.
6. Llamar RPC con operación `agregar`.
7. Verificar código e ID de respuesta.
8. Actualizar stores.
9. Revocar y limpiar preview.
10. Establecer `success`.

No existe un botón de guardado general adicional.

## 25. Bloqueo de doble submit de imagen

El composable debe establecer estado de procesamiento sincrónicamente antes del primer `await`.

Un segundo `guardarImagen()` durante subida o registro retorna `busy` y no:

- crea otra ruta;
- sube otro archivo;
- llama otra RPC.

La UI deshabilitada es una protección adicional, no la única.

## 26. Actualización del wizard

Después de respuesta válida actualizar `draft.equipoCreado` con un objeto nuevo:

```text
main_storage_path  = response.imagen.mainStoragePath
tiene_imagen_main  = response.imagen.tieneImagenMain
imagen_actualizada_en = response.imagen.imagenActualizadaEn
```

Conservar:

- ID;
- código;
- tipo;
- subtipo;
- estado;
- etapas.

No reemplazar el equipo creado con una respuesta parcial de imagen.

## 27. Actualización del listado

Usar la acción existente:

```ts
actualizarImagenEquipo(
  equipoId: number,
  imagen: EquipoImagenPersistida,
): void
```

Debe actualizar directamente el mismo registro insertado en SPEC-07:

- `main_storage_path`;
- `tiene_imagen_main`;
- `imagen_actualizada_en`;
- invalidar `imageUrl` local si existe para que una vista posterior obtenga URL vigente.

No llamar:

```text
rpc_obtener_equipos_lista
rpc_obtener_imagen_equipo
```

## 28. Verificación de identidad

Antes de aplicar respuesta:

- `response.codigo` debe coincidir con código normalizado creado;
- `response.equipoId` debe coincidir con ID creado;
- la ruta retornada debe ser la subida;

Si no coincide:

- tratar como error de integración;
- intentar limpieza del archivo recién subido cuando sea seguro;
- no actualizar stores;
- permitir omitir o reintentar;
- nunca revertir equipo.

## 29. Fallo al subir

Si Storage falla antes de RPC:

- establecer `error`;
- conservar preview para reintentar;
- no llamar RPC;
- no modificar equipo ni listado;
- permitir `guardarImagen()` otra vez con una ruta nueva;
- permitir omitir.

No hace falta limpieza porque la subida no fue confirmada.

## 30. Fallo de RPC después de subir

Si la subida termina pero la RPC falla:

1. Intentar eliminar inmediatamente la ruta recién subida.
2. Si elimina correctamente:
   - establecer `error` con el fallo de registro;
   - conservar preview para reintentar;
   - no modificar stores.
3. Si la limpieza falla:
   - establecer `cleanup_pending` con la ruta;
   - informar que el equipo sigue creado y queda un archivo pendiente;
   - permitir reintentar limpieza;
   - no repetir RPC automáticamente.

No marcar imagen como registrada sin respuesta válida.

## 31. Reintentar limpieza

Acción:

```ts
reintentarLimpiezaImagen(): Promise<void>
```

Sólo disponible en `cleanup_pending`.

Si elimina:

- regresar a `ready` si aún existe preview;
- o `idle` si no existe;
- permitir reintentar guardado u omitir.

Si falla:

- conservar `cleanup_pending` y ruta;
- actualizar mensaje;
- no bloquear indefinidamente `Omitir por ahora`, salvo durante el intento activo.

## 32. Fallo local después de RPC exitosa

Si la RPC registró la imagen pero actualizar el store local falla inesperadamente:

- no eliminar el archivo;
- no repetir RPC;
- considerar la imagen persistida;
- actualizar al menos `draft.equipoCreado` si es posible;
- conservar una advertencia local recuperable;
- permitir finalizar;
- una futura recarga reconciliará el listado.

Nunca presentar este escenario como “no se pudo subir la imagen” si la RPC ya confirmó éxito.

## 33. Omitir imagen

Acción:

```ts
omitirImagen(): ResultadoFinalizarCreacion
```

Precondiciones:

- equipo creado;
- paso 5;
- sin `preparing/uploading/registering`.

Comportamiento:

- si hay preview local, revocarla y descartarla;
- no crear registro de imagen;
- no llamar Storage ni RPC;
- marcar el wizard listo para finalizar;
- conservar `tiene_imagen_main: false`;
- no generar error.

Si existe `cleanup_pending`, omitir debe seguir siendo posible y conservar la advertencia diagnóstica necesaria para una limpieza posterior. La política exacta de persistencia de esa tarea debe reutilizar el mecanismo existente o registrar claramente que requiere reintento antes de abandonar si no hay infraestructura para recuperarla.

## 34. Finalizar después de guardar

Acción:

```ts
finalizarCreacion(): ResultadoFinalizarCreacion
```

Definir:

```ts
export type ResultadoFinalizarCreacion =
  | { ok: true; equipo: EquipoEngraseListItem }
  | { ok: false; codigo: string; mensaje: string }
```

Requiere:

- equipo creado;
- paso 5;
- sin operación en curso;
- imagen registrada o decisión explícita de omitir.

La acción retorna una copia del equipo final para que la UI navegue al listado. No ejecuta router dentro del store.

## 35. Decisión explícita de omisión

No derivar que el usuario omitió sólo porque no exista imagen. Mantener un estado de finalización:

```ts
export type CrearEquipoFinalizacionState =
  | { kind: "pending" }
  | { kind: "image_saved" }
  | { kind: "image_skipped" }
  | { kind: "finished" }
```

Esto permite diferenciar:

- usuario recién entra al paso;
- usuario decidió omitir;
- imagen guardada;
- wizard finalizado.

No usar múltiples booleanos contradictorios.

## 36. Footer del paso

Contratos esperados para UI:

```text
[ Omitir por ahora ] [ Finalizar → ]
```

Comportamiento recomendado:

- sin imagen y sin decisión: `Omitir por ahora` realiza omisión explícita; `Finalizar` puede equivaler a omitir y finalizar sólo si producto lo decide claramente;
- con imagen preparada sin guardar: Finalizar no debe descartar silenciosamente;
- con imagen guardada: `Finalizar` navega;
- durante procesamiento: ambos deshabilitados;
- después de error: Omitir disponible y reintento visible.

Para evitar ambigüedad, implementación preferida:

```text
Omitir por ahora → marca image_skipped y finaliza/navega
Finalizar        → disponible tras image_saved
```

La UI final puede mantener ambos visibles conforme al contexto, pero no debe inducir a creer que hay un guardado general pendiente.

## 37. Salida y navegación

Durante procesamiento:

- bloquear router leave;
- bloquear `beforeunload`;
- bloquear cierre del wizard;
- no abrir confirmación de descartar equipo.

Sin procesamiento:

- el equipo ya existe;
- salir equivale a finalizar sin imagen si aún no se registró;
- no mostrar mensaje que sugiera revertir creación;
- una preview local sin guardar sí requiere confirmación antes de descartarse.

## 38. Preview local y salida

Si existe preview `ready` y el usuario intenta omitir o salir:

- advertir que la imagen seleccionada no fue guardada;
- opciones: `Seguir con la imagen` y `Descartar imagen`;
- descartar revoca preview;
- el equipo permanece creado;
- no usar términos `Descartar creación`.

## 39. Reset final

Después de navegación exitosa al listado:

1. Revocar previews restantes.
2. Limpiar timers o solicitudes.
3. Ejecutar reset completo del wizard.
4. No eliminar el equipo del store del listado.
5. No recargar lista.

El reset debe ocurrir después de capturar/navegar con el equipo final, no antes.

## 40. URL firmada

No es obligatorio solicitar una URL firmada inmediatamente después de registrar la imagen para completar el flujo. La preview local puede mostrar el resultado hasta finalizar.

Si la UI necesita una URL persistida:

- reutilizar `obtenerUrlFirmada`;
- manejar expiración;
- no bloquear finalización por fallo de preview;
- distinguir fallo visual de fallo de persistencia.

No hacer una consulta adicional al equipo.

## 41. Accesibilidad futura que condiciona contratos

- Estados `Procesando imagen…` y `Subiendo imagen…` deben ser anunciables.
- Galería y Cámara deben ser botones reales asociados a inputs.
- Preview posee texto alternativo contextual.
- Errores y limpieza pendiente usan texto, no sólo color.
- Botones bloqueados usan `disabled`.
- Confirmación de descarte devuelve foco.
- El éxito indica explícitamente que el equipo ya fue creado.

## 42. Reglas TypeScript y Vue

- TypeScript estricto.
- Prohibidos `any`, `unknown`, `as any`, `as unknown` y `Record<string, unknown>`.
- Uniones discriminadas para procesamiento, resultado y finalización.
- `shallowRef` para `File`, preview y estados reemplazados.
- `computed` para capacidades derivadas.
- No almacenar objetos DOM o canvas en Pinia.
- Limpiar Object URLs en reemplazo y desmontaje.
- No watchers profundos.
- No importar componentes en stores o servicios.
- No agregar dependencias.
- Sólo servicios acceden a Supabase.

## 43. Pruebas de procesamiento

Cubrir:

- rechazo de archivo no imagen;
- rechazo mayor de 5 MB;
- imagen dentro del límite;
- redimensionamiento proporcional;
- conversión WebP;
- calidad y MIME correctos;
- fallo de lectura;
- fallo de canvas/toBlob;
- URL de origen revocada;
- reemplazar preview revoca la anterior.

## 44. Pruebas de ruta y Storage

Cubrir:

- ruta con código confirmado;
- sanitización de código;
- prefijo `equipos/{codigo}/main_thumb/`;
- extensión `.webp`;
- unicidad;
- rechazo de ruta inválida;
- subida sin upsert;
- eliminación compensatoria.

## 45. Pruebas de mapper y RPC

Cubrir:

- respuesta exitosa;
- snake_case a camelCase;
- operación distinta de agregar rechazada;
- ruta nula rechazada;
- `tiene_imagen_main: false` rechazado;
- respuesta incompleta;
- `ok: false`;
- parámetros exactos de RPC;
- descripción enviada;
- error remoto tipado.

## 46. Pruebas de guardado

Cubrir:

- requiere equipo creado y paso 5;
- requiere preview;
- estado `uploading` antes del primer await;
- doble submit retorna busy;
- orden Storage → RPC → stores;
- código e ID verificados;
- wizard actualizado;
- listado actualizado;
- preview limpiada tras éxito;
- no se consulta lista ni equipo.

## 47. Pruebas de fallos

Cubrir:

- fallo de subida conserva preview;
- fallo RPC intenta limpieza;
- limpieza exitosa permite reintento;
- limpieza fallida produce `cleanup_pending`;
- reintento de limpieza;
- error permite omitir;
- discrepancia de identidad no actualiza stores;
- éxito RPC con fallo local no repite ni elimina imagen;
- ningún fallo revierte equipo.

## 48. Pruebas de omisión y finalización

Cubrir:

- omitir sin archivo no llama servicios;
- omitir con preview solicita/desarrolla descarte explícito;
- omitir conserva equipo sin imagen;
- finalizar tras imagen retorna equipo actualizado;
- finalizar durante processing bloqueado;
- reset posterior conserva equipo del listado;
- salida nunca muestra descarte de creación;
- pasos 1–4 permanecen bloqueados.

## 49. No hacer

- No permitir imagen antes de crear.
- No incluir archivo o ruta en `rpc_crear_equipo_completo`.
- No llamar una segunda vez la creación general.
- No usar el manager acoplado a edición sin extraer dependencias.
- No duplicar constantes de imagen.
- No usar `upsert: true`.
- No actualizar stores antes de respuesta RPC válida.
- No revertir equipo por fallo de imagen.
- No obligar a agregar imagen.
- No bloquear omisión después de un error recuperable.
- No volver a consultar la lista.
- No limpiar el wizard antes de finalizar navegación.
- No consultar ni modificar configuración de Supabase.

## 50. Criterios de aceptación

- El paso sólo funciona con un equipo creado.
- Galería, cámara, recorte y WebP reutilizan lógica neutral compartida.
- La ruta usa el código confirmado y formato válido.
- La subida ocurre antes del registro RPC.
- El doble submit de imagen está bloqueado.
- La respuesta actualiza directamente wizard y listado.
- No se realiza consulta adicional.
- Fallo de RPC intenta limpiar el archivo subido.
- Limpieza pendiente es recuperable.
- El usuario puede omitir tras un error.
- El equipo nunca se revierte.
- Finalizar retorna el equipo final y permite limpiar el wizard.
- Los pasos 1–4 permanecen bloqueados.
- La imagen no depende de otro guardado general.
- No se realizaron cambios de backend.

## 51. Resultado esperado

Al finalizar la implementación de este spec existirá el flujo:

```text
PASO 5 — IMAGEN
    |
    +--> Omitir por ahora
    |       ├── sin RPC
    |       ├── equipo permanece creado
    |       └── finalizar
    |
    └--> Seleccionar imagen
            |
            +--> recortar
            +--> validar
            +--> convertir WebP
            +--> preview
            |
            v
          Guardar
            |
            +--> subir Storage
            +--> rpc_administrar_imagen_equipo(agregar)
            +--> actualizar equipo del wizard
            +--> actualizar mismo item del listado
            |
            v
          Finalizar
```

Con este spec queda completa toda la lógica funcional de creación. El spec restante ensamblará ruta, permisos, componentes y experiencia responsive.
