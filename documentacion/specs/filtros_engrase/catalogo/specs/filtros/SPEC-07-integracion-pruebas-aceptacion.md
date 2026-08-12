# SPEC-07 — Integración, estados y pruebas de aceptación

## Objetivo

Integrar Filtros en el shell general y verificar lógica, UI/UX, responsive, accesibilidad, rendimiento y no regresión.

## Dependencias

Implementar después de `SPEC-01` a `SPEC-06`.

## Integración

Ruta:

```txt
/engrase/filtros/catalogo/filtros
```

Reemplazar únicamente el placeholder de Filtros por `CatalogoFiltrosSection`. No alterar la implementación de Tipos de filtro ni implementar Aceites o Sistemas.

Carga diferida: llamar `inicializar()` la primera vez que la pestaña entra en uso; volver a ella reutiliza el store mientras siga vigente la sesión.

## Mapa final

```txt
CatalogoEngraseView
└── CatalogoFiltrosSection
    ├── FiltrosToolbar
    ├── FiltrosTable
    ├── FiltrosMobileList
    │   └── FiltroMobileCard
    ├── FiltrosMobileFilterSheet
    ├── FiltrosListState
    ├── FiltroDetailDrawer
    │   ├── FiltroForm
    │   ├── FiltroRelatedTypes
    │   ├── FiltroEquipmentTypes
    │   └── FiltroImpactSummary
    ├── FiltroUpdateConfirmDialog
    └── FiltroUnsavedDialog
```

La sección usa el composable; componentes presentacionales no llaman al servicio.

## Estados a verificar

```txt
carga inicial
error inicial y reintento
catálogo vacío
sin coincidencias
listado
selección
crear
editar sin/con cambios
confirmación
guardando
éxito
error funcional/desconocido
item que sale del filtro actual
cierre con cambios pendientes
```

## Pruebas unitarias

### Helpers y mapper

- Normaliza código sin destruir caracteres internos.
- Filtra por código, tipo relacionado, compras y estado.
- Deduplica opciones relacionadas por ID.
- Ordena código/compras/estado/equipos/asignaciones.
- Mapea tipos relacionados e impacto.
- Conserva equipos y asignaciones como métricas distintas.
- Rechaza payload esencial inválido.

### Store

- Deduplica inicialización.
- Filtra y ordena sin llamar al servicio.
- Cierra selección al quedar fuera.
- Crear agrega una vez; editar reemplaza una vez.
- Recalcula los cinco campos de resumen.
- Error no borra item ni draft.
- Reset limpia datos de sesión.

### Componentes

- Props/emits correctos.
- Toolbar actualiza los cuatro criterios.
- Clear restaura defaults.
- Tabla expone `aria-sort`.
- Fila/card abre con mouse y teclado.
- Card no muestra tipos relacionados.
- Drawer no permite editar relaciones.
- Form asocia errores al código.
- Modal muestra cambios, desglose y aviso.
- Loading bloquea doble acción.

## Pruebas de integración

1. Abrir pestaña carga una vez.
2. Buscar `B7030` filtra sin request adicional.
3. Cambiar Tipo de filtro filtra por `tiposFiltro[].id` localmente.
4. Cambiar En compras y Estado filtra localmente.
5. Limpiar vuelve a búsqueda vacía, todos/todos/activos y código asc.
6. Seleccionar abre detalle sin request.
7. Tipos relacionados aparecen solo en detalle.
8. Cerrar draft modificado solicita descarte.
9. Crear guarda código/compras/estado sin modal de impacto.
10. Editar muestra confirmación con equipos y cambios.
11. Guardar reemplaza el item retornado sin recarga.
12. Cambiar estado o compras actualiza visibilidad según filtros.
13. Volver a la pestaña conserva carga y criterios.

## Validación visual responsive

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
- Tabla compacta y legible con sus cuatro columnas funcionales.
- Panel no destruye el resumen de uso.
- `xs/sm` predominante.

### Tablet

- Tabla o cards según ancho real.
- Drawer overlay, sin solapamientos ni doble scroll.

### Mobile

- Cards, nunca tabla comprimida.
- Filtros secundarios en sheet.
- Detalle full-screen.
- Targets 44px.
- Footer y teclado virtual no ocultan acciones.
- Cero overflow horizontal.

## Accesibilidad

- Flujo completo por teclado.
- Foco visible y retorno tras overlays.
- Estado/compras comunicados con texto.
- Orden y selección anunciados.
- Errores y resultados en regiones vivas adecuadas.
- Contraste AA y zoom 200% sin pérdida.
- `prefers-reduced-motion` respetado.

## Auditoría de cursores Tailwind

Revisar:

```txt
tabs y botones
triggers de filtros
encabezados ordenables
filas desktop
cards mobile
chips +N
cerrar drawer
segmentos compras/estado
acciones de dialogs
```

- Habilitado: `cursor-pointer`.
- Guardando: `cursor-wait`.
- Deshabilitado: `cursor-not-allowed`.
- Informativo: cursor normal.

## Rendimiento

- Una RPC al primer ingreso.
- Cero RPC por búsqueda, filtros, orden o detalle.
- Cero recarga total después de guardar.
- Filtros/orden en `computed`, sin watchers profundos de `items`.
- Sin virtualización o paginación hasta medir una necesidad real.

## No regresión

- `/engrase/filtros` continúa operando.
- `/catalogo` global no cambia.
- Tipos de filtro conserva su implementación.
- Aceites y Sistemas siguen como placeholders.
- Solo la edición del equipo administra asociaciones.
- No se escriben equivalencias ni historiales.

## Comandos de verificación de implementación

```txt
pnpm typecheck
pnpm test:run
pnpm build
```

Adaptar los nombres solo si `package.json` define equivalentes; no omitir typecheck, pruebas ni build.

## Criterios finales

- Flujo completo funciona contra el contrato objetivo o fixture explícito.
- Solo escribe código, compras y activo.
- Tipos relacionados e impacto proceden del item cargado.
- Desktop ERP compacto; mobile táctil y legible.
- Sin scroll horizontal accidental.
- Cursores y estados Tailwind consistentes.
- Sin consultas adicionales ni modificación de asociaciones.
- Integración limitada a la pestaña Filtros.

