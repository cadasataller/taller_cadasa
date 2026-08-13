# SPEC-04 — Store y máquina de estados del wizard

## 1. Objetivo

Implementar el store Pinia responsable de orquestar el borrador local y la navegación del wizard de creación de equipos de Engrase durante sus cinco pasos:

1. Datos del equipo.
2. Filtros.
3. Aceites.
4. Revisar.
5. Imagen.

Este spec conecta el modelo, las validaciones y los servicios de los specs anteriores, pero todavía no ejecuta la creación transaccional ni administra imágenes. Su objetivo es establecer una única fuente de verdad para el ciclo de vida del wizard, incluyendo carga inicial, validación manual del código, pasos completados, salida segura y bloqueo de navegación una vez que el equipo ya existe.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: `CrearEquipoDraft`, factory, clonación y normalización.
- `SPEC-02-validaciones-payload-creacion.md`: validaciones por paso, vigencia del código y mapper de errores.
- `SPEC-03-contratos-mappers-servicios.md`: auxiliares, validación remota, búsqueda y servicio de creación.
- `context_ui.md`: flujo del wizard, navegación, carga, salida y estados esperados.
- `context_bd.md`: separación entre borrador, creación transaccional e imagen.
- Decisiones confirmadas:
  - el código se valida manualmente mediante un botón;
  - el botón sólo corresponde cuando el código normalizado tiene más de cuatro caracteres;
  - al cambiar el código se invalida cualquier validación anterior;
  - el usuario puede regresar haciendo clic en pasos ya completados;
  - no puede saltar a pasos futuros no completados;
  - al llegar a Imagen, los pasos 1–4 quedan bloqueados;
  - creación utilizará temporalmente el permiso `editar_filtros_engrase`;
  - debe advertirse antes de perder un borrador al salir o recargar.

## 3. Dependencias y orden

- Requiere `SPEC-01`, `SPEC-02` y `SPEC-03` implementados.
- Debe completarse antes de la lógica detallada de filtros y aceites, la creación transaccional, imagen y UI.
- No requiere componentes Vue completos ni una ruta definitiva.
- No requiere cambios en Supabase.

## 4. Alcance

Incluye:

- setup store de Pinia exclusivo de creación;
- creación y reemplazo del borrador inicial;
- carga única de auxiliares;
- estados de carga y error inicial;
- máquina de estados de los cinco pasos;
- validación del paso actual antes de avanzar;
- navegación hacia atrás;
- navegación por clic a pasos completados;
- bloqueo de pasos futuros;
- bloqueo de pasos 1–4 después de crear;
- validación manual y asíncrona del código;
- descarte de respuestas obsoletas;
- detección de borrador con contenido;
- confirmación de salida;
- estado de overlays como contrato de orquestación;
- preparación de puntos de extensión para filtros, aceites, creación e imagen;
- composable de ciclo de vida y protección de ruta;
- pruebas unitarias del store.

No incluye:

- ruta y componentes visuales definitivos;
- implementación de formularios;
- lógica completa para agregar o editar filtros;
- lógica completa para agregar o editar aceites;
- llamada a `rpc_crear_equipo_completo`;
- inserción del equipo en el store del listado;
- procesamiento o subida de imagen;
- footer o stepper visual;
- permisos de ruta, que se integrarán en el spec de UI.

## 5. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.store.ts
└── equipoEngraseCreacion.store.test.ts

src/composables/engrase/
└── useEquipoEngraseCreacionWizard.ts
```

Ampliar si hacen falta contratos públicos del wizard:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
```

No crear componentes Vue en este spec.

## 6. Regla arquitectónica

El store es la única fuente de verdad mutable del wizard.

```text
Vista futura
    |
    v
Composable de ciclo de vida
    |
    v
Store de creación
    ├── borrador
    ├── auxiliares
    ├── paso actual
    ├── progreso
    ├── validación
    ├── loading/errores
    └── overlays
        |
        v
Servicios tipados
```

