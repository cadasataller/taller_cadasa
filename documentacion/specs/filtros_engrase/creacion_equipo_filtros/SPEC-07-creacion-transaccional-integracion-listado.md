# SPEC-07 — Creación transaccional e integración con el listado

## 1. Objetivo

Implementar el momento transaccional e irreversible del wizard: validar nuevamente el borrador completo, construir el payload, bloquear el primer submit, ejecutar `engrase.rpc_crear_equipo_completo`, insertar directamente `equipo_lista` en el store local del listado y trasladar el flujo al paso 5 — Imagen.

Este spec completa la creación de los pasos 1–4. Si la RPC falla, el borrador debe permanecer íntegro y editable. Si tiene éxito, no puede repetirse la creación ni regresar a los pasos anteriores.

La administración física y lógica de la imagen continúa fuera de alcance y se implementará en `SPEC-08`.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: borrador y `equipoCreado`.
- `SPEC-02-validaciones-payload-creacion.md`: validación integral, payload y errores por paso.
- `SPEC-03-contratos-mappers-servicios.md`: `crearEquipoCompleto` y respuesta tipada.
- `SPEC-04-store-maquina-estados-wizard.md`: pasos, progreso y transición `registrarEquipoCreado`.
- `SPEC-05-logica-filtros-borrador.md`: filtros locales definitivos.
- `SPEC-06-logica-aceites-borrador.md`: aceites locales definitivos.
- `context_ui.md`: bloqueo de navegación, actualización directa del store y paso Imagen.
- `context_bd.md`: transacción única y forma de `equipo_lista`.
- Decisiones confirmadas:
  - la creación se bloquea desde el primer submit para impedir solicitudes duplicadas;
  - al llegar a Imagen, los pasos 1–4 quedan bloqueados;
  - el permiso de creación será temporalmente `editar_filtros_engrase` y se integrará en el spec de UI/ruta.

## 3. Dependencias y orden

- Requiere `SPEC-01` a `SPEC-06` implementados.
- Debe completarse antes de imagen y UI integral.
- No requiere cambios en Supabase, RPC o migraciones.
- No debe implementarse parcialmente antes de que validación, servicios, filtros y aceites estén disponibles.

## 4. Alcance

Incluye:

- estado transaccional de creación;
- bloqueo sincrónico del primer submit;
- validación integral inmediatamente antes de llamar la RPC;
- construcción segura del argumento;
- ejecución única de `crearEquipoCompleto`;
- tratamiento de éxito y error;
- conservación íntegra del borrador ante fallo;
- mapeo de errores RPC a pasos y secciones;
- actualización directa del store de equipos;
- reconciliación local mínima de catálogos del listado cuando sea necesaria;
- transición del wizard al paso Imagen;
- bloqueo irreversible de datos, filtros y aceites;
- resumen de la operación creada;
- pruebas de concurrencia, integración e inmutabilidad.

No incluye:

- subida o procesamiento de imagen;
- llamada a `rpc_administrar_imagen_equipo`;
- UI del paso Revisión;
- UI del banner de éxito;
- footer o stepper visual;
- ruta y permiso;
- navegación final al listado;
- recarga remota del listado o detalle.

## 5. Archivos previstos

Modificar:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.store.ts
├── equipoEngraseCreacion.store.test.ts
└── equipoEngraseCreacion.types.ts

src/stores/dbequipos/engrase/
├── filtrosEngrase.store.ts
└── filtrosEngrase.store.test.ts
```

Crear pruebas de integración lógica si ayudan a mantener responsabilidades claras:

```text
src/stores/dbequipos/engrase/creacion/
└── equipoEngraseCreacion.submit.test.ts
```

No crear componentes Vue en este spec.

## 6. Principio transaccional

La única escritura remota de los pasos 1–4 es:

```text
engrase.rpc_crear_equipo_completo
```

Está prohibido realizar antes o durante el submit escrituras separadas para:

- equipo;
- tipo de equipo;
- etapas;
- filtros;
- tipos de filtro;
- códigos de filtro;
- aceites;
- sistemas de aceite.

Si la RPC falla, ninguna capa frontend debe intentar “deshacer” escrituras parciales. La atomicidad corresponde a la RPC.

## 7. Estado transaccional del store

Agregar:

```ts
export type CrearEquipoSubmitState =
  | { kind: "idle" }
  | { kind: "creating" }
  | {
      kind: "error"
      codigo: string
      mensaje: string
    }
  | {
      kind: "success"
      mensaje: string
      resumen: ResumenOperacionesCreacionEquipo
    }
