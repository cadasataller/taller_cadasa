# Specs — Tipos de filtro

> Sección: Catálogo de filtros y engrase / Tipos de filtro
>
> Stack: Vue 3 + TypeScript estricto + Pinia + Tailwind CSS
>
> Referencia visual: `../../catalogo_tipo_filtro.png`

## Objetivo

Implementar progresivamente la primera sección funcional del Catálogo sin modificar asociaciones de equipos.

El tipo de filtro administra únicamente:

```txt
nombre
activo
```

Los tipos de equipo, cantidades, equipos afectados y asignaciones son información de solo lectura.

## Dependencia

Implementar después de:

```txt
../general/SPEC-00-vista-general-catalogo.md
```

## Orden de implementación

1. [SPEC-00 — Alcance y reglas base](SPEC-00-alcance-reglas-base.md)
2. [SPEC-01 — Contratos, mapper y servicio](SPEC-01-contratos-mapper-servicio.md)
3. [SPEC-02 — Store Pinia y composable](SPEC-02-store-composable-filtros.md)
4. [SPEC-03 — Toolbar y tabla desktop ERP](SPEC-03-toolbar-tabla-desktop.md)
5. [SPEC-04 — Lista mobile responsive](SPEC-04-lista-mobile-responsive.md)
6. [SPEC-05 — Drawer, detalle y formulario](SPEC-05-drawer-detalle-formulario.md)
7. [SPEC-06 — Confirmación, guardado y errores](SPEC-06-confirmacion-guardado-errores.md)
8. [SPEC-07 — Integración y pruebas](SPEC-07-integracion-pruebas-aceptacion.md)

## Reglas transversales

- No consultar ni modificar asociaciones desde esta sección.
- No implementar SQL ni verificar Supabase desde estos specs.
- El contrato RPC descrito en `contexto.md` es un contrato objetivo pendiente.
- Filtrar y ordenar localmente después de una sola carga.
- Abrir Detalles sin una segunda consulta.
- Desktop ERP: tabla compacta, texto `xs/sm`, controles de `32px` a `36px`.
- Mobile: cards, texto `sm`, targets táctiles mínimos de `44px`.
- Todo control clickeable habilitado debe tener `cursor-pointer`.
- Todo control deshabilitado debe usar `disabled` y `cursor-not-allowed`.
- Usar iconos de `lucide-vue-next`, nunca emoji.
- La imagen guía la composición; `contexto.md` prevalece para reglas funcionales.
