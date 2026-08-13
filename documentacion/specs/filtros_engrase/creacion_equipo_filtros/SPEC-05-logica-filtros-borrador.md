# SPEC-05 — Lógica de filtros del borrador

## 1. Objetivo

Implementar toda la lógica de dominio y orquestación necesaria para administrar los filtros iniciales de un equipo antes de crearlo: búsqueda por código original, selección de tipo, creación temporal de códigos y tipos, edición, eliminación local, cantidades, sugerencias y estados derivados para badges y opciones bloqueadas.

Este spec amplía el store del wizard sin crear todavía los componentes visuales definitivos. Debe entregar contratos y acciones suficientes para que la UI posterior pueda reutilizar los formularios y overlays de edición sin heredar sus reglas de actualización o eliminación persistida.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: referencias existentes/temporales y `CrearEquipoFiltroDraft`.
- `SPEC-02-validaciones-payload-creacion.md`: unicidad por tipo, cantidades y payload.
- `SPEC-03-contratos-mappers-servicios.md`: búsqueda remota sin `p_codigo_equipo`.
- `SPEC-04-store-maquina-estados-wizard.md`: store, overlays, pasos y bloqueo posterior a creación.
- `context_ui.md`: flujo de búsqueda, creación, lista y drawer/bottom sheet.
- `context_bd.md`: restricción de un filtro por tipo para cada equipo.
- Decisión definitiva confirmada:
  - el mismo código original puede asignarse más de una vez al equipo;
  - cada repetición debe utilizar un tipo de filtro diferente;
  - un código ya utilizado debe indicarse mediante badge o texto `Ya asignado`;
  - dentro de la selección de tipos, todo tipo ya ocupado muestra badge `Asignado` y queda deshabilitado;
  - el código completo no queda bloqueado mientras conserve al menos un tipo disponible.

## 3. Dependencias y orden

- Requiere `SPEC-01` a `SPEC-04` implementados.
- Debe completarse antes de la creación transaccional y la UI final.
- No requiere cambios en Supabase.
- No requiere administración de imagen.

## 4. Alcance

Incluye:

- estado del flujo de búsqueda dentro del store o un composable especializado;
- normalización y envío de búsquedas;
- control de solicitudes obsoletas;
- combinación de resultados remotos con el borrador local;
- derivación de códigos usados y tipos ocupados;
- badge informativo para código ya asignado;
- badge y bloqueo para tipos ya asignados;
- selección de filtro existente con tipo existente o nuevo;
- creación temporal de código con tipo existente o nuevo;
- cantidades enteras positivas;
- edición de tipo y cantidad;
- eliminación inmediata del borrador;
- bloqueo de eliminación del último filtro;
- sugerencias remotas y locales;
- apertura y cierre del overlay con descarte seguro;
- pruebas unitarias de reglas y acciones.

No incluye:

- componentes visuales definitivos;
- estilos de badges;
- implementación del drawer/bottom sheet;
- llamadas para crear filtros o tipos individualmente;
- persistencia de relaciones;
- equivalencias de filtros;
- aceites;
- creación transaccional del equipo;
- imagen.

## 5. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.filtros.ts
└── equipoEngraseCreacion.filtros.test.ts
```

Modificar:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store.ts
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
```

Opcionalmente crear un composable de presentación si resulta necesario para aislar estado efímero del overlay:

```text
src/composables/engrase/useCrearEquipoFiltroEditor.ts
```

El estado autoritativo de filtros permanece en el store. El composable no debe mantener una segunda lista del borrador.

## 6. Principios obligatorios

### 6.1. Todo permanece local

Agregar, editar o quitar un filtro sólo modifica `draft.filtros`. La única llamada remota de este spec es la búsqueda por código original.

No llamar RPC de catálogo para persistir:

- códigos nuevos;
- tipos nuevos;
- asignaciones;
- cantidades.

### 6.2. El tipo es la restricción excluyente

