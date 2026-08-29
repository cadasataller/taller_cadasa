# SPEC-09 — Store, composable y máquina de estados de creación

## Objetivo

Implementar la fuente de verdad mutable del flujo de creación y su coordinación con el panel derecho, el mapa y el workspace.

## Dependencias

Implementar después de:

```txt
SPEC-08-types-contratos-permisos-creacion.md
```

## Regla arquitectónica

La creación debe tener un store dedicado y no mezclar su estado con el store de lectura como si fuera una simple bandera booleana.

Se permite coordinación entre ambos stores, pero no fusión indiscriminada.

## Estado mínimo esperado

El store de creación debe contemplar al menos:

```txt
draft
modo de panel create abierto/cerrado
tipo seleccionado
loading de catálogos auxiliares si aplica
errores de validación local
errores remotos
estado de geometría
estado de envío
confirmación de salida
```

## Máquina de estados mínima

```txt
idle
editing
validating
submitting
success
error
```

Debe poder distinguir además:

- formulario limpio vs con cambios;
- geometría incompleta;
- panel cerrable vs bloqueado por submit;
- salida segura vs confirmación requerida.

## Integración con el workspace

Cuando el usuario abre creación:

- el panel derecho entra en modo `create`;
- el detalle visible previo deja de ser el panel activo;
- el mapa sigue vivo;
- la interacción del mapa pasa a estar subordinada al borrador actual cuando corresponda.

Cuando el usuario cancela o sale:

- si no hay cambios, el panel puede cerrarse;
- si hay cambios, debe poder advertirse la pérdida del borrador;
- el listado y el mapa no deben quedar en estado inconsistente.

## Composable esperado

El composable de creación debe coordinar:

- apertura/cierre;
- protección de salida;
- acciones hacia el store;
- ciclo de vida del panel;
- integración con el workspace y selección posterior.

No debe reemplazar al store como dueño del draft.

## Integración post éxito

Al crear exitosamente:

- el store de creación registra éxito;
- el listado de lectura recibe o refresca la nueva tarea;
- el panel derecho puede pasar a detalle de la tarea creada o a un estado final confirmado;
- el borrador previo se limpia.

La política exacta de post-éxito debe documentarse, no dejarse implícita.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/creacion/tareaCreacion.store.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.store.test.ts
src/composables/seguimiento/useSeguimientoTareaCreacion.ts
```

## No hacer

- No meter el draft de creación dentro de la vista o del panel como estado local principal.
- No compartir el mismo objeto mutable entre creación y edición futura.
- No cerrar silenciosamente el panel si el usuario ya escribió información.
- No suponer que el submit exitoso equivale automáticamente a recargar toda la página.

## Criterios de aceptación

- Existe un store exclusivo para creación.
- El panel derecho en modo create se controla desde estado claro.
- El flujo protege la salida con borrador sucio.
- La tarea creada puede integrarse al workspace sin inconsistencia.
