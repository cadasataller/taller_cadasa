# SPEC-01 — Contratos, tipos, mappers y servicios de edición

## 1. Objetivo

Crear la base estrictamente tipada para consumir las RPC de edición de equipos del esquema `engrase`, sin implementar todavía la pantalla, el store del borrador ni los drawers.

Este spec es el primer paso obligatorio. Ningún componente de edición debe consumir directamente Supabase ni declarar versiones locales de estos contratos.

## 2. Fuentes de verdad

- `context.md`: responsabilidades generales de cada RPC.
- `context_payload_rpc.md`: nombres de parámetros, payloads, respuestas y errores.
- `context_view.md`: reglas funcionales de la edición.
- Las imágenes de esta carpeta son referencias visuales; no agregan campos que no existan en los contratos.
- La búsqueda de filtros se realiza únicamente por código original. Debe ignorarse cualquier texto visual que mencione equivalencias.

## 3. Dependencias y orden

- No depende de otro spec de esta carpeta.
- Debe completarse antes de `SPEC-02` a `SPEC-08`.
- No requiere cambios de esquema ni migraciones SQL.

## 4. Alcance

Incluye:

- tipos de dominio y DTO de las cinco RPC;
- contratos del borrador que serán compartidos por store, composables y UI;
- mappers explícitos y puros;
- funciones de servicio para lectura, búsqueda, actualización e imagen;
- catálogo central de códigos de error;
- helpers para crear `temp_id`;
- pruebas unitarias de mappers y servicios.

No incluye:

- ruta de edición;
- estado Pinia;
- componentes Vue;
- carga de imágenes o movimiento físico en Storage;
- cambios a RPC o tablas.

## 5. Archivos

Crear:

```text
src/stores/dbequipos/engrase/edicion/
├── equipoEngraseEdicion.types.ts
├── equipoEngraseEdicion.mappers.ts
├── equipoEngraseEdicion.service.ts
├── equipoEngraseEdicion.errors.ts
├── equipoEngraseEdicion.tempIds.ts
├── equipoEngraseEdicion.mappers.test.ts
└── equipoEngraseEdicion.service.test.ts
```

Si los tipos generados de Supabase no contienen las RPC del esquema `engrase`, actualizar el mecanismo de tipos generado usado por el proyecto. No crear definiciones parciales basadas en `any`.

## 6. Reglas técnicas obligatorias

- Usar TypeScript estricto.
- Está prohibido declarar, inferir deliberadamente, convertir o propagar `any` o `unknown` en todos los archivos creados o modificados por este spec.
- No usar `as any`, `as unknown`, `Record<string, unknown>`, parámetros sin tipo ni respuestas RPC sin contrato.
- No duplicar interfaces equivalentes con nombres diferentes.
- Usar uniones discriminadas para estados y respuestas alternativas.
- Los mappers reciben DTO concretos y devuelven modelos concretos.
- Los componentes futuros no deberán conocer la forma cruda de Supabase.
- No realizar queries desde componentes.
- No exponer claves `service_role` en frontend.
- No agregar dependencias nuevas.

## 7. Contratos base

Definir, como mínimo:

```ts
export type EquipoEstado = "activo" | "descartado"
export type EntidadDraftEstado = "existente" | "nuevo"
export type OperacionDraft =
  | "existente"
  | "nuevo"
  | "actualizado"
  | "pendiente_eliminacion"

export interface CatalogoIdNombre {
  id: number
  nombre: string
}

export interface EquipoEdicionDatos {
  id: number
  codigo: string
  tipoEquipoId: number
  tipoEquipo: string
  subtipo: string
  estado: EquipoEstado
}

export interface EquipoEdicionFiltro {
  id: number
  equipoId: number
  tipoFiltro: CatalogoIdNombre
  filtro: {
    id: number
    codigo: string
    estaEnListaCompras: boolean
  }
  cantidad: number
  cantidadEquivalencias: number
}

export interface EquipoEdicionAceite {
  equipoAceiteId: number
  sistema: CatalogoIdNombre
  aceite: CatalogoIdNombre
}
```

`subtipo` debe normalizarse como cadena editable. En la UI representa indistintamente modelo, subtipo o descripción del equipo. No crear tres campos distintos.

## 8. RPC de carga del equipo

Servicio:

```ts
obtenerEquipoParaEdicion(codigo: string): Promise<EquipoParaEdicion>
```

Debe llamar:

```json
{
  "p_codigo": "410002"
}
```

Debe mapear:

- `equipo`;
- `etapas`;
- `filtros`;
- `aceites`.

Todos los arreglos ausentes o vacíos deben resolverse según el contrato real. No inventar registros por defecto. La respuesta `ok: false`, si alguna vez es incorporada por backend, debe tratarse como error y no como equipo vacío.

Error funcional conocido:

```text
EQUIPO_NO_ENCONTRADO: <codigo>
```

## 9. RPC de auxiliares

Servicio:

```ts
obtenerAuxiliaresEdicionEquipo(): Promise<AuxiliaresEdicionEquipo>
```

Debe mapear:

- tipos de equipo con `subtipos_sugeridos`;
- etapas;
- tipos de filtro con `tipos_equipo_que_lo_usan`;
- sistemas de aceite;
- aceites.

