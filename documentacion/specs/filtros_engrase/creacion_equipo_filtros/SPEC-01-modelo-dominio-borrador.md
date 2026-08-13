# SPEC-01 — Modelo de dominio y borrador local de creación

## 1. Objetivo

Definir la base de dominio estrictamente tipada para la creación de equipos de Engrase: contratos locales, referencias a catálogos existentes o temporales, estructura del borrador, estados de validación de código, normalización y helpers puros para inicializar, clonar y reiniciar el borrador.

Este spec no implementa todavía servicios, llamadas RPC, Pinia, navegación del wizard ni componentes Vue. Su resultado debe ser una base independiente de la UI que pueda ser consumida por los specs posteriores sin inventar IDs persistidos ni reutilizar estados exclusivos de la edición.

## 2. Fuentes de verdad

- `context_ui.md`: flujo funcional, borrador local y reglas confirmadas de creación.
- `context_bd.md`: entidades existentes, referencias temporales y contratos conceptuales del payload.
- Los contratos compatibles ya implementados en `src/stores/dbequipos/engrase/edicion/` pueden reutilizarse o extraerse a una ubicación compartida, pero la creación no debe depender conceptualmente del ciclo de vida de edición.
- Esta conversación confirma una regla adicional definitiva para filtros:
  - un código original puede repetirse dentro del mismo equipo si cada asignación utiliza un tipo de filtro diferente;
  - un tipo de filtro sólo puede aparecer una vez dentro del borrador;
  - que un código ya aparezca en el borrador es información para la UI, no una razón para bloquear globalmente el código.

## 3. Dependencias y orden

- No depende de otro spec de esta carpeta.
- Debe completarse antes de los specs de validación, payload, servicios, store, filtros, aceites, creación transaccional, imagen y UI.
- No requiere consultar Supabase.
- No requiere cambios de esquema, RPC ni migraciones SQL.

## 4. Alcance

Incluye:

- tipos de dominio propios de creación;
- referencias discriminadas a elementos existentes y temporales;
- borrador limpio de datos, etapas, filtros y aceites;
- estado discriminado de validación del código del equipo;
- referencia opcional al equipo ya creado;
- normalización pura de textos y códigos;
- helpers para crear IDs temporales;
- factory del borrador inicial;
- clonación profunda controlada del borrador;
- pruebas unitarias de contratos y helpers puros.

No incluye:

- reglas completas de validación para avanzar o crear;
- construcción de `p_datos`;
- mappers de DTO o respuestas RPC;
- acceso a Supabase;
- store Pinia;
- paso actual, pasos completados o navegación del stepper;
- debounce o ejecución manual de la validación de código;
- lógica para agregar, editar o quitar filtros y aceites;
- componentes, estilos, drawers o bottom sheets;
- procesamiento o persistencia de imagen.

## 5. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.types.ts
├── equipoEngraseCreacion.draft.ts
└── equipoEngraseCreacion.draft.test.ts
```

Si es necesario extraer contratos realmente compartidos con edición, crear únicamente los módulos mínimos comunes:

```text
src/stores/dbequipos/engrase/shared/
├── equipoEngraseDraft.types.ts
└── equipoEngraseDraft.tempIds.ts
```

La extracción debe conservar exports compatibles desde las rutas actuales de edición cuando sea necesario para no romper imports existentes. No mover lógica propia del guardado de edición a `shared`.

## 6. Principios del modelo

### 6.1. El borrador no es un equipo persistido

Antes del paso 4 no existe:

- `equipo.id`;
- `equipo_filtro.id`;
- `equipo_aceite.id`;
- imagen persistida;
- snapshot original;
- código original persistido.

Por lo tanto, el modelo de creación no debe completar esos campos con `0`, `-1`, cadenas vacías especiales ni IDs falsos.

### 6.2. Todo lo agregado en pasos 1–3 es local

Los tipos de equipo, tipos de filtro, códigos de filtro, sistemas y aceites nuevos permanecen representados como referencias temporales. Ninguna referencia temporal implica que el registro ya exista en base de datos.

### 6.3. La imagen no pertenece al borrador transaccional

El borrador de creación no contiene archivo, preview, ruta Storage ni operación de imagen. El equipo creado puede conservar los campos de imagen recibidos dentro de `EquipoEngraseListItem`, pero la selección y subida pertenecen al spec de imagen posterior a la creación.

### 6.4. No heredar estados operativos de edición

No usar en creación:

```ts
type OperacionDraft =
  | "existente"
  | "nuevo"
  | "actualizado"
  | "pendiente_eliminacion"