Los componentes futuros reciben props y emiten eventos. No deben mutar directamente arreglos o referencias anidadas del store.

## 7. Tipo de pasos

Definir:

```ts
export type CrearEquipoPaso = 1 | 2 | 3 | 4 | 5

export const CREAR_EQUIPO_PASOS = [
  { numero: 1, clave: "datos", titulo: "Datos del equipo" },
  { numero: 2, clave: "filtros", titulo: "Filtros" },
  { numero: 3, clave: "aceites", titulo: "Aceites" },
  { numero: 4, clave: "revisar", titulo: "Revisar" },
  { numero: 5, clave: "imagen", titulo: "Imagen" },
] as const
```

Reglas:

- los números son estables y coinciden con los specs funcionales;
- no usar índices base cero como contrato público;
- la configuración es readonly;
- textos visuales pueden residir posteriormente en UI si se considera más apropiado, pero las claves y números deben permanecer centralizados;
- no representar pasos con cadenas libres dispersas.

## 8. Estado del store

El estado mínimo debe incluir:

```ts
const draft = ref<CrearEquipoDraft>(crearEquipoDraftInicial())
const auxiliares = ref<AuxiliaresEquipoEngrase | null>(null)
const pasoActual = shallowRef<CrearEquipoPaso>(1)
const mayorPasoCompletado = shallowRef<0 | 1 | 2 | 3 | 4>(0)
const loadingInicial = shallowRef(false)
const errorInicial = shallowRef<CrearEquipoError | null>(null)
const validationErrors = ref<CrearEquipoValidationIssue[]>([])
const activeOverlay = shallowRef<CrearEquipoOverlay | null>(null)
const salidaSolicitada = shallowRef(false)
```

También puede incluir identificadores internos no reactivos para descartar solicitudes obsoletas.

No incluir todavía:

- estado de creación remota;
- respuesta de resumen de creación;
- progreso de Storage;
- archivo o preview de imagen.

Esos campos se incorporarán en sus specs correspondientes.

## 9. Estado de error general

Definir un contrato simple:

```ts
export interface CrearEquipoError {
  codigo: string
  mensaje: string
}
```

El error inicial corresponde exclusivamente a la carga de auxiliares. Los errores de campos o pasos usan `CrearEquipoValidationIssue`.

No mezclar:

- error de carga inicial;
- error de validación del código;
- errores locales del formulario;
- futuro error transaccional;
- futuro error de imagen.

## 10. Overlays de orquestación

Definir inicialmente:

```ts
export type CrearEquipoOverlay =
  | "confirmar_salida"
  | "nuevo_tipo_equipo"
  | "agregar_filtro"
  | "editar_filtro"
  | "agregar_aceite"
  | "editar_aceite"
```

Si editar filtro o aceite requiere identificar una fila, preferir una unión discriminada:

```ts
export type CrearEquipoOverlayState =
  | { kind: "confirmar_salida" }
  | { kind: "nuevo_tipo_equipo" }
  | { kind: "agregar_filtro" }
  | { kind: "editar_filtro"; draftId: string }
  | { kind: "agregar_aceite" }
  | { kind: "editar_aceite"; draftId: string }
```

No mantener simultáneamente `activeOverlay` y varios IDs auxiliares que puedan contradecirlo.

La lógica interna de cada formulario se define en specs posteriores.

## 11. Carga inicial

Implementar:

```ts
cargarInicial(): Promise<void>
```

Comportamiento:

1. Si ya existen auxiliares cargados y no se solicita fuerza, no repetir la RPC.
2. Activar `loadingInicial`.
3. Limpiar `errorInicial`.
4. Ejecutar `equipoEngraseCreacionService.obtenerAuxiliaresEquipo()`.
5. Guardar una copia independiente de los auxiliares.
6. Mantener el borrador inicial existente.
7. Finalizar loading.

Si falla:

- conservar el borrador local;
- dejar `auxiliares` en `null` si nunca hubo carga exitosa;
- establecer error normalizado;
- permitir `reintentarCargaInicial()`;
- no navegar automáticamente al listado.

