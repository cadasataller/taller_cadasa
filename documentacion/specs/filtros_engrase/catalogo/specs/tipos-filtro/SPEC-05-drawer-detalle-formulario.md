# SPEC-05 — Drawer de Detalles y formulario

## Objetivo

Implementar la superficie para consultar, crear y editar un tipo de filtro sin mezclar campos editables con relaciones informativas.

## Dependencias

Implementar después de `SPEC-03` y `SPEC-04`.

## Archivos

```txt
src/components/engrase/catalogo/tipos-filtro/TipoFiltroDetailDrawer.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroForm.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroImpactSummary.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroEquipmentTypes.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroUnsavedDialog.vue
```

## Modos

```txt
crear
editar
```

### Crear

```ts
{
  id: null,
  nombre: "",
  activo: true
}
```

- Título: `Nuevo tipo de filtro`.
- No mostrar asociaciones ficticias.
- Puede mostrar: `Todavía no está asociado a equipos`.
- Acción primaria: `Crear tipo de filtro`.

### Editar

- Título: `Detalles`.
- Copiar nombre y estado al draft.
- Mostrar impacto recibido en listado.
- Acción primaria: `Guardar cambios`.
- Nunca mutar el item mientras se escribe.

## Campos editables

### Nombre para mostrar

- Label visible y asociado.
- Requerido.
- Aplicar `trim` al validar y enviar; permitir espacios internos.
- La imagen muestra máximo 100 caracteres. Centralizar `TIPO_FILTRO_NOMBRE_MAX = 100` mientras no exista otra regla contractual.
- Mostrar contador `N/100` en `text-xs`.
- Validar en blur y submit, no durante cada pulsación inicial.
- Mobile: `min-h-11 text-base`; desktop: `h-8/h-9 text-sm`.

Mensajes:

```txt
Ingresa un nombre para mostrar.
El nombre no puede superar 100 caracteres.
```

### Estado

```txt
[Activo] [Desactivado]
```

- Usar botones reales en `fieldset`/`legend` o radios nativos estilizados.
- Comunicar selección semánticamente y con texto.
- Cada opción usa `cursor-pointer` y target mínimo 44px mobile.
- Desktop conserva altura visual compacta.
- Desactivar no elimina ni modifica asociaciones.

## Información de solo lectura

### Tipos de equipo asociados

Por elemento:

```txt
nombre del tipo
cantidad de equipos distintos
```

- Ordenar por cantidad descendente y luego nombre solo para presentación.
- Usar chips compactos como en la imagen cuando haya pocos.
- Si hay más de cuatro, mostrar cuatro y botón `+N` con `cursor-pointer`.
- `+N` expande o abre popover accesible; no es texto inerte.
- Mobile permite wrap, nunca scroll horizontal.
- Sin uso: `Sin equipos asociados`.

### Impacto

```txt
Esta actualización se reflejará en N equipos.
```

- Mostrar solo en edición.
- Para cero: `Este tipo de filtro todavía no se utiliza en equipos.`
- Icono `Info` decorativo y texto explícito.
- No sugerir que se actualizarán relaciones.

### Total de asignaciones

Mostrar `impacto.totalAsignaciones` con cifra tabular y formato local.

```txt
totalEquipos = equipos distintos
totalAsignaciones = relaciones
```

## Layout responsive

### Desktop amplio

- Panel junto al listado.
- Ancho orientativo: `clamp(320px, 28vw, 400px)`.
- El listado conserva ancho legible.
- Scroll interno único para contenido.
- Footer fijo dentro del panel.

### Tablet

- Drawer overlay derecho.
- Ancho máximo `400px`.
- Scrim de 40%–60%.

### Mobile

- Panel a pantalla completa.
- Header y footer sticky.
- Respetar safe areas y bottom nav.
- No mostrar panel y lista simultáneamente.

## Acciones

```txt
Cerrar
Cancelar
Crear tipo de filtro | Guardar cambios
```

- Botones habilitados: `cursor-pointer`.
- Guardar deshabilitado sin cambios, con errores o guardando.
- Deshabilitado: `cursor-not-allowed`.
- Cerrar/Cancelar con draft limpio cierra.
- Con cambios pendientes abre confirmación de descarte.
- Escape sigue la misma regla.

## Foco y accesibilidad

- Al abrir, enfocar título o primer campo según modo.
- Con error, enfocar el primer campo inválido.
- En overlay, contener foco y devolverlo al disparador.
- X con `aria-label="Cerrar detalles"`.
- Usar dialog modal solo cuando sea overlay.
- Panel desktop acoplado usa `aside`, no dialog.
- Respetar reduced motion.

## Contratos de componentes

Props:

```txt
open
mode
item
draft
hasChanges
saving
fieldErrors
```

Emits:

```txt
update:draft
request-close
cancel
submit
expand-equipment-types
```

Props son readonly; cambios suben con eventos o `defineModel` para el draft.

## Criterios de aceptación

- Solo nombre y estado son editables.
- Impacto y tipos de equipo no pueden modificarse.
- Crear y editar tienen acciones distintas.
- Drawer responsive en desktop, tablet y mobile.
- No solicita detalle adicional.
- No pierde cambios sin confirmación.
- Todo control clickeable habilitado usa `cursor-pointer`.