```

Todos los filtros y aceites del borrador de creación son, conceptualmente, nuevos para el equipo. Al quitarlos se eliminan del arreglo local; no quedan marcados como pendientes de eliminación.

## 7. Contratos compartidos mínimos

Reutilizar o extraer, sin duplicar interfaces equivalentes:

```ts
export type EquipoEstado = "activo" | "descartado"

export interface CatalogoIdNombre {
  id: number
  nombre: string
}

export interface CatalogoExistenteReference extends CatalogoIdNombre {
  estado: "existente"
  tempId: null
}

export interface CatalogoTemporalReference {
  estado: "nuevo"
  id: null
  tempId: string
  nombre: string
}

export type CatalogoDraftReference =
  | CatalogoExistenteReference
  | CatalogoTemporalReference
```

Reglas:

- `estado` es el discriminante obligatorio.
- Una referencia existente siempre tiene `id` numérico y `tempId: null`.
- Una referencia nueva siempre tiene `id: null` y `tempId` no vacío.
- Los nombres locales se conservan para presentar el borrador y construir posteriormente el payload.
- No usar propiedades opcionales para simular ambos estados dentro de una sola interfaz.

## 8. Referencia de tipo de equipo

El tipo de equipo conserva las sugerencias de subtipo porque los selectores actuales pueden utilizarlas:

```ts
export interface TipoEquipoExistenteCreacionReference
  extends CatalogoExistenteReference {
  subtiposSugeridos: string[]
}

export interface TipoEquipoNuevoCreacionReference
  extends CatalogoTemporalReference {
  subtiposSugeridos: string[]
}

export type TipoEquipoCreacionReference =
  | TipoEquipoExistenteCreacionReference
  | TipoEquipoNuevoCreacionReference
```

El borrador inicial no selecciona implícitamente el primer tipo disponible. La referencia comienza en `null`.

## 9. Referencias de filtro

Definir referencias específicas porque el código de filtro posee datos diferentes a un catálogo `id/nombre`:

```ts
export interface FiltroExistenteCreacionReference {
  estado: "existente"
  id: number
  tempId: null
  codigo: string
  estaEnListaCompras: boolean
}

export interface FiltroNuevoCreacionReference {
  estado: "nuevo"
  id: null
  tempId: string
  codigo: string
  estaEnListaCompras: boolean
}

export type FiltroCreacionReference =
  | FiltroExistenteCreacionReference
  | FiltroNuevoCreacionReference

