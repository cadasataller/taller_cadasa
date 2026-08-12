# SPEC-05 — Drawer de detalle y formulario

## Objetivo

Implementar consulta, creación y edición distinguiendo con claridad los campos maestros de las relaciones informativas.

## Dependencias

Implementar después de `SPEC-03` y `SPEC-04`.

## Archivos

```txt
src/components/engrase/catalogo/filtros/FiltroDetailDrawer.vue
src/components/engrase/catalogo/filtros/FiltroForm.vue
src/components/engrase/catalogo/filtros/FiltroRelatedTypes.vue
src/components/engrase/catalogo/filtros/FiltroEquipmentTypes.vue
src/components/engrase/catalogo/filtros/FiltroImpactSummary.vue
src/components/engrase/catalogo/filtros/FiltroUnsavedDialog.vue
```

## Modos

### Crear

```ts
{
  id: null,
  codigo: "",
  estaEnListaCompras: true,
  activo: true
}
```

- Título: `Nuevo filtro`.
- Acción: `Crear filtro`.
- No pedir tipo ni equipo.
- Mostrar relaciones vacías solo si ayuda: `Las asociaciones se agregan desde la edición del equipo.`
- Impacto inicial esperado: cero equipos y cero asignaciones.

### Editar

- Título: `Detalles`.
- Copiar los tres campos al draft.
- Mostrar relaciones e impacto del item cargado.
- Acción: `Guardar cambios`.
- No mutar el item al escribir.

## Campos editables

### Código del filtro

- Label visible, requerido y asociado.
- `trim` al validar/enviar; conservar espacios internos.
- La imagen indica máximo 100. Centralizar `FILTRO_CODIGO_MAX = 100` como restricción visual provisional hasta que el contrato indique otra.
- Contador `N/100` en `text-xs`.
- Error en blur y submit, no agresivamente en la primera pulsación.
- Mobile `min-h-11 text-base`; desktop `h-8/h-9 text-sm`.

Mensajes:

```txt
Ingresa el código del filtro.
El código no puede superar 100 caracteres.
```

### En compras

```txt
[Sí] [No]
```

### Estado

```txt
[Activo] [Desactivado]
```

Ambos son `fieldset` con `legend` y radios nativos estilizados o botones con semántica equivalente. Texto y estado accesible; `cursor-pointer`; target 44px mobile. Desactivar conserva relaciones.

## Solo lectura

### Tipos de filtro donde se utiliza

Por relación:

```txt
nombre · cantidad de equipos
```

- No permitir agregar, quitar o seleccionar.
- Chips compactos con wrap.
- Mostrar cuatro y botón `+N` cuando haya más.
- `+N` debe expandir o abrir popover accesible y usar `cursor-pointer`.
- Vacío: `Sin tipos de filtro relacionados`.

### Usado en tipos de equipo

Por elemento:

```txt
nombre · cantidad de equipos distintos
```

- Orden de presentación: cantidad descendente y luego nombre.
- Mismas reglas de chips, expansión y wrap.
- Vacío: `Sin equipos asociados`.

### Impacto

En edición:

```txt
Esta actualización se reflejará en N equipos.
Total asignaciones: N
```

Para cero: `Este filtro todavía no se utiliza en equipos.`

El texto debe explicar que es alcance informativo y no implica modificar asociaciones. `totalEquipos` son equipos distintos; `totalAsignaciones` son relaciones y puede ser mayor.

## Layout responsive

### Desktop amplio

- Panel acoplado junto al listado.
- Ancho `clamp(340px, 30vw, 420px)`.
- Un scroll interno para contenido; footer sticky.
- Usar `aside`, no dialog modal.

### Tablet

- Drawer overlay derecho, máximo `420px`.
- Scrim y focus trap.

### Mobile

- Pantalla completa con header/footer sticky.
- Safe areas y bottom nav respetados.
- Lista y detalle no compiten simultáneamente.

## Acciones y cierre

```txt
Cerrar
Cancelar
Crear filtro | Guardar cambios
```

- Habilitado `cursor-pointer`.
- Sin cambios, errores o guardando: guardar deshabilitado con `cursor-not-allowed`.
- Durante operación: `cursor-wait`.
- Cerrar con draft limpio cierra directamente.
- Cerrar/Cancelar/Escape con cambios abre confirmación de descarte.

## Accesibilidad

- Foco inicial en título o primer campo.
- Error enfoca primer campo inválido.
- Overlay contiene foco y lo devuelve al disparador.
- X: `aria-label="Cerrar detalles"`.
- Labels, legends y descripciones asociados.
- Respetar `prefers-reduced-motion`.

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
expand-related-types
expand-equipment-types
```

## Criterios de aceptación

- Solo código, compras y estado son editables.
- Tipos relacionados, tipos de equipo e impacto son inmutables.
- Crear no pide asociaciones.
- Drawer se adapta a desktop, tablet y mobile.
- No existe request de detalle.
- Cambios no se pierden sin confirmación.
- Cursores y estados interactivos son coherentes.