## 12. Carga única y reintentos

El store debe impedir solicitudes iniciales duplicadas:

- si `loadingInicial` es `true`, una segunda llamada no inicia otra solicitud;
- si ya hay auxiliares válidos, una llamada normal retorna sin consultar;
- `reintentarCargaInicial()` puede forzar una nueva llamada después de error;
- respuestas anteriores no deben reemplazar una carga más reciente.

No recargar auxiliares al cambiar de paso.

No mantener una caché global fuera del store para este spec.

## 13. Getters mínimos

Implementar con `computed`:

```text
isReady
isCreated
isDraftPhase
isImagePhase
hasActiveOverlay
hasDraftContent
canValidateCode
isValidatingCode
isCurrentCodeValidated
canGoBack
canGoNext
canOpenStep
completedSteps
```

Definiciones:

- `isReady`: auxiliares cargados y sin loading inicial.
- `isCreated`: `draft.equipoCreado !== null`.
- `isDraftPhase`: pasos 1–4 y equipo aún no creado.
- `isImagePhase`: paso 5 y equipo creado.
- `hasActiveOverlay`: existe overlay abierto.
- `canValidateCode`: más de cuatro caracteres, no loading y equipo no creado.
- `isCurrentCodeValidated`: validación válida y vigente según SPEC-02.
- `canGoBack`: depende de paso, loading y fase persistida.
- `canGoNext`: validación del paso actual exitosa y sin operación bloqueante.

Los derivados no deben almacenarse como flags mutables paralelos.

## 14. Detección de contenido del borrador

`hasDraftContent` no debe comparar contra un snapshot persistido. Debe derivarse comparando con el estado inicial conceptual.

Debe ser `true` cuando exista al menos uno:

- código no vacío;
- tipo de equipo seleccionado;
- subtipo no vacío;
- una etapa;
- estado diferente del inicial `activo`;
- un filtro;
- un aceite.

No considerar como contenido:

- auxiliares cargados;
- paso actual;
- error de validación;
- estado `idle/loading/error` de validación sin datos del formulario;
- overlay abierto.

Una validación exitosa supone necesariamente código y, por tanto, ya habrá contenido.

Después de crear, `hasDraftContent` deja de gobernar la salida porque el equipo ya es persistido.

## 15. Mutaciones de Datos del equipo

Exponer acciones explícitas:

```ts
actualizarCodigo(codigo: string): void
seleccionarTipoEquipo(tipo: TipoEquipoCreacionReference): void
limpiarTipoEquipo(): void
actualizarSubtipo(subtipo: string): void
actualizarEstado(estado: EquipoEstado): void
agregarEtapa(etapaId: number): void
quitarEtapa(etapaId: number): void
crearYSeleccionarTipoEquipo(nombre: string): boolean
```

Reglas:

- sólo funcionan antes de crear;
- obtienen etapas existentes desde `auxiliares`;
- no duplican etapas;
- no permiten crear etapas;
- no bloquean todavía la eliminación de la última etapa mediante la acción; la validación detecta vacío y la UI puede prevenirlo;
- el nombre del tipo nuevo se normaliza;
- un tipo nuevo recibe `tempId` del helper compartido;
- no crear tipos duplicados por nombre normalizado.

No mutar objetos recibidos como parámetros. Copiar las referencias seleccionadas.

## 16. Cambio de código e invalidación

`actualizarCodigo` debe:

1. almacenar el texto editable según la política definida en SPEC-01;
2. comparar el código normalizado anterior con el nuevo;
3. si cambió, reemplazar `validacionCodigo` por `{ estado: "idle" }`;
4. limpiar errores locales asociados al código;
5. invalidar lógicamente cualquier solicitud anterior.

No conservar un check verde si el usuario modifica un carácter.

No iniciar validación automáticamente.

## 17. Validación manual del código

Implementar:

```ts
validarCodigoActual(): Promise<void>
```

