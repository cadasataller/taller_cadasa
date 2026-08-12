# SPEC-00 — Alcance y reglas base de Filtros

## Objetivo

Fijar el alcance funcional, técnico y visual de la pestaña antes de crear contratos o UI. Este spec no conecta datos ni implementa componentes.

## Modelo funcional

Objeto maestro:

```txt
engrase.filtro
```

Únicos campos editables:

```txt
codigo
esta_en_lista_compras
activo
```

Información derivada de solo lectura:

```txt
tipos_filtro[].id
tipos_filtro[].nombre
tipos_filtro[].cantidad_equipos
impacto.total_equipos
impacto.total_asignaciones
impacto.tipos_equipo[].id
impacto.tipos_equipo[].nombre
impacto.tipos_equipo[].cantidad_equipos
```

`tipo_filtro` no es una propiedad del filtro. Solo existe mediante la relación `equipo_filtro` y nunca se edita en esta pestaña.

## Casos de uso

1. Cargar activos y desactivados una vez.
2. Mostrar activos inicialmente.
3. Buscar localmente por código.
4. Filtrar localmente por tipo relacionado, compras y estado.
5. Ordenar localmente código, compras, estado y uso.
6. Abrir detalle con el item ya cargado.
7. Crear con código, compras y estado.
8. Editar esos mismos tres campos.
9. Confirmar actualizaciones mostrando impacto existente.
10. Desactivar sin borrar asociaciones.
11. Agregar o reemplazar el item retornado sin recargar el listado.

## No hacer

- No inventar `nombre`, descripción, marca, categoría o `tipo_filtro_id`.
- No mostrar tipos de filtro ni tipos de equipo dentro de la fila.
- No editar `equipo_filtro`, equivalencias o historiales.
- No eliminar físicamente filtros.
- No consultar por cada búsqueda, selector, orden o apertura de detalle.
- No pedir tipo de filtro ni equipo al crear.
- No implementar Tipos de filtro, Aceites o Sistemas.
- No comprobar tablas o RPC en Supabase.

## Estado inicial

```txt
búsqueda: vacía
tipo relacionado: todos
en compras: todos
estado: activos
orden: código ascendente
selección: ninguna
detalle: cerrado
```

`Limpiar filtros` vuelve exactamente a esos valores; no equivale a seleccionar estado `Todos`.

## Traducción válida de la imagen

- Toolbar: Buscar por código, Tipo de filtro, En compras, Estado, Nuevo filtro y Limpiar filtros.
- Tabla: Código, En compras, Estado y Resumen de uso.
- Resumen: equipos distintos y total de asignaciones.
- Detalle editable: código, compras y estado.
- Detalle informativo: tipos relacionados, tipos de equipo, equipos y asignaciones.
- La imagen es referencia desktop; mobile se redefine en `SPEC-04`.

Aunque la imagen incluya selector circular e icono, no se requiere un radio independiente si toda la fila es una única acción accesible.

## Densidad ERP

Desktop:

```txt
texto: text-xs/text-sm
controles: h-8/h-9
fila: 44px–52px
celda: px-3 py-2
gaps: 8px–12px
iconos: 14px–18px
```

Mobile:

```txt
texto: text-sm; metadatos text-xs
target interactivo: mínimo 44×44px
card: p-3
gap entre acciones: mínimo 8px
```

Todo elemento habilitado y clickeable usa `cursor-pointer`.

## Archivos finales previstos

```txt
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.errors.ts
src/composables/engrase/catalogo/useCatalogoFiltros.ts
src/views/engrase/catalogo/CatalogoFiltrosSection.vue
src/components/engrase/catalogo/filtros/**
```

## Criterios de aceptación

- Solo los tres campos propios quedan editables.
- Tipos y uso quedan definidos como solo lectura.
- Filtrado local y carga única quedan explícitos.
- Se fija densidad `xs/sm`, targets mobile y cursores Tailwind.
- No se autoriza trabajo de base de datos.

