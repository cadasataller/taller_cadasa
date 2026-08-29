# SPEC-15 — Types, contratos y permisos de actualización

## Objetivo

Definir la base técnica y de permisos para la fase de actualización.

## Dependencias

Implementar después de:

```txt
SPEC-14-alcance-flujo-general-actualizacion.md
```

## Tipos funcionales necesarios

La fase 3 necesita modelar al menos:

```txt
borrador de edición
snapshot original
campos editables
campos bloqueados
resumen de cambios
payload de actualización
respuesta de actualización
errores locales
errores remotos
acciones administrativas
```

## Restricción de tipos editables

El conjunto editable en fase 3 es:

```txt
"finca" | "zona"
```

`duda` no debe entrar al contrato de edición manual.

## Permisos mínimos

UI de edición:

```txt
module_seguimiento
ver_tareas_seguimiento
editar_tareas_seguimiento
```

Capacidades relacionadas:

```txt
editar_asignacion_tarea_seguimiento
editar_geometria_tarea_seguimiento
reprogramar_tarea_seguimiento
ver_mapa_seguimiento
```

Acciones administrativas:

```txt
cancelar_tareas_seguimiento
eliminar_tareas_seguimiento
restaurar_tareas_seguimiento
```

## Reglas de permisos

- Ver una tarea no implica poder editarla.
- Poder editar no implica poder cancelar o eliminar.
- Poder cancelar no implica poder eliminar lógicamente.
- `Duda` puede verse aun por usuarios sin permisos de edición.
- La UI no debe mostrar CTAs de edición por simple acceso al detalle.

## Frontera de contratos

Separar al menos:

```txt
Entidad leída
Draft de edición
Payload de actualización
Payload de acción administrativa
Respuesta de operación
```

## Archivos previstos

```txt
src/stores/seguimiento/tareas/edicion/tareaEdicion.types.ts
src/stores/seguimiento/tareas/edicion/tareaEdicion.validation.ts
src/stores/seguimiento/tareas/edicion/tareaEdicion.payload.ts
src/stores/seguimiento/tareas/edicion/tareaEdicion.service.ts
```

## No hacer

- No usar el mismo tipo para detalle leído, draft editable y payload final.
- No colapsar permisos de edición y eliminación en uno solo.
- No dejar `duda` como tipo editable en la API del frontend.

## Criterios de aceptación

- Quedan definidos permisos mínimos de actualización y acciones administrativas.
- Queda separada la entidad original del borrador editable.
- `Duda` queda fuera del contrato editable.
