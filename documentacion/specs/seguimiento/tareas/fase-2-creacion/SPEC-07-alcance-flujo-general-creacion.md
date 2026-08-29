# SPEC-07 — Alcance y flujo general de creación

## Objetivo

Fijar el alcance funcional exacto de la creación manual de tareas antes de entrar a types, store, formulario o RPC.

## Dependencias

Implementar después de:

```txt
fase-1-visualizacion completa
documentacion/specs/seguimiento/shared/SPEC-03-modelo-dominio-y-capacidades-base.md
```

## Fuente visual principal

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Objetivo funcional

La fase 2 debe permitir:

1. abrir el panel derecho en modo `create`;
2. elegir tipo de tarea `finca` o `zona`;
3. seleccionar trabajador, tracker y acompañante si aplica;
4. definir descripción, fecha y duración;
5. definir geometría y contexto espacial;
6. fijar posición de tarea en ruta;
7. validar el formulario;
8. guardar la tarea;
9. reflejar la nueva tarea en el workspace.

## Fuera de alcance

- crear `duda`;
- edición de tarea existente;
- cancelación o eliminación;
- restauración;
- wizard multi-ruta independiente;
- bulk create;
- subida masiva;
- aprobación posterior;
- flujo de observaciones como parte del guardado inicial.

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
usuario abre crear
→ panel derecho cambia a modo create
→ elige tipo
→ completa asignación
→ completa detalles
→ define geometría
→ define posición en ruta
→ valida
→ guarda
→ backend responde
→ store integra nueva tarea
→ UI vuelve a detalle o estado confirmado
```

## Relación con la fase 1

La creación no reemplaza la fase de visualización. Debe convivir con ella:

- el mapa sigue siendo el mismo workspace;
- el listado lateral se conserva;
- el formulario aparece en el panel derecho;
- la selección o contexto del mapa puede ayudar a prellenar, pero no debe introducir efectos ocultos no documentados.

## Decisiones consolidadas del mockup

- El formulario vive en el panel derecho.
- Existen secciones claras de tipo, asignación, detalles, ubicación/geometría y ruta.
- El control de duración es incremental.
- `finca` y `zona` modifican el comportamiento del bloque geométrico.
- El botón principal de cierre de flujo es `Guardar tarea`.

## Reglas de negocio mínimas

- El tipo elegido condiciona qué geometría debe existir.
- La tarea necesita asignación operativa válida.
- La tarea necesita fecha programada.
- La tarea necesita duración estimada válida.
- La tarea necesita al menos un punto de enrutado.
- La posición de ruta debe respetar restricciones del dominio cuando aplique.

## No hacer

- No abrir creación para usuarios sin permiso específico.
- No crear flujos separados por tipo si la diferencia puede resolverse dentro del mismo formulario.
- No tratar el mockup como autorización para guardar datos incompletos.
- No inventar creación manual de `duda`.

## Criterios de aceptación

- El alcance de creación manual queda limitado a `finca` y `zona`.
- El panel derecho en modo `create` queda confirmado como superficie principal.
- La fase 2 queda alineada con el mockup y con la fase 1.
