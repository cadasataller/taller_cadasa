# SPEC-03 — Contratos remotos, mappers y servicios

## 1. Objetivo

Implementar la frontera tipada entre la lógica local de creación y las RPC de Engrase necesarias durante los pasos 1–4: carga de auxiliares, validación del código, búsqueda de filtros originales y creación transaccional del equipo completo.

Este spec debe aislar las formas crudas de Supabase dentro de DTO y mappers explícitos. El futuro store sólo consumirá modelos locales en camelCase y errores funcionales identificables; nunca conocerá nombres `p_*`, claves snake_case ni respuestas RPC sin mapear.

La administración de imagen se excluye deliberadamente porque ocurre después de crear el equipo y tendrá su propio spec.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: contratos de dominio, auxiliares y referencias locales.
- `SPEC-02-validaciones-payload-creacion.md`: argumento local, contenido de `p_datos` y errores por pasos.
- `context_bd.md`: firmas, respuestas y errores de las RPC.
- `context_ui.md`: momento de uso, carga única de auxiliares y prohibición de escrituras parciales.
- Implementación existente de edición:
  - `equipoEngraseEdicion.service.ts`;
  - `equipoEngraseEdicion.mappers.ts`;
  - `equipoEngraseEdicion.errors.ts`;
  - `equipoEngraseEdicion.types.ts`.
- Decisión confirmada: `p_codigo_equipo` de `rpc_buscar_filtro_original_para_asignar` tiene valor predeterminado `NULL`.

## 3. Dependencias y orden

- Requiere `SPEC-01` y `SPEC-02` implementados.
- Debe completarse antes del store y la máquina de estados del wizard.
- No requiere componentes Vue ni cambios de rutas.
- No requiere modificar Supabase, RPC, tablas, Storage o migraciones.

## 4. Alcance

Incluye:

- DTO estrictos de las cuatro RPC usadas en pasos 1–4;
- contratos locales de respuestas;
- mappers puros para auxiliares, validación, búsqueda y creación;
- error funcional propio de creación;
- extracción estable de códigos desde errores remotos;
- servicio que encapsula `supabaseEquipos.schema("engrase").rpc(...)`;
- reutilización segura de lógica compartida con edición;
- pruebas unitarias de mappers y servicios;
- manejo de respuesta nula, `ok: false` y respuesta incompleta.

No incluye:

- store Pinia;
- ejecución automática de solicitudes;
- reglas para mostrar el botón `Validar código`;
- debounce;
- navegación del wizard;
- mutaciones del borrador;
- control de doble submit;
- actualización del store del listado;
- administración de imagen o Storage;
- componentes, badges, drawers o estados visuales.

## 5. RPC incluidas

```text
engrase.rpc_obtener_auxiliares_edicion_equipo
engrase.rpc_validar_codigo_equipo_para_creacion
engrase.rpc_buscar_filtro_original_para_asignar
engrase.rpc_crear_equipo_completo
```

De estas llamadas, sólo `rpc_crear_equipo_completo` escribe datos. Cargar auxiliares, validar código y buscar filtro son lecturas.

No agregar al servicio de este spec:

```text
engrase.rpc_administrar_imagen_equipo
```

## 6. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.dto.ts
├── equipoEngraseCreacion.mappers.ts
├── equipoEngraseCreacion.mappers.test.ts
├── equipoEngraseCreacion.service.ts
├── equipoEngraseCreacion.service.test.ts
└── equipoEngraseCreacion.remote-errors.ts
```

Ampliar únicamente si faltan modelos públicos:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
```

Si se extraen piezas compartidas con edición, conservar reexports compatibles desde sus rutas actuales.

## 7. Reglas técnicas obligatorias

- Usar TypeScript estricto.
- Está prohibido declarar o propagar `any`, `unknown`, `as any`, `as unknown` o `Record<string, unknown>`.
- Cada RPC posee un DTO concreto y un modelo local concreto.
- Los casts de `data` sólo pueden ocurrir dentro del servicio, después de comprobar `error`, y siempre hacia un DTO local concreto.
- No pasar datos crudos de Supabase al store.
- No crear ni modificar `Database`, `database.types.ts` o tipos globales equivalentes.
- No usar genéricos artificiales para registrar RPC en el cliente Supabase.
- No ejecutar consultas desde mappers, stores o componentes.
- No agregar dependencias.
- Los mappers y helpers de error no importan Vue, Pinia ni router.
- El servicio no normaliza ni valida nuevamente el borrador completo; recibe argumentos ya preparados por las capas anteriores.

