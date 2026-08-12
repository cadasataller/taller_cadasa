# SPEC-05 — Drawer de Detalles y formulario

## Objetivo

Implementar consulta, creación y edición separando objeto maestro y relaciones informativas.

## Dependencias

Implementar después de `SPEC-03` y `SPEC-04`.

## Archivos

```txt
src/components/engrase/catalogo/sistemas/SistemaDetailDrawer.vue
src/components/engrase/catalogo/sistemas/SistemaForm.vue
src/components/engrase/catalogo/sistemas/SistemaRelatedOils.vue
src/components/engrase/catalogo/sistemas/SistemaEquipmentTypes.vue
src/components/engrase/catalogo/sistemas/SistemaImpactSummary.vue
src/components/engrase/catalogo/sistemas/SistemaUnsavedDialog.vue
```

## Modos

### Crear

```ts
{ id: null, nombre: "", activo: true }
```

- Título `Nuevo sistema`; acción `Crear sistema`.
- No pedir aceite/equipo.
- Explicar que las asociaciones se agregan desde el equipo.
- Impacto y aceites iniciales vacíos.

### Editar

- Título `Detalles`.
- Draft con nombre/estado.
- Aceites e impacto del item cargado.
- Acción `Guardar cambios`.
- Sin mutar el item mientras se escribe.

## Campos editables

### Nombre para mostrar

- Requerido, label visible y asociado.
- `trim` al validar/enviar.
- Límite visual provisional de la imagen: `SISTEMA_NOMBRE_MAX = 100`.
- Contador `N/100`, `text-xs`.
- Validación blur/submit.
- Mobile `min-h-11 text-base`; desktop `h-8/h-9 text-sm`.

```txt
Ingresa un nombre para mostrar.
El nombre no puede superar 100 caracteres.
```

### Estado

`[Activo] [Desactivado]` mediante `fieldset`/`legend` y radios o semántica equivalente. Texto explícito, target 44px mobile, `cursor-pointer`. Desactivar conserva asociaciones.

## Solo lectura

### Aceites relacionados

Por elemento:

```txt
nombre · cantidad de equipos distintos
```

- Mostrar todos mediante chips/wrap; cuatro + botón `+N` si hace falta.
- `+N` expande/popover accesible con `cursor-pointer`.
- No agregar/quitar aceites.
- Encabezado muestra `aceites.length` como cantidad de aceites distintos, no `totalEquipos`.
- Vacío: `Sin aceites relacionados`.

### Tipos de equipo

Nombre + cantidad de equipos distintos; ordenar cantidad descendente y nombre. Misma expansión/wrap. Vacío: `Sin equipos asociados`.

### Impacto

```txt
Esta actualización se reflejará en N equipos.
Total asignaciones: N
```

Para cero: `Este sistema todavía no se utiliza en equipos.` Explicar que nombre/estado cambia el objeto maestro, no `equipo_aceite`.

## Responsive

- Desktop: `aside` acoplado, `clamp(340px, 30vw, 420px)`, scroll único, footer sticky.
- Tablet: drawer overlay máximo 420px, scrim/focus trap.
- Mobile: full-screen, header/footer sticky, safe areas, lista oculta.

## Acciones/accesibilidad

- Cerrar, Cancelar, Crear/Guardar.
- Habilitado `cursor-pointer`; disabled `cursor-not-allowed`; guardando `cursor-wait`.
- Cierre con cambios abre descarte; Escape sigue la regla.
- Foco inicial, primer error, trap/retorno en overlay.
- X con `aria-label="Cerrar detalles"`.
- Read-only visual/semánticamente distinto de disabled.
- Reduced motion.

Props readonly:

```txt
open, mode, item, draft, hasChanges, saving, fieldErrors
```

Emits:

```txt
update:draft, request-close, cancel, submit,
expand-oils, expand-equipment-types
```

## Criterios de aceptación

- Solo nombre/estado editables.
- Aceites, tipos de equipo e impacto read-only.
- Conteo de aceites no se confunde con equipos.
- Crear no solicita relaciones.
- Sin request de detalle ni pérdida silenciosa de cambios.
- Responsive y cursores coherentes.

