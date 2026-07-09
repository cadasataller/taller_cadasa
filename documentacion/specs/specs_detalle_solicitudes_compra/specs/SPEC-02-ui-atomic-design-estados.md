# Specs granulares — Detalle de Solicitudes de Compra

> Modulo: Compras / Solicitudes de Compra  
> Stack: Vue 3 + TypeScript estricto + Pinia + Supabase + Tailwind  
> Enfoque de composicion UI: Atomic Design  
> Fuente de verdad funcional: `documentacion/specs/utils/contexto.md`  
> Fuente de verdad de datos: `documentacion/specs/utils/bd_compras.sql`

## Contexto obligatorio antes de implementar

Antes de implementar este spec, leer:

```txt
documentacion/specs/utils/contexto.md
documentacion/specs/utils/bd_compras.sql
documentacion/specs/specs_listado_solicitudes_compra/specs/SPEC-19-densidad-visual-desktop-erp-mobile-cards.md
```

Reglas transversales:

- Mantener el lenguaje visual de CADASA ya usado en el listado.
- No convertir detalle desktop en cards gigantes.
- No comprimir mobile como si fuera tabla ERP.
- La diferencia entre roles se resuelve por bloques, columnas y datos visibles, no por titulos explicativos del rol.
- La misma vista base debe soportar estados de solicitud y estados de detalle sin duplicar pantallas completas.

---

# SPEC-02 — UI del detalle y estados disponibles con Atomic Design

## Objetivo

Describir la estructura visual del detalle de solicitud de compra para desktop y mobile, contemplando:

- estados posibles de la solicitud;
- estados posibles de los detalles;
- cambios visuales por rol;
- cambios visuales por modo `sin OC` y `con OC`;
- composicion de componentes siguiendo Atomic Design.

## Arquitectura Atomic Design

### Atoms

Atoms minimos esperados:

```txt
SolicitudDetailStateBadge
SolicitudDetailStatusChip
SolicitudDetailDiscardSourceChip
SolicitudDetailCycleChip
SolicitudDetailQuantityPill
SolicitudDetailDateLabel
SolicitudDetailMetaLabel
SolicitudDetailSectionTitle
SolicitudDetailInlineHint
SolicitudDetailExpandIcon
```

Responsabilidades:

- mostrar una sola unidad visual;
- no resolver reglas de negocio complejas;
- ser reutilizables entre desktop y mobile.

### Molecules

Molecules minimas esperadas:

```txt
SolicitudDetailHeaderMeta
SolicitudDetailDateBlock
SolicitudDetailRoleFactsRow
SolicitudDetailQuantityCell
SolicitudDetailDifferenceCell
SolicitudDetailOcSummary
SolicitudDetailOcExpandableRow
SolicitudDetailDiscardMeta
SolicitudDetailLineStateBlock
SolicitudDetailGroupedSectionHeader
```

Responsabilidades:

- combinar varios atoms;
- representar una pieza de lectura funcional;
- no cargar la pagina completa.

### Organisms

Organisms minimos esperados:

```txt
SolicitudDetailHeader
SolicitudDetailSummaryPanel
SolicitudDetailActiveLinesTable
SolicitudDetailDiscardedLinesTable
SolicitudDetailServiceLinesTable
SolicitudDetailOcPanel
SolicitudDetailDifferencesPanel
SolicitudDetailAttachmentsPanel
SolicitudDetailLockBanner
SolicitudDetailTimelinePanel
```

Responsabilidades:

- resolver bloques completos de pantalla;
- recibir datos ya saneados por rol;
- cambiar layout entre desktop y mobile sin cambiar la logica de negocio.

### Templates

Templates minimos esperados:

```txt
SolicitudDetailDesktopTemplate
SolicitudDetailMobileTemplate
```

Responsabilidades:

- definir distribucion general;
- ubicar organisms;
- no consultar datos.

### Pages

Page esperada:

```txt
SolicitudCompraDetalleView
```

Responsabilidades:

- montar composable/store;
- pedir carga del detalle;
- pasar props a templates;
- conectar acciones de expandir, volver y refrescar.

## Subspec UI general

### Desktop

La vista desktop debe sentirse:

```txt
administrativa
ERP
detallada
ordenada
densa sin saturar
```

Estructura recomendada:

```txt
header de solicitud
banner de lock si existe
resumen principal
tabla o grilla de detalles activas
tabla o grilla de descartados
panel de OC y diferencias
paneles secundarios: adjuntos, historial, timeline
```

