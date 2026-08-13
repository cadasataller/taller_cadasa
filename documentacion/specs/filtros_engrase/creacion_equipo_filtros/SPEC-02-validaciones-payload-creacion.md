# SPEC-02 — Validaciones y payload de creación

## 1. Objetivo

Implementar la segunda capa lógica del flujo de creación de equipos de Engrase: validaciones puras por paso, validación integral previa al submit, detección de duplicados y construcción exacta del argumento de `engrase.rpc_crear_equipo_completo` a partir de `CrearEquipoDraft`.

Este spec no consume Supabase ni modifica el borrador. Su resultado debe permitir que el futuro store pregunte si un paso puede completarse, muestre errores asociados a campos o secciones y obtenga un payload válido sin incluir propiedades propias de la UI.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: contratos locales, referencias discriminadas, normalización e IDs temporales.
- `context_ui.md`: requisitos para avanzar entre pasos y comportamiento previo a la creación.
- `context_bd.md`: forma exacta de `p_datos`, reglas transaccionales y códigos de error.
- Decisiones confirmadas:
  - la validación remota del código sólo puede solicitarse cuando el código normalizado tiene más de cuatro caracteres;
  - el botón y la ejecución de la llamada serán manuales en specs posteriores;
  - debe existir al menos una etapa;
  - debe existir al menos un filtro;
  - los aceites son opcionales;
  - un código de filtro puede repetirse si cada asignación usa un tipo distinto;
  - un tipo de filtro no puede repetirse dentro del equipo;
  - un sistema de aceite no puede repetirse dentro del equipo.

## 3. Dependencias y orden

- Requiere `SPEC-01` implementado.
- Debe completarse antes de servicios, store, lógica de filtros y aceites, creación transaccional y UI.
- No requiere acceso a red ni conexión con Supabase.
- No requiere cambios de esquema, funciones o migraciones.

## 4. Alcance

Incluye:

- contrato común de errores de validación;
- validación pura del paso 1, Datos del equipo;
- validación pura del paso 2, Filtros;
- validación pura del paso 3, Aceites;
- validación integral antes de crear;
- helpers de identidad para tipos de filtro y sistemas;
- detección de tipos de filtro y sistemas duplicados;
- comprobación de correspondencia entre el código actual y el código validado;
- contratos TypeScript del payload de creación;
- construcción pura de `p_datos`;
- resultado discriminado de construcción;
- mapeo de códigos RPC conocidos a errores de pasos o secciones;
- pruebas unitarias de validación y payload.

No incluye:

- llamada a `rpc_validar_codigo_equipo_para_creacion`;
- llamada a `rpc_crear_equipo_completo`;
- extracción de errores desde respuestas Supabase;
- estado Pinia;
- navegación del wizard;
- control de doble submit;
- badges o deshabilitación visual de opciones;
- formularios y componentes Vue;
- cambios de imagen o Storage.

## 5. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.validation.ts
├── equipoEngraseCreacion.validation.test.ts
├── equipoEngraseCreacion.payload.ts
├── equipoEngraseCreacion.payload.test.ts
└── equipoEngraseCreacion.errors.ts
```

Ampliar únicamente si faltan contratos del payload:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
```

No crear servicios ni stores en este spec.

## 6. Principios obligatorios

### 6.1. Validaciones puras

Todas las validaciones reciben el borrador o una sección y devuelven datos. No deben:

- mutar el borrador;
- ejecutar RPC;
- escribir en Pinia;
- cambiar el paso actual;
- enfocar campos;
- mostrar notificaciones;
- lanzar errores por datos corregibles del usuario.

### 6.2. El frontend valida y la RPC sigue siendo autoridad

La validación local mejora la experiencia, pero no reemplaza las restricciones transaccionales. El payload sólo se construye después de pasar la validación local y aun así el flujo posterior debe poder mapear errores retornados por la RPC.

### 6.3. El payload no es el borrador

No enviar directamente `CrearEquipoDraft` a `.rpc()`. El constructor debe traducir:

- camelCase local a snake_case remoto;
- `tempId` a `temp_id`;
- referencias discriminadas a objetos del contrato RPC;
- etapas a operaciones `nuevo`;
- filtros y aceites locales a colecciones `nuevos`.

No incluir:

- `validacionCodigo`;
- `equipoCreado`;
- `draftId` con ese nombre;
- flags derivados para badges;
- paso actual o pasos completados;
- estado de imagen.

## 7. Contrato de errores locales

Definir:

```ts
export type CrearEquipoPasoValidable = 1 | 2 | 3 | 4

export type CrearEquipoSeccionError =
  | "datos"
  | "etapas"
  | "filtros"
  | "aceites"
  | "general"

export interface CrearEquipoValidationIssue {
  codigo: string
  mensaje: string
  paso: CrearEquipoPasoValidable
  seccion: CrearEquipoSeccionError
  fieldId?: string
}

export interface CrearEquipoValidationResult {
  valido: boolean
  errores: CrearEquipoValidationIssue[]
}
```

Reglas:

- `paso` permite redirigir al usuario desde Revisión al origen del problema;
- `seccion` permite agrupar mensajes;
- `fieldId` sólo se usa para errores de campos concretos;
- los errores de creación general permanecen en el paso 4;
- no almacenar componentes, callbacks ni referencias DOM dentro del error;
- el orden de errores debe ser estable y seguir el orden del formulario.

## 8. Helpers de identidad

Implementar funciones puras para referencias de catálogo:

```ts
crearClaveCatalogoCreacion(
  referencia: CatalogoDraftReference,
): string

crearClaveTipoFiltroCreacion(
  referencia: TipoFiltroCreacionReference,
): string

crearClaveSistemaCreacion(
  referencia: CatalogoDraftReference,
): string
```

Reglas:

- referencia existente: `id:<id>`;
- referencia nueva: `nombre:<clave-normalizada>`;
- los tipos o sistemas temporales con nombres equivalentes deben producir la misma clave;
- no usar `tempId` como única identidad de una entidad nueva;
- las funciones no deben considerar el código del filtro al crear la clave del tipo.

Ejemplo:

```text
tipo nuevo "Filtro Hidráulico" → nombre:filtro hidraulico
tipo nuevo " filtro hidraulico " → nombre:filtro hidraulico
```

## 9. Validación para solicitar comprobación de código

Implementar:

```ts
puedeSolicitarValidacionCodigo(codigo: string): boolean
```

Debe devolver `true` sólo cuando:

- el código normalizado no está vacío;
- el código normalizado contiene más de cuatro caracteres.

Por tanto:

```text
"4100"  → false
"41000" → true
" 41000 " → true
```

Esta función no decide si el resultado remoto es válido. Sólo permite que store y UI posteriores sepan si corresponde mostrar/habilitar `Validar código`.

No implementar debounce: la decisión confirmada es validación manual mediante botón.

## 10. Vigencia de la validación del código

Implementar:

```ts
validacionCorrespondeAlCodigoActual(
  draft: CrearEquipoDraft,
): boolean
```

Debe ser `true` únicamente cuando:

- `validacionCodigo.estado === "valido"`;
- el código conservado por la validación coincide con `normalizarCodigoCreacion(draft.datos.codigo)`.

Debe ser `false` para:

- `idle`;
- `loading`;
- `invalido`;
- `error`;
- resultado válido correspondiente a un valor anterior del campo.

Ejemplo:

```text
campo actual:       410003
código validado:    410003 → vigente

campo actual:       410003A
código validado:    410003 → obsoleto
```

El futuro store debe regresar la validación a `idle` al modificar el código. Esta comprobación permanece como defensa adicional para impedir avanzar o crear con una respuesta obsoleta.

## 11. Validación del paso 1 — Datos del equipo

Implementar:

```ts
validarPasoDatosEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult
```

Validaciones y orden:

