# SPEC-01 — Contratos TypeScript, mapper y servicio

## Objetivo

Definir una frontera tipada entre las RPC objetivo en `snake_case` y el dominio Vue en `camelCase`.

## Dependencia

Implementar después de `SPEC-00`.

## Archivos

```txt
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.mappers.test.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.service.test.ts
```

## Dominio UI

```ts
export type CatalogoAceiteEstado = "activos" | "desactivados" | "todos";
export type CatalogoAceiteUso = "en-uso" | "sin-uso" | "todos";
export type CatalogoAceiteSortKey =
  | "nombre" | "sistemas" | "estado" | "equipos" | "asignaciones";
export type CatalogoSortDirection = "asc" | "desc";

export interface CatalogoSistemaRelacionado {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoTipoEquipoImpacto {
  id: number;
  nombre: string;
  cantidadEquipos: number;
}

export interface CatalogoAceiteImpacto {
  totalEquipos: number;
  totalAsignaciones: number;
  tiposEquipo: CatalogoTipoEquipoImpacto[];
}

export interface CatalogoAceiteItem {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string | null;
  actualizadoEn: string | null;
  sistemas: CatalogoSistemaRelacionado[];
  impacto: CatalogoAceiteImpacto;
}

export interface CatalogoAceitesResumen {
  total: number;
  activos: number;
  desactivados: number;
}
```

## Listado RPC

Objetivo:

```txt
rpc_catalogo_aceites_listar()
```

```ts
export interface CatalogoAceiteRpcItem {
  id: number;
  nombre: string;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
  sistemas: Array<{
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

export interface CatalogoAceitesListarRpcResponse {
  ok: boolean;
  items: CatalogoAceiteRpcItem[];
  resumen: {
    total: number;
    activos: number;
    desactivados: number;
  };
}
```

El mapper valida raíz, `ok`, arreglos, booleanos, IDs positivos, cantidades finitas no negativas y nombre recortado no vacío. Timestamps inválidos pasan a `null`. No usar `any`, ocultar errores estructurales ni inventar relaciones.

## Guardado RPC

Objetivo:

```txt
rpc_catalogo_aceite_guardar(p_data jsonb)
```

```ts
export interface CatalogoAceiteGuardarInput {
  id: number | null;
  nombre: string;
  activo: boolean;
}

export interface CatalogoAceiteGuardarRpcResponse {
  ok: boolean;
  operacion: "creado" | "actualizado";
  codigo: "ACEITE_CREADO" | "ACEITE_ACTUALIZADO";
  mensaje: string;
  afecta_equipos: number;
  item: CatalogoAceiteRpcItem;
}

export interface CatalogoAceiteGuardarResultado {
  operacion: "creado" | "actualizado";
  codigo: "ACEITE_CREADO" | "ACEITE_ACTUALIZADO";
  mensaje: string;
  afectaEquipos: number;
  item: CatalogoAceiteItem;
}
```

Enviar únicamente `{ p_data: { id, nombre: nombre.trim(), activo } }`. Nunca enviar sistema, sistemas, equipos, tipos de equipo o impacto.

## Servicio

```ts
export const aceitesCatalogoService = {
  listar(): Promise<{
    items: CatalogoAceiteItem[];
    resumen: CatalogoAceitesResumen;
  }>;
  guardar(input: CatalogoAceiteGuardarInput):
    Promise<CatalogoAceiteGuardarResultado>;
};
```

- Usar `.schema("engrase").rpc(...)` únicamente en `.service.ts`.
- No usar `.from("aceite")` ni consultar `equipo_aceite` por separado.
- Listado y guardado comparten mapper de item.
- Diferenciar transporte, contrato inválido y error funcional.
- Servicio sin toasts ni estado visual.

## Contrato objetivo pendiente

Las RPC son el contrato objetivo documentado, no una disponibilidad verificada. Se permite avanzar con tipos, mappers, pruebas y fixtures/adaptador de desarrollo explícitos. El servicio de producción nunca simula éxito.

## Errores esperados

```txt
AUTENTICACION_REQUERIDA
PAYLOAD_INVALIDO
REGISTRO_NO_ENCONTRADO
ACEITE_NOMBRE_REQUERIDO
ACEITE_NOMBRE_DUPLICADO
ACEITE_NO_ENCONTRADO
```

## Pruebas

- Mapea sistemas e impacto completos.
- Conserva cero equipos/asignaciones y listas vacías.
- Convierte propiedades en ambos sentidos.
- Rechaza payload esencial inválido.
- Listar se llama sin filtros funcionales.
- Guardar envía solo ID, nombre y activo.
- La respuesta de guardado reutiliza el mapper de listado.

## Criterios de aceptación

- Sin `any`.
- UI `camelCase`; RPC `snake_case`.
- Todas las llamadas viven en el servicio.
- No se consulta ni modifica ninguna asociación por separado.

