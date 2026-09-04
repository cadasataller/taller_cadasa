# SPEC-02 — Contratos, Zod, types y mappers

> Fase: 0 — Fundación técnica y límites de integración

## Objetivo

Modelar y validar estrictamente las respuestas de la Edge Function y RPCs existentes antes de que lleguen al estado reactivo o a componentes Vue.

## Fuentes obligatorias

```txt
documentacion/reporte_captura_paradas/documentacion_backend_reporte_equipos.md
documentacion/reporte_captura_paradas/documentacion_rpc_bd_equipos.md
```

Los nombres de parámetros, campos y semántica deben coincidir exactamente con esas fuentes. No se infieren campos desde el HTML ni se generan datos de relleno.

## Ubicación propuesta

```txt
src/stores/dashboard/reporte-equipos/
├── reporteEquipos.types.ts
├── reporteEquipos.schemas.ts
├── reporteEquipos.mappers.ts
└── reporteEquipos.service.ts

src/composables/dashboard/useReporteEquiposView.ts
```

Los DTOs remotos, schemas Zod, modelos de UI y mappers son capas distintas. Un componente no recibe JSONB crudo.

## Contratos mínimos

Se deben crear schemas y DTOs para:

```txt
BuscarEquiposReporteResponse
ReporteEquipoContextoResponse
ReporteEquipoResumenResponse
ReporteEquipoParadasResponse
ReporteEquipoOperadoresResponse
ReporteEquipoOperadorDetalleResponse
ReporteEquipoDetalleResponse
```

También se tipan los parámetros exactos:

```ts
interface ReportDateRangeParams {
  p_equipo: string;
  p_desde: string;
  p_hasta: string;
}

interface OperatorDetailParams extends ReportDateRangeParams {
  p_operador: string;
}
```

Los parámetros de la Edge Function son independientes y usan `desde`/`hasta`, no `p_desde`/`p_hasta`.

## Reglas de validación

- Validar toda respuesta con `safeParse` de Zod en el service.
- Convertir un error de validación a un error de dominio tipado y accionable.
- No usar `any`, `unknown`, `Record<string, unknown>` ni assertions para eludir el parseo.
- Permitir explícitamente los `null` documentados: jornadas y tiempo de la Edge Function cuando falle su enriquecimiento, además de atributos maestros opcionales como modelo, marca, imagen e implemento.
- Persistir segundos como número para ordenamiento y cálculos; `HH:MM` se conserva como texto de presentación retornado por backend.
- Mantener timestamps crudos del backend y formatearlos en un helper de presentación con zona `America/Panama` cuando sea necesario.

## Modelos de UI mínimos

La fase 0 produce modelos enfocados en la primera carga de Resumen:

```txt
EquipmentListItem
EquipmentMasterDetail
EquipmentContext
EquipmentSummary
ReportFilters
ReportLoadState
ReportTab
```

`ReportTab` es exactamente:

```ts
type ReportTab = "resumen" | "paradas" | "operadores";
```

Los contratos de Paradas y Operadores se modelan desde ahora, aunque sus vistas se construyan en fases posteriores. Esto evita reinterpretar el RPC al llegar a cada pestaña.

## Criterios de aceptación

- Cada respuesta remota tiene schema Zod, DTO y mapper tipados.
- Los campos opcionales y nulos documentados no rompen el parseo.
- Los mappers no inventan valores ni convierten un dato faltante en cero.
- No llega JSONB crudo a Vue, Pinia ni templates.