1. Código requerido.
2. Longitud suficiente para solicitar validación.
3. Validación remota vigente y exitosa.
4. Tipo de equipo seleccionado.
5. Nombre válido para tipo existente o nuevo.
6. Modelo/subtipo requerido.
7. Mínimo una etapa.
8. IDs de etapa válidos, positivos y sin duplicados.
9. Estado permitido: `activo` o `descartado`.

Códigos locales mínimos:

```text
CODIGO_EQUIPO_REQUERIDO
CODIGO_EQUIPO_LONGITUD_INSUFICIENTE
CODIGO_EQUIPO_PENDIENTE_VALIDACION
CODIGO_EQUIPO_VALIDANDO
EQUIPO_YA_EXISTE_EN_ENGRASE
VALIDACION_CODIGO_FALLIDA
VALIDACION_CODIGO_OBSOLETA
TIPO_EQUIPO_REQUERIDO
TIPO_EQUIPO_NOMBRE_REQUERIDO
SUBTIPO_EQUIPO_REQUERIDO
ETAPA_MINIMA_REQUERIDA
ETAPA_INVALIDA
ETAPA_DUPLICADA
ESTADO_EQUIPO_INVALIDO
```

### 11.1. Interpretación del estado remoto

- `idle`: falta validar.
- `loading`: todavía no se puede avanzar.
- `valido` con código coincidente: válido.
- `valido` con código diferente: validación obsoleta.
- `invalido`: el equipo ya existe en Engrase.
- `error`: no se pudo completar la validación; debe permitirse reintentar posteriormente.

Cuando el estado sea `invalido`, el error local debe conservar un mensaje compatible con la información disponible:

```text
Este código ya existe en Engrase.
```

Modelo y estado existente permanecen en `draft.validacionCodigo` para que la UI posterior los presente. No concatenarlos obligatoriamente dentro del mensaje de dominio.

### 11.2. Campos asociados

- errores de código: `equipo-creacion-codigo`;
- tipo: `equipo-creacion-tipo` cuando el adaptador permita asociarlo;
- subtipo: `equipo-creacion-subtipo`;
- etapas: `equipo-creacion-etapas`;
- estado: `equipo-creacion-estado`.

Los IDs son contratos estables para la futura UI, no selectores CSS de implementación accidental.

## 12. Validación del paso 2 — Filtros

Implementar:

```ts
validarPasoFiltrosEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult
```

Validaciones:

- existe al menos un filtro;
- cada `draftId` es no vacío y único;
- cada tipo existente posee ID positivo;
- cada tipo nuevo posee `tempId` y nombre normalizado no vacío;
- cada filtro existente posee ID positivo y código no vacío;
- cada filtro nuevo posee `tempId` y código no vacío;
- cantidad es un entero mayor que cero;
- no hay tipos de filtro duplicados según su clave conceptual.

Códigos locales mínimos:

```text
FILTRO_MINIMO_REQUERIDO
FILTRO_DRAFT_ID_INVALIDO
FILTRO_DRAFT_ID_DUPLICADO
TIPO_FILTRO_INVALIDO
FILTRO_INVALIDO
CANTIDAD_FILTRO_INVALIDA
TIPO_FILTRO_DUPLICADO
```

### 12.1. Regla definitiva de duplicidad

La validación debe comparar únicamente la identidad del tipo para determinar conflicto de asignación.

Válido:

```text
B7577 · Filtro de aceite
B7577 · Filtro hidráulico
```

Inválido:

```text
B7577 · Filtro de aceite
B7030 · Filtro de aceite
```

No producir un error por:

- código repetido;
- ID de filtro repetido;
- mismo catálogo de filtro utilizado con tipos distintos.

El badge `Ya asignado` del código será informativo. El bloqueo se aplica a la opción del tipo ocupado y se implementará en la lógica/UI de filtros.

### 12.2. Tipos nuevos equivalentes

Debe considerarse duplicado:

```text
"Filtro hidráulico"
" FILTRO   HIDRÁULICO "
```

aunque posean `tempId` diferentes.

## 13. Validación del paso 3 — Aceites

Implementar:

```ts
validarPasoAceitesEquipo(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult
```