export type TipoFiltroCreacionReference = CatalogoDraftReference
```

El `estado` del código y el `estado` del tipo se resuelven independientemente. Son válidas, entre otras, estas combinaciones:

```text
código existente + tipo existente
código existente + tipo nuevo
código nuevo     + tipo existente
código nuevo     + tipo nuevo
```

## 10. Datos del equipo

Definir:

```ts
export interface CrearEquipoDatosDraft {
  codigo: string
  tipoEquipo: TipoEquipoCreacionReference | null
  subtipo: string
  etapas: CatalogoIdNombre[]
  estado: EquipoEstado
}
```

Decisiones:

- `codigo` conserva el valor editable; la normalización para comparar o enviar se realiza mediante helpers puros.
- `subtipo` representa modelo, subtipo o descripción del equipo. No crear campos separados.
- `etapas` conserva objetos `id/nombre` para permitir chips y revisión sin búsquedas repetidas.
- Las etapas sólo pueden ser existentes; no existe una referencia temporal de etapa.
- `estado` comienza como `activo`.

## 11. Filtros del borrador

Definir un modelo propio sin IDs persistidos:

```ts
export interface CrearEquipoFiltroDraft {
  draftId: string
  tipoFiltro: TipoFiltroCreacionReference
  filtro: FiltroCreacionReference
  cantidad: number
}
```

No agregar:

- `id` de `equipo_filtro`;
- `equipoId`;
- `estadoOperacion`;
- `estadoAntesDeEliminar`;
- `cantidadEquivalencias`, porque no forma parte de la creación ni del payload confirmado.

### 11.1. Identidad y duplicados

La identidad excluyente de una asignación dentro del borrador es el tipo de filtro:

- tipo existente: clave conceptual `id:<id>`;
- tipo nuevo: clave conceptual basada en nombre normalizado, no sólo en `tempId`.

Usar el nombre normalizado para tipos nuevos impide crear dos referencias temporales distintas con nombres equivalentes.

El código del filtro no es una clave excluyente. Este borrador es válido:

```text
B7577 · Filtro de aceite
B7577 · Filtro hidráulico
```

Este borrador es inválido:

```text
B7577  · Filtro de aceite
P55042 · Filtro de aceite
```

La detección y mensajes de la segunda situación se implementarán en el spec de validación y en el spec funcional de filtros. Este spec sólo debe proveer un modelo que no impida representar el primer caso.

### 11.2. Información para badges posteriores

No almacenar flags redundantes como:

```ts
yaAsignado: boolean
codigoRepetido: boolean
tipoBloqueado: boolean
```

Esos estados deben derivarse en specs posteriores a partir del borrador:

- un código está `Ya asignado` cuando aparece en al menos una asignación local;
- un tipo muestra badge `Asignado` y queda deshabilitado cuando su clave de identidad ya está ocupada;
- un código repetido puede seguir seleccionándose si quedan tipos no ocupados.

## 12. Aceites del borrador

Definir:

```ts
export interface CrearEquipoAceiteDraft {
  draftId: string
  sistema: CatalogoDraftReference
  aceite: CatalogoDraftReference
}
```

No agregar IDs de `equipo_aceite` ni estados de actualización/eliminación.

La identidad excluyente posterior será el sistema:

- sistema existente por ID;
- sistema nuevo por nombre normalizado.

El arreglo puede estar vacío porque los aceites son opcionales.

## 13. Estado de validación del código

Modelar el resultado asincrónico con una unión discriminada:

```ts
export type ValidacionCodigoEquipoCreacion =
  | { estado: "idle" }
  | { estado: "loading"; codigo: string }
  | { estado: "valido"; codigo: string }
  | {
      estado: "invalido"
      codigo: string
      modeloExistente: string | null
      activoExistente: boolean | null
    }
  | { estado: "error"; codigo: string; mensaje: string }
