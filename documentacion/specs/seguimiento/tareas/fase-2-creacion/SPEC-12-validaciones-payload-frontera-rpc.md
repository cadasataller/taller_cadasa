# SPEC-12 — Validaciones, payload y frontera RPC de creación

## Objetivo

Aterrizar las validaciones funcionales y la frontera técnica entre el borrador local y la operación remota de creación.

## Dependencias

Implementar después de:

```txt
SPEC-11-geometria-mapa-posicion-ruta.md
```

## Fuentes de dominio

```txt
documentacion/rastreo_tarea/esquema_bd_tablas_triggers_indices.md
documentacion/rastreo_tarea/rpcs_funciones_bd.md
```

## Validaciones locales mínimas

El frontend debe validar antes de enviar:

- tipo permitido;
- trabajador presente;
- tracker presente;
- descripción presente;
- fecha programada válida;
- duración estimada válida;
- punto de enrutado presente;
- geometría requerida según tipo;
- zona de control cerrada y sin auto-intersecciones;
- posición de ruta cuando sea obligatoria por el flujo definido.

## Validaciones remotas esperables

Por las tablas, índices y triggers documentados, el backend puede rechazar por razones como:

- asignación inválida de tracker;
- geometría inconsistente;
- orden de ruta inválido;
- relación tarea-zona inválida;
- combinación de campos que no satisface `validar_tarea()`;
- conflicto operativo o de unicidad no resuelto localmente.

La UI debe distinguir entre error local y error remoto.

## Frontera RPC

Este spec no inventa una RPC inexistente, pero sí exige definir una operación de creación consistente para frontend.

Opciones aceptables:

1. una RPC pública dedicada de crear tarea;
2. una operación compuesta encapsulada en service que combine inserciones y relaciones bajo una frontera clara;
3. una abstracción temporal documentada mientras se formaliza la operación final.

No es aceptable dejar la creación repartida arbitrariamente en componentes.

## Payload conceptual

El payload debería poder transportar al menos:

- tipo de tarea;
- usuario asignado;
- tracker y source si forman parte del dominio de asignación;
- ubicación o contexto base;
- fecha programada;
- indicaciones;
- prioridad si aplica;
- tiempo estimado;
- punto de enrutado;
- línea de control si aplica;
- zonas asociadas si aplica;
- orden de ruta si aplica;
- metadatos auxiliares necesarios para la operación.

## Respuesta esperada

La operación de creación debería devolver información suficiente para:

- identificar la nueva tarea;
- integrarla al listado;
- abrir su detalle;
- reflejar su geometría y estado inicial;
- evitar una recarga total innecesaria.

## Manejo de errores

Errores locales:

- se muestran por campo o por bloque;
- impiden submit;
- no disparan la operación remota.

Errores remotos:

- pueden venir del dominio o de infraestructura;
- deben mostrarse sin borrar el borrador;
- deben permitir corregir y reenviar;
- si se relacionan con geometría o ruta, deben señalar ese bloque específicamente cuando sea posible.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/creacion/tareaCreacion.validation.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.payload.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.service.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.errors.ts
```

## No hacer

- No inventar una validación local que contradiga triggers documentados.
- No enviar payloads ambiguos según el tipo sin discriminación clara.
- No borrar el borrador si la operación remota falla.
- No convertir todo error remoto en “falló el guardado” sin contexto.

## Criterios de aceptación

- Las validaciones locales mínimas quedan enumeradas.
- La frontera entre draft y RPC queda documentada.
- Los posibles rechazos del dominio backend quedan contemplados.
- El diseño permite integrar la tarea creada sin recargar toda la app.
