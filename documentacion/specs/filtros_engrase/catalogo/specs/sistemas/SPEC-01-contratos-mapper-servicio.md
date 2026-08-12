# SPEC-01 — Contratos TypeScript, mapper y servicio

## Objetivo

Definir una frontera tipada entre el contrato RPC `snake_case` y el dominio UI `camelCase`.

## Dependencia

Implementar después de `SPEC-00`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.mappers.test.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.service.test.ts
```

## Dominio UI

```ts
export type CatalogoSistemaEstado = "activos" | "desactivados" | "todos";
export type CatalogoSistemaUso = "en-uso" | "sin-uso" | "todos";
export type CatalogoSistemaSortKey =
  | "nombre" | "estado" | "equipos" | "asignaciones";
export type CatalogoSortDirection = "asc" | "desc";

export interface CatalogoAceiteRelacionado {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoSistemaImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoSistemaItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  aceites: CatalogoAceiteRelacionado[];
  impacto: CatalogoSistemaImpacto;
}

export interface CatalogoSistemasResumen {
  total: number;
  activos: number;
  desactivados: number;
}
```

## Listado RPC

```txt
rpc_catalogo_sistemas_listar()
```

```ts
export interface CatalogoSistemaRpcItem {
  id: number;
  nombre: string;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  aceites: Array<{
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

export interface CatalogoSistemasListarRpcResponse {
  ok: boolean;
  items: CatalogoSistemaRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
  };
}
```

El mapper valida raíz, `ok`, arrays, booleanos, IDs positivos, conteos finitos no negativos y nombre recortado no vacío. Timestamps inválidos pasan a `null`. No usar `any` ni inventar datos.

## Guardado RPC

```txt
rpc_catalogo_sistema_guardar(p_data jsonb)
```

```ts
export interface CatalogoSistemaGuardarInput {
  id: number | null;
  nombre: string;
  activo: boolean;
}

export interface CatalogoSistemaGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "SISTEMA_CREADO" | "SISTEMA_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoSistemaRpcItem;
}

export interface CatalogoSistemaGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "SISTEMA_CREADO" | "SISTEMA_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoSistemaItem;
}
```

Enviar solo `{ p_data: { id, nombre: nombre.trim(), activo } }`. No enviar aceites, equipos, tipos de equipo o impacto.

## Servicio

```ts
export const sistemasCatalogoService = {
  listar(): Promise<{
    items: CatalogoSistemaItem[];
    resumen: CatalogoSistemasResumen;
  }>;
  guardar(input: CatalogoSistemaGuardarInput):
    Promise<CatalogoSistemaGuardarResultado>;
};
```

- `.schema("engrase").rpc(...)` solo en `.service.ts`.
- No `.from("sistema_aceite")` ni consulta separada de relaciones.
- Listar y guardar comparten mapper de item.
- Separar transporte, contrato inválido y error funcional.
- Servicio sin toasts.

## Contrato objetivo pendiente

Las RPC no se verifican. Avanzar con tipos, mapper, pruebas y fixture/adaptador de desarrollo explícito; el servicio productivo nunca simula éxito.

## Errores

```txt
AUTENTICACION_REQUERIDA
PAYLOAD_INVALIDO
REGISTRO_NO_ENCONTRADO
SISTEMA_NOMBRE_REQUERIDO
SISTEMA_NOMBRE_DUPLICADO
SISTEMA_NO_ENCONTRADO
```

## Pruebas y aceptación

- Mapea aceites, impacto, ceros y listas vacías.
- Rechaza estructura esencial inválida.
- Listado se llama sin filtros.
- Guardado envía solo ID, nombre y activo.
- Respuesta de guardado reutiliza el mapper.
- Sin `any`; UI `camelCase`; RPC `snake_case`.
- Ninguna asociación se consulta o escribe por separado.

