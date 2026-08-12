# SPEC-01 — Contratos TypeScript, mapper y servicio

## Objetivo

Crear una frontera estrictamente tipada entre el contrato RPC objetivo en `snake_case` y el dominio UI en `camelCase`.

## Dependencia

Implementar después de `SPEC-00`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.mappers.test.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.service.test.ts
```

## Dominio UI

```ts
export type CatalogoFiltroEstado = "activos" | "desactivados" | "todos";
export type CatalogoFiltroCompras = "en-compras" | "fuera-compras" | "todos";
export type CatalogoFiltroSortKey =
  | "codigo" | "compras" | "estado" | "equipos" | "asignaciones";
export type CatalogoSortDirection = "asc" | "desc";

export interface CatalogoTipoFiltroRelacionado {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoFiltroImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoFiltroItem {
  id: number;
  codigo: string;
  estaEnListaCompras: boolean;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  tiposFiltro: CatalogoTipoFiltroRelacionado[];
  impacto: CatalogoFiltroImpacto;
}

export interface CatalogoFiltrosResumen {
  total: number;
  activos: number;
  desactivados: number;
  enCompras: number;
  fueraCompras: number;
}
```

## Contrato RPC de listado

```txt
rpc_catalogo_filtros_listar()
```

```ts
export interface CatalogoFiltroRpcItem {
  id: number;
  codigo: string;
  esta_en_lista_compras: boolean;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  tipos_filtro: Array<{
    id: number;
    nombre: string;
    cantidad_equipos: number;
  }>;
  impacto: {
    total_equipos: number;
    total_asignaciones: number;
    tipos_equipo: Array<{
      id: number;
      nombre: string;
      cantidad_equipos: number;
    }>;
  };
}

export interface CatalogoFiltrosListarRpcResponse {
  ok: boolean;
  items: CatalogoFiltroRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
    en_compras: number;
    fuera_compras: number;
  };
}
```

El mapper valida raíz, `ok`, arreglos, booleanos, IDs positivos, conteos finitos no negativos y código recortado no vacío. Timestamps ausentes o inválidos pasan a `null`; una estructura esencial inválida produce error explícito. No usar `any` ni datos inventados.

## Contrato de guardado

RPC objetivo:

```txt
rpc_catalogo_filtro_guardar(p_data jsonb)
```

```ts
export interface CatalogoFiltroGuardarInput {
  id: number | null;
  codigo: string;
  esta_en_lista_compras: boolean;
  activo: boolean;
}

export interface CatalogoFiltroGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "FILTRO_CREADO" | "FILTRO_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoFiltroRpcItem;
}

export interface CatalogoFiltroGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "FILTRO_CREADO" | "FILTRO_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoFiltroItem;
}
```

Enviar exclusivamente `{ p_data: { id, codigo: codigo.trim(), esta_en_lista_compras, activo } }`. No enviar tipos, equipos, impacto, equivalencias ni asignaciones.

## Servicio

```ts
export const filtrosCatalogoService = {
  listar(): Promise<{
    items: CatalogoFiltroItem[];
    resumen: CatalogoFiltrosResumen;
  }>;
  guardar(input: CatalogoFiltroGuardarInput):
    Promise<CatalogoFiltroGuardarResultado>;
};
```

- Únicamente `.schema("engrase").rpc(...)` dentro de `.service.ts`.
- No usar `.from("filtro")` ni consultar relaciones por separado.
- Listar y guardar comparten mapper de item.
- Separar error de transporte, contrato inválido y código funcional.
- Servicio sin toasts ni estado visual.

## Contrato objetivo pendiente

`contexto.md` declara estas RPC como objetivo, no como disponibilidad comprobada. Progresión permitida:

1. tipos, mapper y pruebas con fixtures locales;
2. UI mediante adaptador de desarrollo explícito;
3. activar servicio real cuando exista el contrato.

Nunca devolver éxito simulado desde el servicio de producción.

## Errores esperados

```txt
AUTENTICACION_REQUERIDA
PAYLOAD_INVALIDO
REGISTRO_NO_ENCONTRADO
CODIGO_FILTRO_REQUERIDO
CODIGO_FILTRO_DUPLICADO
FILTRO_NO_ENCONTRADO
```

## Pruebas

- Mapea listado, tipos relacionados e impacto completos.
- Distingue equipos distintos de asignaciones.
- Conserva valores cero y listas vacías.
- Convierte los nombres de propiedades en ambos sentidos.
- Rechaza payload esencial inválido.
- Listar no envía filtros.
- Guardar solo envía los cuatro campos permitidos.
- Conserva el código funcional para la capa UI.

## Criterios de aceptación

- Sin `any`.
- UI en `camelCase`; RPC en `snake_case`.
- Todas las llamadas viven en el servicio.
- Ninguna asociación se consulta por separado ni se escribe.
