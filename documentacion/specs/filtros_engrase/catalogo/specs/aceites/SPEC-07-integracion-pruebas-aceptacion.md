# SPEC-07 — Integración, estados y pruebas de aceptación

## Objetivo

Integrar Aceites en el shell y verificar lógica, UI/UX, responsive, accesibilidad, rendimiento y no regresión.

## Dependencias

Implementar después de `SPEC-01` a `SPEC-06`.

## Integración

Ruta:

```txt
/engrase/catalogo/aceites
```

Reemplazar solo el placeholder de Aceites por `CatalogoAceitesSection`. No modificar Tipos de filtro o Filtros ni implementar Sistemas.

Cargar al abrir la pestaña por primera vez y reutilizar el store durante la sesión. Si el Catálogo ya dispone de auxiliares compartidos, reutilizarlos; no crear una segunda carga por control visual.

## Mapa final

```txt
CatalogoEngraseView
└── CatalogoAceitesSection
    ├── AceitesToolbar
    ├── AceitesTable
    │   └── AceiteSystemsSummary
    ├── AceitesMobileList
    │   └── AceiteMobileCard
    ├── AceitesMobileFilterSheet
    ├── AceitesListState
    ├── AceiteDetailDrawer
    │   ├── AceiteForm
    │   ├── AceiteRelatedSystems
    │   ├── AceiteEquipmentTypes
    │   └── AceiteImpactSummary
    ├── AceiteUpdateConfirmDialog
    └── AceiteUnsavedDialog
```

La sección consume el composable; componentes presentacionales no llaman servicios.

## Estados

```txt
carga inicial
error y reintento
catálogo vacío
sin coincidencias
listado y selección
crear
editar sin/con cambios
confirmación
guardando
éxito
error funcional/desconocido
item que sale del filtro
cierre con cambios pendientes
```

## Pruebas unitarias

### Helpers y mapper

- Normaliza búsqueda por nombre.
- Filtra sistema, estado y uso.
- Define uso por `totalEquipos`.
- Deduplica sistemas por ID.
- Calcula dos sistemas visibles y N restantes.
- Ordena nombre/sistemas/estado/equipos/asignaciones.
- Mapea sistemas e impacto sin mezclar métricas.
- Rechaza payload inválido.

### Store

- Deduplica inicialización.
- Filtra y ordena sin servicio.
- Maneja selección y cierre al quedar fuera.
- Crear agrega una vez; editar reemplaza una vez.
- Recalcula resumen.
- Error conserva item/draft.
- Reset limpia sesión.

### Componentes

- Props/emits correctos.
- Toolbar cambia cuatro filtros.
- Clear restaura defaults.
- Tabla aplica `aria-sort`.
- Fila/card abre con mouse y teclado.
- Fila/card limita sistemas y omite cantidades.
- Drawer muestra todas las cantidades como read-only.
- Form solo contiene nombre/estado.
- Modal muestra cambios, impacto y aviso.
- Loading evita doble acción.

## Pruebas de integración

1. Abrir Aceites carga una vez.
2. Buscar nombre filtra sin request.
3. Sistema filtra por `item.sistemas[].id`.
4. Estado y En uso filtran localmente.
5. Limpiar restaura vacío/todos/activos/todos/nombre asc.
6. Tabla muestra máximo dos sistemas y `+N` sin cantidades.
7. Seleccionar abre detalle sin request.
8. Detalle muestra sistemas y tipos de equipo con cantidades.
9. Cerrar draft modificado solicita descarte.
10. Crear guarda solo nombre/activo y no confirma impacto.
11. Editar confirma impacto y reemplaza el item retornado.
12. Desactivar bajo Activos lo oculta después del éxito.
13. Volver a la pestaña conserva datos y filtros.

## Responsive visual

```txt
320×568
375×667
414×896
768×1024
1024×768
1440×900
```

### Desktop

- Toolbar envuelve antes de desbordar.
- Tabla compacta y columnas legibles.
- Drawer conserva espacio para sistemas y uso.
- `xs/sm` predominante.

### Tablet

- Cards/tabla según lectura real.
- Drawer overlay sin doble scroll.

### Mobile

- Cards, filtros en sheet y detalle full-screen.
- Targets 44px.
- Footer/teclado no ocultan acciones.
- Sin overflow horizontal.

## Accesibilidad

- Flujo completo por teclado.
- Foco visible y retorno tras overlays.
- Estado/uso no dependen solo de color.
- Sort, selección, errores y conteos anunciados.
- Contraste AA y zoom 200% sin pérdida.
- Reduced motion.

## Auditoría de cursores Tailwind

```txt
tabs, botones y selects
headers ordenables
filas y cards
chips +N
cerrar drawer
segmentos de estado
acciones de dialogs
```

- Habilitado `cursor-pointer`.
- Guardando `cursor-wait`.
- Deshabilitado `cursor-not-allowed`.
- Informativo cursor normal.

## Rendimiento

- Una RPC al primer ingreso.
- Cero RPC por filtros, orden o detalle.
- Cero recarga total después de guardar.
- Filtros/orden en `computed`, sin watchers profundos.
- No virtualizar o paginar sin medición.

## No regresión

- `/engrase/filtros` continúa operando.
- `/catalogo` global no cambia.
- Tipos de filtro y Filtros conservan su implementación.
- Sistemas sigue placeholder.
- Solo edición de equipo administra `equipo_aceite`.

## Comandos de implementación

```txt
pnpm typecheck
pnpm test:run
pnpm build
```

Adaptar nombres a scripts equivalentes de `package.json`, sin omitir verificación.

## Criterios finales

- Flujo funciona con contrato objetivo o fixture explícito.
- Solo escribe nombre y activo.
- Sistemas e impacto proceden del item cargado.
- Tabla respeta dos sistemas +N sin cantidades.
- Desktop ERP compacto y mobile táctil.
- Cursores Tailwind consistentes.
- Sin llamadas adicionales ni mutación de asociaciones.
- Integración limitada a Aceites.