## 8. Patrón obligatorio del servicio

Definir constantes internas:

```ts
const RPC_OBTENER_AUXILIARES =
  "rpc_obtener_auxiliares_edicion_equipo"
const RPC_VALIDAR_CODIGO =
  "rpc_validar_codigo_equipo_para_creacion"
const RPC_BUSCAR_FILTRO =
  "rpc_buscar_filtro_original_para_asignar"
const RPC_CREAR_EQUIPO =
  "rpc_crear_equipo_completo"
```

Usar una única función local para seleccionar el esquema:

```ts
const schemaEngrase = () => supabaseEquipos.schema("engrase")
```

Flujo de cada método:

1. Construir parámetros RPC internamente.
2. Ejecutar `.rpc()`.
3. Si existe `error`, convertirlo a `ErrorCreacionEquipo`.
4. Comprobar que `data !== null`.
5. Convertir `data` al DTO concreto.
6. Ejecutar mapper puro.
7. Retornar modelo local.

No retornar `{ data, error }` al consumidor.

## 9. Error remoto de creación

Definir:

```ts
export class ErrorCreacionEquipo extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
  )
}
```

Helpers mínimos:

```ts
extraerCodigoErrorCreacionEquipo(mensaje: string): string

crearErrorCreacionEquipo(
  mensaje: string,
  codigo?: string,
): ErrorCreacionEquipo
```

Reglas:

- usar el texto anterior al primer `:` como código cuando no se recibe uno separado;
- limpiar espacios;
- fallback estable: `ERROR_CREACION_EQUIPO`;
- conservar un mensaje legible para diagnóstico;
- no convertir aquí el código a mensaje de UI: eso corresponde a `mapearErrorRpcCreacionEquipo` del SPEC-02;
- una respuesta `ok: false` debe producir el mismo tipo de error que un error del cliente Supabase.

No depender de `ErrorEdicionEquipo`. Si la implementación demuestra que ambos errores son idénticos, puede extraerse una utilidad compartida sin hacer que creación importe una clase semánticamente llamada “edición”.

## 10. Auxiliares compartidos

La RPC reutilizada retorna:

- tipos de equipo con sugerencias de subtipo;
- etapas;
- tipos de filtro con tipos de equipo que los usan;
- sistemas de aceite;
- aceites.

El modelo local debe ser el ya consumible por creación y edición:

```ts
export interface TipoEquipoAuxiliar {
  id: number
  nombre: string
  subtiposSugeridos: string[]
}

export interface TipoFiltroAuxiliar {
  id: number
  nombre: string
  tiposEquipoQueLoUsan: string[]
}

export interface AuxiliaresEquipoEngrase {
  tiposEquipo: TipoEquipoAuxiliar[]
  etapas: CatalogoIdNombre[]
  tiposFiltro: TipoFiltroAuxiliar[]
  sistemasAceite: CatalogoIdNombre[]
  aceites: CatalogoIdNombre[]
}
```

Puede reutilizarse `AuxiliaresEdicionEquipo` sólo si se extrae o renombra hacia un contrato neutral, conservando compatibilidad con edición. No duplicar dos interfaces estructuralmente idénticas.

## 11. DTO de auxiliares

Definir:

```ts
export interface ObtenerAuxiliaresEquipoDto {
  ok: boolean
  codigo?: string
  mensaje?: string
  tipos_equipo?: Array<{
    id: number
    nombre: string
    subtipos_sugeridos: string[]
  }>
  etapas?: Array<{ id: number; nombre: string }>
  tipos_filtro?: Array<{
    id: number
    nombre: string
    tipos_equipo_que_lo_usan: string[]
  }>
  sistemas_aceite?: Array<{ id: number; nombre: string }>
  aceites?: Array<{ id: number; nombre: string }>
}
```

Mapper:

```ts
mapAuxiliaresEquipo(
  dto: ObtenerAuxiliaresEquipoDto,
): AuxiliaresEquipoEngrase
```

Reglas:

- `ok: false` lanza `ErrorCreacionEquipo`;
- colecciones ausentes se convierten en `[]`;
- snake_case se convierte a camelCase;
- no seleccionar opciones por defecto;
- no filtrar auxiliares localmente en el mapper salvo que el contrato marque explícitamente elementos inactivos;
- no modificar orden ni nombres recibidos.

