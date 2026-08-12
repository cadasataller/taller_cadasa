# SPEC-06 — Confirmación de impacto, guardado y errores

## Objetivo

Completar creación/edición con validación, confirmación informativa y recuperación.

## Dependencia

Implementar después de `SPEC-05`.

## Archivos

```txt
src/components/engrase/catalogo/sistemas/SistemaUpdateConfirmDialog.vue
src/components/engrase/catalogo/sistemas/SistemaChangeSummary.vue
src/stores/dbequipos/engrase/catalogo/sistemasCatalogo.errors.ts
```

Reutilizar dialog accesible existente si cumple el contrato.

## Creación

```txt
Nuevo → nombre/estado → validar → guardar directo
→ agregar item con impacto 0 → cerrar → anunciar éxito
```

No confirmar impacto al crear.

## Actualización

```txt
Editar → validar → confirmar → guardar una vez
→ reemplazar por ID → anunciar éxito
```

Si sale de filtros después del éxito, cerrar Detalles y anunciar antes de retirarlo.

## Modal

```txt
Confirmar actualización

Esta actualización se reflejará en N equipos.

COMBINADAS                   11
TRACTORES                     8
Total asignaciones           22

Solo se actualizarán los datos del catálogo.
Los aceites y asociaciones con equipos no se modificarán.

Cancelar | Confirmar y guardar
```

Mostrar únicamente cambios reales:

```txt
Nombre: MOTOR → MOTOR PRINCIPAL
Estado: Activo → Desactivado
```

El ID permanece estable.

## Conteos/guardando

- Conteos del item cargado; sin request previo.
- `Intl.NumberFormat("es")`; no inferir total sumando grupos.
- No afirmar actualización de filas de equipo.
- Spinner `Guardando…`, `aria-busy="true"`, `cursor-wait`.
- Bloquear duplicados y cierre por Escape/scrim.
- Sin actualización optimista; respuesta como fuente final.

## Éxito

- Crear agrega; editar reemplaza; sin recarga.
- Región `aria-live="polite"` 3–5 segundos.

```txt
El sistema se creó correctamente.
El sistema se actualizó correctamente.
```

## Errores

| Código | Mensaje UI | Ubicación |
|---|---|---|
| `SISTEMA_NOMBRE_REQUERIDO` | Ingresa un nombre para mostrar. | Campo nombre |
| `SISTEMA_NOMBRE_DUPLICADO` | Ya existe un sistema con ese nombre. | Campo nombre |
| `SISTEMA_NO_ENCONTRADO` | El sistema ya no está disponible. Actualiza el listado. | Drawer/banner |
| `AUTENTICACION_REQUERIDA` | Tu sesión ya no es válida. Inicia sesión nuevamente. | Global |
| `PAYLOAD_INVALIDO` | No se pudieron validar los datos enviados. | Formulario |
| `REGISTRO_NO_ENCONTRADO` | El registro ya no existe o fue modificado. | Drawer/banner |

Desconocido: `No se pudo guardar el sistema. Intenta nuevamente.`

- Conservar draft e item ante error.
- Error de nombre con `aria-describedby`.
- Reintento sin operaciones paralelas.

## Responsive/accesibilidad

- Desktop 480px–560px, texto sm/metadatos xs.
- Mobile margen 16px/sheet, scroll, footer visible, targets 44px.
- Título referenciado, focus trap/retorno, contraste AA, reduced motion.
- Habilitado `cursor-pointer`; disabled `cursor-not-allowed`.

## Pruebas y aceptación

- Crear no confirma; sin cambios no guarda.
- Editar muestra impacto/cambios reales.
- Cancelar no llama servicio; doble click llama una vez.
- Duplicado se asocia al campo.
- Error conserva draft.
- Desactivar bajo Activos lo retira tras éxito.
- Modal no sugiere modificar relaciones.
- Respuesta actualiza estado sin recarga.