Precondiciones:

- equipo no creado;
- código normalizado con más de cuatro caracteres;
- no hay validación en curso;
- auxiliares y wizard disponibles.

Flujo:

1. Capturar el código normalizado actual.
2. Incrementar identificador de solicitud.
3. Guardar `{ estado: "loading", codigo }`.
4. Llamar `validarCodigoEquipoParaCreacion(codigo)`.
5. Ignorar respuesta si cambió el código o existe una solicitud posterior.
6. Si `puedeCrearse`, guardar `{ estado: "valido", codigo }`.
7. Si no puede crearse, guardar modelo y activo en estado `invalido`.
8. Si falla, guardar `{ estado: "error", codigo, mensaje }`.

No lanzar al componente errores funcionales esperados. El estado discriminado debe representar el resultado.

## 18. Carreras de validación

Caso obligatorio:

```text
usuario valida 410003
    |
    +--> solicitud A en curso
usuario cambia a 410003A
    |
    +--> validación vuelve a idle
respuesta A llega
    |
    └--> se ignora
```

También ignorar una respuesta si el usuario valida dos veces secuencialmente y la primera termina después.

No es obligatorio cancelar físicamente la petición; basta cancelación lógica mediante ID y comparación de código.

## 19. Validación de pasos

Crear una función de store o helper:

```ts
validarPaso(paso: CrearEquipoPaso): CrearEquipoValidationResult
```

Correspondencia:

- paso 1 → `validarPasoDatosEquipo`;
- paso 2 → `validarPasoFiltrosEquipo`;
- paso 3 → `validarPasoAceitesEquipo`;
- paso 4 → `validarCreacionEquipoCompleta`;
- paso 5 → sin validación del borrador previo; el equipo ya debe existir.

La función no cambia el paso. Las acciones de navegación deciden cuándo guardar errores.

## 20. Definición de paso completado

Un paso se considera completado cuando el usuario avanza exitosamente desde él, no sólo porque sus datos sean accidentalmente válidos.

Ejemplo:

```text
Paso 1 válido pero usuario no pulsa Siguiente
→ paso 1 todavía no está completado para navegación
```

`mayorPasoCompletado` representa progreso secuencial confirmado:

- `0`: ninguno;
- `1`: Datos completado;
- `2`: Filtros completado;
- `3`: Aceites completado;
- `4`: equipo creado y Revisión completada.

No puede disminuir durante la fase borrador por regresar a un paso anterior. Si el usuario modifica un paso previamente completado y lo vuelve inválido, el progreso visual puede conservarse como visitado/completado histórico, pero no podrá avanzar de nuevo hasta corregirlo. La UI debe señalar errores sin borrar arbitrariamente todo el progreso.

## 21. Avanzar

Implementar:

```ts
avanzar(): boolean
```

Para pasos 1–3:

1. Rechazar si hay overlay o loading bloqueante.
2. Validar paso actual.
3. Guardar errores.
4. Si es inválido, permanecer en el paso y devolver `false`.
5. Si es válido, actualizar `mayorPasoCompletado`.
6. Ir al paso siguiente.
7. Limpiar errores que ya no correspondan.
8. Devolver `true`.

En paso 4, `avanzar()` no crea el equipo. Debe rechazar o delegar a una acción futura claramente separada. El CTA `Crear equipo` no debe confundirse con navegación normal.

En paso 5 no existe `Siguiente`.

## 22. Retroceder

Implementar:

```ts
retroceder(): boolean
```

Reglas:

- paso 1: no retrocede; la acción secundaria es Cancelar/Salir;
- pasos 2–4: retrocede un paso sin exigir validación;
- paso 5: siempre devuelve `false`;
- después de crear, nunca navega a pasos 1–4;
- rechazar mientras exista una futura operación transaccional o de imagen bloqueante; los flags se ampliarán en specs posteriores.

No borrar datos al retroceder.

## 23. Navegación por clic en el stepper

Implementar:

```ts
puedeAbrirPaso(paso: CrearEquipoPaso): boolean
irAPaso(paso: CrearEquipoPaso): boolean
```

Antes de crear:

- el paso actual es accesible;
- cualquier paso `<= mayorPasoCompletado` es accesible;
- el siguiente paso ya alcanzado por avance también debe poder reabrirse;
- los pasos futuros no completados no son accesibles;
- Imagen no es accesible.

Para evitar ambigüedad entre completado y alcanzado, puede derivarse:

```ts
const mayorPasoAccesible = Math.min(mayorPasoCompletado + 1, 4)
```

Así, después de completar Datos y entrar a Filtros:

```text
Datos   → accesible y completado
Filtros → accesible y actual
Aceites → bloqueado
Revisar → bloqueado
Imagen  → bloqueado
```

Después de crear:

- sólo paso 5 es accesible;
- pasos 1–4 se muestran completados pero no responden a clic;
- no existe acción para “descrear” o volver a editar el borrador.

`irAPaso` no valida el paso que se abandona cuando se navega hacia atrás. Para ir hacia delante sólo permite pasos ya alcanzados; nunca completa pasos por sí misma.

## 24. Entrada irreversible al paso Imagen

Este spec debe definir una acción interna o pública que usará el spec transaccional:

```ts
registrarEquipoCreado(equipo: EquipoEngraseListItem): void
```

Comportamiento:

1. Rechazar o ignorar si ya existe `equipoCreado`.
2. Copiar el objeto recibido sin compartir etapas mutables.
3. Asignar `draft.equipoCreado`.
4. Establecer `mayorPasoCompletado = 4`.
5. Establecer `pasoActual = 5`.
6. Limpiar errores de pasos 1–4.
7. Cerrar overlays del borrador.
8. Invalidar solicitudes de validación pendientes.

Esta acción no ejecuta la RPC ni actualiza el listado. Es una transición de estado que se invocará únicamente después del éxito transaccional.

Una vez aplicada:

- mutaciones de datos, filtros y aceites quedan bloqueadas;
- `retroceder()` queda bloqueado;
- `irAPaso(1..4)` queda bloqueado;
- salir no muestra advertencia por “cancelar creación”, porque el equipo ya existe;
- omitir imagen o finalizar serán acciones posteriores.

## 25. Errores y enfoque posterior

El store conserva:

```ts
validationErrors: CrearEquipoValidationIssue[]
```

Acciones mínimas:

```ts
limpiarErrores(): void
limpiarErroresDeCampo(fieldId: string): void
establecerErrores(errores: CrearEquipoValidationIssue[]): void
```

El store no consulta el DOM ni enfoca campos. El composable o la UI futura podrán usar `fieldId` después de renderizar.

No crear watchers profundos para limpiar errores. Cada acción de mutación limpia de forma explícita sólo los errores afectados.

## 26. Salida segura

Implementar:

```ts
solicitarSalida(): boolean
continuarCreando(): void
confirmarDescarte(): void
```

Antes de crear:

- si no hay contenido, `solicitarSalida()` devuelve `true`;
- si hay contenido, abre `confirmar_salida` y devuelve `false`;
- si existe operación bloqueante, devuelve `false` sin abrir una segunda confirmación.

Después de crear:

- `solicitarSalida()` devuelve `true` si no hay una futura operación de imagen en curso;
- no mostrar “Descartar creación” porque ya no existe un borrador cancelable.

`confirmarDescarte()` debe:

- reemplazar el borrador mediante `crearEquipoDraftInicial()`;
- regresar al paso 1;
- reiniciar progreso;
- limpiar validaciones y overlays;
- conservar auxiliares cargados para evitar otra RPC al permanecer en la misma sesión;
- invalidar solicitudes activas.

La navegación real al listado pertenece al composable/router posterior.

## 27. Protección de recarga y navegación

`useEquipoEngraseCreacionWizard` debe coordinar:

