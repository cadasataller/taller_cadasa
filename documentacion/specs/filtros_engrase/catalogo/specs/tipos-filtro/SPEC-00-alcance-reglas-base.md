# SPEC-00 — Alcance y reglas base de Tipos de filtro

## Objetivo

Fijar el alcance funcional, visual y técnico antes de crear contratos o componentes. Este spec no genera UI ni conecta datos.

## Fuentes obligatorias

```txt
documentacion/specs/filtros_engrase/catalogo/contexto.md
documentacion/specs/filtros_engrase/catalogo/catalogo_tipo_filtro.png
documentacion/specs/filtros_engrase/catalogo/specs/general/SPEC-00-vista-general-catalogo.md
```

## Modelo funcional

Objeto maestro:

```txt
engrase.tipo_filtro
```

Campos editables:

```txt
nombre
activo
```

Información derivada de solo lectura:

```txt
impacto.total_equipos
impacto.total_asignaciones
impacto.tipos_equipo[].id
impacto.tipos_equipo[].nombre
impacto.tipos_equipo[].cantidad_equipos
```

> Editar un tipo de filtro cambia el objeto maestro mostrado por los equipos, pero no modifica ninguna asociación de `equipo_filtro`.

## Casos de uso

La sección debe permitir:

1. Cargar activos y desactivados.
2. Mostrar activos inicialmente.
3. Buscar localmente por nombre.
4. Filtrar localmente por estado.
5. Ordenar localmente el listado.
6. Seleccionar un registro y abrir Detalles sin otra consulta.
7. Crear un tipo con nombre y estado.
8. Editar nombre o estado.
9. Confirmar una actualización mostrando su impacto.
10. Desactivar sin eliminar relaciones existentes.
11. Reemplazar o agregar localmente el item retornado al guardar.

## No hacer

- No eliminar físicamente tipos de filtro.
- No crear, cambiar ni eliminar `equipo_filtro`.
- No editar tipos de equipo ni sus cantidades.
- No mostrar equipos individuales; el contrato solo entrega agrupaciones.
- No cargar un detalle por separado.
- No consultar al cambiar búsqueda, estado u orden.
- No inventar campos como código, categoría, posición o descripción.
- No implementar Filtros, Aceites o Sistemas.
- No verificar el estado real de tablas o RPC en Supabase.

## Estado inicial

```txt
búsqueda: vacía
estado: activos
orden: nombre ascendente
selección: ninguna
drawer: cerrado
```

`Limpiar filtros` vuelve exactamente a esos valores. No equivale a mostrar todos los estados.

## Reglas extraídas de la imagen

- Toolbar: búsqueda, Estado, Nuevo tipo de filtro y Limpiar filtros.
- Tabla desktop: Nombre, Estado y Resumen de uso.
- La selección abre un panel Detalles.
- El formulario contiene Nombre para mostrar y Estado.
- Los tipos de equipo son información, no inputs.
- Mostrar alcance en equipos y total de asignaciones.
- Acción primaria: `Nuevo tipo de filtro`; en edición: `Guardar cambios`.

La imagen es desktop. Mobile se define en `SPEC-04` y no debe ser una tabla comprimida.

## Densidad ERP transversal

Desktop:

```txt
texto: text-xs o text-sm
encabezados de tabla: text-xs font-semibold
controles: h-8 o h-9
filas: 44px–52px
padding de celda: px-3 py-2
gaps: 8px–12px
iconos: 14px–18px
```

Mobile:

```txt
texto: text-sm; metadatos text-xs
targets: mínimo 44×44px
cards: padding 12px
separación entre acciones: mínimo 8px
```

Todo botón, enlace, fila/card seleccionable, trigger o chip interactivo habilitado usa `cursor-pointer`.

## Archivos finales previstos

```txt
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.store.ts
src/composables/engrase/catalogo/useCatalogoTiposFiltro.ts
src/views/engrase/catalogo/CatalogoTiposFiltroSection.vue
src/components/engrase/catalogo/tipos-filtro/**
```

## Criterios de aceptación

- No contiene campos ni relaciones editables adicionales.
- Queda documentada la carga única y filtrado frontend.
- Queda definido el estado inicial.
- Queda definida la densidad `xs/sm` y el mínimo táctil mobile.
- No se autoriza trabajo de base de datos.

