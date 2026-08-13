# SPEC-06 — Lógica de aceites del borrador

## 1. Objetivo

Implementar la lógica completa para administrar las asociaciones iniciales de aceites de un equipo antes de crearlo: seleccionar o crear temporalmente sistemas y aceites, agregar asociaciones locales, editarlas, eliminarlas y evitar que un mismo sistema aparezca más de una vez.

Los aceites son opcionales. Este spec debe permitir que el paso 3 sea válido con una colección vacía y entregar contratos suficientes para que la UI posterior reutilice el formulario y overlay de edición sin heredar estados de persistencia.

## 2. Fuentes de verdad

- `SPEC-01-modelo-dominio-borrador.md`: `CrearEquipoAceiteDraft` y referencias de catálogo.
- `SPEC-02-validaciones-payload-creacion.md`: unicidad por sistema y payload de aceites.
- `SPEC-03-contratos-mappers-servicios.md`: auxiliares de sistemas y aceites.
- `SPEC-04-store-maquina-estados-wizard.md`: estado, overlays, navegación y bloqueo después de crear.
- `context_ui.md`: comportamiento del paso Aceites y drawer/bottom sheet.
- `context_bd.md`: funciones resolver y restricción de un aceite por sistema para cada equipo.
- Regla confirmada: los aceites son opcionales y no bloquean el avance cuando la lista está vacía.

## 3. Dependencias y orden

- Requiere `SPEC-01` a `SPEC-04` implementados.
- Puede implementarse después o en paralelo con `SPEC-05`, porque ambos modifican secciones independientes del mismo borrador; si se trabaja en paralelo, debe coordinarse la edición del store compartido.
- Debe completarse antes de la creación transaccional y la UI final.
- No requiere cambios ni consultas adicionales en Supabase.

## 4. Alcance

Incluye:

- estado efímero del editor de aceites;
- selección de sistema existente o temporal;
- selección de aceite existente o temporal;
- creación y reutilización de referencias temporales;
- derivación de sistemas ocupados;
- badge y bloqueo de sistemas asignados;
- alta local de asociaciones;
- edición de sistema y aceite;
- eliminación inmediata del borrador;
- validación de conflictos antes de mutar;
- cierre y descarte seguro del editor;
- resumen derivado para el paso Revisión;
- integración con store y validación del paso 3;
- pruebas unitarias.

No incluye:

- componentes visuales definitivos;
- estilos de badges;
- persistencia individual de sistemas o aceites;
- llamadas remotas adicionales;
- cantidades o volúmenes de aceite;
- filtros;
- creación transaccional del equipo;
- imagen.

## 5. Archivos previstos

Crear:

```text
src/stores/dbequipos/engrase/creacion/
├── equipoEngraseCreacion.aceites.ts
└── equipoEngraseCreacion.aceites.test.ts
```

Modificar:

```text
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store.ts
src/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types.ts
```

Opcionalmente crear un composable de estado efímero:

```text
src/composables/engrase/useCrearEquipoAceiteEditor.ts
```

El arreglo autoritativo continúa siendo `draft.aceites` dentro del store.

## 6. Principios obligatorios

### 6.1. Sección opcional

Son válidos:

```text
0 asociaciones
1 asociación
n asociaciones con sistemas únicos
```

No crear un aceite por defecto ni seleccionar automáticamente el primer sistema disponible.

### 6.2. Todo permanece local

Agregar, editar y eliminar sólo modifican `draft.aceites`. Las referencias nuevas se resuelven dentro de `rpc_crear_equipo_completo` en el spec transaccional posterior.

No persistir individualmente:

- sistema nuevo;
- aceite nuevo;
- relación equipo-aceite.

### 6.3. El sistema es la identidad excluyente

Un equipo sólo puede tener una asociación activa por sistema.

- sistema existente: identidad por ID;
- sistema nuevo: identidad por nombre normalizado;
- el aceite elegido no participa en la detección de duplicidad del sistema.