Los arreglos se conservan como `[]`. No convertirlos en `null`.

## 10. RPC de búsqueda de filtro original

Servicio:

```ts
buscarFiltroOriginalParaAsignar(
  codigo: string,
  codigoEquipo?: string,
): Promise<ResultadoBusquedaFiltroOriginal>
```

Definir una unión discriminada para estos casos:

```ts
type ResultadoBusquedaFiltroOriginal =
  | ResultadoFiltroNoEncontrado
  | ResultadoFiltroEncontrado
```

El resultado encontrado debe conservar:

- filtro;
- `requiereSeleccionarTipo`;
- `sinTiposRegistrados`;
- tipos posibles;
- `yaAsignadoAlEquipo` por cada tipo;
- `equipoFiltroActual` cuando exista.

Reglas:

- enviar `p_codigo_equipo` al agregar desde la edición;
- no buscar equivalencias;
- no implementar sugerencias por nombre;
- no reutilizar `buscarSugerenciasCodigo` del listado, porque su contrato incluye equivalencias y no representa este flujo.

## 11. RPC de actualización integral

Servicio:

```ts
actualizarEquipoCompleto(
  codigoEquipoOriginal: string,
  cambios: CambiosEquipoPayload,
): Promise<ActualizarEquipoCompletoRespuesta>
```

`CambiosEquipoPayload` debe permitir omitir todas las secciones:

```ts
export interface CambiosEquipoPayload {
  datos_equipo?: DatosEquipoCambiosPayload
  etapas?: EtapasCambiosPayload
  filtros?: FiltrosCambiosPayload
  aceites?: AceitesCambiosPayload
}
```

También deben ser opcionales las colecciones internas:

```ts
export interface FiltrosCambiosPayload {
  nuevos?: FiltroNuevoPayload[]
  actualizados?: FiltroActualizadoPayload[]
  eliminados?: FiltroEliminadoPayload[]
}
```

La implementación futura enviará únicamente propiedades modificadas. Este servicio no debe completar secciones vacías automáticamente.

La respuesta debe mapear:

- `equipo_lista` al `EquipoEngraseListItem` ya utilizado por el listado;
- `cambios_detalle`;
- `resumen_operaciones`;
- código y mensaje.

## 12. RPC de imagen

Servicio:

```ts
administrarImagenEquipo(
  entrada: AdministrarImagenEquipoEntrada,
): Promise<AdministrarImagenEquipoRespuesta>
```

Operaciones admitidas:

```ts
type OperacionImagenEquipo = "agregar" | "actualizar" | "eliminar"
```

Usar unión discriminada para impedir combinaciones inválidas:

- `agregar` y `actualizar` requieren `storagePath` terminado en `.webp`;
- `eliminar` usa `storagePath: null` y `descripcion: null`.

La respuesta debe conservar:

- código y equipo ID;
- operación;
- imagen resultante;
- `storagePathAnterior`.

El servicio RPC no sube, mueve ni elimina archivos físicos. Esa coordinación corresponde al `SPEC-07`.

## 13. IDs temporales

Crear helpers específicos:

```ts
crearTempId("equipo_filtro")
crearTempId("tipo_filtro")
crearTempId("filtro")
crearTempId("equipo_aceite")
crearTempId("sistema_aceite")
crearTempId("aceite")
crearTempId("tipo_equipo")
```

Formato esperado:

```text
tmp_equipo_filtro_<identificador>
```

Los IDs deben ser únicos durante la sesión de edición y estables mientras el elemento permanezca en el borrador.

## 14. Errores

Crear un mapa tipado de códigos funcionales conocidos. El servicio debe preservar el código original para que la capa de presentación pueda traducirlo.

No depender únicamente de coincidencias parciales de mensajes. Cuando el backend devuelva texto con detalle, separar el prefijo funcional sin perder el mensaje completo.

Errores mínimos a contemplar:

- autenticación requerida;
- equipo no encontrado;
- código duplicado;
- subtipo requerido;
- etapa mínima;
- filtro mínimo;
- cantidad inválida;
- datos duplicados;
- archivo inexistente;
- operación de imagen inválida.

## 15. Pruebas

Cubrir al menos:

- mapeo completo de cada respuesta de ejemplo;
- arreglos vacíos;
- filtro encontrado con un tipo;
- filtro encontrado con múltiples tipos;
- filtro existente sin tipos;
- filtro no encontrado;
- payload parcial con una sola sección;
- respuesta `equipo_lista` compatible con el store existente;
- unión de imagen impidiendo entradas inválidas en compilación;
- preservación de códigos de error.

Los mocks deben estar completamente tipados. No usar `any` ni `unknown` en datos de prueba.

## 16. Criterios de aceptación

- Existen contratos únicos para las cinco RPC.
- Ningún archivo del spec contiene `any` ni `unknown`.
- `pnpm typecheck` finaliza correctamente.
- Las pruebas del spec pasan.
- La búsqueda sólo contempla código original.
- El payload de actualización no agrega secciones vacías.
- Los servicios no contienen estado visual ni reglas de componentes.
- No se agregó UI ni se modificó el comportamiento del listado.