La ocupación se determina mediante `crearClaveTipoFiltroCreacion` del SPEC-02.

No considerar excluyentes:

- código original;
- ID del filtro;
- `tempId` del código;
- combinación código/tipo como única regla.

### 6.3. Los badges son derivados

No escribir flags redundantes dentro de `CrearEquipoFiltroDraft`:

```ts
yaAsignado
tipoBloqueado
codigoRepetido
```

Se calculan desde `draft.filtros` y el contexto del elemento editado.

### 6.4. Eliminar no es marcar pendiente

Los filtros aún no existen en base de datos. Al confirmar eliminación, se quitan del arreglo. No utilizar:

```text
pendiente_eliminacion
estadoAntesDeEliminar
deshacer eliminación persistida
```

## 7. Estado efímero del editor de filtros

Definir una unión discriminada para el flujo abierto:

```ts
export type CrearEquipoFiltroEditorState =
  | { kind: "closed" }
  | {
      kind: "search"
      query: string
      result: ResultadoBusquedaFiltroOriginal | null
      loading: boolean
      error: string | null
      dirty: boolean
    }
  | {
      kind: "create"
      codigoInicial: string
      dirty: boolean
    }
  | {
      kind: "edit"
      draftId: string
      dirty: boolean
    }
```

Puede integrarse con `activeOverlay` mediante una única unión o vivir en un composable especializado. No deben existir estados contradictorios como overlay cerrado con editor en `edit`.

Los datos definitivos sólo se agregan al borrador al confirmar.

## 8. Contratos de entrada

Definir entradas explícitas:

```ts
export interface AgregarFiltroExistenteCreacionInput {
  filtro: FiltroExistenteCreacionReference
  tipoFiltro: TipoFiltroCreacionReference
  cantidad: number
}

export interface AgregarFiltroTemporalCreacionInput {
  filtro: FiltroCreacionReference
  tipoFiltro: TipoFiltroCreacionReference
  cantidad: number
}

export interface EditarFiltroCreacionInput {
  draftId: string
  tipoFiltro: TipoFiltroCreacionReference
  cantidad: number
}
```

Si las dos entradas de alta terminan siendo estructuralmente idénticas, usar un único contrato neutral y dos acciones semánticas sólo cuando ayuden al flujo de la UI. No duplicar interfaces equivalentes.

## 9. Getters de filtros

Agregar o implementar helpers puros para derivar:

```text
filtersCount
hasMinimumFilter
usedFilterCodes
usedFilterIds
occupiedFilterTypeKeys
occupiedExistingFilterTypeIds
occupiedNewFilterTypeNames
```

Reglas:

- `filtersCount` es `draft.filtros.length`;
- `usedFilterCodes` usa códigos normalizados únicos;
- `usedFilterIds` contiene IDs existentes usados, aunque no sean bloqueantes;
- tipos existentes ocupados se identifican por ID;
- tipos nuevos ocupados se identifican por nombre normalizado;
- no guardar estos conjuntos dentro del borrador;
- usar `computed` en store o funciones puras reutilizables.

## 10. Contexto de edición

Toda función de ocupación debe aceptar opcionalmente un `excludeDraftId` para no bloquear contra sí misma al editar.

Ejemplo:

```ts
estaTipoFiltroOcupado(
  tipo: TipoFiltroCreacionReference,
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): boolean
```

Sin exclusión:

- se usa al agregar.

Con exclusión:

- se usa al editar una fila existente;
- el tipo actual permanece seleccionable;
- otros tipos ocupados siguen bloqueados.

## 11. Estado derivado de un código

Definir:

```ts
export interface EstadoCodigoFiltroEnBorrador {
  codigo: string
  asignado: boolean
  cantidadAsignaciones: number
  tiposAsignados: Array<{
    clave: string
    nombre: string
  }>
}
```

Helper:

```ts
obtenerEstadoCodigoFiltro(
  codigo: string,
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): EstadoCodigoFiltroEnBorrador
```