### 6.4. Estados derivados

No almacenar en `CrearEquipoAceiteDraft`:

```ts
sistemaAsignado
sistemaBloqueado
esNuevo
estadoOperacion
pendienteEliminacion
```

La presentación deriva esos valores de las referencias y el borrador.

## 7. Estado efímero del editor

Definir:

```ts
export type CrearEquipoAceiteEditorState =
  | { kind: "closed" }
  | {
      kind: "add"
      dirty: boolean
      error: string | null
    }
  | {
      kind: "edit"
      draftId: string
      dirty: boolean
      error: string | null
    }
```

El formulario puede mantener selecciones locales hasta confirmar, pero no debe mantener una segunda copia autoritativa del arreglo completo.

Si este estado se integra en `activeOverlay`, usar una sola unión discriminada para impedir contradicciones.

## 8. Contratos de entrada y resultado

Definir:

```ts
export interface AgregarAceiteCreacionInput {
  sistema: CatalogoDraftReference
  aceite: CatalogoDraftReference
}

export interface EditarAceiteCreacionInput
  extends AgregarAceiteCreacionInput {
  draftId: string
}

export type ResultadoMutacionAceiteCreacion =
  | { ok: true; draftId: string }
  | {
      ok: false
      codigo:
        | "EQUIPO_YA_CREADO"
        | "ASOCIACION_ACEITE_NO_ENCONTRADA"
        | "SISTEMA_ACEITE_INVALIDO"
        | "ACEITE_INVALIDO"
        | "SISTEMA_ACEITE_DUPLICADO"
      mensaje: string
    }
```

Las acciones no deben lanzar excepciones por conflictos corregibles del formulario.

## 9. Helpers de ocupación

Reutilizar `crearClaveSistemaCreacion` del SPEC-02.

Implementar:

```ts
estaSistemaOcupado(
  sistema: CatalogoDraftReference,
  asociaciones: readonly CrearEquipoAceiteDraft[],
  excludeDraftId?: string,
): boolean
```

Reglas:

- comparar referencias existentes por ID;
- comparar referencias nuevas por nombre normalizado;
- `excludeDraftId` evita que una fila se bloquee contra sí misma al editar;
- no comparar únicamente por `tempId`;
- no considerar el aceite para decidir ocupación.

## 10. Getters de aceites

Agregar o derivar:

```text
oilsCount
hasOils
occupiedSystemKeys
occupiedExistingSystemIds
occupiedNewSystemNames
```

Reglas:

- `oilsCount` se deriva de `draft.aceites.length`;
- cero es un valor válido;
- conjuntos de ocupación no se guardan como estado mutable;
- los nombres nuevos se comparan con `crearClaveNombreCreacion`;
- las colecciones derivadas pueden implementarse como `computed` o helpers puros.

## 11. Opciones de sistema

Definir un modelo presentacional neutral:

```ts
export interface OpcionSistemaAceiteCreacion {
  referencia: CatalogoDraftReference
  asignado: boolean
  disabled: boolean
  badge: "Asignado" | null
}
```

Helper:

```ts
crearOpcionesSistemaAceiteCreacion(
  sistemas: readonly CatalogoDraftReference[],
  asociaciones: readonly CrearEquipoAceiteDraft[],
  excludeDraftId?: string,
): OpcionSistemaAceiteCreacion[]
```

Comportamiento:

- sistema ocupado por otra fila: visible, badge `Asignado`, `disabled: true`;
- sistema disponible: sin badge, habilitado;
- en edición, el sistema actual permanece habilitado;
- no ocultar sistemas ocupados;
- no depender sólo de color u opacidad en la futura UI.

Aunque el contexto visual sólo exige evitar seleccionar sistemas ocupados, el badge explícito mantiene consistencia con la interacción de filtros y explica el bloqueo.

## 12. Opciones de aceite

Los aceites no se bloquean globalmente por estar usados en otro sistema. Es válido:

