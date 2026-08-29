# SPEC-14 — Alcance y flujo general de actualización

## Objetivo

Fijar el alcance funcional de la actualización manual de tareas y separar claramente edición normal de acciones administrativas.

## Dependencias

Implementar después de:

```txt
fase-2-creacion completa
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
```

## Fuente visual principal

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Objetivo funcional

La fase 3 debe permitir:

1. abrir el panel derecho en modo `edit` desde una tarea seleccionada;
2. cargar un borrador editable a partir de la tarea existente;
3. modificar campos permitidos;
4. ajustar tracker, geometría y posición de ruta según permisos;
5. validar cambios;
6. guardar actualización;
7. ejecutar acciones administrativas separadas cuando existan permisos;
8. reflejar el resultado en listado, detalle y mapa.

## Fuera de alcance

- edición manual de `duda`;
- creación de `duda`;
- flujos batch de edición;
- auditoría visual completa avanzada;
- herramientas de administración masiva;
- acciones silenciosas que modifiquen la tarea sin feedback.

## Tipos permitidos

Permitidos:

```txt
finca
zona
```

No permitido:

```txt
duda
```

## Flujo general esperado

```txt
usuario abre detalle
→ elige editar
→ panel derecho cambia a modo edit
→ se carga borrador desde la tarea actual
→ modifica campos permitidos
→ valida
→ guarda cambios
→ backend responde
→ store integra la tarea actualizada
→ detalle y mapa reflejan cambios
```

Acciones administrativas:

```txt
detalle o edición
→ acción específica
→ confirmación
→ operación remota
→ integración del resultado
```

## Relación con fases anteriores

- La visualización sigue siendo la base del workspace.
- La edición reutiliza gran parte de la estructura del formulario de creación.
- La actualización no debe duplicar componentes sin necesidad.
- Las acciones destructivas o administrativas no deben ocultarse dentro del botón principal de guardar.

## Decisiones consolidadas

- El panel derecho soporta modo `edit`.
- `Duda` continúa siendo visualización solamente.
- Edición normal y acciones administrativas deben tratarse como flujos distintos.
- El mapa sigue activo durante la edición.

## No hacer

- No mezclar guardar cambios con cancelar o eliminar en una sola acción.
- No dejar `duda` como editable por omisión.
- No hacer que la edición requiera abandonar el workspace existente.

## Criterios de aceptación

- Queda definido el flujo principal de edición.
- Quedan separadas edición normal y acciones administrativas.
- `Duda` queda explícitamente excluida del flujo editable.