## 12. Servicio de auxiliares

Firma:

```ts
obtenerAuxiliaresEquipo(): Promise<AuxiliaresEquipoEngrase>
```

Llamada:

```ts
schemaEngrase().rpc(RPC_OBTENER_AUXILIARES, {})
```

La carga única durante el wizard será responsabilidad del futuro store. El servicio no implementa caché ni memoización.

No crear una RPC nueva para auxiliares de creación.

## 13. Validación remota del código

### 13.1. Parámetros

El servicio recibe una cadena local:

```ts
validarCodigoEquipoParaCreacion(
  codigo: string,
): Promise<ValidacionCodigoEquipoRespuesta>
```

Construye:

```json
{
  "p_codigo": "410003"
}
```

El store posterior sólo llamará este método mediante acción manual cuando el código tenga más de cuatro caracteres. El servicio no debe decidir visibilidad del botón ni ejecutar debounce.

El código debe llegar ya normalizado desde la capa de dominio/store. Como defensa de frontera, el servicio puede aplicar `normalizarCodigoCreacion` una vez antes de enviar, sin modificar el borrador.

### 13.2. DTO

Definir una unión compatible con las dos respuestas exitosas:

```ts
export type ValidarCodigoEquipoCreacionDto =
  | {
      puede_crearse: true
    }
  | {
      puede_crearse: false
      modelo: string | null
      activo: boolean | null
    }
```

No exigir `ok`, `codigo` ni `mensaje` porque la respuesta documentada es mínima.

### 13.3. Modelo local

Definir:

```ts
export type ValidacionCodigoEquipoRespuesta =
  | {
      puedeCrearse: true
    }
  | {
      puedeCrearse: false
      modeloExistente: string | null
      activoExistente: boolean | null
    }
```

Mapper:

```ts
mapValidacionCodigoEquipo(
  dto: ValidarCodigoEquipoCreacionDto,
): ValidacionCodigoEquipoRespuesta
```

Reglas:

- la respuesta válida no inventa modelo ni estado;
- la respuesta no válida conserva `null` cuando falten datos opcionales;
- no convertir `activo` a etiquetas de UI;
- no construir directamente `ValidacionCodigoEquipoCreacion` del borrador, porque el código consultado y los estados `loading/error` pertenecen al store.

### 13.4. Errores esperados

```text
AUTENTICACION_REQUERIDA
CODIGO_EQUIPO_REQUERIDO
```

Se convierten a `ErrorCreacionEquipo`. No deben confundirse con `{ puedeCrearse: false }`, que representa un resultado funcional válido.

## 14. Búsqueda de filtro original

### 14.1. Reutilización

La búsqueda utiliza el mismo contrato conceptual y mapper ya empleado en edición:

```ts
ResultadoBusquedaFiltroOriginal
```

Debe conservar:

- resultado encontrado o no encontrado;
- filtro original;
- posibilidad de crear;
- sugerencias;
- tipos posibles;
- contexto de uso por tipo de equipo;
- campos `yaAsignadoAlEquipo` y `equipoFiltroActual` cuando los devuelva la RPC.

En creación, como `p_codigo_equipo` no se envía, la RPC no conoce las asignaciones del borrador. Los flags remotos no sustituyen la derivación local de tipos ocupados.

### 14.2. Firma de servicio

Crear una firma específica e inequívoca:

```ts
buscarFiltroOriginalParaCreacion(
  codigo: string,
): Promise<ResultadoBusquedaFiltroOriginal>
```

No exponer `codigoEquipo?: string` en el servicio de creación.

### 14.3. Parámetros y decisión sobre `NULL`

Como se confirmó que `p_codigo_equipo` posee valor predeterminado `NULL`, la llamada de creación debe ser:

```ts
schemaEngrase().rpc(RPC_BUSCAR_FILTRO, {
  p_codigo: codigoNormalizado,
})
```

No es necesario enviar:

```ts
p_codigo_equipo: null
```

Ambas formas representan el mismo caso funcional, pero omitir el parámetro aprovecha explícitamente el valor predeterminado confirmado y mantiene la firma local simple.

La prueba del servicio debe verificar que el objeto remoto sólo contiene `p_codigo`.

### 14.4. Duplicados locales