- `beforeunload` mientras exista borrador local no persistido;
- `onBeforeRouteLeave` usando `solicitarSalida()`;
- limpieza de listeners al desmontar;
- retorno al listado después de confirmación;
- reintento de carga inicial;
- foco posterior en el primer error como responsabilidad de UI/composable, no del store.

Condición de `beforeunload`:

```text
hasDraftContent && !isCreated
```

No bloquear recarga sólo por:

- auxiliares cargados;
- error inicial;
- paso visitado;
- equipo ya creado sin imagen.

## 28. Reset y desmontaje

Implementar dos conceptos distintos:

```ts
reiniciarBorrador(): void
resetCompleto(): void
```

`reiniciarBorrador`:

- crea un borrador nuevo;
- regresa a paso 1;
- limpia progreso, errores y overlays;
- conserva auxiliares.

`resetCompleto`:

- además elimina auxiliares;
- limpia loading y error inicial;
- invalida solicitudes;
- deja el store como recién creado.

El composable no debe ejecutar `resetCompleto` automáticamente al desmontar si eso pudiera borrar el borrador antes de resolver una navegación interceptada. La política final de desmontaje debe probarse con router.

## 29. Preparación para filtros y aceites

El store puede exponer contratos o placeholders tipados para que specs posteriores agreguen acciones, pero no debe implementar parcialmente reglas complejas.

Getters útiles que pueden existir desde este spec:

```text
filtersCount
oilsCount
stagesCount
```

Los specs siguientes agregarán:

- tipos ocupados;
- códigos usados;
- badges derivados;
- agregar/editar/quitar filtro;
- agregar/editar/quitar aceite;
- conflictos locales.

No almacenar contadores manuales; derivarlos de los arreglos.

## 30. Preparación para creación transaccional

El store no llama todavía `crearEquipoCompleto`, pero debe dejar claras las fronteras futuras:

```text
validarCreacionEquipoCompleta(draft)
construirPayloadCrearEquipo(draft)
equipoEngraseCreacionService.crearEquipoCompleto(argumento)
registrarEquipoCreado(respuesta.equipoLista)
```

No agregar un `guardar()` vacío o simulado. La acción transaccional se especificará completa en un spec posterior, incluyendo bloqueo del primer submit y actualización del listado.

## 31. Reglas Vue y Pinia

- Usar setup store con `defineStore`.
- Usar `storeToRefs()` en el composable y consumidores futuros.
- Usar `shallowRef` para primitivos y estados discriminados reemplazados completamente.
- Usar `ref` para el borrador y auxiliares anidados.
- Usar `computed` para derivados.
- Evitar watchers para derivar flags que pueden ser `computed`.
- Los watchers sólo se justifican para side effects de ruta o ciclo de vida y deben vivir en el composable.
- No mutar estado desde componentes fuera de acciones públicas.
- No usar `reactive` y luego destructurarlo sin `toRefs`.
- No importar componentes en el store.
- Está prohibido usar `any`, `unknown`, `as any`, `as unknown` o `Record<string, unknown>`.

## 32. Pruebas del estado inicial

Cubrir:

- borrador producido por factory;
- paso actual 1;
- progreso 0;
- auxiliares nulos;
- sin errores ni overlay;
- `isCreated` falso;
- `hasDraftContent` falso;
- Imagen inaccesible;
- contadores en cero.

## 33. Pruebas de carga

Cubrir:

- carga exitosa de auxiliares;
- una única llamada aunque `cargarInicial()` se invoque dos veces;
- segunda llamada ignorada durante loading;
- no recarga si ya hay auxiliares;
- error inicial conservando borrador;
- reintento exitoso;
- respuesta obsoleta ignorada;
- `isReady` correcto.

## 34. Pruebas de código

Cubrir:

- cuatro caracteres no habilitan validación;
- cinco caracteres sí la habilitan;
- botón lógico deshabilitado durante loading;
- llamada manual con código normalizado;
- respuesta disponible produce estado `valido`;
- respuesta ocupada conserva modelo y activo;
- fallo produce estado `error`;
- cambio del campo devuelve estado a `idle`;
- respuesta antigua ignorada tras cambiar código;
- respuesta de una solicitud anterior ignorada;
- equipo creado bloquea validación.

