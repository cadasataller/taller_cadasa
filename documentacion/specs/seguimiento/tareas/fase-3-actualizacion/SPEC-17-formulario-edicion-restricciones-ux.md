# SPEC-17 — Formulario de edición, restricciones y UX

## Objetivo

Definir cómo se reutiliza y adapta el formulario para edición, incluyendo restricciones por tipo y por capacidad.

## Dependencias

Implementar después de:

```txt
SPEC-16-store-composable-borrador-edicion.md
documentacion/specs/seguimiento/tareas/fase-2-creacion/SPEC-10-formulario-asignacion-detalles-base.md
```

## Reutilización del formulario

La edición debe reutilizar al máximo la estructura del formulario de creación:

```txt
Tipo de tarea
Asignación
Detalles
Ubicación y geometría
Ruta
```

Pero con diferencias claras de comportamiento.

## Restricciones recomendadas

Tipo de tarea:

- por defecto debe tratarse como bloqueado en edición, salvo confirmación futura en contra;
- no debe poder pasar silenciosamente de `finca` a `zona` o viceversa si eso rompe contratos geométricos.

Asignación:

- puede requerir permisos adicionales para cambiar tracker o trabajador;
- acompañante puede seguir siendo opcional si el dominio lo permite.

Detalles:

- descripción, fecha o duración pueden ser editables según permisos;
- cualquier campo bloqueado debe verse claramente como de solo lectura.

## UX de edición

- el panel debe comunicar de forma clara que el usuario está editando una tarea existente;
- el botón principal debe indicar guardado de cambios, no creación;
- si existen cambios, debe quedar claro qué estado del panel está sucio;
- si no hay cambios, el submit no debe comportarse como operación real necesaria.

## `Duda`

Si la tarea seleccionada es `duda`:

- no abrir el formulario de edición;
- mantener el detalle de lectura;
- ocultar o deshabilitar la acción de editar según la política de permisos y UX.

## Estados visuales

- cargando borrador;
- edición lista;
- con errores locales;
- guardando cambios;
- error remoto;
- éxito.

## Archivos previstos

```txt
src/components/seguimiento/tareas/edit/TaskEditPanel.vue
src/components/seguimiento/tareas/edit/**
```

Se permite reutilizar componentes de `create/` si su API soporta ambos modos con claridad.

## No hacer

- No presentar edición y creación como dos diseños totalmente distintos sin necesidad.
- No permitir cambio de tipo por defecto si no está controlado.
- No abrir edición para `duda`.
- No ocultar campos bloqueados como si estuvieran ausentes si eso confunde al usuario.

## Criterios de aceptación

- La edición reutiliza la base del formulario de creación.
- Quedan documentadas diferencias de comportamiento entre create y edit.
- `Duda` no entra al flujo editable.
- Los campos bloqueados y estados del panel quedan claros.
