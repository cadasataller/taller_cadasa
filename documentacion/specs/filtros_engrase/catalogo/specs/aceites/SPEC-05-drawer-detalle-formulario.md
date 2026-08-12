# SPEC-05 — Drawer de Detalles y formulario

## Objetivo

Implementar consulta, creación y edición separando campos maestros de relaciones informativas.

## Dependencias

Implementar después de `SPEC-03` y `SPEC-04`.

## Archivos

```txt
src/components/engrase/catalogo/aceites/AceiteDetailDrawer.vue
src/components/engrase/catalogo/aceites/AceiteForm.vue
src/components/engrase/catalogo/aceites/AceiteRelatedSystems.vue
src/components/engrase/catalogo/aceites/AceiteEquipmentTypes.vue
src/components/engrase/catalogo/aceites/AceiteImpactSummary.vue
src/components/engrase/catalogo/aceites/AceiteUnsavedDialog.vue
```

## Modos

### Crear

```ts
{
  id: null,
  nombre: "",
  activo: true
}
```

- Título `Nuevo aceite`.
- Acción `Crear aceite`.
- No pedir sistema o equipo.
- Mensaje: `Las asociaciones se agregan desde la edición del equipo.`
- Impacto esperado: 0 equipos, 0 asignaciones y sistemas vacíos.

### Editar

- Título `Detalles`.
- Copiar nombre y estado al draft.
- Mostrar sistemas e impacto del item cargado.
- Acción `Guardar cambios`.
- Nunca mutar el item mientras se escribe.

## Campos editables

### Nombre para mostrar

- Label visible/asociado y requerido.
- `trim` al validar y enviar; conservar espacios internos.
- La referencia muestra máximo 100. Centralizar `ACEITE_NOMBRE_MAX = 100` como límite visual provisional hasta que el contrato indique otro.
- Contador `N/100` en `text-xs`.
- Validación en blur y submit.
- Mobile `min-h-11 text-base`; desktop `h-8/h-9 text-sm`.

Mensajes:

```txt
Ingresa un nombre para mostrar.
El nombre no puede superar 100 caracteres.
```

### Estado

```txt
[Activo] [Desactivado]
```

Usar `fieldset`/`legend` con radios nativos estilizados o semántica equivalente. Texto y selección explícitos; `cursor-pointer`; target 44px mobile. Desactivar no modifica relaciones.

## Información de solo lectura

### Sistemas donde se utiliza

Mostrar todos:

```txt
nombre del sistema · cantidad de equipos distintos
```

- Ordenar para presentación por cantidad descendente y nombre.
- Chips compactos con wrap.
- Puede mostrar cuatro y `+N`; `+N` expande/popover accesible con `cursor-pointer`.
- No agregar, quitar ni seleccionar sistemas.
- Vacío: `Sin sistemas asociados`.

### Usado en tipos de equipo

Por elemento:

```txt
nombre · cantidad de equipos distintos
```

Mismas reglas de orden, chips, expansión y wrap. Vacío: `Sin equipos asociados`.

### Impacto

En edición:

```txt
Esta actualización se reflejará en N equipos.
Total asignaciones: N
```

Para cero: `Este aceite todavía no se utiliza en equipos.`

Explicar que el alcance es informativo: cambiar nombre/estado no actualiza `equipo_aceite`; las asociaciones mantienen el mismo `aceite.id`.

## Layout responsive

### Desktop

- Panel acoplado junto al listado.
- Ancho `clamp(340px, 30vw, 420px)`.
- Un scroll de contenido y footer sticky.
- Semántica `aside`, no dialog.

### Tablet

- Drawer overlay derecho, máximo 420px, scrim y focus trap.

### Mobile

- Pantalla completa con header/footer sticky.
- Safe areas y bottom nav respetados.
- No mostrar lista y detalle simultáneamente.

## Acciones

```txt
Cerrar
Cancelar
Crear aceite | Guardar cambios
```

- Habilitado `cursor-pointer`.
- Sin cambios, inválido o guardando: `cursor-not-allowed` y `disabled`.
- En progreso: `cursor-wait`.
- Cerrar draft limpio es directo.
- Con cambios, Cerrar/Cancelar/Escape abre confirmación de descarte.

## Accesibilidad

- Foco inicial y primer error manejados.
- Overlay contiene y devuelve foco.
- X con `aria-label="Cerrar detalles"`.
- Relaciones read-only se diferencian de controles disabled.
- Reduced motion.

## Contrato de componentes

Props readonly:

```txt
open, mode, item, draft, hasChanges, saving, fieldErrors
```

Emits:

```txt
update:draft
request-close
cancel
submit
expand-systems
expand-equipment-types
```

## Criterios de aceptación

- Solo nombre y estado son editables.
- Sistemas, tipos de equipo e impacto son read-only.
- Crear no solicita asociaciones.
- Drawer responde correctamente en tres clases de viewport.
- No existe request de detalle.
- No se pierden cambios sin confirmación.
- Cursores y estados son coherentes.

