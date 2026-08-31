# SPEC-10 — Formulario, asignación y detalles base

## Objetivo

Definir la UI y reglas funcionales del formulario base de creación según el mockup.

## Dependencias

Implementar después de:

```txt
SPEC-09-store-composable-maquina-estados-creacion.md
```

## Fuente visual

```txt
documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html
```

## Secciones confirmadas del formulario

```txt
Tipo de tarea
Asignación
Detalles
Ubicación y geometría
Ruta
```

Este spec cubre las tres primeras y deja geometría/ruta para el siguiente spec.

## Tipo de tarea

El tipo se detecta durante la clasificación espacial y se muestra como un
indicador de solo lectura:

```txt
Finca
Zona
```

Reglas:

- `Duda` no aparece;
- el usuario no puede cambiar el tipo desde el panel de detalles;
- no se muestran descripciones redundantes por tipo;
- conservar la geometría detectada tiene prioridad sobre ofrecer una selección
  manual posterior.

## Asignación

El bloque de asignación debe contemplar al menos:

- trabajador;
- equipo / tracker;
- acompañante.

Reglas:

- trabajador es obligatorio;
- tracker es obligatorio;
- acompañante puede ser opcional;
- la UI debe poder representar “sin acompañante” de forma explícita;
- la selección debe venir de fuentes válidas del dominio, no de texto libre si no está confirmado.

## Detalles

El bloque de detalles debe contemplar al menos:

- descripción o indicaciones;
- fecha programada;
- duración estimada.

## Duración

Tomando el mockup como referencia:

- el control es incremental;
- los pasos visibles son de 15 minutos;
- no debe permitir valores fuera del rango de negocio permitido;
- el valor debe ser legible en desktop y mobile;
- no debe depender de entrada textual libre si el control principal es stepper.

## Validaciones locales mínimas

- tipo seleccionado;
- trabajador válido;
- tracker válido;
- descripción no vacía;
- fecha programada válida;
- duración válida y positiva.

Los mensajes finales pueden definirse en la capa de validación, pero este spec obliga esos chequeos conceptuales.

## Reglas de UX

- la jerarquía visual del panel debe parecer la del mockup;
- el formulario debe sentirse compacto y operativo;
- no debe requerir scroll horizontal;
- los labels y ayudas deben ser claros en móvil;
- el botón primario final no pertenece a esta sección, sino al footer del panel.

## Archivos previstos

```txt
src/components/seguimiento/tareas/create/TaskTypeSelector.vue
src/components/seguimiento/tareas/create/TaskAssignmentSection.vue
src/components/seguimiento/tareas/create/TaskDetailsSection.vue
src/components/seguimiento/tareas/create/DurationStepper.vue
```

## No hacer

- No usar `duda` como opción manual.
- No usar inputs libres para relaciones que deberían seleccionarse desde catálogo.
- No esconder la invalidez del tracker o trabajador hasta después del submit si puede detectarse antes.

## Criterios de aceptación

- El formulario base refleja las secciones visibles del mockup.
- Tipo, asignación y detalles quedan definidos con reglas claras.
- Duración incremental y validaciones mínimas quedan documentadas.