Una colección vacía es válida.

Cuando existan asociaciones, validar:

- `draftId` no vacío y único;
- sistema existente con ID positivo;
- sistema nuevo con `tempId` y nombre no vacío;
- aceite existente con ID positivo;
- aceite nuevo con `tempId` y nombre no vacío;
- sistema no repetido según identidad conceptual.

Códigos locales mínimos:

```text
ACEITE_DRAFT_ID_INVALIDO
ACEITE_DRAFT_ID_DUPLICADO
SISTEMA_ACEITE_INVALIDO
ACEITE_INVALIDO
SISTEMA_ACEITE_DUPLICADO
```

Dos sistemas nuevos con nombres equivalentes cuentan como el mismo sistema aunque tengan distintos `tempId`.

No exigir una cantidad para aceites porque el contrato no contiene ese campo.

## 14. Validación integral previa a crear

Implementar:

```ts
validarCreacionEquipoCompleta(
  draft: CrearEquipoDraft,
): CrearEquipoValidationResult
```

Debe:

1. impedir crear si `equipoCreado !== null`;
2. ejecutar las validaciones de pasos 1, 2 y 3;
3. concatenar errores en orden de pasos;
4. evitar mensajes duplicados idénticos;
5. devolver `valido: true` sólo si no hay errores.

Código adicional:

```text
EQUIPO_YA_CREADO
```

Este error pertenece al paso 4 y sección `general`.

No volver a ejecutar la RPC de validación de código desde esta función. Sólo comprobar la vigencia del resultado ya almacenado.

## 15. Contratos base del payload

Definir:

```ts
export interface EntidadExistenteCreacionPayload {
  estado: "existente"
  id: number
  nombre: string
}

export interface EntidadNuevaCreacionPayload {
  estado: "nuevo"
  id: null
  temp_id: string
  nombre: string
}

export type EntidadCreacionPayload =
  | EntidadExistenteCreacionPayload
  | EntidadNuevaCreacionPayload
```

Filtro:

```ts
export interface FiltroExistenteCreacionPayload {
  estado: "existente"
  id: number
  codigo: string
  esta_en_lista_compras: boolean
}

export interface FiltroNuevoCreacionPayload {
  estado: "nuevo"
  id: null
  temp_id: string
  codigo: string
  esta_en_lista_compras: boolean
}

export type FiltroCreacionPayload =
  | FiltroExistenteCreacionPayload
  | FiltroNuevoCreacionPayload
```

No reutilizar el payload diferencial de edición si eso permite propiedades no admitidas en creación.

## 16. Payload de datos y etapas

Definir:

```ts
export interface DatosEquipoCreacionPayload {
  codigo: string
  subtipo: string
  estado: EquipoEstado
  tipo_equipo: EntidadCreacionPayload
}

export interface EtapaAgregadaCreacionPayload {
  estado_operacion: "nuevo"
  etapa_id: number
}

export interface EtapasCreacionPayload {
  agregadas: EtapaAgregadaCreacionPayload[]
}
```

Reglas:

- `codigo`, `subtipo` y nombres salen normalizados;
- el código se envía en mayúsculas;
- las etapas mantienen el orden del borrador;
- siempre existe al menos una etapa después de validar;
- no existe colección `eliminadas` en creación.

## 17. Payload de filtros

Definir:

```ts
export interface FiltroEquipoNuevoCreacionPayload {
  estado_operacion: "nuevo"
  temp_id: string
  tipo_filtro: EntidadCreacionPayload
  filtro: FiltroCreacionPayload
  cantidad: number
}

export interface FiltrosCreacionPayload {
  nuevos: FiltroEquipoNuevoCreacionPayload[]
}
```

Reglas:

- `temp_id` de la asignación corresponde a `CrearEquipoFiltroDraft.draftId`;
- conservar el orden visible del borrador;
- no deduplicar por código;
- no fusionar dos filas que usan el mismo código;
- no incluir `actualizados` ni `eliminados`;
- no incluir motivo de cambio;
- no incluir equivalencias.