El servicio y mapper no deben:

- bloquear códigos ya usados en el borrador;
- alterar `tiposPosibles` usando estado local;
- decidir badges;
- descartar un resultado porque el mismo filtro ya aparezca en otra fila.

La lógica posterior combinará el resultado remoto con el borrador para:

- marcar el código como `Ya asignado`;
- marcar cada tipo ocupado como `Asignado`;
- deshabilitar sólo tipos ocupados;
- permitir el mismo código con otro tipo.

## 15. DTO de búsqueda

Puede extraerse y compartir el DTO existente si su forma coincide exactamente:

```ts
export interface BuscarFiltroOriginalDto {
  ok: boolean
  encontrado: boolean
  codigo: string
  mensaje?: string
  codigo_buscado?: string
  puede_crearse?: boolean
  coincidencia_exacta?: boolean
  sugerencias?: Array<{
    id: number
    codigo: string
    esta_en_lista_compras: boolean
  }>
  filtro?: {
    id: number
    codigo: string
    esta_en_lista_compras: boolean
  }
  requiere_seleccionar_tipo?: boolean
  sin_tipos_registrados?: boolean
  tipos_posibles?: Array<{
    tipo_filtro: { id: number; nombre: string }
    tipos_equipo_que_lo_usan: string[]
    ya_asignado_al_equipo: boolean
    equipo_filtro_actual: {
      equipo_filtro_id: number
      codigo: string
      cantidad: number
    } | null
  }>
}
```

No copiar este contrato a dos archivos si puede residir en un módulo neutral compartido.

## 16. Creación transaccional

### 16.1. Firma de servicio

```ts
crearEquipoCompleto(
  argumento: CrearEquipoCompletoArgumento,
): Promise<CrearEquipoCompletoRespuesta>
```

`CrearEquipoCompletoArgumento` proviene del SPEC-02 y tiene raíz local:

```ts
{
  datos: CrearEquipoCompletoDatosPayload
}
```

El servicio traduce exactamente a:

```ts
schemaEngrase().rpc(RPC_CREAR_EQUIPO, {
  p_datos: argumento.datos,
})
```

No reconstruir el payload dentro del servicio ni recibir `CrearEquipoDraft`.

### 16.2. Única escritura de pasos 1–4

Este método debe ser la única escritura remota expuesta por el servicio de creación antes del paso Imagen.

Está prohibido agregar métodos para crear individualmente:

- equipo;
- etapa;
- filtro;
- tipo de filtro;
- aceite;
- sistema;
- tipo de equipo.

## 17. DTO de creación exitosa

Definir:

```ts
export interface CrearEquipoCompletoDto {
  ok: boolean
  codigo: string
  mensaje: string
  equipo_lista?: {
    id: number
    codigo: string
    tipo_equipo_id: number
    tipo_equipo: string
    subtipo: string | null
    estado: EquipoEstado
    main_storage_path: string | null
    tiene_imagen_main: boolean
    imagen_actualizada_en: string | null
    etapas: Array<{ id: number; nombre: string }>
  }
  resumen_operaciones?: {
    etapas_agregadas: number
    filtros_agregados: number
    aceites_agregados: number
  }
}
```

Aunque `equipo_lista` y `resumen_operaciones` son obligatorios para una respuesta exitosa, se modelan opcionales en el DTO para poder detectar una respuesta remota incompleta y producir un error controlado.

## 18. Modelo local de respuesta

Definir:

```ts
export interface ResumenOperacionesCreacionEquipo {
  etapasAgregadas: number
  filtrosAgregados: number
  aceitesAgregados: number
}

export interface CrearEquipoCompletoRespuesta {
  codigo: string
  mensaje: string
  equipoLista: EquipoEngraseListItem
  resumenOperaciones: ResumenOperacionesCreacionEquipo
}
```

El mapper debe reutilizar o extraer el mapper tipado de `equipo_lista` empleado por edición. No usar los mappers laxos del listado basados en `Record<string, unknown>`.

## 19. Mapper de creación

Implementar:

```ts
mapCrearEquipoCompleto(
  dto: CrearEquipoCompletoDto,
): CrearEquipoCompletoRespuesta
```

Reglas:

- `ok: false` lanza `ErrorCreacionEquipo` con código y mensaje remotos;
- `equipo_lista` ausente produce error `RESPUESTA_CREACION_INCOMPLETA`;
- `resumen_operaciones` ausente produce el mismo error controlado;
- mapear `equipo_lista` a `EquipoEngraseListItem` sin propiedades adicionales;
- conservar `subtipo: null` si así lo permite `EquipoEngraseListItem`;
- convertir sólo claves del resumen a camelCase;
- no consultar la lista de equipos;
- no crear URL firmada;
- no agregar `imageUrl` artificialmente salvo que sea propiedad obligatoria del contrato compartido y exista una decisión documentada para su valor inicial.

## 20. Errores de creación conocidos

El servicio debe conservar como `codigo` al menos:

```text
AUTENTICACION_REQUERIDA
PAYLOAD_CREACION_INVALIDO
DATOS_EQUIPO_REQUERIDOS
CODIGO_EQUIPO_REQUERIDO
EQUIPO_YA_EXISTE_EN_ENGRASE
SUBTIPO_EQUIPO_REQUERIDO
ESTADO_EQUIPO_INVALIDO
TIPO_EQUIPO_REQUERIDO
TIPO_EQUIPO_NO_EXISTE
ETAPA_NO_EXISTE
ETAPA_MINIMA_REQUERIDA
FILTRO_MINIMO_REQUERIDO
CANTIDAD_FILTRO_INVALIDA
TIPO_FILTRO_NO_EXISTE
FILTRO_NO_EXISTE
ACEITE_NO_EXISTE
SISTEMA_ACEITE_NO_EXISTE
CONFLICTO_DATOS_DUPLICADOS
DATOS_INVALIDOS
```

También debe conservar códigos específicos propagados por las funciones resolver aunque no aparezcan en esta lista.

No mantener un segundo catálogo de mensajes visuales en el servicio.

## 21. Respuesta nula e incompleta

Cada método debe tener un mensaje controlado cuando Supabase no devuelve `data`:

```text
La RPC no devolvió auxiliares.
La RPC no devolvió la validación del código.
La RPC no devolvió el resultado de búsqueda.
La RPC no devolvió la creación del equipo.
```

Los mappers deben rechazar respuestas estructuralmente incompatibles que impidan construir el modelo local.

No convertir una respuesta incompleta en:

- arreglos vacíos que oculten un fallo cuando `ok: true` exige datos;
- `puedeCrearse: true` por defecto;
- un `EquipoEngraseListItem` con ID `0`;
- resumen de operaciones con ceros inventados.

## 22. Concurrencia y solicitudes obsoletas

El servicio debe ser stateless. No almacena:

- solicitud activa;
- último código validado;
- auxiliares cacheados;
- resultado de búsqueda;
- equipo creado.

La cancelación lógica de respuestas obsoletas pertenece al store. Para hacerla posible, el método de validación retorna únicamente el resultado y el store conserva por separado el código consultado según el contrato del SPEC-01.

## 23. Relación con la regla de validación manual

El servicio no se invoca automáticamente al escribir. El flujo posterior será:

```text
usuario escribe más de 4 caracteres
        |
        v
UI muestra/habilita "Validar código"
        |
        v
usuario presiona el botón
        |
        v
store fija loading con el código consultado
        |
        v
service.validarCodigoEquipoParaCreacion(código)
        |
        v
store acepta la respuesta sólo si todavía corresponde al código actual
```

Este spec implementa únicamente la llamada y el mapper.

## 24. Reutilización con edición

Se recomienda compartir cuando las formas sean realmente idénticas:

- auxiliares;
- búsqueda de filtro original;
- `EquipoEngraseListItem`;
- mapper tipado de `equipo_lista`;
- helpers de catálogo `id/nombre`;
- extracción genérica de código de error.

Mantener separados:

- método de creación completa;
- DTO y resumen de creación;
- validación de código para creación;
- error semántico de creación si no se extrae una base neutral;
- método de búsqueda específico que omite `p_codigo_equipo`.

No añadir condicionales de modo `create/edit` dentro de un único método ambiguo cuando dos firmas explícitas sean más seguras.

## 25. Pruebas de mappers

Cubrir, como mínimo:

### Auxiliares

- respuesta completa;
- arrays snake_case a camelCase;
- colecciones ausentes a `[]`;
- `ok: false` convertido en error funcional;
- orden conservado.

### Validación de código

