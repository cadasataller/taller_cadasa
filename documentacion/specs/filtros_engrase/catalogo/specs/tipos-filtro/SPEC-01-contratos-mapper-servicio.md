# SPEC-01 — Contratos TypeScript, mapper y servicio

## Objetivo

Definir una frontera tipada entre el contrato RPC objetivo y el estado utilizado por Vue.

## Dependencia

Implementar después de `SPEC-00`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.mappers.test.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.service.test.ts
```

## Contratos de dominio

```ts
export type CatalogoEstadoFiltro = "activos" | "desactivados" | "todos";
export type CatalogoTipoFiltroSortKey = "nombre" | "estado" | "uso";
export type CatalogoSortDirection = "asc" | "desc";

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoTipoFiltroItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  impacto: CatalogoImpacto;
}

export interface CatalogoTiposFiltroResumen {
  total: number;
  activos: number;
  desactivados: number;
}
```

Separar contratos RPC `snake_case` de modelos UI `camelCase`. No usar `any`.

## Contrato de listado

RPC objetivo:

```txt
rpc_catalogo_tipos_filtro_listar()
```

```ts
export interface CatalogoTipoEquipoImpactoRpc {
  id: number;
  nombre: string;
  cantidad_equipos: number;
}

export interface CatalogoTipoFiltroRpcItem {
  id: number;
  nombre: string;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  impacto: {
    total_equipos: number;
    total_asignaciones: number;
    tipos_equipo: CatalogoTipoEquipoImpactoRpc[];
  };
}

export interface CatalogoTiposFiltroListarRpcResponse {
  ok: boolean;
  items: CatalogoTipoFiltroRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
  };
}
```

El mapper debe validar:

- objeto raíz válido y `ok === true`;
- `items` como arreglo;
- IDs y cantidades numéricas finitas y no negativas;
- textos recortados;
- `activo` booleano;
- timestamps inválidos como `null`;
- estructura esencial incompleta como error claro.

Los arreglos informativos ausentes solo se transforman en `[]` si la tolerancia queda probada. No usar valores ficticios para ocultar un contrato inválido.

## Contrato de guardado

RPC objetivo:

```txt
rpc_catalogo_tipo_filtro_guardar(p_data jsonb)
```

```ts
export interface CatalogoTipoFiltroGuardarInput {
  id: number | null;
  nombre: string;
  activo: boolean;
}

export interface CatalogoTipoFiltroGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "TIPO_FILTRO_CREADO" | "TIPO_FILTRO_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoTipoFiltroItem;
}

export interface CatalogoTipoFiltroGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "TIPO_FILTRO_CREADO" | "TIPO_FILTRO_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoTipoFiltroRpcItem;
}
```

Enviar exclusivamente:

```txt
id
nombre recortado
activo
```

No enviar impacto, tipos de equipo, equipos ni asignaciones.

## Servicio

API propuesta:

```ts
export const tiposFiltroCatalogoService = {
  listar(): Promise<{
    items: CatalogoTipoFiltroItem[];
    resumen: CatalogoTiposFiltroResumen;
  }>;
  guardar(input: CatalogoTipoFiltroGuardarInput):
    Promise<CatalogoTipoFiltroGuardarResultado>;
};
```

Reglas:

- Usar `supabaseEquipos.schema("engrase").rpc(...)` solo en `.service.ts`.
- No usar `.from("tipo_filtro")` como atajo desde frontend.
- No consultar asociaciones desde el servicio.
- Guardado y listado comparten el mismo mapper de item.
- Distinguir transporte, respuesta inválida y código funcional.
- No mostrar toasts desde el servicio.

## Dependencia externa pendiente

`contexto.md` declara las RPC como contrato objetivo pendiente. Este spec no confirma su existencia.

Progresión permitida:

1. Crear tipos, mappers y pruebas con fixtures locales.
2. Construir UI contra un adaptador/fixture explícito de desarrollo.
3. Activar servicio real solo cuando el contrato esté disponible.

Nunca simular éxito dentro del servicio de producción.

## Códigos de error

```txt
AUTENTICACION_REQUERIDA
PAYLOAD_INVALIDO
REGISTRO_NO_ENCONTRADO
TIPO_FILTRO_NOMBRE_REQUERIDO
TIPO_FILTRO_NOMBRE_DUPLICADO
TIPO_FILTRO_NO_ENCONTRADO
```

## Pruebas

- Mapea listado válido.
- Conserva cero equipos y asignaciones.
- Convierte timestamps ausentes a `null`.
- Rechaza raíz o item esencial inválido.
- Lista sin parámetros funcionales.
- Guarda con `{ p_data: input }`.
- Nunca incluye propiedades informativas en escritura.
- Preserva código funcional para que la UI lo traduzca.

## Criterios de aceptación

- No existe `any` en contratos ni mappers.
- El dominio UI usa `camelCase`.
- Todas las llamadas están en el servicio.
- Listado y guardado comparten mapper.
- No se consulta ni modifica ninguna asociación.
