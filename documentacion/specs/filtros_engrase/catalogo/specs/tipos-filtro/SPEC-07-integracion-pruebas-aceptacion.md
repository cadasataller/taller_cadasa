# SPEC-07 — Integración, estados y pruebas de aceptación

## Objetivo

Integrar Tipos de filtro en el shell general y verificar lógica, UI/UX, responsive, accesibilidad y no regresión.

## Dependencias

Implementar después de `SPEC-01` a `SPEC-06`.

## Integración

Ruta:

```txt
/engrase/catalogo/tipos-filtro
```

Reemplazar solo el placeholder de Tipos de filtro por `CatalogoTiposFiltroSection`.

Permanecen como placeholders:

```txt
Filtros
Aceites
Sistemas
```

No importar sus stores ni cargar sus datos.

## Mapa final

```txt
CatalogoEngraseView
└── CatalogoTiposFiltroSection
    ├── TiposFiltroToolbar
    ├── TiposFiltroTable
    ├── TiposFiltroMobileList
    │   └── TipoFiltroMobileCard
    ├── TiposFiltroListState
    ├── TipoFiltroDetailDrawer
    │   ├── TipoFiltroForm
    │   ├── TipoFiltroEquipmentTypes
    │   └── TipoFiltroImpactSummary
    ├── TipoFiltroUpdateConfirmDialog
    └── TipoFiltroUnsavedDialog
```

La sección consume el composable. Los componentes presentacionales no llaman servicios.

## Estados a verificar

```txt
carga inicial
error inicial
reintento
catálogo vacío
sin coincidencias
listado con datos
selección
crear
editar sin cambios
editar con cambios
confirmación
guardando
éxito
error funcional
error desconocido
desactivación del seleccionado
cierre con cambios pendientes
```

## Pruebas unitarias

### Helpers y mapper

- Normaliza búsqueda.
- Filtra activos/desactivados/todos.
- Ordena nombre/estado/uso.
- Forma singular/plural de equipos.
- Mapea impacto completo.
- Rechaza payload esencial inválido.

### Store

- Deduplica inicialización.
- Filtra sin llamar servicio.
- Maneja selección y cierre al quedar fuera.
- Crear agrega una vez.
- Editar reemplaza una vez.
- Recalcula resumen.
- Error no borra items ni draft.
- Reset limpia datos de sesión.

### Componentes

- Props/emits y eventos correctos.
- Toolbar cambia filtros.
- Clear restaura defaults.
- Tabla aplica `aria-sort`.
- Fila/card selecciona con mouse y teclado.
- Drawer no permite editar impacto.
- Form muestra errores junto al campo.
- Modal muestra desglose y aviso.
- Botón loading queda deshabilitado.

## Pruebas de integración

1. Abrir ruta carga una vez.
2. Buscar `aire` filtra sin llamada nueva.
3. Cambiar a Desactivados filtra localmente.
4. Limpiar vuelve a Activos.
5. Seleccionar abre detalle sin request.
6. Cancelar sin cambios cierra.
7. Cerrar con cambios pide confirmación.
8. Crear guarda sin modal de impacto.
9. Editar muestra confirmación y desglose.
10. Guardar reemplaza item retornado.
11. Desactivar bajo Activos oculta item después de éxito.
12. Volver a la pestaña conserva datos cargados.

## Responsive visual

Validar:

```txt
320×568
375×667
414×896
768×1024
1024×768
1440×900
```

### Desktop

- Tabla compacta con 8–12 filas posibles.
- Toolbar en una línea cuando cabe.
- Drawer no destruye columnas.
- Texto `xs/sm` predominante.

### Tablet

- Toolbar envuelve sin solaparse.
- Drawer se superpone.
- Sin scroll horizontal.

### Mobile

- Cards, nunca tabla comprimida.
- Drawer full-screen.
- Targets de 44px.
- Footer fuera del bottom nav.
- Teclado virtual no tapa campos o acciones.

## Accesibilidad

- Flujo completo con teclado.
- Foco visible.
- Focus trap y retorno en overlays.
- Estado comunicado con texto.
- Sort y selección anunciados.
- Errores anunciados.
- Contraste AA.
- Reduced motion.
- Zoom 200% sin pérdida.

## Cursores Tailwind

Auditar:

```txt
botones
enlaces de sección
encabezados ordenables
filas desktop
cards mobile
chips +N
selector Estado
cerrar drawer
acciones de modal
```

- Habilitado: `cursor-pointer`.
- Guardando: `cursor-wait`.
- Deshabilitado: `cursor-not-allowed`.
- No interactivo: cursor normal.

## Rendimiento

- Una RPC de listado al entrar por primera vez.
- Cero llamadas por búsqueda, estado u orden.
- Cero llamadas al abrir detalle.
- Cero recarga total después de guardar.
- Sin watchers profundos de `items`.
- Filtros y orden en `computed`.
- No virtualizar sin evidencia real.

## No regresión

- `/engrase/filtros` sigue operando.
- La subpestaña `Catálogo` mantiene permisos del spec general.
- `/catalogo` global no cambia.
- Solo edición de equipo modifica asociaciones.
- Las otras pestañas no se implementan.

## Comandos de verificación

```txt
pnpm typecheck
pnpm test:run
pnpm build
```

## Criterios finales

- Flujo completo funciona con contrato objetivo.
- Solo escribe nombre y activo.
- Impacto informativo proviene del item cargado.
- Desktop ERP compacto; mobile táctil y legible.
- Sin scroll horizontal accidental.
- Todo control clickeable habilitado usa `cursor-pointer`.
- Sin consultas adicionales por filtros o detalle.
- No modifica asociaciones.
- Se integra sin implementar otras pestañas.
