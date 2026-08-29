# Specs — Módulo Seguimiento

> Módulo funcional nuevo: **Seguimiento**
>
> Primera subruta confirmada: **Tareas**
>
> Ruta canónica objetivo: `/seguimiento/tareas`

## Propósito

Esta carpeta define la base documental del módulo `seguimiento` para que la implementación siga una estructura incremental y estable, similar a `engrase`, pero adaptada al dominio de tareas, mapa, trackers, geometría y observación operativa.

El módulo nace con una única subruta funcional:

```txt
/seguimiento/tareas
```

La documentación se separa en:

- specs `shared` para decisiones transversales del módulo;
- specs específicos del submódulo `tareas`;
- fases de entrega independientes para visualización, creación y actualización.

## Alcance inicial confirmado

- El módulo padre se llama `Seguimiento`.
- La primera subruta es `Tareas`.
- Debe existir una estrategia de permisos por acción desde el diseño, aunque la matriz real aún no esté publicada.
- Mientras no existan permisos definitivos, se permitirá una simulación temporal de acceso para `erickq@cadasa.com`.
- Deben existir tres fases funcionales:
  1. visualización;
  2. creación;
  3. actualización.
- `Dudas` pertenece al mismo subdominio de tareas, pero por ahora se trata como un tipo de tarea generado automáticamente y con capacidad de solo visualización.
- La estrategia de mapa y trackers es transversal al módulo y no debe quedar embebida como detalle aislado de una sola pantalla.

## Fuentes obligatorias

Antes de implementar cualquier spec de este módulo, leer completamente:

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
documentacion/rastreo_tarea/mockup-rastreo-mobile.html
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
documentacion/rastreo_tarea/estrategia_carga_trackers.md
documentacion/rastreo_tarea/estrategia_carga_kay_maps.md
```

Cuando exista una diferencia entre mockup y reglas funcionales posteriores, prevalecen las decisiones consolidadas en los specs.

## Organización propuesta

```txt
shared/
├── SPEC-00-base-modulo-rutas-permisos.md
├── SPEC-01-simulacion-dev-y-taxonomia-permisos.md
├── SPEC-02-mapa-trackers-y-servicios-transversales.md
└── SPEC-03-modelo-dominio-y-capacidades-base.md
```

Las carpetas futuras de `tareas` deben colgarse de esta base:

```txt
tareas/
├── README.md
├── fase-1-visualizacion/
├── fase-2-creacion/
└── fase-3-actualizacion/
```

## Orden de trabajo recomendado

1. Implementar completamente `shared/SPEC-00` a `shared/SPEC-03`.
2. Crear el `README` del submódulo `tareas`.
3. Implementar `tareas/fase-1-visualizacion`.
4. Implementar `tareas/fase-2-creacion`.
5. Implementar `tareas/fase-3-actualizacion`.
6. Integrar pruebas, endurecimiento de permisos y retiro del fallback temporal de desarrollo.

## Reglas transversales del módulo

- La ruta de vista debe ser una superficie de composición delgada.
- El mapa es parte del workspace central, no un widget secundario.
- La lógica de permisos no debe duplicarse entre router, layout y componentes.
- La simulación temporal para desarrollo debe vivir encapsulada en un único punto.
- Debe diseñarse permisos por acción aunque temporalmente un usuario de prueba obtenga acceso total.
- `Dudas` no debe mezclarse como simple badge visual; debe modelarse como variante funcional con capacidades restringidas.
- No acoplar las fases de visualización, creación y actualización en un solo spec gigante.
- No asumir que toda interacción del mockup entra en la primera entrega.
- Vue debe consumir los RPC de negocio documentados en `rastreo_tarea/rpcs_funciones_bd.md` para leer o mutar tareas. No debe consultar tablas internas de tareas, tracking, visitas, rutas o estados como sustituto de esos contratos.
- Las suscripciones Realtime pueden reflejar cambios autorizados, pero no reemplazan la carga inicial ni el detalle obtenidos mediante RPC.

## Resultado esperado de esta carpeta

Al terminar los specs `shared`, el proyecto debe tener definidas:

- la ruta canónica y la ubicación del módulo en navegación;
- la taxonomía preliminar de permisos;
- la simulación temporal de permisos para desarrollo;
- el alcance transversal de mapa, trackers y proveedores externos;
- el modelo base de tipos de tarea y sus capacidades mínimas;
- la frontera entre decisiones del módulo y decisiones propias del submódulo `tareas`.
