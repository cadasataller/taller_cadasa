# Implementación de Engrase / Filtros

Esta carpeta contiene el contexto funcional, la referencia visual y las specs incrementales para implementar la primera vista de filtros de Engrase.

## Alcance

La primera entrega es exclusivamente de lectura y filtrado. No incluye creación, edición ni eliminación, aunque la base de datos disponga de permisos de escritura para fases posteriores.

## Orden de implementación

1. [SPEC-00 — Base, navegación y permisos](SPEC-00-base-navegacion-permisos.md)
2. [SPEC-01 — Contratos y servicio Supabase](SPEC-01-contratos-servicio-supabase.md)
3. [SPEC-02 — Store Pinia y orquestación](SPEC-02-store-orquestacion.md)
4. [SPEC-03 — Filtro superior](SPEC-03-filtro-superior.md)
5. [SPEC-04 — Panel lateral de equipos](SPEC-04-panel-equipos.md)
6. [SPEC-05 — Panel central de filtros](SPEC-05-panel-filtros-equipo.md)
7. [SPEC-06 — Panel derecho de detalle](SPEC-06-panel-detalle-filtro.md)
8. [SPEC-07 — Integración responsive y estados](SPEC-07-integracion-responsive-estados.md)
9. [SPEC-08 — Pruebas y aceptación](SPEC-08-pruebas-aceptacion.md)

## Fuentes obligatorias

```txt
context.md
context_2.md
context_view_vault.md
mockup_filtros_view.png
```

## Decisiones consolidadas

- Ruta: `/engrase/filtros`.
- Permiso del módulo: `module_engrase`.
- Permiso de lectura: `ver_filtros_engrase`.
- Permiso futuro de escritura: `editar_filtros_engrase`.
- `tipo_equipo` se presenta como **Tipo de equipo**.
- `subtipo` se presenta como **Modelo**.
- Activos se muestran por defecto.
- Descartados se incluyen solamente cuando el usuario los selecciona.
- Equipos sin etapas muestran `Sin etapa`.
- Las sugerencias de código aceptan coincidencia parcial.
- La búsqueda definitiva se ejecuta con coincidencia exacta al seleccionar una sugerencia.
- Las equivalencias muestran solo códigos; no fabricantes.
- La vista no muestra controles de escritura.