## 35. Pruebas de navegación

Cubrir:

- no avanzar con paso 1 inválido;
- avanzar de Datos a Filtros con validación vigente;
- paso completado registrado al avanzar;
- no saltar desde Datos a Aceites;
- volver de Filtros a Datos sin perder borrador;
- clic en Datos desde Filtros permitido;
- volver a Filtros después de haberlo alcanzado;
- no acceder a Revisar antes de completar pasos anteriores;
- Aceites vacío permite avanzar a Revisar;
- paso 4 no usa `avanzar()` para crear;
- Imagen inaccesible antes de creación.

## 36. Pruebas de transición a Imagen

Cubrir:

- `registrarEquipoCreado` copia el equipo;
- entra automáticamente al paso 5;
- marca pasos 1–4 completados;
- bloquea clic en pasos 1–4;
- bloquea retroceso;
- bloquea mutaciones de datos;
- cierra overlays;
- invalida validación pendiente;
- segunda transición no reemplaza silenciosamente el equipo creado.

## 37. Pruebas de salida y reset

Cubrir:

- salida directa con borrador vacío;
- confirmación con código, tipo, subtipo, etapa, filtro o aceite cargado;
- continuar conserva borrador;
- descartar crea un grafo nuevo;
- descartar conserva auxiliares;
- reset completo elimina auxiliares;
- `beforeunload` sólo con borrador no persistido;
- equipo ya creado no muestra confirmación de descarte;
- listeners eliminados al desmontar.

## 38. No hacer

- No implementar navegación con tabs.
- No permitir clic en pasos futuros.
- No permitir volver desde Imagen.
- No validar código automáticamente al escribir.
- No conservar una validación después de cambiar el código.
- No recargar auxiliares por paso.
- No comparar el borrador con un snapshot ficticio de edición.
- No usar `EquipoEdicionDraft` como estado del store.
- No ejecutar la creación transaccional en este spec.
- No insertar el equipo en el listado.
- No administrar imágenes.
- No consultar ni modificar Supabase.

## 39. Criterios de aceptación

- Existe un store Pinia exclusivo de creación.
- El borrador del SPEC-01 es su única fuente de verdad de dominio.
- Los auxiliares se cargan una vez y pueden reintentarse.
- La validación de código sólo ocurre por acción manual.
- Más de cuatro caracteres habilitan conceptualmente la validación.
- Cambiar el código invalida inmediatamente el resultado anterior.
- Las respuestas asíncronas obsoletas no alteran el borrador.
- Los pasos se completan al avanzar exitosamente.
- El usuario puede abrir pasos ya completados o alcanzados mediante el stepper.
- No puede saltar a pasos futuros.
- La entrada a Imagen requiere un equipo creado.
- Al entrar a Imagen, pasos 1–4 quedan bloqueados definitivamente.
- La salida protege borradores no persistidos.
- El descarte reinicia el borrador sin recargar auxiliares.
- No se implementó aún creación remota ni imagen.
- El store no contiene lógica DOM o visual.

## 40. Resultado esperado

Al finalizar la implementación de este spec existirá esta máquina de estados:

```text
INICIALIZANDO
    |
    +--> ERROR_CARGA ──> REINTENTAR
    |
    v
PASO 1 DATOS
    |  validar código manualmente
    |  validar paso
    v
PASO 2 FILTROS
    |  validar mínimo y consistencia
    v
PASO 3 ACEITES
    |  opcional
    v
PASO 4 REVISAR
    |  espera spec transaccional
    v
PASO 5 IMAGEN
    └── equipo ya creado; pasos anteriores bloqueados
```

El store estará preparado para que los siguientes specs añadan la lógica detallada de filtros, aceites, creación transaccional e imagen sin redefinir navegación, ciclo de vida ni validación del código.