```

Estado:

```ts
const submitState = shallowRef<CrearEquipoSubmitState>({ kind: "idle" })
```

No mantener además flags mutables independientes como:

```text
creating
created
submitError
submitSuccess
```

Derivarlos con `computed` desde `submitState` y `draft.equipoCreado`.

## 8. Getters transaccionales

Agregar:

```text
isCreating
hasCreateError
createError
creationSummary
canSubmitCreation
isInteractionLocked
```

Definiciones:

- `isCreating`: `submitState.kind === "creating"`.
- `hasCreateError`: `submitState.kind === "error"`.
- `createError`: código y mensaje sólo en error.
- `creationSummary`: resumen sólo en success.
- `canSubmitCreation`: paso 4, equipo no creado, estado no creating, sin overlay y borrador integral válido.
- `isInteractionLocked`: true durante creación y después de éxito para controles de pasos 1–4.

No ejecutar validaciones costosas dentro del template. El getter puede usar el helper puro del SPEC-02.

## 9. Contrato de resultado del submit

Definir:

```ts
export type ResultadoCrearEquipoSubmit =
  | {
      kind: "success"
      respuesta: CrearEquipoCompletoRespuesta
    }
  | { kind: "invalid"; errores: CrearEquipoValidationIssue[] }
  | { kind: "busy" }
  | { kind: "already_created" }
  | { kind: "error"; error: CrearEquipoError }
```

La acción no debe depender de inspeccionar `submitState` desde la UI para saber su resultado inmediato.

## 10. Acción principal

Implementar:

```ts
crearEquipo(): Promise<ResultadoCrearEquipoSubmit>
```

Precondiciones:

- `pasoActual === 4`;
- `draft.equipoCreado === null`;
- auxiliares cargados;
- sin overlay incompatible;
- no existe creación en curso.

Si no está en el paso 4, retornar `invalid` con error general o un resultado tipado específico. No ejecutar la RPC silenciosamente desde otro paso.

## 11. Bloqueo desde el primer submit

El bloqueo debe establecerse sincrónicamente antes del primer `await`:

```text
clic Crear equipo
    |
    +--> comprobar guards
    +--> submitState = creating
    +--> desde aquí segundo clic retorna busy
    |
    v