- `puede_crearse: true` produce sólo `puedeCrearse: true`;
- `puede_crearse: false` conserva modelo y activo;
- valores opcionales `null` conservados;
- no se inventan datos al validar correctamente.

### Búsqueda de filtro

- coincidencia exacta;
- código no encontrado y creable;
- sugerencias;
- varios tipos posibles;
- flags remotos conservados;
- `ok: false`;
- resultado encontrado sin filtro rechazado.

### Creación

- respuesta exitosa completa;
- `equipo_lista` mapeado exactamente;
- etapas conservadas;
- resumen convertido a camelCase;
- `ok: false` conserva código;
- falta de `equipo_lista` rechazada;
- falta de resumen rechazada;
- ausencia de IDs o conteos inventados.

## 26. Pruebas del servicio

Mockear exclusivamente la frontera del cliente Supabase y verificar:

- uso del esquema `engrase` en las cuatro operaciones;
- auxiliares llama `rpc_obtener_auxiliares_edicion_equipo` con `{}`;
- validación llama `rpc_validar_codigo_equipo_para_creacion` con `p_codigo` normalizado;
- búsqueda llama `rpc_buscar_filtro_original_para_asignar` sólo con `p_codigo`;
- búsqueda no envía `p_codigo_equipo` ni `undefined` como propiedad;
- creación llama `rpc_crear_equipo_completo` con `{ p_datos: argumento.datos }`;
- el servicio no muta el argumento de creación;
- cada respuesta pasa por su mapper;
- error del cliente se convierte a `ErrorCreacionEquipo`;
- `data: null` produce error controlado;
- `ok: false` no se devuelve como éxito;
- no se realiza una segunda consulta después de crear.

Los tests no deben usar `any` ni `unknown` en mocks, fixtures o casts.

## 27. No hacer

- No consultar el proyecto remoto de Supabase para implementar este spec.
- No crear RPC alternativas.
- No insertar registros parciales.
- No recibir `CrearEquipoDraft` en el servicio de creación.
- No construir el payload en componentes o store.
- No recargar `rpc_obtener_equipos_lista` después de crear.
- No actualizar todavía el store de listado.
- No agregar la imagen a `p_datos`.
- No subir archivos.
- No enviar `p_codigo_equipo` con el código que se está creando.
- No bloquear remotamente un código de filtro porque aparezca en el borrador.
- No convertir errores técnicos en alertas visuales desde el servicio.

## 28. Criterios de aceptación

- Existen DTO concretos para las cuatro RPC.
- El store futuro sólo necesitará modelos en camelCase.
- Los auxiliares reutilizan la RPC de edición sin duplicar contrato.
- La validación distingue correctamente código disponible, código ocupado y error remoto.
- La búsqueda omite `p_codigo_equipo` y aprovecha su `NULL` predeterminado confirmado.
- La búsqueda remota no implementa duplicidad del borrador.
- La creación recibe el argumento construido por SPEC-02 y lo traduce a `p_datos`.
- No existe ninguna escritura parcial adicional.
- La respuesta contiene un `EquipoEngraseListItem` listo para insertar en el store.
- El servicio no vuelve a consultar la lista después de crear.
- Los errores conservan códigos utilizables por el mapper del SPEC-02.
- Respuestas nulas o incompletas fallan de forma controlada.
- La capa remota permanece stateless.
- No se incluyó administración de imagen.
- No se modificó ni consultó Supabase.

## 29. Resultado esperado

Al finalizar la implementación de este spec existirá una frontera remota coherente:

```text
Store futuro
    |
    +--> obtenerAuxiliaresEquipo()
    |         └--> rpc_obtener_auxiliares_edicion_equipo
    |
    +--> validarCodigoEquipoParaCreacion(código)
    |         └--> rpc_validar_codigo_equipo_para_creacion
    |
    +--> buscarFiltroOriginalParaCreacion(código)
    |         └--> rpc_buscar_filtro_original_para_asignar
    |             sin p_codigo_equipo
    |
    └--> crearEquipoCompleto({ datos })
              └--> rpc_crear_equipo_completo({ p_datos: datos })
                         |
                         v
              CrearEquipoCompletoRespuesta
              ├── equipoLista
              └── resumenOperaciones
```

Todavía no debe existir navegación, store Pinia ni UI. El entregable es una capa de servicios verificable que permita construir esas piezas sin filtrar detalles de Supabase hacia el resto de la funcionalidad.
