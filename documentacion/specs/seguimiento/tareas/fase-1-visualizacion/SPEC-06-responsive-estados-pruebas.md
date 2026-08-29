# SPEC-06 — Responsive, estados globales y pruebas

## Objetivo

Componer la fase 1 completa y fijar comportamiento responsive, estados visuales y criterios mínimos de prueba.

## Conexión de rastreo

Las pruebas e integraciones de fase 1 deben usar o mockear `supabaseRastreoTareas`: `listar_tareas_rastreo_v2`, `obtener_tarea_detalle_v2` y la Edge Function `maps-key` cuando se inicialice Google Maps. No deben usar el cliente Supabase principal para esas operaciones.

Las pruebas de carga, vacío, error y retry deben mockear `listar_tareas_rastreo_v2` y `obtener_tarea_detalle_v2`. No deben simular lecturas directas de tablas como contrato del workspace.

## Dependencias

Implementar después de:

```txt
SPEC-02-shell-vista-y-paneles.md
SPEC-03-filtros-superiores-y-toolbar-mapa.md
SPEC-04-listado-lateral-tareas.md
SPEC-05-detalle-tarea-y-duda.md
```

## Desktop

La composición base debe conservar:

```txt
filtros flotantes arriba
panel lateral izquierdo
mapa central
panel derecho de detalle
herramientas flotantes del mapa
```

Reglas:

- no debe aparecer scroll horizontal accidental;
- el mapa no debe desaparecer al abrir detalle;
- los paneles deben tener scroll interno cuando haga falta;
- el producto debe sentirse operativo y legible, no como modal sobre modal.

## Mobile

El flujo puede volverse secuencial para preservar legibilidad:

```txt
filtros globales
→ listado
→ detalle
→ regreso al listado
```

Reglas:

- preservar el contexto de filtros al volver;
- mantener selección lógica o comportamiento consistente al cerrar detalle;
- conservar objetivos táctiles mínimos de `44px`;
- evitar comprimir tres paneles simultáneos en una sola pantalla.

## Estados globales

### Carga inicial

- skeleton o placeholders para barra, listado y panel;
- no mostrar vacío antes de completar la primera carga.

### Vacío estructural

- no existen tareas para el contexto base;
- el mensaje debe ser distinto de “sin resultados por filtros”.

### Sin resultados por filtros

- existen tareas en general, pero no con la combinación aplicada;
- ofrecer limpiar filtros o volver al contexto inicial.

### Error inicial

- mensaje claro;
- botón de reintento;
- no debe colapsar toda la navegación de la app.

### Errores parciales

- el listado puede fallar de forma independiente;
- el detalle puede fallar de forma independiente;
- el mapa puede fallar de forma independiente;
- el usuario debe recuperar cada parte sin perder necesariamente toda la pantalla.

## Accesibilidad

- foco visible;
- selección comunicada semánticamente;
- color no es el único indicador;
- iconos decorativos ocultos a lectores cuando aplique;
- etiquetas claras para herramientas de mapa;
- lectura suficiente de estados y badges.

## Pruebas mínimas recomendadas

Unitarias:

- store de lectura;
- helpers y mappers;
- lógica de selección;
- reglas de diferenciación de `duda`.

Componentes:

- listado lateral;
- card de tarea;
- panel de detalle;
- barra de filtros;
- vista principal en composición básica.

Integración:

- abrir ruta con permisos;
- cargar resultados;
- seleccionar tarea;
- abrir detalle;
- visualizar `duda`;
- recuperar error parcial;
- flujo mobile de ir y volver.

## No hacer

- No introducir pruebas de creación o edición en esta fase.
- No exigir persistencia local como condición de aceptación.
- No degradar la experiencia mobile a una miniatura del desktop.
- No asumir que todo error requiere recargar la aplicación completa.

## Criterios de aceptación

- La fase 1 queda integrada como workspace coherente.
- Desktop y mobile tienen flujos definidos y legibles.
- Los estados loading, vacío, sin resultados y error quedan diferenciados.
- Existen criterios de prueba para lectura, selección y `duda`.
