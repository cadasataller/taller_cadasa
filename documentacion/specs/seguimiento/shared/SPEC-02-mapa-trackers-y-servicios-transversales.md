# SPEC-02 — Mapa, trackers y servicios transversales

## Objetivo

Delimitar la arquitectura transversal del workspace de `seguimiento` para que mapa, carga de credenciales, trackers y servicios externos no queden mezclados como detalles accidentales de la vista de tareas.

Este spec no define todavía componentes finales ni contratos completos de una fase funcional.

## Fuentes obligatorias

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/estrategia_carga_trackers.md
documentacion/rastreo_tarea/estrategia_carga_kay_maps.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
```

## Decisión transversal

El mapa y los trackers pertenecen al módulo `seguimiento` como infraestructura funcional compartida.

Por lo tanto:

- no deben modelarse como simple componente local de una vista;
- no deben acoplarse exclusivamente al flujo de crear tarea;
- deben exponer contratos reutilizables para visualización, creación y actualización.

## Responsabilidades transversales esperadas

```txt
seguimiento/shared
  - carga e inicialización del proveedor de mapa
  - resolución de credenciales
  - fallback principal/secundario
  - control de concurrencia de recargas
  - estado del provider del mapa
  - utilidades base para trackers
  - contratos comunes de capas y marcadores
```

```txt
seguimiento/tareas
  - decide qué tareas, dudas o trackers mostrar
  - decide qué paneles abrir
  - decide interacciones de negocio
```

## Proveedor de mapa

El proveedor actual esperado es Google Maps JavaScript, pero la implementación debe conservar fronteras claras:

- proveedor de render;
- obtención de credenciales;
- estado de carga;
- errores de autenticación o cuota;
- reconstrucción controlada tras fallback.

La vista funcional no debe gestionar por sí sola:

- scripts del proveedor;
- fallback de credenciales;
- invalidación manual de instancias cargadas;
- recargas simultáneas.

## Reglas derivadas de la estrategia de credenciales

Se consolidan estas reglas:

1. existe una clave principal;
2. existe una clave de respaldo;
3. ambas se reutilizan en memoria por sesión;
4. la clave secundaria se activa sólo cuando la principal falla o queda limitada;
5. debe evitarse duplicar recargas o solicitudes paralelas;
6. si el proveedor requiere reinicialización, debe existir una ruta controlada de limpieza y reconstrucción.

## Trackers como fuente transversal

El dominio documentado contiene entidades y funciones relacionadas con:

- `ubicaciones_actuales_tracker`;
- `eventos_procesamiento_tracker`;
- `estado_detencion_tracker`;
- `visitas_tarea_tracker`;
- `visitas_zona_tarea_tracker`;
- funciones públicas y privadas de procesamiento.

Eso indica que el tracking no es decorativo. El frontend debe prepararse para:

- ubicar trackers en mapa;
- relacionar un tracker con tarea actual o candidata;
- diferenciar tarea normal, tarea activa y duda;
- mostrar estados operativos y temporales de permanencia o visita;
- soportar lectura de información que llega desde procesos automáticos.

## Capas visuales mínimas del workspace

Tomando el mockup como referencia, el workspace debe admitir al menos estas capas:

```txt
mapa base
ruta o polilínea
marcadores de tarea
marcadores de tracker
zonas o límites
capas de duda o permanencia
controles flotantes
```

Cada capa debe poder encenderse, apagarse o actualizarse sin rehacer toda la vista.

## Fronteras de servicio

Los servicios futuros deberían separarse conceptualmente así:

```txt
map provider loader
maps credential service
tracker data service
task query service
task mutation service
geometry helper layer
```

No todo debe vivir en un único service de “seguimiento”.

## Regla de acceso a datos

Vue debe consumir RPCs de negocio y no sustituirlas con consultas directas a tablas internas del dominio. Para `tareas`, la frontera mínima es:

```txt
listar_tareas_rastreo_v2      -> listado, filtros, puntos simples y resumen operativo
obtener_tarea_detalle_v2      -> detalle, asignación, permisos y geometrías GeoJSON
```

Las tablas `tareas`, `ubicaciones_actuales_tracker`, visitas, rutas y estados siguen siendo la fuente de verdad del backend, pero no son el contrato de consulta del frontend. Realtime puede actualizar el estado local después de una carga RPC, sin convertirse en una consulta ad hoc de tablas.

## Impacto en las fases funcionales

Fase 1:

- lectura de mapa;
- lectura de trackers y tareas;
- render de dudas en modo visualización;
- manejo de errores de carga y fallback técnico.

Fase 2:

- reutiliza el mismo mapa para creación;
- agrega captura o edición inicial de geometría;
- reutiliza trackers y capas sin redefinir bootstrap.

Fase 3:

- reutiliza bootstrap de mapa;
- agrega edición de geometría, reasignación o cambios administrativos.

## No hacer

- No incrustar la carga del mapa dentro de un único componente de formulario.
- No esconder la lógica de fallback en utilidades no documentadas.
- No tratar la información de tracker como simple metadato estático del listado.
- No duplicar el bootstrap del proveedor entre ver, crear y editar.
- No ligar la supervivencia del mapa al estado interno de un solo panel lateral.

## Criterios de aceptación

- Queda documentado que mapa y trackers son infraestructura transversal.
- Queda definida la separación entre bootstrap técnico y flujo de negocio.
- Queda consolidada la estrategia principal/secundaria de credenciales.
- El módulo futuro puede reutilizar el mismo workspace en visualización, creación y actualización.