```text
MOTOR       → 15W40
HIDRÁULICO  → 15W40
```

Por tanto:

- no derivar `occupiedOilIds` para deshabilitar opciones;
- no marcar un aceite como asignado globalmente;
- un mismo aceite existente o temporal puede usarse en múltiples sistemas;
- la validación sólo exige una referencia válida.

## 13. Abrir editor

Acciones:

```ts
abrirAgregarAceite(): boolean
abrirEditarAceite(draftId: string): boolean
```

Reglas:

- sólo antes de crear;
- preferentemente desde el paso 3;
- rechazar si hay overlay incompatible;
- modo agregar inicia vacío;
- modo editar exige una fila existente;
- no modificar el borrador al abrir;
- limpiar errores efímeros anteriores.

No bloquear agregar cuando la lista esté vacía; ese es el estado inicial esperado.

## 14. Referencia de sistema existente

Al seleccionar un sistema de auxiliares construir:

```ts
{
  estado: "existente",
  id: sistema.id,
  tempId: null,
  nombre: sistema.nombre,
}
```

No almacenar directamente el mismo objeto mutable de `auxiliares`.

Antes de confirmar, verificar que el ID siga disponible en auxiliares cuando corresponda.

## 15. Sistema temporal

Helper:

```ts
crearSistemaTemporal(
  nombre: string,
): CatalogoDraftReference | null
```

Reglas:

- normalizar espacios;
- rechazar vacío;
- si coincide con sistema existente, devolver referencia existente;
- si coincide con un sistema temporal presente en el borrador, reutilizar su referencia y `tempId`;
- si no existe, crear `tmp_sistema_aceite_*`;
- si la entidad reutilizada ya está asignada, debe quedar bloqueada al confirmar otra fila;
- no persistirla.

La coincidencia usa nombre normalizado sin distinguir mayúsculas ni acentos.

## 16. Referencia de aceite existente

Al seleccionar un aceite de auxiliares construir una copia discriminada existente.

La selección no depende del sistema salvo que una regla futura del catálogo lo indique explícitamente. El contexto actual permite utilizar los auxiliares cargados y filtrar localmente, pero no define una matriz obligatoria sistema-aceite.

No inventar restricciones adicionales.

## 17. Aceite temporal

Helper:

```ts
crearAceiteTemporal(
  nombre: string,
): CatalogoDraftReference | null
```

Reglas:

- normalizar nombre;
- rechazar vacío;
- si coincide con aceite existente, reutilizar referencia existente;
- si coincide con un aceite temporal usado en cualquier fila, reutilizar `tempId`;
- si no existe, crear `tmp_aceite_*`;
- el mismo aceite temporal puede asociarse a varios sistemas;
- no persistirlo.

## 18. Catálogo temporal derivado

No mantener arreglos separados y mutables de `sistemasTemporales` o `aceitesTemporales` salvo necesidad demostrada.

Derivar desde `draft.aceites`:

```ts
obtenerSistemasTemporales(
  asociaciones: readonly CrearEquipoAceiteDraft[],
): CatalogoTemporalReference[]

obtenerAceitesTemporales(
  asociaciones: readonly CrearEquipoAceiteDraft[],
): CatalogoTemporalReference[]
```

Reglas:

- deduplicar por identidad conceptual;
- conservar primera aparición y `tempId`;
- retornar copias;
- permitir que formularios posteriores reutilicen entidades temporales ya preparadas.

## 19. Agregar asociación

Acción:

```ts
agregarAceite(
  input: AgregarAceiteCreacionInput,
): ResultadoMutacionAceiteCreacion
```

Flujo:

1. Rechazar si el equipo ya fue creado.
2. Validar referencia de sistema.
3. Validar referencia de aceite.
4. Comprobar que el sistema no esté ocupado.
5. Crear `draftId` con prefijo `tmp_equipo_aceite_*`.
6. Copiar ambas referencias.
7. Agregar al final de `draft.aceites`.
8. Limpiar errores del paso 3 resueltos.
9. Cerrar editor tras éxito.