Ejemplo válido que debe producir dos entradas:

```json
{
  "nuevos": [
    {
      "estado_operacion": "nuevo",
      "temp_id": "tmp_equipo_filtro_1",
      "tipo_filtro": {
        "estado": "existente",
        "id": 1,
        "nombre": "Filtro de aceite"
      },
      "filtro": {
        "estado": "existente",
        "id": 35,
        "codigo": "B7577",
        "esta_en_lista_compras": true
      },
      "cantidad": 1
    },
    {
      "estado_operacion": "nuevo",
      "temp_id": "tmp_equipo_filtro_2",
      "tipo_filtro": {
        "estado": "existente",
        "id": 2,
        "nombre": "Filtro hidráulico"
      },
      "filtro": {
        "estado": "existente",
        "id": 35,
        "codigo": "B7577",
        "esta_en_lista_compras": true
      },
      "cantidad": 1
    }
  ]
}
```

## 18. Payload de aceites

Definir:

```ts
export interface AceiteEquipoNuevoCreacionPayload {
  estado_operacion: "nuevo"
  temp_id: string
  sistema: EntidadCreacionPayload
  aceite: EntidadCreacionPayload
}

export interface AceitesCreacionPayload {
  nuevos: AceiteEquipoNuevoCreacionPayload[]
}
```

Reglas:

- `temp_id` corresponde a `CrearEquipoAceiteDraft.draftId`;
- la colección `nuevos` puede ser `[]`;
- conservar el orden del borrador;
- no incluir `actualizados` ni `eliminados`.

## 19. Payload integral y argumento RPC

Definir exactamente:

```ts
export interface CrearEquipoCompletoDatosPayload {
  datos_equipo: DatosEquipoCreacionPayload
  etapas: EtapasCreacionPayload
  filtros: FiltrosCreacionPayload
  aceites: AceitesCreacionPayload
}

export interface CrearEquipoCompletoArgumento {
  datos: CrearEquipoCompletoDatosPayload
}
```

`CrearEquipoCompletoArgumento` utiliza un nombre local legible. El spec de servicios traducirá posteriormente:

```ts
{ datos: argumento.datos }
// a parámetros RPC:
{ p_datos: argumento.datos }
```

Este spec construye exactamente el contenido de `p_datos`, pero no acopla el dominio local al nombre `p_*` de la función remota.

En contraste con el payload diferencial de edición, las cuatro secciones deben existir siempre después de validar:

- `datos_equipo`;
- `etapas`;
- `filtros`;
- `aceites`.

Si no hay aceites:

```json
{
  "aceites": {
    "nuevos": []
  }
}
```

No omitir la sección ni convertirla en `null`.

## 20. Conversión de referencias

Implementar helpers puros internos o exportados sólo si los necesitan pruebas posteriores:

```ts
crearEntidadCreacionPayload(
  referencia: CatalogoDraftReference,
): EntidadCreacionPayload

crearFiltroCreacionPayload(
  referencia: FiltroCreacionReference,
): FiltroCreacionPayload
```

Comportamiento:

- referencias existentes conservan ID y no incluyen `temp_id`;
- referencias nuevas conservan `id: null` e incluyen `temp_id`;
- nombres y códigos se normalizan;
- booleanos se conservan sin coerciones;
- no buscar ni resolver IDs localmente;
- no modificar las referencias recibidas.

## 21. Constructor seguro del payload

Definir un resultado discriminado:

```ts
export type ConstruirPayloadCreacionResultado =
  | {
      ok: true
      argumento: CrearEquipoCompletoArgumento
    }
  | {
      ok: false
      errores: CrearEquipoValidationIssue[]
    }
```

Implementar:

```ts
construirPayloadCrearEquipo(
  draft: CrearEquipoDraft,
): ConstruirPayloadCreacionResultado
```

Flujo obligatorio:

1. Ejecutar `validarCreacionEquipoCompleta`.
2. Si hay errores, devolver `ok: false` sin payload parcial.
3. Si es válido, construir un argumento local nuevo con `datos`.
4. No mutar ni normalizar in-place el borrador.