Comportamiento:

- compara códigos normalizados;
- incluye asignaciones con filtro existente o temporal;
- `asignado` informa uso previo, pero no deshabilita el código;
- permite presentar `Ya asignado` y la cantidad de tipos usados;
- conserva nombres de los tipos asignados para información contextual.

Ejemplo:

```text
B7577
Badge: Ya asignado
Tipos asignados: Filtro de aceite
Tipos todavía disponibles: Hidráulico, Combustible...
```

## 12. Estado derivado de cada tipo

Definir:

```ts
export interface OpcionTipoFiltroCreacion {
  referencia: TipoFiltroCreacionReference
  asignado: boolean
  disabled: boolean
  badge: "Asignado" | null
}
```

Helper:

```ts
crearOpcionesTipoFiltroCreacion(
  tipos: readonly TipoFiltroCreacionReference[],
  filtros: readonly CrearEquipoFiltroDraft[],
  excludeDraftId?: string,
): OpcionTipoFiltroCreacion[]
```

Reglas:

- si el tipo está ocupado por otra fila: `asignado: true`, `disabled: true`, `badge: "Asignado"`;
- si no está ocupado: `false`, `false`, `null`;
- en edición, el tipo actual no se marca contra sí mismo;
- no ocultar tipos ocupados: deben permanecer visibles con menor disponibilidad para explicar por qué no pueden seleccionarse;
- no depender del código buscado para bloquear el tipo, porque la regla aplica al equipo completo.

## 13. Combinación con tipos sugeridos por RPC

Los tipos posibles retornados por la búsqueda pueden contener:

```text
yaAsignadoAlEquipo
equipoFiltroActual
```

En creación, esos campos normalmente no reflejan el borrador porque la RPC se invoca sin código de equipo. La fuente de verdad para bloqueo es local.

Crear un modelo de presentación combinado:

```ts
export interface TipoFiltroBusquedaCreacion {
  tipoFiltro: CatalogoIdNombre
  tiposEquipoQueLoUsan: string[]
  sugeridoPorCodigo: boolean
  asignadoEnBorrador: boolean
  disabled: boolean
  badge: "Asignado" | null
}
```

Reglas:

- preservar contexto `tiposEquipoQueLoUsan`;
- derivar `asignadoEnBorrador` desde estado local;
- `disabled` depende del borrador, no sólo del flag remoto;
- no eliminar los tipos que no fueron sugeridos si el flujo actual permite seleccionar otro tipo del catálogo;
- ordenar primero sugeridos disponibles, luego sugeridos ocupados y después el resto, conservando estabilidad alfabética o el orden de catálogo definido;
- no seleccionar automáticamente un tipo ocupado.

## 14. Abrir búsqueda

Acción:

```ts
abrirAgregarFiltro(): boolean
```

Debe:

- funcionar únicamente antes de crear;
- estar disponible preferentemente en el paso 2;
- abrir estado `search` limpio;
- limpiar errores efímeros anteriores;
- no modificar `draft.filtros`;
- devolver `false` si existe otro overlay incompatible.

No exigir que ya exista un filtro; precisamente este flujo permite agregar el primero.

## 15. Ejecutar búsqueda

Acción asíncrona:

```ts
buscarFiltroOriginal(codigo: string): Promise<void>
```

Precondiciones:

- editor abierto en modo búsqueda;
- equipo no creado;
- código normalizado no vacío;
- no existe otra búsqueda en curso para el mismo estado.

Flujo:

1. Normalizar el código a mayúsculas.
2. Guardarlo como query del editor.
3. Limpiar resultado y error anteriores.
4. Establecer loading.
5. Llamar `buscarFiltroOriginalParaCreacion(codigo)`.
6. Ignorar respuestas obsoletas.
7. Guardar el resultado remoto sin modificarlo.
8. Derivar badges y bloqueos al consumirlo.
9. Finalizar loading.

Error:

- conservar mensaje legible en estado efímero;
- permitir reintentar;
- no cerrar overlay;
- no modificar borrador.

## 16. Carreras de búsqueda

Caso obligatorio:

```text
buscar B75 → solicitud A
buscar B7577 → solicitud B
respuesta B llega primero → se muestra B7577
respuesta A llega después → se ignora
```

Cerrar el overlay también debe invalidar cualquier respuesta pendiente.

No es obligatorio cancelar físicamente la petición.

## 17. Resultado exacto encontrado

Cuando la búsqueda retorna filtro existente:

- mostrar el código y estado de lista de compras;
- calcular si el código ya está asignado localmente;
- si está asignado, presentar badge `Ya asignado`;
- no bloquear el filtro por ese badge;
- mostrar tipos sugeridos y catálogo permitido;
- marcar tipos ocupados con badge `Asignado`;
- deshabilitar tipos ocupados;
- permitir confirmar cuando se elige un tipo disponible y cantidad válida.

Si todos los tipos permitidos están ocupados:

- el código sigue visible con badge;
- ninguna opción ocupada es seleccionable;
- el CTA de agregar queda deshabilitado;
- mostrar explicación: `Todos los tipos disponibles para este código ya están asignados al equipo.`;
- no emitir un error genérico de código duplicado.

## 18. Resultado sin coincidencia exacta

Cuando no existe el código:

- mostrar `codigoBuscado`;
- conservar `puedeCrearse`;
- combinar sugerencias remotas con códigos del borrador que coincidan;
- marcar cada sugerencia usada con `Ya asignado`;
- una sugerencia usada sigue siendo consultable si puede asociarse con otro tipo;
- no deshabilitar la sugerencia completa únicamente por estar usada;
- permitir `Crear filtro nuevo` sólo si `puedeCrearse` y el código no entra en conflicto con reglas de catálogo confirmadas.

La existencia local de un código temporal idéntico requiere tratamiento especial indicado en la siguiente sección.

## 19. Código temporal repetido

Si el usuario ya creó localmente el código `NUEVO123` y vuelve a buscarlo, la RPC puede seguir indicando que no existe en base de datos.

El frontend no debe crear una segunda referencia temporal independiente para el mismo código. Debe reutilizar la referencia ya presente en el borrador.

Implementar:

```ts
buscarReferenciaFiltroTemporalPorCodigo(
  codigo: string,
  filtros: readonly CrearEquipoFiltroDraft[],
): FiltroNuevoCreacionReference | null
```

Reglas:

- comparación por código normalizado;
- si existe una referencia temporal local, el flujo `Crear filtro nuevo` debe reutilizarla;
- conservar su `tempId` y `estaEnListaCompras` originales;
- permitir asignarla a otro tipo disponible;
- no permitir redefinir contradictoriamente `estaEnListaCompras` en una segunda asignación;
- mostrar que se trata de un código nuevo ya preparado en el borrador.

Si un código existe remotamente, usar la referencia existente retornada por RPC y no una temporal nueva.

## 20. Alta con filtro existente

Acción:

```ts
agregarFiltroExistente(
  input: AgregarFiltroExistenteCreacionInput,
): ResultadoMutacionFiltroCreacion
```

Definir resultado discriminado:

```ts
export type ResultadoMutacionFiltroCreacion =
  | { ok: true; draftId: string }
  | {
      ok: false
      codigo:
        | "EQUIPO_YA_CREADO"
        | "TIPO_FILTRO_DUPLICADO"
        | "CANTIDAD_FILTRO_INVALIDA"
        | "FILTRO_INVALIDO"
      mensaje: string
    }
```

Comportamiento:

- validar filtro, tipo y cantidad;
- bloquear si el tipo está ocupado;
- no bloquear si el mismo código o filtro ID ya está usado con otro tipo;
- generar `tmp_equipo_filtro_*` para la asignación;
- copiar referencias;
- agregar al final de `draft.filtros`;
- cerrar editor sólo después del éxito;
- limpiar errores del paso 2 que hayan quedado resueltos.