No crear una cantidad ni campos adicionales.

## 20. Combinaciones admitidas

La acción debe soportar:

```text
sistema existente + aceite existente
sistema existente + aceite nuevo
sistema nuevo     + aceite existente
sistema nuevo     + aceite nuevo
```

Cada referencia conserva su propio estado y `tempId`. No exigir que ambas sean nuevas o existentes simultáneamente.

## 21. Conflicto de sistema

Debe rechazarse:

```text
MOTOR → 15W40
MOTOR → SAE 50
```

También:

```text
"Mandos finales"  → SAE 50
" MANDOS  FINALES " → AW100
```

cuando ambos sistemas sean temporales conceptualmente equivalentes.

El error debe ser específico:

```text
Este equipo ya tiene un aceite asociado a ese sistema.
```

No reemplazar silenciosamente la fila existente al agregar. Para cambiarla debe usarse edición.

## 22. Editar asociación

Acción:

```ts
actualizarAceite(
  input: EditarAceiteCreacionInput,
): ResultadoMutacionAceiteCreacion
```

Permite modificar:

- sistema;
- aceite.

Reglas:

- localizar por `draftId`;
- bloquear después de crear;
- excluir la propia fila al validar ocupación;
- permitir conservar sistema actual;
- bloquear sistema usado por otra fila;
- validar ambas referencias;
- conservar `draftId` y posición;
- copiar nuevas referencias;
- cerrar editor tras éxito;
- no escribir `estadoOperacion: "actualizado"`.

## 23. Eliminar asociación

Acción:

```ts
quitarAceite(draftId: string): ResultadoMutacionAceiteCreacion
```

Reglas:

- bloquear después de crear;
- localizar fila;
- eliminar inmediatamente mediante un arreglo nuevo;
- permitir eliminar la última asociación y quedar en cero;
- no requerir confirmación de dominio;
- no llamar RPC;
- no dejar estado pendiente de eliminación;
- no añadir acción Deshacer persistida.

La UI puede solicitar confirmación si producto lo requiere, pero no existe riesgo de borrar un registro remoto.

## 24. Lista vacía

Cuando `draft.aceites.length === 0`:

- `validarPasoAceitesEquipo` devuelve válido;
- `canGoNext` desde el paso 3 puede ser `true` si no existen otras operaciones bloqueantes;
- se muestra estado vacío y CTA `Agregar aceite`;
- el resumen del paso 4 indica `0 asociados` o `Sin aceites`;
- el payload conserva `aceites: { nuevos: [] }`;
- no crear warnings globales ni errores.

## 25. Resumen para Revisión

Definir un helper puro:

```ts
export interface ResumenAceiteCreacion {
  draftId: string
  sistema: string
  aceite: string
  sistemaNuevo: boolean
  aceiteNuevo: boolean
}

crearResumenAceitesCreacion(
  asociaciones: readonly CrearEquipoAceiteDraft[],
): ResumenAceiteCreacion[]
```

Reglas:

- conservar orden del borrador;
- usar nombres normalizados para presentación sin mutar referencias;
- indicar si cada catálogo es nuevo para posibles chips informativos;
- no incluir IDs en la UI de revisión;
- lista vacía retorna `[]`.

## 26. Orden

El arreglo conserva orden de inserción.

- editar no reordena;
- eliminar conserva orden relativo restante;
- el mismo orden se usa en lista, revisión y payload;
- no ordenar alfabéticamente dentro del store después de cada mutación.

La UI podrá presentar columnas o cards sin alterar el orden autoritativo.

## 27. Cierre y descarte del editor

Acciones:

```ts
solicitarCerrarEditorAceite(): boolean
continuarEditandoAceite(): void
descartarEditorAceite(): void
```

Reglas:

- editor limpio cierra inmediatamente;
- editor dirty abre confirmación local;
- no usar `window.confirm` desde store o helper;
- descartar sólo elimina selecciones no confirmadas;
- asociaciones ya confirmadas permanecen;
- cerrar restablece estado a `closed`;
- la confirmación no interfiere con la salida general del wizard.

## 28. Errores del editor

Separar:

- referencia inválida o conflicto: error efímero cercano al formulario;
- error de validación global del paso: `validationErrors`;
- futuro error transaccional: paso 4;
- error de auxiliares: error inicial del wizard.

No existe búsqueda remota en este editor, por lo que no debe tener loading de API salvo que otro spec incorpore una necesidad real.

## 29. Integración con validación del paso 3

Después de una mutación exitosa:

- consultar `validarPasoAceitesEquipo`;
- limpiar errores resueltos de la sección;
- no avanzar automáticamente;
- no marcar el paso como completado;
- no afectar validaciones de Datos o Filtros.

Si una edición introduce un conflicto, la acción debe rechazarla y conservar la asociación anterior sin mutación parcial.

## 30. Integración con el payload

Mantener los campos esperados:

```text
draftId          → temp_id de equipo_aceite
sistema.estado   → sistema.estado
sistema.id       → sistema.id
sistema.tempId   → sistema.temp_id
aceite.estado    → aceite.estado
aceite.id        → aceite.id
aceite.tempId    → aceite.temp_id
```

No convertir a snake_case dentro del store.

No incluir campos no documentados como:

- cantidad;
- volumen;
- unidad;
- observaciones;
- frecuencia.

## 31. Preparación para reutilizar UI de edición

Es reutilizable:

- overlay responsive drawer/bottom sheet;
- selector que admite opción existente o nueva;
- formulario Sistema/Aceite;
- fila visual con iconos `Cog` y `Droplet`;
- confirmación de descarte local.

Debe adaptarse:

- contratos de `EquipoAceiteDraft` a `CrearEquipoAceiteDraft`;
- eliminación inmediata sin `pendiente_eliminacion`;
- ausencia de estados `Nuevo/Actualizado/Activo` si no aportan información;
- sistemas ocupados visibles con badge `Asignado` y deshabilitados;
- mensaje `La asociación se aplicará al crear el equipo`;
- lista vacía explícitamente opcional;
- bloqueo total después de entrar a Imagen.

Preferir componentes presentacionales neutrales o variantes explícitas. No propagar condicionales ambiguos de modo por toda la jerarquía.

## 32. Accesibilidad futura que condiciona contratos

- Sistemas ocupados usan `disabled` real.
- Badge `Asignado` acompaña el texto del sistema.
- El estado vacío explica que los aceites son opcionales.
- Botones de editar/eliminar poseen etiquetas accesibles con sistema y aceite.
- Errores de conflicto se asocian al selector de sistema.
- Confirmación de descarte recupera foco.
- No depender sólo de color.

Este spec entrega los estados necesarios, aunque no genera markup.

## 33. Reglas TypeScript y Vue

- TypeScript estricto.
- Prohibidos `any`, `unknown`, `as any`, `as unknown` y `Record<string, unknown>`.
- Uniones discriminadas para editor y resultados.
- Helpers puros separados de acciones Pinia.
- `computed` para sistemas ocupados y contadores.
- `shallowRef` para estado efímero reemplazado.
- No watchers profundos.
- No mutar props, argumentos, auxiliares o referencias compartidas.
- No importar componentes en store/helpers.
- No agregar dependencias.
- No llamar Supabase desde componentes o store.

## 34. Pruebas de identidad y opciones

Cubrir:

- sistema existente ocupado por ID;
- sistema temporal ocupado por nombre normalizado;
- acentos, mayúsculas y espacios equivalentes;
- `excludeDraftId` evita autobloqueo;
- aceite repetido en distintos sistemas permitido;
- sistema ocupado visible con `Asignado` y disabled;
- sistema actual habilitado al editar;
- getters y conteos derivados.

