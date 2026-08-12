# SPEC-00 — Alcance y reglas base de Aceites

## Objetivo

Fijar alcance funcional, técnico y visual antes de crear contratos o componentes. Este spec no conecta datos ni genera UI.

## Modelo funcional

Objeto maestro:

```txt
engrase.aceite
```

Únicos campos editables:

```txt
nombre
activo
```

Información derivada de solo lectura:

```txt
sistemas[].id
sistemas[].nombre
sistemas[].cantidad_equipos
impacto.total_equipos
impacto.total_asignaciones
impacto.tipos_equipo[].id
impacto.tipos_equipo[].nombre
impacto.tipos_equipo[].cantidad_equipos
```

Un sistema no es propiedad directa del aceite. La combinación sistema–aceite depende del equipo mediante `equipo_aceite`.

## Casos de uso

1. Cargar aceites activos y desactivados una vez.
2. Mostrar activos inicialmente.
3. Buscar localmente por nombre.
4. Filtrar localmente por sistema relacionado, estado y uso.
5. Ordenar localmente nombre, sistemas, estado y uso.
6. Mostrar hasta dos sistemas relacionados en la fila, sin cantidades, y `+N`.
7. Abrir detalle usando el item ya cargado.
8. Crear un aceite con nombre y estado.
9. Editar esos dos campos.
10. Confirmar actualización mostrando impacto.
11. Desactivar sin eliminar asociaciones.
12. Agregar o reemplazar el item retornado sin recargar.

## No hacer

- No agregar `sistema_id`, selector de sistema editable, código, viscosidad estructurada, marca o descripción.
- No crear, modificar ni eliminar `equipo_aceite`.
- No permitir editar sistemas o cantidades desde chips.
- No eliminar físicamente aceites.
- No pedir sistema o equipo durante creación.
- No consultar al buscar, filtrar, ordenar o abrir Detalles.
- No implementar las otras pestañas.
- No verificar tablas o RPC en Supabase.

## Estado inicial

```txt
búsqueda: vacía
sistema: todos
estado: activos
uso: todos
orden: nombre ascendente
selección: ninguna
detalle: cerrado
```

`Limpiar filtros` restaura exactamente estos valores.

## Traducción válida de la imagen

- Toolbar: Buscar por nombre, Sistema, Estado, En uso, Nuevo aceite y Limpiar filtros.
- Tabla: Nombre, Sistemas asociados, Estado y Resumen de uso.
- En la fila: máximo dos nombres de sistema y `+N`, nunca cantidades.
- En Detalles: nombre/estado editables; sistemas, tipos de equipo e impacto informativos.
- La imagen es desktop; mobile se redefine en `SPEC-04`.

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
gap entre acciones: mínimo 8px
```

Todo elemento habilitado y clickeable usa `cursor-pointer`.

## Archivos finales previstos

```txt
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.types.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.mappers.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.helpers.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.service.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.store.ts
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.errors.ts
src/composables/engrase/catalogo/useCatalogoAceites.ts
src/views/engrase/catalogo/CatalogoAceitesSection.vue
src/components/engrase/catalogo/aceites/**
```

## Criterios de aceptación

- Solo nombre y activo quedan editables.
- La relación sistema–aceite queda explícitamente informativa.
- Tabla y detalle muestran niveles distintos de información.
- Quedan definidos filtrado local, densidad `xs/sm`, mobile y cursores.
- No se autoriza trabajo de base de datos.

