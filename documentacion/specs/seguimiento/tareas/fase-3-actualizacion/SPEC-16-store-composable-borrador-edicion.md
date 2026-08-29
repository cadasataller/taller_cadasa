# SPEC-16 — Store, composable y carga del borrador de edición

## Objetivo

Implementar el estado central de edición, la carga del borrador desde una tarea existente y la protección de salida.

## Dependencias

Implementar después de:

```txt
SPEC-15-types-contratos-permisos-actualizacion.md
```

## Regla arquitectónica

La actualización debe tener un store dedicado, separado del store de lectura y del store de creación.

Puede compartir helpers o contratos, pero no debe compartir el mismo objeto mutable de draft.

## Estado mínimo esperado

El store de edición debe contemplar al menos:

```txt
original cargado
draft editable
modo edit abierto/cerrado
loading inicial de borrador
errores de carga
errores de validación local
errores remotos
estado de guardado
estado de acciones administrativas
confirmación de salida
resumen de cambios
```

## Flujo de carga

Al abrir edición:

1. partir de la tarea seleccionada;
2. hidratar campos faltantes si el detalle actual no es suficiente;
3. construir el draft editable;
4. conservar un snapshot original para diff y descarte;
5. abrir el panel en modo `edit`.

## Detección de cambios

El store debe poder distinguir:

- sin cambios;
- con cambios en datos base;
- con cambios de asignación;
- con cambios geométricos;
- con cambios de ruta.

No hace falta exponer un diff complejo desde el primer día, pero sí una noción confiable de “hay cambios”.

## Protección de salida

Si el usuario intenta cerrar el panel o salir con cambios no guardados:

- debe existir confirmación de descarte;
- el borrador no debe perderse silenciosamente;
- el listado y el detalle original no deben contaminarse con cambios locales.

## Integración con el workspace

- el panel derecho cambia de `view` a `edit`;
- el mapa sigue activo;
- la selección principal de tarea se mantiene;
- la vista de detalle no debe romperse al cancelar la edición.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/edicion/tareaEdicion.store.ts
src/stores/seguimiento/tareas/edicion/tareaEdicion.store.test.ts
src/composables/seguimiento/useSeguimientoTareaEdicion.ts
```

## No hacer

- No guardar cambios directamente sobre la entidad mostrada en lectura.
- No usar el store de creación como base editable de actualización.
- No cerrar la edición silenciosamente si hay cambios sin guardar.
- No perder el snapshot original necesario para reset o diff.

## Criterios de aceptación

- Existe un store exclusivo de edición.
- El borrador se construye a partir de la tarea existente.
- La salida con cambios no guardados queda protegida.
- La edición convive con el workspace sin inconsistencias.