## 35. Pruebas de referencias temporales

Cubrir:

- sistema nuevo genera prefijo correcto;
- aceite nuevo genera prefijo correcto;
- nombre coincidente con catálogo reutiliza existente;
- sistema temporal equivalente reutiliza `tempId`;
- aceite temporal equivalente reutiliza `tempId`;
- mismo aceite temporal usado en varios sistemas;
- referencias retornadas son copias;
- nombre vacío rechazado.

## 36. Pruebas de alta

Cubrir:

- existente/existente;
- existente/nuevo;
- nuevo/existente;
- nuevo/nuevo;
- `draftId` con prefijo correcto;
- sistema duplicado rechazado;
- mismo aceite en otro sistema aceptado;
- input inválido sin mutación parcial;
- orden de inserción;
- editor cierra sólo tras éxito;
- operación bloqueada después de crear.

## 37. Pruebas de edición

Cubrir:

- cambiar sólo aceite;
- cambiar a sistema disponible;
- conservar sistema actual;
- sistema de otra fila rechazado;
- referencias temporales válidas;
- `draftId` y posición conservados;
- error conserva fila anterior;
- no aparece `estadoOperacion`.

## 38. Pruebas de eliminación y opcionalidad

Cubrir:

- quitar una asociación entre varias;
- quitar la última y quedar vacío;
- cero asociaciones es válido;
- resumen vacío;
- payload posterior admite `nuevos: []`;
- sin estado pendiente de eliminación;
- eliminación bloqueada después de crear.

## 39. Pruebas del editor

Cubrir:

- apertura en modo agregar;
- apertura de fila existente;
- fila inexistente rechazada;
- cierre directo cuando está limpio;
- confirmación cuando está dirty;
- continuar conserva selecciones efímeras;
- descartar no altera borrador confirmado;
- overlay incompatible bloqueado.

## 40. No hacer

- No exigir al menos un aceite.
- No seleccionar sistema o aceite por defecto.
- No permitir dos asociaciones del mismo sistema.
- No bloquear un aceite por estar usado en otro sistema.
- No crear cantidades ni campos adicionales.
- No persistir catálogos desde el overlay.
- No usar estados operativos de edición.
- No impedir eliminar la última asociación.
- No avanzar automáticamente al agregar.
- No crear todavía componentes definitivos.
- No consultar ni modificar Supabase.

## 41. Criterios de aceptación

- La sección es válida con cero aceites.
- Cada sistema aparece como máximo una vez.
- Sistemas temporales equivalentes se consideran el mismo sistema.
- Un mismo aceite puede usarse en sistemas diferentes.
- Sistemas ocupados permanecen visibles, muestran `Asignado` y están deshabilitados.
- En edición, una fila no se bloquea contra sí misma.
- Sistemas y aceites nuevos reutilizan referencias temporales equivalentes.
- Alta, edición y eliminación sólo modifican el borrador.
- Eliminar la última asociación está permitido.
- Lista, revisión y payload conservan orden.
- No existen IDs persistidos ficticios ni estados de edición.
- La lógica queda preparada para reutilizar overlay y formulario existentes.
- No se realizaron escrituras parciales ni llamadas remotas adicionales.

## 42. Resultado esperado

Al finalizar la implementación de este spec, el paso Aceites tendrá esta lógica:

```text
Lista vacía
    ├── válida
    └── Agregar aceite
            |
            v
Elegir/crear sistema
    ├── disponible → seleccionable
    └── ya usado   → badge Asignado + disabled
            |
            v
Elegir/crear aceite
    └── puede repetirse en otros sistemas
            |
            v
Agregar al borrador
    ├── editar sistema/aceite localmente
    └── eliminar incluso la última asociación
```

La creación de sistemas, aceites y relaciones seguirá ocurriendo exclusivamente dentro de `rpc_crear_equipo_completo` en un spec posterior.