validar / construir / RPC
```

Aunque el botón futuro use `disabled`, el store debe protegerse por sí mismo.

Durante `creating` quedan bloqueados:

- nuevos submits;
- avanzar o retroceder;
- clics del stepper;
- mutaciones de datos;
- alta/edición/eliminación de filtros;
- alta/edición/eliminación de aceites;
- apertura de overlays;
- cancelación o salida normal.

No depender de un retraso visual para activar el bloqueo.

## 12. Orden interno del submit

Una vez superados los guards:

1. Establecer `submitState = { kind: "creating" }`.
2. Limpiar errores transaccionales anteriores.
3. Ejecutar `validarCreacionEquipoCompleta(draft)`.
4. Si es inválido:
   - guardar `validationErrors`;
   - regresar al estado `idle`;
   - devolver `invalid`;
   - no llamar servicio.
5. Ejecutar `construirPayloadCrearEquipo(draft)`.
6. Si inesperadamente falla:
   - tratarlo como `invalid`;
   - no llamar servicio.
7. Capturar una copia estable del argumento o borrador necesario para diagnóstico.
8. Ejecutar `equipoEngraseCreacionService.crearEquipoCompleto(argumento)`.
9. Procesar éxito o error.

La validación se repite en el submit aunque el paso Revisión se haya abierto con un borrador válido.

## 13. Validación obsoleta del código

Antes de crear debe seguir siendo obligatorio:

```text
validacionCodigo.estado === valido
y
validacionCodigo.codigo === código actual normalizado
```

Si no coincide:

- no ejecutar RPC;
- volver `submitState` a `idle`;
- guardar error del paso 1;
- mantener al usuario en Revisión o permitir que la UI lo lleve al paso 1 mediante el error;
- no revalidar automáticamente el código.

## 14. Snapshot para la solicitud

El servicio recibe un argumento nuevo construido por SPEC-02. No recibe referencias vivas al formulario.

Una vez en `creating`, las acciones del store ya están bloqueadas. Aun así:

- el argumento no debe compartir referencias mutables con el borrador;
- el servicio no debe mutarlo;
- el payload enviado corresponde exactamente al estado validado;
- no observar cambios tardíos mediante watchers.

## 15. Éxito remoto

Al recibir `CrearEquipoCompletoRespuesta`:

1. Comprobar que todavía no existe otro equipo registrado en el wizard.
2. Aplicar `respuesta.equipoLista` al store del listado.
3. Reconciliar catálogos locales mínimos del listado si corresponde.
4. Ejecutar `registrarEquipoCreado(respuesta.equipoLista)`.
5. Guardar `submitState = { kind: "success", mensaje, resumen }`.
6. Limpiar errores de validación y creación.
7. Mantener el borrador disponible sólo como referencia de revisión interna, pero congelado funcionalmente.
8. Entrar automáticamente al paso 5.

No navegar al listado todavía.

## 16. Integración con el store del listado

El store existente ya dispone conceptualmente de:

```ts
aplicarEquipoActualizado(equipo: EquipoEngraseListItem): void
```

Como esa acción inserta el equipo si su ID no existe, puede reutilizarse o exponerse mediante un nombre neutral:

```ts
aplicarEquipoLista(equipo: EquipoEngraseListItem): void
```

También puede añadirse una acción semántica:

```ts
aplicarEquipoCreado(equipo: EquipoEngraseListItem): void
```

La acción debe:

- buscar por ID;
- como defensa adicional, comprobar conflicto por código normalizado;
- insertar una copia del equipo y sus etapas;
- no duplicar si ya fue aplicada la misma respuesta;
- mantener estable la selección actual salvo que producto defina seleccionar el nuevo equipo al finalizar;
- no realizar llamadas remotas.

## 17. Conflicto local inesperado en el listado

La RPC es autoridad sobre la creación. Si al aplicar la respuesta ya existe:

- el mismo ID: reemplazar con la respuesta confirmada;
- el mismo código y distinto ID: no insertar un duplicado silencioso.

En el segundo caso:

- registrar un error de integración controlado;
- conservar `equipoCreado` porque la RPC ya tuvo éxito;
- entrar igualmente al paso Imagen usando la respuesta;
- no repetir la RPC;
- permitir que una recarga futura del listado resuelva la inconsistencia si fuera necesario.

Nunca transformar un fallo local posterior al éxito remoto en “el equipo no fue creado”.

## 18. Reconciliación local de tipo y etapas

`equipo_lista` incluye tipo de equipo y etapas.

Después de insertar:

- si `tiposEquipo` del listado ya contiene `tipo_equipo_id`, no cambiarlo;
- si se creó un tipo nuevo y no existe localmente, agregar `{ id, nombre }` sin consulta remota;
- no duplicar por ID ni por nombre normalizado;
- las etapas sólo pueden ser existentes y deberían estar cargadas; si falta una etapa devuelta, puede reconciliarse localmente por ID/nombre sin consultar;
- no actualizar catálogos de filtros, sistemas o aceites desde `equipo_lista`, porque la respuesta no contiene esos IDs resueltos.

Esta reconciliación evita que un equipo con tipo nuevo aparezca en la lista pero falte en controles locales de tipo.

No contradice la regla de insertar directamente `equipo_lista`: no se vuelve a consultar la lista ni los catálogos.

## 19. Detalles y cachés

Un equipo recién creado no debe tener un detalle viejo cacheado. La integración puede:

- asegurar que no existan entradas previas bajo el nuevo ID;
- no cargar filtros o aceites inmediatamente;
- no seleccionar el equipo automáticamente durante el paso Imagen;
- dejar la carga de detalle para cuando el usuario regrese y lo seleccione.

No llamar:

```text
rpc_obtener_equipos_lista
rpc_obtener_filtros_equipo
rpc_obtener_aceites_equipo
```

después de crear.

## 20. Transición al paso Imagen

La transición usa la acción definida por SPEC-04:

```ts
registrarEquipoCreado(respuesta.equipoLista)
```

Resultado obligatorio:

- `draft.equipoCreado` contiene una copia del registro;
- `pasoActual === 5`;
- `mayorPasoCompletado === 4`;
- pasos 1–4 se muestran completados;
- pasos 1–4 no son clicables;
- `retroceder()` está bloqueado;
- datos, filtros y aceites ya no son mutables;
- el header futuro cambia de `Borrador` a `Creado`;
- la imagen sigue siendo opcional.

## 21. Resumen de operaciones

Conservar:

```ts
ResumenOperacionesCreacionEquipo {
  etapasAgregadas
  filtrosAgregados
  aceitesAgregados
}
```

Usos posteriores:

- verificación interna;
- banner o mensaje de éxito si producto lo requiere;
- pruebas de coherencia.

No usar el resumen para reconstruir el equipo ni para reemplazar el borrador.

Puede verificarse de forma no destructiva:

```text
etapasAgregadas esperado = draft.datos.etapas.length
filtrosAgregados esperado = draft.filtros.length
aceitesAgregados esperado = draft.aceites.length
```

Si los conteos difieren:

- no repetir RPC;
- no revertir creación;
- conservar respuesta exitosa;
- opcionalmente registrar una advertencia diagnóstica no bloqueante.

## 22. Error remoto

Si el servicio lanza `ErrorCreacionEquipo`:

1. Extraer código y mensaje.
2. Ejecutar `mapearErrorRpcCreacionEquipo(codigo)`.
3. Guardar el issue en `validationErrors`.
4. Guardar `submitState = { kind: "error", codigo, mensaje amigable }`.
5. Conservar el borrador completo.
6. Mantener `equipoCreado === null`.
7. Permanecer en paso 4 inicialmente.
8. Desbloquear interacción para corregir y reintentar.

La UI futura puede usar `issue.paso` para ofrecer o ejecutar navegación al paso afectado.

No borrar tipos, filtros o aceites temporales.

## 23. Error de código ocupado durante el submit

Aunque el código haya sido validado antes, otra sesión puede crear el equipo antes del submit. Si la RPC responde:

```text
EQUIPO_YA_EXISTE_EN_ENGRASE
```

el store debe:

- conservar borrador;
- cambiar `validacionCodigo` a un estado que ya no sea válido, preferentemente `invalido` si no existen modelo/activo o `idle` si el contrato local exige esos datos;
- asociar error al paso 1 y campo código;
- permitir volver a Datos;
- exigir una nueva validación después de cambiar código;
- no reintentar automáticamente.

No asumir que una validación previa garantiza disponibilidad indefinida.

## 24. Error de catálogo obsoleto

Si la RPC retorna que ya no existe una entidad seleccionada:

```text
TIPO_EQUIPO_NO_EXISTE
ETAPA_NO_EXISTE
TIPO_FILTRO_NO_EXISTE
FILTRO_NO_EXISTE
ACEITE_NO_EXISTE
SISTEMA_ACEITE_NO_EXISTE
```

el store debe:

- conservar referencias del borrador para mostrar qué falló;
- mapear al paso correspondiente;
- no borrar silenciosamente la selección;
- permitir corrección manual;
- no recargar automáticamente todos los auxiliares durante el submit;
- ofrecer reintento de auxiliares en una acción posterior si la UI lo necesita.

## 25. Error desconocido

Un código no reconocido:

- se presenta como error general del paso 4;
- usa mensaje amigable genérico;
- conserva código técnico en estado para diagnóstico;
- desbloquea reintento;
- no cambia de paso automáticamente;
- no borra borrador.

## 26. Reintento

Después de error:

- el usuario puede editar cualquier paso accesible;
- modificar campos limpia sólo errores relacionados;
- al volver a Revisión puede enviar nuevamente;
- el nuevo submit repite validación y reconstruye payload;
- `submitState` pasa sincrónicamente a `creating`;
- no reutilizar el payload fallido si el borrador cambió.

No crear una acción que reenvíe ciegamente el último argumento.

## 27. Salida durante creación

Mientras `isCreating`:

- `solicitarSalida()` devuelve `false`;
- no abrir confirmación de descarte encima del loading;
- `beforeunload` continúa protegiendo la página;
- router leave queda bloqueado;
- no cancelar lógicamente el submit para permitir editar otra versión del borrador.

El componente futuro debe mostrar `Creando equipo…` y deshabilitar acciones.

## 28. Salida después del éxito

Después de éxito:

- el equipo ya existe;
- abandonar el wizard no descarta ni revierte la creación;
- puede permitirse salida si no hay operación de imagen en curso;
- el usuario permanece inicialmente en Imagen para elegir `Omitir por ahora` o `Finalizar`;
- no mostrar confirmación `Descartar creación`;
- no ejecutar automáticamente otra RPC.

## 29. Reinicio después del éxito

No ejecutar `reiniciarBorrador()` mientras el usuario se encuentre en paso Imagen.

El borrador y `equipoCreado` sólo se limpian cuando un flujo posterior:

- finaliza y navega al listado;
- omite la imagen y navega;
- inicia explícitamente otra creación después de terminar.

Nunca reiniciar antes de que el paso Imagen disponga del código e ID creados.

## 30. Idempotencia frontend

Protecciones mínimas:

- segundo submit durante `creating` retorna `busy`;
- submit después de éxito retorna `already_created`;
- aplicar dos veces el mismo `equipoLista` no duplica el listado;
- `registrarEquipoCreado` no reemplaza un equipo ya registrado;
- error permite un nuevo intento explícito;
- callbacks tardíos de un intento anterior no deben sobrescribir un éxito posterior.

Puede usarse un identificador interno de intento además del guard `creating` para proteger tests y futuros cambios.

## 31. Orden de actualización en éxito

Orden recomendado:

```text
respuesta RPC válida
    |
    +--> aplicar equipo al listado
    +--> registrar equipo creado en wizard
    +--> guardar resumen/mensaje success
    └--> renderizar paso Imagen
