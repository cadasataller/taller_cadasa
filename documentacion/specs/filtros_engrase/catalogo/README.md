# Specs — Catálogo de filtros y engrase

> Módulo funcional: Equipos / Engrase / Filtros
>
> Entrada: menú desplegable del panel **Equipos** → **Ver catálogo**
> Ruta base propuesta: `/engrase/filtros/catalogo`

## Propósito

Esta carpeta divide la implementación del Catálogo de engrase en entregas pequeñas e independientes.

El Catálogo pertenece a la subpestaña **Filtros** del módulo Engrase. No pertenece a la ruta global `/catalogo` ni utiliza el módulo funcional `module_catalog`.

La regla transversal del dominio es:

> El Catálogo administra objetos maestros. La edición de equipos administra las asociaciones entre esos objetos y los equipos.

## Fuentes obligatorias

Antes de implementar cualquier spec de esta carpeta, leer:

```txt
documentacion/specs/filtros_engrase/catalogo/contexto.md
documentacion/specs/filtros_engrase/catalogo/catalogo_tipo_filtro.png
documentacion/specs/filtros_engrase/catalogo/catalogo_filtro.png
documentacion/specs/filtros_engrase/catalogo/catalogo_aceite.png
documentacion/specs/filtros_engrase/catalogo/catalogo_sistemas.png
documentacion/specs/filtros_engrase/catalogo/catalogo_modal_confirmacion.png
```

Las imágenes son referencias de composición y jerarquía. Cuando exista una diferencia funcional, prevalece `contexto.md`.

## Organización incremental

```txt
specs/
├── general/
│   └── SPEC-00-vista-general-catalogo.md
├── tipos-filtro/
│   ├── README.md
│   └── SPEC-00…SPEC-07
├── filtros/
│   ├── README.md
│   └── SPEC-00…SPEC-07
├── aceites/
│   ├── README.md
│   └── SPEC-00…SPEC-07
└── sistemas/
    ├── README.md
    └── SPEC-00…SPEC-07
```

## Orden de trabajo

1. Implementar el shell general definido en `general/SPEC-00-vista-general-catalogo.md`.
2. Implementar **Tipos de filtro** siguiendo `tipos-filtro/README.md` y sus specs `00` a `07`.
3. Implementar **Filtros** siguiendo `filtros/README.md` y sus specs `00` a `07`.
4. Implementar **Aceites** siguiendo `aceites/README.md` y sus specs `00` a `07`.
5. Implementar **Sistemas** siguiendo `sistemas/README.md` y sus specs `00` a `07`.
6. Integrar confirmación, estados cruzados y pruebas finales cuando las cuatro secciones estén disponibles.

No avanzar una sección sin su spec específico. El spec general no autoriza implementar tablas, filtros, formularios, drawers, RPC ni reglas particulares de ninguna pestaña.

## Reglas visuales transversales

- Producto ERP administrativo: compacto, sobrio, denso y orientado a revisión rápida.
- Escala predominante: textos `text-xs` y `text-sm`; títulos contenidos.
- Desktop usa controles visuales `sm`/`xs`, normalmente de `32px` a `36px` de alto.
- En móvil, el contenido sigue siendo compacto, pero el área interactiva debe alcanzar al menos `44px` de alto o ancho.
- Todo botón, tab, enlace, fila o chip interactivo habilitado debe usar `cursor-pointer`.
- Los elementos deshabilitados deben usar semántica `disabled`, aspecto desactivado y `cursor-not-allowed`.
- No usar emoji como iconos. Utilizar `lucide-vue-next`.
- No producir scroll horizontal de página en móvil.
- Color nunca será el único indicador de estado.
- Mantener foco visible y navegación completa por teclado.

## Stack esperado

```txt
Vue 3
Composition API
<script setup lang="ts">
Vue Router
Pinia cuando los specs de lógica lo requieran
Tailwind CSS
lucide-vue-next
```

La vista de ruta debe ser una superficie de composición delgada. La lógica de cada pestaña se añadirá después mediante componentes, composables, tipos y stores propios.