No usar aserciones no nulas para saltarse la validación. Después de validar, utilizar narrowing explícito o helpers tipados que hagan imposible construir el payload sin tipo de equipo.

## 22. Mapeo de errores RPC

Crear un catálogo puro que traduzca códigos conocidos a `CrearEquipoValidationIssue`.

Implementar:

```ts
mapearErrorRpcCreacionEquipo(
  codigo: string,
): CrearEquipoValidationIssue
```

Mapeo mínimo:

| Código RPC | Paso | Sección |
|---|---:|---|
| `AUTENTICACION_REQUERIDA` | 4 | `general` |
| `PAYLOAD_CREACION_INVALIDO` | 4 | `general` |
| `DATOS_EQUIPO_REQUERIDOS` | 1 | `datos` |
| `CODIGO_EQUIPO_REQUERIDO` | 1 | `datos` |
| `EQUIPO_YA_EXISTE_EN_ENGRASE` | 1 | `datos` |
| `SUBTIPO_EQUIPO_REQUERIDO` | 1 | `datos` |
| `ESTADO_EQUIPO_INVALIDO` | 1 | `datos` |
| `TIPO_EQUIPO_REQUERIDO` | 1 | `datos` |
| `TIPO_EQUIPO_NO_EXISTE` | 1 | `datos` |
| `ETAPA_NO_EXISTE` | 1 | `etapas` |
| `ETAPA_MINIMA_REQUERIDA` | 1 | `etapas` |
| `FILTRO_MINIMO_REQUERIDO` | 2 | `filtros` |
| `CANTIDAD_FILTRO_INVALIDA` | 2 | `filtros` |
| `TIPO_FILTRO_NO_EXISTE` | 2 | `filtros` |
| `FILTRO_NO_EXISTE` | 2 | `filtros` |
| `ACEITE_NO_EXISTE` | 3 | `aceites` |
| `SISTEMA_ACEITE_NO_EXISTE` | 3 | `aceites` |
| `CONFLICTO_DATOS_DUPLICADOS` | 4 | `general` |
| `DATOS_INVALIDOS` | 4 | `general` |

Reglas:

- códigos desconocidos producen un error general del paso 4;
- no exponer mensajes técnicos o SQL directamente al usuario;
- el mapper no cambia el paso actual;
- el futuro store decidirá si regresar al paso de origen o mostrar el error desde Revisión;
- `EQUIPO_YA_EXISTE_EN_ENGRASE` debe asociarse a `equipo-creacion-codigo`.

La extracción del código desde el error remoto pertenece al spec de servicios. Este archivo sólo recibe una cadena de código ya identificada.

## 23. Inmutabilidad

Después de validar o construir payload:

- el código editable conserva el texto original ingresado;
- nombres temporales conservan su texto local;
- arreglos del borrador conservan identidad y orden;
- referencias no reciben propiedades snake_case;
- `validacionCodigo` no cambia;
- `equipoCreado` no cambia.

El payload debe ser un grafo nuevo. Modificarlo en una prueba no debe mutar el borrador.

## 24. Reglas TypeScript

- Usar TypeScript estricto.
- Está prohibido introducir `any`, `unknown`, `as any`, `as unknown` o `Record<string, unknown>`.
- Usar uniones discriminadas para referencias y resultados.
- No usar casts para forzar un borrador inválido a payload válido.
- No crear tipos globales de Supabase ni modificar `Database`.
- No agregar dependencias.
- Los módulos de este spec no importan Vue, Pinia, router ni Supabase.
- Mantener funciones pequeñas: identidad, validación y transformación deben estar separadas.
- No duplicar normalizadores del `SPEC-01`.
- No lanzar excepciones para validaciones corregibles.

## 25. Pruebas de validación

Cubrir, como mínimo:

### Datos