```

La transición a Imagen no debe ocurrir antes de disponer de `equipoLista`.

Si la actualización local del listado produce un error inesperado después del éxito remoto:

- registrar de todos modos el equipo creado en el wizard;
- no repetir RPC;
- conservar un estado de integración parcial recuperable;
- permitir paso Imagen;
- informar que el equipo fue creado aunque la lista local necesite sincronización.

## 32. Estado parcial de integración

Para representar correctamente un éxito remoto con fallo local opcional, puede ampliarse:

```ts
export type CrearEquipoSubmitState =
  | ...
  | {
      kind: "success_with_local_warning"
      mensaje: string
      warning: string
      resumen: ResumenOperacionesCreacionEquipo
    }
```

Usarlo sólo si la acción del listado puede fallar realmente. Si la integración local es sincrónica y controlada, evitar complejidad innecesaria y garantizar que no lance.

En cualquier caso, nunca etiquetar este escenario como fallo de creación.

## 33. No recargar la lista

Después de éxito está expresamente prohibido:

```ts
await filtrosEngraseStore.cargarEquipos()
await filtrosEngraseStore.inicializar()
```

La respuesta contiene el objeto suficiente.

Razones:

- evita latencia adicional;
- preserva filtros, scroll y selección local;
- evita parpadeo del listado;
- reduce riesgo de que una respuesta posterior sobrescriba la inserción;
- respeta el contrato de `equipo_lista`.

## 34. Inmutabilidad

Verificar:

- el servicio no recibe el borrador directamente;
- construir payload no muta datos;
- aplicar al listado inserta una copia;
- `registrarEquipoCreado` inserta otra copia controlada;
- modificar posteriormente la copia del listado no altera `draft.equipoCreado`;
- las etapas no comparten el mismo arreglo mutable entre respuesta, listado y wizard.

## 35. Reglas TypeScript y Pinia

- TypeScript estricto.
- Prohibidos `any`, `unknown`, `as any`, `as unknown` y `Record<string, unknown>`.
- Estado transaccional mediante unión discriminada.
- `shallowRef` para `submitState`.
- `computed` para getters.
- Acciones explícitas para mutaciones.
- No usar watchers para disparar submit.
- No importar componentes en stores.
- No mostrar alertas desde el store.
- No agregar dependencias.
- No acceder directamente a Supabase fuera del servicio del SPEC-03.

## 36. Pruebas de guards y bloqueo

Cubrir:

- submit fuera de paso 4 no llama RPC;
- borrador inválido no llama RPC;
- equipo ya creado retorna `already_created`;
- primer submit fija `creating` antes de esperar;
- segundo submit inmediato retorna `busy`;
- navegación y mutaciones bloqueadas durante creating;
- overlay abierto impide submit;
- validación de código obsoleta impide RPC.

## 37. Pruebas del argumento

Cubrir:

- validación integral ejecutada en submit;
- constructor del SPEC-02 utilizado;
- service recibe `{ datos }` y traduce a `p_datos` según SPEC-03;
- payload corresponde al estado capturado;
- borrador no mutado;
- un nuevo intento reconstruye payload actualizado.

## 38. Pruebas de éxito

Cubrir:

- una sola llamada RPC;
- `equipoLista` insertado sin recarga;
- mismo ID reemplazado sin duplicar;
- tipo nuevo reconciliado localmente;
- etapas no duplicadas;
- selección actual preservada;
- `equipoCreado` establecido;
- paso actual cambia a 5;
- pasos 1–4 completados y bloqueados;
- resumen y mensaje conservados;
- mutaciones posteriores rechazadas;
- submit posterior retorna `already_created`.

## 39. Pruebas de error

Cubrir:

- error funcional mapeado a paso correcto;
- borrador completo conservado;
- equipo no registrado;
- listado no modificado;
- interacción desbloqueada;
- reintento posible;
- código ocupado invalida validación previa;
- catálogo obsoleto conserva selección;
- error desconocido queda en Revisión;
- no se ejecutan escrituras compensatorias.

## 40. Pruebas de integración local

Cubrir:

- no se llama `cargarEquipos`;
- no se llama `inicializar`;
- no se cargan detalles;
- respuesta aplicada una sola vez;
- conflicto por mismo código y distinto ID no duplica;
- fallo local posterior al éxito no repite RPC;
- copias de etapas independientes.

## 41. No hacer

- No insertar parcialmente antes de `rpc_crear_equipo_completo`.
- No permitir doble submit.
- No confiar sólo en `disabled` de la UI.
- No saltarse la validación final.
- No reutilizar un payload viejo al reintentar.
- No borrar el borrador ante error.
- No regresar a pasos 1–4 después de éxito.
- No recargar lista ni detalles después de crear.
- No repetir RPC por un fallo de integración local.
- No agregar imagen a la transacción.
- No navegar al listado antes del paso Imagen.
- No consultar ni modificar Supabase.

## 42. Criterios de aceptación

- El submit sólo se ejecuta desde Revisión con borrador válido.
- El bloqueo se activa sincrónicamente desde el primer submit.
- Sólo existe una llamada de creación en curso.
- La RPC recibe el payload construido por SPEC-02.
- Un fallo conserva todo el borrador y permite corregir/reintentar.
- Un éxito inserta directamente `equipo_lista` en el listado.
- No se vuelve a consultar la lista.
- Tipos nuevos quedan coherentes en el catálogo local mínimo.
- El wizard registra el equipo creado y entra automáticamente a Imagen.
- Los pasos 1–4 quedan completados y no clicables.
- La creación no puede repetirse.
- La imagen permanece opcional y fuera de esta transacción.
- Un fallo local después del éxito remoto nunca se presenta como equipo no creado.
- No se realizaron cambios de backend.

## 43. Resultado esperado

Al finalizar la implementación de este spec existirá este flujo:

```text
PASO 4 — REVISAR
        |
        +--> primer submit: bloqueo inmediato
        |
        +--> validación integral
        |       └── inválido → conservar borrador y corregir
        |
        +--> construir { datos }
        |
        +--> rpc_crear_equipo_completo({ p_datos: datos })
                |
                +--> error
                |      ├── mapear al paso
                |      ├── conservar borrador
                |      └── permitir reintento
                |
                └--> éxito
                       ├── insertar equipo_lista localmente
                       ├── no recargar lista
                       ├── registrar equipo creado
                       ├── bloquear pasos 1–4
                       └── entrar a PASO 5 — IMAGEN
```

El equipo ya estará persistido y disponible localmente. La siguiente unidad implementará únicamente la imagen opcional y la finalización del wizard.