### Mobile

La vista mobile debe sentirse:

```txt
operativa
legible
apilada
expandible
sin grid ERP comprimido
```

Estructura recomendada:

```txt
header compacto con volver
estado + folio
resumen apilado
accordion o cards por agrupacion
lineas activas
lineas descartadas
OC expandible
paneles secundarios apilados
```

## Estados de solicitud y tratamiento visual

### Solicitud en revision o en proceso interno

Ejemplos:

```txt
para_revision_almacen
en_revision_almacen
revisado_por_almacen
para_revision_supervisor
en_revision_supervisor
para_revision_gerencia
en_revision_gerencia
aprobado_gerencia
subiendo_sistema_compras
subido_sistema_compra
```

UI:

- badge principal visible en header;
- tabla de `Activas` como bloque dominante;
- columnas de cantidades progresivas;
- `Descartados` debajo, si existen;
- mostrar `disponible_desde` cuando aplique;
- diferencias sin OC solo si ya existen cantidades comparables.

### Solicitud con OC o recepcion

Ejemplos:

```txt
orden_compra
oc_recibido_parcial_almacen
oc_recibido_completo_almacen
```

UI:

- header mantiene el estado principal;
- las lineas activas cambian a modo `con OC`;
- la fila principal prioriza `aprobada`, `subida sistema`, `OC`, `recibida`;
- `cantidad_inventario` desaparece de la fila principal;
- el panel de OC gana relevancia;
- el expandible por OC queda disponible por linea.

### Solicitud cerrada o descartada a nivel solicitud

Ejemplos:

```txt
rechazado
descartado_por_supervisor
rechazado_comprador
cancelado
```

UI:

- badge de estado con tono de cierre;
- la pantalla sigue mostrando lineas historicas;
- `Activas` puede quedar vacia segun el caso;
- `Descartados` conserva cantidades y ciclo;
- no ocultar trazabilidad por estar cerrada.

## Estados de detalle y tratamiento visual

### Activas

La agrupacion `Activas` debe aceptar lineas en estados:

```txt
pendiente
activo
aprobado_gerencia
subido_sistema
```

Reglas visuales:

- cada fila muestra badge o chip de `estado_detalle`;
- el color no debe competir con el estado de la solicitud;
- la fila puede cambiar columnas segun el modo `sin OC` o `con OC`;
- si el detalle tiene observaciones de sistema o diferencias, deben verse en una zona secundaria de la misma fila.

### Descartados

La agrupacion `Descartados` debe mostrar:

- estado del detalle;
- `descartado_por`;
- `ciclo`;
- cantidades historicas;
- `linea_solicitud` si existe;
- orden por ciclo desc.

Reglas visuales:

- usar tono mas apagado pero legible;
- no convertirla en seccion colapsada por defecto;
- no esconder datos historicos;
- si el descarte fue de servicio, la misma UI aplica sin inventario.

## Estados de UI disponibles

### Estado base sin lock

UI:

- header limpio;
- resumen visible;
- agrupaciones normales;
- paneles secundarios sin alerta.

### Estado bloqueado

UI:

- banner superior obligatorio;
- indicar usuario y fecha de bloqueo si estan disponibles;
- si excede el umbral funcional futuro, el banner debe poder escalar a alerta fuerte;
- el resto de la pantalla sigue visible.

### Estado loading inicial

UI:

- skeleton de header;
- skeleton de resumen;
- skeleton de tabla/listas;
- no mostrar tabla vacia real mientras siga cargando.

### Estado empty de agrupacion

Aplica cuando una agrupacion no tiene lineas.

UI:

- mensaje compacto por agrupacion;
- no usar empty state gigante dentro del detalle;
- ejemplo: `No hay detalles descartados en esta solicitud.`

### Estado error

UI:

- bloque de error dentro de la page;
- accion de reintentar;
- no romper layout completo.

## Variantes visuales por rol

### Admin y gerencia

Desktop:

- tabla completa de detalles;
- columnas de cantidades completas segun etapa;
- panel de diferencias visible;
- panel OC visible;
- metadata de solicitud amplia.

Mobile:

- cards de linea con chips de estado;
- cantidades en bloques horizontales o mini grid legible;
- expandible de OC.

### Operativo

Desktop:

