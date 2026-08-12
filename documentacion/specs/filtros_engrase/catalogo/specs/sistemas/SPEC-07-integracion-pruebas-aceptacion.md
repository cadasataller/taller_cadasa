# SPEC-07 — Integración, estados y pruebas de aceptación

## Objetivo

Integrar Sistemas y verificar lógica, UI/UX, responsive, accesibilidad, rendimiento y no regresión.

## Dependencias

Implementar después de `SPEC-01` a `SPEC-06`.

## Integración

Ruta:

```txt
/engrase/catalogo/sistemas
```

Reemplazar solo el placeholder de Sistemas por `CatalogoSistemasSection`. No modificar las otras pestañas. Carga diferida al primer ingreso y reutilización durante la sesión.

## Mapa final

```txt
CatalogoEngraseView
└── CatalogoSistemasSection
    ├── SistemasToolbar
    ├── SistemasTable
    ├── SistemasMobileList
    │   └── SistemaMobileCard
    ├── SistemasMobileFilterSheet
    ├── SistemasListState
    ├── SistemaDetailDrawer
    │   ├── SistemaForm
    │   ├── SistemaRelatedOils
    │   ├── SistemaEquipmentTypes
    │   └── SistemaImpactSummary
    ├── SistemaUpdateConfirmDialog
    └── SistemaUnsavedDialog
```

Vista delgada; composable orquesta; presentacionales sin servicio.

## Estados

```txt
carga/error/reintento
vacío/sin coincidencias/listado
selección/crear/editar
confirmación/guardando/éxito/error
item fuera del filtro
cierre con cambios
```

## Unitarias

### Helpers/mapper

- Normaliza nombre.
- Filtra estado/uso y define uso por equipos.
- Ordena nombre/estado/equipos/asignaciones.
- Mapea aceites e impacto sin mezclar métricas.
- Conserva ceros/listas vacías y rechaza payload inválido.

### Store

- Deduplica carga.
- Filtra sin servicio.
- Selección/cierre correctos.
- Crear agrega y editar reemplaza una vez.
- Recalcula resumen; error conserva datos; reset limpia sesión.

### Componentes

- Props/emits correctos.
- Toolbar cambia tres filtros y clear restaura defaults.
- Tabla `aria-sort`; fila/card accesible.
- Tabla/card omiten aceites.
- Drawer muestra aceites y cantidades read-only.
- Encabezado de aceites usa `aceites.length`.
- Form solo nombre/estado.
- Modal muestra impacto/aviso; loading bloquea doble acción.

## Integración

1. Primer ingreso carga una vez.
2. Buscar filtra sin request.
3. Estado y En uso filtran localmente.
4. Limpiar vuelve a vacío/activos/todos/nombre asc.
5. Tabla no muestra aceites.
6. Seleccionar abre detalle sin request.
7. Detalle muestra aceites/tipos con cantidades.
8. Conteo de aceites es cantidad de elementos, no equipos.
9. Draft modificado pide descarte.
10. Crear guarda solo nombre/activo y sin confirmación.
11. Editar confirma y reemplaza item retornado.
12. Desactivar bajo Activos oculta después del éxito.
13. Regresar conserva carga/filtros.

## Responsive

```txt
320×568, 375×667, 414×896,
768×1024, 1024×768, 1440×900
```

- Desktop: toolbar sin overflow, tabla compacta, drawer legible, `xs/sm`.
- Tablet: cards/tabla según lectura, drawer overlay sin doble scroll.
- Mobile: cards, filtros sheet, detalle full-screen, targets 44px, sin overflow.

## Accesibilidad/cursores

- Teclado completo, foco visible/retorno, estado no solo color.
- Sort/selección/errores/conteos anunciados.
- Contraste AA, zoom 200%, reduced motion.
- `cursor-pointer`: tabs, botones, triggers, headers, filas, cards, `+N`, segmentos y dialogs.
- `cursor-wait` guardando; `cursor-not-allowed` disabled; cursor normal read-only.

## Rendimiento/no regresión

- Una RPC al primer ingreso.
- Cero RPC por filtros, orden o detalle.
- Cero recarga tras guardar.
- Derivaciones computed; sin watchers profundos.
- Sin virtualización/paginación no medida.
- `/engrase/filtros` y `/catalogo` global no cambian.
- Las otras tres pestañas conservan comportamiento.
- Solo edición de equipo administra `equipo_aceite`.

## Comandos de implementación

```txt
pnpm typecheck
pnpm test:run
pnpm build
```

Usar equivalentes de `package.json` si cambian los nombres.

## Criterios finales

- Flujo completo con contrato objetivo o fixture explícito.
- Solo escribe nombre/activo.
- Aceites/impacto proceden del item cargado.
- Tabla compacta sin relaciones; detalle completo read-only.
- Desktop ERP y mobile táctil.
- Cursores Tailwind consistentes.
- Sin requests adicionales ni mutación de asociaciones.
- Integración limitada a Sistemas.
