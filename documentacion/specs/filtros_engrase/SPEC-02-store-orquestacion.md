# SPEC-02 — Store Pinia y orquestación

## Objetivo

Centralizar datos remotos, filtros aplicados, selección y estados asíncronos sin trasladar lógica de negocio a los componentes visuales.

## Dependencia

Implementar después de `SPEC-01`.

## Archivos a crear

```txt
src/stores/dbequipos/engrase/filtrosEngrase.store.ts
src/composables/engrase/useFiltrosEngrase.ts
```

## Responsabilidades

### Store

- Mantener equipos, catálogos, filtros del equipo y equivalencias.
- Mantener estados `loading`, `error` y marcas de carga por recurso.
- Ejecutar únicamente funciones del service.
- Evitar solicitudes duplicadas concurrentes.
- Exponer acciones explícitas; los componentes no mutan colecciones directamente.

### Composable

- Orquestar la carga inicial.
- Gestionar debounce y obsolescencia de sugerencias.
- Coordinar selección de equipo y filtro.
- Exponer estado derivado preparado para la vista.
- Conectar filtros visuales con acciones del store.

## Estado mínimo

```txt
equipos
tiposEquipo
tiposFiltro
etapas
filtrosEquipo
equivalenciasPorFiltroId
sugerenciasCodigo
equipoSeleccionadoId
filtroSeleccionadoId
filtrosAplicados
codigoExactoSeleccionado
loadingInicial
loadingEquipos
loadingDetalleEquipo
loadingSugerencias
errorInicial
errorEquipos
errorDetalle
```

Estado inicial confirmado:

```txt
estadoEquipo = 'activo'
tipoEquipoId = null
tipoFiltroId = null
modelo = ''
etapaId = null
codigoExactoSeleccionado = null
```

## Estado derivado

Usar getters/computed para:

```txt
equiposVisibles
equipoSeleccionado
filtroSeleccionado
conteoPorTipoEquipo
totalFiltrosEquipo
totalConEquivalencias
totalEnListaCompras
hayFiltrosActivos
```

- No guardar en estado valores que puedan derivarse de una fuente única.
- Definir expresamente si `totalFiltrosEquipo` cuenta asignaciones o suma cantidades. Para esta vista debe contar asignaciones/tipos de filtro; `cantidad` se muestra por tarjeta.

## Acciones mínimas

```txt
inicializar()
cargarCatalogos()
cargarEquipos()
cargarFiltrosEquipo(equipoId)
buscarSugerencias(texto)
seleccionarCodigoExacto(sugerencia)
limpiarCodigoSeleccionado()
actualizarFiltros(parcial)
seleccionarEquipo(equipoId)
seleccionarFiltro(equipoFiltroId)
reintentarCarga()
reset()
```

## Reglas de interacción

- Al cargar equipos, seleccionar el primero disponible si no existe una selección válida.
- Cambiar filtros conserva el equipo seleccionado solo si continúa en resultados.
- Si deja de estar visible, seleccionar el primer resultado o dejar selección vacía.
- Cambiar equipo limpia el filtro seleccionado y carga su detalle.
- Al finalizar el detalle, seleccionar el primer filtro únicamente si el diseño requiere abrir detalle derecho automáticamente; preferencia: mantenerlo cerrado hasta acción explícita del usuario.
- Cambiar el código escrito después de una selección invalida `codigoExactoSeleccionado`.
- Solo `seleccionarCodigoExacto()` activa la búsqueda exacta.

## Reactividad

- Usar store setup para la lógica compleja.
- Usar `storeToRefs()` al consumir estado/getters.
- Derivar con `computed`; reservar `watch` para efectos como recarga, debounce o sincronización.
- Limpiar temporizadores y solicitudes lógicas al desmontar.
- No devolver estado mutable desde el composable cuando existe una acción equivalente.

## Caché

- Catálogos pueden cargarse una sola vez por sesión salvo recarga forzada.
- Cachear temporalmente filtros por `equipoId`.
- Invalidar caché si en fases futuras se habilita escritura.
- Las URLs firmadas deben tener expiración conocida y no persistirse como datos permanentes.

## Errores

- Separar error inicial, error del listado y error del detalle.
- Un fallo de imagen no invalida el equipo.
- Un fallo de equivalencias no debe ocultar los datos principales del filtro; mostrar estado recuperable.
- Las acciones deben limpiar su loading en `finally`.

## Criterios de aceptación

- Activos es el estado inicial.
- Los componentes no llaman al service ni a Supabase.
- La selección permanece coherente después de filtrar.
- No hay consultas N+1 para equivalencias.
- Una respuesta antigua de sugerencias no reemplaza una búsqueda más reciente.
- El store puede probarse sin montar la vista.