- misma estructura base que gerencia;
- inventario visible solo antes de OC;
- diferencias visibles;
- lectura completa del flujo.

Mobile:

- cards mas explicitas en cantidades;
- resumen claro de que pidio, que aprobaron, que subio el sistema y que llego.

### Secretaria

Desktop:

- quitar columnas no utiles como inventario;
- priorizar `cantidad_gerencia` y `cantidad_solicitada_sistema`;
- mostrar OC y recepcion si existen;
- resumen administrativo claro.

Mobile:

- cards simplificadas;
- foco en cantidades aprobadas/subidas;
- sin ruido de inventario.

### Almacen

Desktop:

- tabla simplificada;
- foco en producto, estado, inventario, ciclo, descarte;
- sin panel de diferencias OC;
- sin cantidades ajenas al paso de almacen.

Mobile:

- cards simples y enfocadas;
- sin mini grid de cantidades largas;
- inventario como dato principal de la linea.

## Matriz visual de columnas por modo

### Productos sin OC

Columnas potenciales:

```txt
linea
producto
estado_detalle
cantidad_inventario
cantidad
cantidad_gerencia
cantidad_solicitada_sistema
diferencia interna
ciclo
```

Regla:

- solo mostrar columnas ya habilitadas por la etapa actual;
- no reservar visualmente columnas futuras vacias.

### Productos con OC

Columnas potenciales:

```txt
linea
producto
estado_detalle
cantidad_gerencia
cantidad_solicitada_sistema
cantidad_oc_total
cantidad_recibida_total
diferencia compras
ciclo
expandible OC
```

Regla:

- `cantidad_inventario` desaparece de la fila principal.

### Servicios

Columnas potenciales:

```txt
linea
servicio
estado_detalle
cantidad
cantidad_gerencia
cantidad_solicitada_sistema
OC si aplica
ciclo
```

No mostrar inventario.

## Header y resumen principal

### Header

Debe contener:

- boton volver;
- folio solicitud si el rol puede verlo;
- folio OC principal solo si aplica y el rol puede verlo;
- badge de estado de solicitud;
- prioridad;
- metadata compacta.

### Resumen principal

Debe contener segun rol:

- observacion;
- fecha original;
- fecha efectiva de sistema si existe;
- area;
- solicitante si el rol lo puede ver;
- destinos/equipos si aplica;
- indicadores como lock, adjuntos o diferencias segun rol.

## Panel de OC

Debe existir cuando haya informacion de OC suficiente.

Contenido:

- resumen agregado;
- proveedor principal si existe;
- estado/recepcion principal si existe;
- desglose expandible por `folio_oc`;
- relacion con cada linea sin duplicar filas principales.

## Panel de diferencias

Debe ser secundario respecto a la tabla principal, pero visible.

Uso:

- complementar la lectura de la fila;
- no reemplazar la comparacion de cantidades dentro de la linea;
- ayudar a detectar problemas rapidamente.

## Paleta y tono visual

Usar la misma paleta base del listado:

```txt
Fondo principal: #EEECE4
Contenedor: #FFFFFF o #FAF9F5
Verde corporativo oscuro: #003D36
Teal activo: #005C53
Dorado: #D9A73F
Texto principal: #111827
Texto secundario: #7A746B
Bordes suaves: #E5E0D6
```

Reglas:

- `Descartados` usa tono mas apagado, no invisible.
- la fecha de sistema se ve mas opaca o secundaria cuando coexistE con la original.
- badges de estado de solicitud y estado de detalle deben diferenciarse en peso visual.

## No hacer

- No diseñar una pantalla distinta por cada rol.
- No duplicar una tabla por cada estado puntual.
- No convertir los descartados en modal o tab separado.
- No usar inventario en filas con OC activa.
- No esconder las cantidades historicas de descartados.
- No usar una fila por cada OC en el bloque principal.

## Criterios de aceptacion

- La UI se puede componer con Atomic Design de atoms a page.
- Desktop y mobile comparten la misma logica, con distinta densidad visual.
- La pantalla soporta estados de solicitud y estados de detalle sin duplicar experiencias.
- `Activas` y `Descartados` se entienden rapido.
- `descartado_por` y `ciclo` quedan visibles en descartados.
- Los productos cambian correctamente entre modo `sin OC` y `con OC`.
- `secretaria` y `almacen` tienen variantes mas enfocadas sin perder consistencia.
- El desglose por OC es secundario y expandible.