## 21. Alta de filtro temporal

Acción:

```ts
agregarFiltroTemporal(
  input: AgregarFiltroTemporalCreacionInput,
): ResultadoMutacionFiltroCreacion
```

Debe admitir:

```text
código nuevo + tipo existente
código nuevo + tipo nuevo
código existente + tipo nuevo
```

Reglas:

- código nuevo recibe `tmp_filtro_*` sólo la primera vez que aparece;
- tipo nuevo recibe `tmp_tipo_filtro_*` sólo la primera vez que se crea esa entidad conceptual;
- al reutilizar código o tipo temporal, conservar su `tempId`;
- impedir tipos nuevos equivalentes por nombre normalizado;
- permitir un mismo código temporal en tipos diferentes;
- no persistir catálogos.

Si el input ya contiene referencias temporales creadas por el formulario, la acción debe validarlas y copiarlas; no reemplazar sus IDs innecesariamente.

## 22. Creación de tipo nuevo

Helper o acción:

```ts
crearTipoFiltroTemporal(nombre: string): TipoFiltroCreacionReference | null
```

Reglas:

- normalizar nombre;
- rechazar vacío;
- si coincide con un tipo existente del catálogo, reutilizar referencia existente en vez de crear duplicado;
- si coincide con un tipo temporal ya usado en el borrador, reutilizar esa referencia;
- si es un tipo nuevo no usado, crear `tmp_tipo_filtro_*`;
- aun cuando se reutilice, si ya está asignado debe mostrarse bloqueado y no puede confirmarse en otra fila.

La decisión de reutilizar una entidad conceptual no elimina la restricción de una asignación por tipo.

## 23. Creación de código nuevo

Helper:

```ts
crearFiltroTemporal(
  codigo: string,
  estaEnListaCompras: boolean,
): FiltroNuevoCreacionReference | null
```

Reglas:

- normalizar código;
- rechazar vacío;
- si ya existe una referencia temporal local con el mismo código, devolver una copia de esa referencia;
- si el valor de `estaEnListaCompras` no coincide con el temporal existente, no crear otra entidad y devolver un conflicto tipado para que la UI explique el valor vigente;
- si no existe localmente, crear `tmp_filtro_*`;
- no asumir que el código no existe remotamente: este helper sólo se usa después de una búsqueda cuyo resultado permite creación.

## 24. Edición

Acciones:

```ts
abrirEditarFiltro(draftId: string): boolean

actualizarFiltro(
  input: EditarFiltroCreacionInput,
): ResultadoMutacionFiltroCreacion
```

Permitir editar:

- tipo de filtro;
- cantidad.

El código original y `estaEnListaCompras` representan la entidad de filtro elegida y no se cambian desde la edición de asignación. Si se necesita otro código, el usuario debe quitar la fila y agregar otra.

Reglas:

- encontrar fila por `draftId`;
- bloquear después de crear;
- excluir la fila actual al calcular ocupación;
- permitir conservar su tipo actual;
- bloquear un tipo ocupado por otra fila;
- cantidad entera mayor que cero;
- copiar referencia nueva;
- conservar `draftId` y referencia de filtro;
- no mover la fila de posición;
- cerrar editor tras éxito.

## 25. Eliminación local

Acción:

```ts
quitarFiltro(draftId: string): ResultadoMutacionFiltroCreacion
```

Reglas:

- bloquear después de crear;
- localizar fila existente;
- si sólo existe un filtro, rechazar con `FILTRO_MINIMO_REQUERIDO`;
- si hay más de uno, eliminar inmediatamente mediante un arreglo nuevo;
- limpiar referencias temporales huérfanas sólo de forma derivada; no existe un catálogo temporal separado que requiera borrado;
- limpiar error de duplicidad si queda resuelto;
- no llamar RPC;
- no ofrecer `Deshacer` como operación persistida.