- código vacío;
- código de cuatro caracteres sin posibilidad de validación;
- código de cinco caracteres elegible;
- estado `idle` bloquea avance;
- estado `loading` bloquea avance;
- estado `error` bloquea avance y permite distinguir fallo técnico;
- estado `invalido` bloquea porque ya existe en Engrase;
- estado `valido` para otro código se considera obsoleto;
- estado `valido` para el código actual permite continuar;
- tipo no seleccionado;
- tipo nuevo sin nombre;
- subtipo vacío;
- etapas vacías;
- etapa repetida;
- estado válido.

### Filtros

- lista vacía;
- cantidad cero, negativa, decimal o no finita;
- tipo existente inválido;
- tipo nuevo sin `tempId` o nombre;
- filtro existente inválido;
- filtro nuevo sin `tempId` o código;
- `draftId` repetido;
- mismo tipo existente repetido con códigos distintos;
- tipos nuevos con nombres normalizados equivalentes;
- mismo código e ID de filtro con tipos diferentes aceptado;
- código nuevo repetido con tipos diferentes aceptado.

### Aceites

- lista vacía aceptada;
- asociación válida existente/existente;
- sistema nuevo y aceite nuevo válidos;
- sistema existente repetido;
- sistemas nuevos con nombres equivalentes;
- `draftId` repetido;
- referencia inválida.

### Validación integral

- errores ordenados por paso;
- borrador completamente válido;
- equipo previamente creado bloquea un segundo intento;
- ausencia de mutaciones.

## 26. Pruebas de payload

Cubrir, como mínimo:

- datos del equipo normalizados;
- tipo de equipo existente;
- tipo de equipo nuevo con `temp_id`;
- etapas convertidas a `estado_operacion: "nuevo"`;
- filtro existente con tipo existente;
- filtro existente con tipo nuevo;
- filtro nuevo con tipo existente;
- filtro nuevo con tipo nuevo;
- mismo código repetido en dos tipos produce dos entradas;
- cantidades conservadas;
- aceite y sistema existentes;
- aceite y sistema nuevos;
- aceites vacíos producen `nuevos: []`;
- cuatro secciones siempre presentes;
- ausencia de propiedades de edición;
- ausencia de estado de validación y equipo creado;
- payload inválido devuelve errores y no un objeto parcial;
- payload y borrador sin referencias mutables compartidas.

## 27. Criterios de aceptación

- Cada paso posee una validación pura e independiente.
- Sólo un resultado remoto `valido` correspondiente al código actual permite superar el paso 1.
- La elegibilidad para validar comienza con más de cuatro caracteres normalizados.
- Una etapa y un filtro son mínimos obligatorios.
- Los aceites vacíos son válidos.
- Los duplicados de filtro se determinan por tipo, no por código.
- Un código repetido con tipos diferentes pasa la validación y conserva entradas separadas en el payload.
- Los sistemas de aceite no pueden repetirse.
- Las entidades nuevas se comparan por nombre normalizado y se envían con `temp_id`.
- El constructor nunca produce payload parcial cuando el borrador es inválido.
- El argumento local tiene exactamente la raíz `{ datos: ... }`; el service posterior la traduce a `{ p_datos: argumento.datos }`.
- La sección de aceites existe aunque esté vacía.
- Los errores RPC conocidos pueden asociarse al paso y sección correctos.
- Validación y construcción no mutan el borrador.
- No se realizaron consultas ni cambios en Supabase.

## 28. Resultado esperado

Al finalizar la implementación de este spec debe existir el siguiente flujo puramente lógico:

```text
CrearEquipoDraft
        |
        +--> validarPasoDatosEquipo
        +--> validarPasoFiltrosEquipo
        +--> validarPasoAceitesEquipo
        |
        v
validarCreacionEquipoCompleta
        |
        +--> inválido: errores ordenados por paso
        |
        +--> válido
                |
                v
        construirPayloadCrearEquipo
                |
                v
        { datos: { datos_equipo, etapas, filtros, aceites } }
```

Todavía no debe existir ninguna llamada remota ni comportamiento visible. El entregable es una frontera confiable entre el borrador local y el contrato transaccional que consumirá el spec de servicios.