```

Reglas estructurales:

- todo resultado no `idle` conserva el código normalizado al que corresponde;
- esto permite ignorar respuestas obsoletas y comprobar si el usuario cambió el campo;
- `valido` no inventa modelo ni estado, porque la respuesta exitosa sólo confirma `puede_crearse`;
- `invalido` permite mostrar el modelo y estado retornados;
- `error` no se confunde con código ocupado;
- cambiar el texto del código deberá regresar el estado a `idle`; esa mutación pertenece al store de un spec posterior.

La regla del botón visible con más de cuatro caracteres y la ejecución manual mediante `Validar código` pertenecen al spec de store/UI, no a este contrato.

## 14. Borrador raíz

Definir:

```ts
export interface CrearEquipoDraft {
  datos: CrearEquipoDatosDraft
  filtros: CrearEquipoFiltroDraft[]
  aceites: CrearEquipoAceiteDraft[]
  validacionCodigo: ValidacionCodigoEquipoCreacion
  equipoCreado: EquipoEngraseListItem | null
}
```

`EquipoEngraseListItem` es el contrato ya utilizado por el listado y es compatible con `equipo_lista` según el contexto de base de datos.

Reglas:

- `equipoCreado === null` significa que el flujo todavía es reversible como borrador.
- `equipoCreado !== null` significa que la creación transaccional ya terminó.
- No almacenar también un booleano `creado`; debe derivarse de `equipoCreado`.
- No incluir el paso actual o los pasos completados en este objeto de dominio. Esa información pertenece a la máquina de estados del wizard.
- No incluir estado de procesamiento de imagen.

## 15. Estado inicial

Implementar una factory pura:

```ts
crearEquipoDraftInicial(): CrearEquipoDraft
```

Debe producir conceptualmente:

```ts
{
  datos: {
    codigo: "",
    tipoEquipo: null,
    subtipo: "",
    etapas: [],
    estado: "activo",
  },
  filtros: [],
  aceites: [],
  validacionCodigo: { estado: "idle" },
  equipoCreado: null,
}
```

Cada llamada debe devolver un grafo nuevo. Dos borradores iniciales no pueden compartir arreglos ni objetos mutables.

El futuro `reset()` del store debe reemplazar su estado con el resultado de esta factory, no conservar referencias del borrador anterior.

## 16. Clonación

Implementar una función pura:

```ts
clonarCrearEquipoDraft(draft: CrearEquipoDraft): CrearEquipoDraft
```

Debe clonar explícitamente:

- datos;
- tipo de equipo y sus sugerencias;
- etapas;
- filtros y sus dos referencias;
- aceites y sus dos referencias;
- estado discriminado de validación;
- equipo creado y sus etapas, si existe.

No usar serialización JSON. Puede usarse `structuredClone` si el entorno y los tests del proyecto lo soportan de forma uniforme, aunque se prefiere una clonación explícita que preserve los contratos y haga visibles las fronteras mutables.

Modificar el clon nunca debe alterar el objeto de origen.

## 17. Normalización

Crear helpers puros y reutilizables:

```ts
normalizarTextoCreacion(valor: string): string
normalizarCodigoCreacion(valor: string): string
crearClaveNombreCreacion(valor: string): string
```

Comportamiento:

- `normalizarTextoCreacion` elimina espacios exteriores y colapsa espacios internos;
- `normalizarCodigoCreacion` aplica la normalización de texto y convierte a mayúsculas;
- `crearClaveNombreCreacion` normaliza texto, elimina diferencias de acentos y compara sin distinguir mayúsculas;
- ninguna función muta el valor almacenado en el borrador;
- no eliminar caracteres válidos del código salvo que un contrato posterior lo exija expresamente.

Ejemplos:

```text
"  Bus   Blue Bird " → "Bus Blue Bird"
" b7577 "            → "B7577"
"HIDRÁULICO"         → misma clave que "hidraulico"
```

## 18. IDs temporales

Los IDs temporales deben utilizar prefijos compatibles con el payload documentado:

```text
tmp_tipo_equipo_<único>
tmp_equipo_filtro_<único>
tmp_tipo_filtro_<único>
tmp_filtro_<único>
tmp_equipo_aceite_<único>
tmp_sistema_aceite_<único>
tmp_aceite_<único>
```

Reutilizar el helper existente de edición mediante extracción compartida o export compatible. No crear un segundo contador con reglas distintas.

El helper debe:

- producir cadenas no vacías;
- mantener el prefijo solicitado;
- no depender de Supabase;
- no utilizar IDs de base de datos;
- producir valores únicos durante la sesión activa;
- permitir pruebas deterministas del prefijo sin exigir un valor completo fijo.

## 19. Separación respecto a edición

Es correcto compartir:

- `EquipoEstado`;
- `CatalogoIdNombre`;
- referencias existentes/temporales compatibles;
- auxiliares de catálogos;
- generador de IDs temporales;
- normalizadores realmente equivalentes.

No compartir como modelo de creación:

- `EquipoEdicionDraft`;
- `EquipoEdicionSnapshot`;
- `OperacionDraft`;
- payload diferencial de actualización;
- estados de movimiento de imagen por cambio de código;
- flags `isDirty` derivados de comparar original y borrador.

No crear un snapshot vacío para poder reutilizar `EquipoEdicionDraft`.

## 20. Reglas TypeScript

- Usar TypeScript estricto.
- Usar uniones discriminadas para referencias y estados alternativos.
- Está prohibido introducir `any`, `unknown`, `as any`, `as unknown` o `Record<string, unknown>`.
- No duplicar contratos ya existentes con nombres distintos si son semánticamente idénticos.
- No usar propiedades opcionales para representar estados mutuamente excluyentes.
- No crear ni modificar `Database`, `database.types.ts` o equivalentes.
- No agregar dependencias nuevas.
- Los helpers de este spec deben ser puros y no importar Vue, Pinia, router ni Supabase.
- No usar `ref`, `reactive`, `computed` o watchers en los archivos de dominio.

## 21. Pruebas unitarias

Cubrir, como mínimo:

- factory con todos los valores iniciales esperados;
- dos factories sin referencias mutables compartidas;
- clon independiente para datos, etapas, filtros, aceites, referencias y equipo creado;
- normalización de espacios;
- normalización de códigos a mayúsculas;
- claves de nombre equivalentes con mayúsculas y acentos distintos;
- referencias existentes y nuevas representables sin IDs ficticios;
- filtro con código existente y tipo nuevo;
- filtro con código nuevo y tipo existente;
- dos filtros con el mismo código y tipos diferentes representables simultáneamente;
- ausencia de `estadoOperacion` y de IDs persistidos en filtros y aceites de creación;
- estado inicial de validación en `idle`;
- estados `loading`, `valido`, `invalido` y `error` conservando el código correspondiente;
- prefijos correctos y unicidad de IDs temporales.

Las pruebas de duplicidad, validación del formulario y payload pertenecen al siguiente spec lógico. Aquí sólo se verifica que el modelo pueda representar correctamente los casos válidos y los estados necesarios.

## 22. Criterios de aceptación

- Existe un modelo de creación independiente del snapshot de edición.
- El borrador inicial no contiene IDs persistidos ficticios.
- Los elementos temporales usan uniones discriminadas y `tempId`.
- Las etapas sólo admiten elementos existentes.
- Los filtros y aceites nuevos para el equipo no usan estados de actualización o eliminación.
- El mismo código de filtro puede aparecer en varias asignaciones con tipos distintos.
- El modelo permite derivar posteriormente badges de código usado y tipos bloqueados sin almacenar flags redundantes.
- El estado de validación conserva el código al que corresponde cada respuesta.
- `equipoCreado` es la única señal de dominio de que la transacción terminó.
- La imagen y la navegación del wizard permanecen fuera del borrador transaccional.
- La factory y la clonación no comparten referencias mutables.
- Todos los helpers son puros, tipados y están cubiertos por pruebas.
- No se realizaron llamadas ni cambios en Supabase.

## 23. Resultado esperado

Al finalizar la implementación de este spec, los specs posteriores podrán trabajar sobre una única estructura coherente:

```text
CrearEquipoDraft
├── datos
│   ├── código editable
│   ├── tipo existente o temporal
│   ├── subtipo
│   ├── etapas existentes
│   └── estado
├── filtros locales sin IDs persistidos
├── aceites locales sin IDs persistidos
├── validación de código asociada a un valor concreto
└── equipo creado o null
```

No debe existir todavía comportamiento visible para el usuario. El entregable es la base de dominio estable sobre la que se construirán, en orden, las validaciones, servicios, store y UI.