La UI puede pedir confirmación si se considera necesario, pero la acción de dominio es inmediata una vez confirmada.

## 26. Regla del último filtro

La sección exige mínimo uno. Por tanto:

- con cero filtros, el CTA `Siguiente` queda bloqueado por validación;
- con un filtro, el botón eliminar debe estar deshabilitado;
- debe permanecer visible con explicación accesible `Debe existir al menos un filtro`;
- el store vuelve a comprobar la regla aunque la UI haya deshabilitado el botón;
- con dos o más filtros, quitar está permitido.

No permitir eliminar el último y luego confiar únicamente en la validación al avanzar.

## 27. Cantidades

Regla:

```text
entero >= 1
```

Helpers opcionales:

```ts
incrementarCantidadFiltro(valor: number): number
disminuirCantidadFiltro(valor: number): number
normalizarCantidadFiltro(valor: number): number | null
```

Comportamiento:

- decrementar nunca baja de 1;
- no redondear silenciosamente decimales ingresados;
- `NaN`, infinito, cero y negativos son inválidos;
- la UI posterior podrá usar botones `−/+` y entrada numérica;
- la acción final valida nuevamente.

## 28. Sugerencias combinadas

Definir un modelo neutral:

```ts
export interface SugerenciaCodigoFiltroCreacion {
  origen: "rpc" | "borrador"
  id: number | null
  codigo: string
  estaEnListaCompras: boolean
  asignado: boolean
  cantidadAsignaciones: number
}
```

Helper:

```ts
combinarSugerenciasFiltroCreacion(
  remotas: readonly FiltroOriginal[],
  filtros: readonly CrearEquipoFiltroDraft[],
  query: string,
): SugerenciaCodigoFiltroCreacion[]
```

Reglas:

- agregar referencias existentes y temporales del borrador que coincidan con query;
- deduplicar por código normalizado;
- preferir datos remotos si existe la misma entidad remotamente;
- conservar `asignado` y cantidad desde el borrador;
- no deshabilitar automáticamente sugerencias asignadas;
- al seleccionar una sugerencia asignada, realizar o reutilizar búsqueda para conocer tipos disponibles;
- ordenar de manera estable y predecible.

## 29. Cierre y descarte del editor

Acciones:

```ts
solicitarCerrarEditorFiltro(): boolean
continuarEditandoFiltro(): void
descartarEditorFiltro(): void
```

Reglas:

- si el editor no está dirty, cerrar inmediatamente;
- si está dirty, pedir confirmación local del overlay;
- no usar `window.confirm` directamente desde helpers de dominio;
- cerrar invalida búsquedas pendientes;
- descartar sólo elimina estado efímero no confirmado;
- nunca elimina filtros ya confirmados del borrador;
- la confirmación general de salida del wizard permanece separada.

## 30. Errores del editor

Los errores de búsqueda y mutación deben presentarse cerca del formulario, pero conservar contratos distintos:

- búsqueda remota: mensaje efímero del editor;
- conflicto de tipo: resultado de mutación `TIPO_FILTRO_DUPLICADO`;
- cantidad inválida: resultado `CANTIDAD_FILTRO_INVALIDA`;
- mínimo requerido: error del paso y resultado de eliminación;
- error transaccional futuro: pertenece al paso 4.

No copiar todos los errores efímeros a `validationErrors` globales si aún no se intentó avanzar.

## 31. Integración con validación del paso 2

Después de cada mutación exitosa:

- ejecutar o consultar `validarPasoFiltrosEquipo`;
- limpiar errores globales que ya no apliquen;
- no avanzar automáticamente al paso 3;
- no marcar el paso como completado;
- mantener `mayorPasoCompletado` según la máquina del SPEC-04.

Si una edición vuelve inválido un paso ya completado, conservar el progreso alcanzado pero bloquear el próximo avance hasta corregir.

## 32. Integración con el payload

Las acciones deben preservar los contratos esperados por SPEC-02:

```text
draftId               → temp_id de equipo_filtro
tipoFiltro.estado     → tipo_filtro.estado
tipoFiltro.id/tempId  → tipo_filtro.id/temp_id
filtro.estado         → filtro.estado
filtro.id/tempId      → filtro.id/temp_id
cantidad              → cantidad
```

No transformar a snake_case dentro del store.

El orden de `draft.filtros` será el orden de revisión y del payload.

## 33. Preparación para reutilizar UI de edición

Es reutilizable conceptualmente:

- formulario de búsqueda;
- selector de tipos;
- formulario de código nuevo;
- control de cantidad;
- layout drawer/bottom sheet;
- fila visual de filtro;
- iconografía por tipo.

Debe adaptarse:

- no pasar `occupiedFilterIds` como bloqueo del código;
- no deshabilitar sugerencias completas sólo por aparecer en el borrador;
- sustituir estados de eliminación persistida por eliminación local;
- mostrar badge `Ya asignado` en códigos usados;
- mostrar badge `Asignado` dentro de cada opción de tipo ocupada;
- permitir mismo filtro ID con otro tipo;
- ocultar equivalencias y estados `Activo/Nuevo/Actualizado` propios de edición cuando no aporten al flujo.

La adaptación visual posterior debe conservar la corrección responsive ya centralizada en:

```text
src/composables/engrase/useEquipoOverlayMultiselect.ts
```

Los selectores de tipo usados al buscar, crear o editar un filtro dentro de un bottom sheet deben reutilizar ese composable y el contenedor desplazable del overlay debe exponer `data-equipo-overlay-scroll`. El detalle de posicionamiento, recálculo y pruebas pertenece a `SPEC-09`; no debe duplicarse dentro de la lógica del borrador ni en cada formulario.

La implementación no debe introducir condicionales dispersos `isCreation` en todos los componentes. Preferir extraer componentes presentacionales neutrales o añadir variantes con contratos explícitos.

## 34. Accesibilidad futura que condiciona los contratos

- Un tipo ocupado permanece en la lista con `disabled` real.
- El badge `Asignado` acompaña el nombre; no depender sólo de opacidad o color.
- El código usado presenta texto `Ya asignado` accesible.
- Si todos los tipos están ocupados, existe explicación textual.
- El botón de eliminar último filtro usa `disabled` y una razón accesible.
- Loading de búsqueda debe poder anunciarse con `role="status"`.
- Errores se asocian al control correspondiente.

Este spec no escribe markup, pero sus modelos deben suministrar esos estados sin lógica duplicada en templates.

## 35. Reglas TypeScript y Vue

- TypeScript estricto.
- Prohibidos `any`, `unknown`, `as any`, `as unknown` y `Record<string, unknown>`.
- Uniones discriminadas para estado del editor y resultados de mutación.
- Helpers puros separados de acciones Pinia.
- `computed` para derivados del borrador.
- `shallowRef` para estado efímero reemplazado completamente.
- No usar watchers profundos.
- No mutar argumentos ni resultados remotos.
- No importar componentes en store o helpers.
- No agregar dependencias.
- No consultar directamente Supabase fuera del servicio del SPEC-03.

## 36. Pruebas de identidad y ocupación

Cubrir:

- tipo existente ocupado por ID;
- tipo nuevo ocupado por nombre normalizado;
- dos nombres temporales equivalentes;
- `excludeDraftId` evita autobloqueo al editar;
- mismo código no ocupa otro tipo;
- mismo filtro ID no ocupa otro tipo;
- getter de códigos usados deduplicado;
- conteo de asignaciones por código.

## 37. Pruebas de badges y opciones

Cubrir:

- código sin uso no tiene badge;
- código usado una vez muestra `Ya asignado`;
- código usado varias veces conserva cantidad y tipos;
- tipo libre disponible;
- tipo ocupado visible con `Asignado` y `disabled`;
- tipo actual editable disponible al excluir su fila;
- todos los tipos ocupados producen estado sin opción confirmable;
- flags remotos no sustituyen el bloqueo local.

