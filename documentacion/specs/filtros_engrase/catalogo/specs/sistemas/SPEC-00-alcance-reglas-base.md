# SPEC-00 — Alcance y reglas base de Sistemas

## Objetivo

Fijar alcance funcional, técnico y visual antes de crear contratos o UI.

## Modelo funcional

Objeto maestro:

```txt
engrase.sistema_aceite
```

Únicos campos editables:

```txt
nombre
activo
```

Solo lectura:

```txt
aceites[].id
aceites[].nombre
aceites[].cantidad_equipos
impacto.total_equipos
impacto.total_asignaciones
impacto.tipos_equipo[].id
impacto.tipos_equipo[].nombre
impacto.tipos_equipo[].cantidad_equipos
```

La relación aceite–sistema depende de cada equipo mediante `equipo_aceite`; no existe una relación global editable desde esta pestaña.

## Casos de uso

1. Cargar sistemas activos y desactivados una vez.
2. Mostrar activos inicialmente.
3. Buscar localmente por nombre.
4. Filtrar localmente por estado y uso.
5. Ordenar nombre, estado y métricas de uso.
6. Mostrar una tabla compacta sin aceites en la fila.
7. Abrir Detalles con el item cargado.
8. Crear con nombre y estado.
9. Editar esos dos campos.
10. Confirmar actualizaciones mostrando impacto.
11. Desactivar sin borrar asociaciones.
12. Actualizar localmente sin recargar.

## No hacer

- No agregar selector de aceite, `aceite_id`, icono configurable, código, descripción o categoría.
- No inferir un icono diferente a partir del nombre del sistema.
- No mostrar aceites relacionados dentro de la fila.
- No editar `equipo_aceite` ni cantidades derivadas.
- No eliminar físicamente sistemas.
- No pedir aceite o equipo durante creación.
- No consultar al buscar, filtrar, ordenar o abrir Detalles.
- No verificar Supabase ni modificar otras pestañas.

## Estado inicial

```txt
búsqueda: vacía
estado: activos
uso: todos
orden: nombre ascendente
selección: ninguna
detalle: cerrado
```

`Limpiar filtros` restaura exactamente esos valores.

## Traducción válida de la imagen

- Toolbar: Buscar por nombre, Estado, En uso, Nuevo sistema y Limpiar filtros.
- Tabla: Nombre, Estado y Resumen de uso.
- Usar un icono genérico consistente; el contrato no aporta icono por sistema.
- Detalles: nombre/estado editables; aceites, tipos de equipo e impacto read-only.
- La imagen desktop no define mobile; `SPEC-04` lo resuelve con cards.

## Densidad ERP

Desktop:

```txt
texto: text-xs/text-sm
controles: h-8/h-9
fila: 48px–60px
celda: px-3 py-2
gaps: 8px–12px
iconos: 14px–18px
```

Mobile:

```txt
texto: text-sm; metadatos text-xs
target: mínimo 44×44px
card: p-3
```

Todo elemento habilitado y clickeable usa `cursor-pointer`.

## Archivos previstos

```txt
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.errors.ts
src/composables/engrase/catalogo/useCatalogoSistemas.ts
src/views/engrase/catalogo/CatalogoSistemasSection.vue
src/components/engrase/catalogo/sistemas/**
```

## Criterios de aceptación

- Solo nombre y activo son editables.
- Aceites y equipos son relaciones informativas.
- La tabla se mantiene compacta y sin aceites.
- Quedan definidos filtrado local, base `xs/sm`, responsive y cursores.
- No se autoriza trabajo de base de datos.

