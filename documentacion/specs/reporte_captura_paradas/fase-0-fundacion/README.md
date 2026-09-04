# Fase 0 — Fundación técnica y límites de integración

## Objetivo

Dejar lista la base de integración del reporte antes de construir su UI:

- encaje correcto dentro de `DefaultLayout`;
- cliente exclusivo para Captura Operador;
- contratos remotos validados;
- types, mappers, servicios y estado inicial sin datos ambiguos;
- ruta y permiso confirmados.

## Orden de implementación

1. [SPEC-00 — Alcance, layout, ruta y permisos](SPEC-00-alcance-layout-ruta-permisos.md)
2. [SPEC-01 — Cliente Supabase Captura Operador](SPEC-01-cliente-supabase-captura-operador.md)
3. [SPEC-02 — Contratos, Zod, types y mappers](SPEC-02-contratos-zod-types-mappers.md)
4. [SPEC-03 — Servicios, store y pruebas de base](SPEC-03-servicios-store-pruebas-base.md)

## Criterio de cierre de fase

La fase queda cerrada cuando `SlideActividadEquipo` puede cargar y validar el listado de equipos, seleccionar un equipo, pedir su detalle/contexto/resumen en paralelo y exponer estados tipados al shell. No es necesario entregar todavía la UI final de las tres columnas; esa construcción inicia en la fase 1.