## 38. Pruebas de búsqueda

Cubrir:

- código normalizado antes de servicio;
- respuesta encontrada;
- respuesta no encontrada;
- error recuperable;
- búsqueda más reciente gana;
- respuesta ignorada tras cerrar overlay;
- sugerencias combinadas remotas/locales;
- sugerencia usada sigue siendo consultable;
- código temporal local reutilizable.

## 39. Pruebas de alta

Cubrir:

- filtro y tipo existentes;
- código existente con tipo nuevo;
- código nuevo con tipo existente;
- código y tipo nuevos;
- mismo código existente agregado a dos tipos diferentes;
- mismo código temporal agregado a dos tipos diferentes conservando `tempId`;
- mismo tipo con códigos distintos rechazado;
- tipo nuevo equivalente rechazado o reutilizado y luego bloqueado;
- cantidad inválida;
- `draftId` generado con prefijo correcto;
- referencias copiadas sin mutar input;
- editor se cierra sólo tras éxito.

## 40. Pruebas de edición y eliminación

Cubrir:

- editar sólo cantidad;
- cambiar a tipo disponible;
- conservar tipo actual;
- cambiar a tipo ocupado rechazado;
- código y referencia de filtro conservados;
- orden de fila conservado;
- quitar con dos o más filtros;
- quitar último filtro rechazado;
- sin estado `pendiente_eliminacion`;
- operación bloqueada después de crear.

## 41. No hacer

- No bloquear un código completo porque ya está asignado.
- No bloquear un filtro existente por ID si se elige otro tipo.
- No permitir dos filas del mismo tipo.
- No ocultar tipos ocupados.
- No crear una segunda entidad temporal para el mismo código local.
- No persistir tipos o filtros desde el drawer.
- No buscar equivalencias.
- No usar `p_codigo_equipo` en creación.
- No usar estados operativos de edición.
- No permitir eliminar el último filtro.
- No avanzar automáticamente al confirmar un filtro.
- No crear todavía componentes ni estilos definitivos.
- No consultar ni modificar Supabase.

## 42. Criterios de aceptación

- El borrador mantiene mínimo un filtro para abandonar el paso 2.
- El mismo código puede aparecer en varias filas con tipos distintos.
- Un tipo sólo puede aparecer una vez.
- Los códigos usados quedan marcados como `Ya asignado` sin quedar globalmente bloqueados.
- Cada tipo ocupado permanece visible, muestra `Asignado` y queda deshabilitado.
- En edición, la fila no se bloquea contra sí misma.
- Códigos y tipos temporales conceptualmente iguales reutilizan sus referencias.
- Las búsquedas obsoletas no sobrescriben el estado actual.
- Agregar, editar y quitar sólo mutan el borrador local.
- El último filtro no puede eliminarse.
- La lista mantiene orden estable para revisión y payload.
- La lógica queda preparada para reutilizar los overlays existentes con contratos neutrales.
- No se realizaron escrituras parciales ni consultas directas fuera del servicio.

## 43. Resultado esperado

Al finalizar la implementación de este spec, el paso Filtros dispondrá de esta lógica completa:

```text
Buscar código
    |
    +--> encontrado
    |      ├── badge del código: Ya asignado, si corresponde
    |      ├── tipos libres: seleccionables
    |      └── tipos usados: badge Asignado + disabled
    |
    +--> no encontrado
           ├── sugerencias remotas y del borrador
           └── crear/reutilizar código temporal
                    |
                    v
Elegir tipo existente o temporal disponible
                    |
Definir cantidad >= 1
                    |
                    v
Agregar al borrador
    ├── mismo código + otro tipo: permitido
    └── mismo tipo: bloqueado
```

La persistencia seguirá reservada para `rpc_crear_equipo_completo` en el spec transaccional posterior.
