# SPEC-06 — Confirmación de impacto, guardado y errores

## Objetivo

Completar creación y actualización con validación, confirmación informativa, feedback y recuperación.

## Dependencia

Implementar después de `SPEC-05`.

## Archivos

```txt
src/components/engrase/catalogo/aceites/AceiteUpdateConfirmDialog.vue
src/components/engrase/catalogo/aceites/AceiteChangeSummary.vue
src/stores/dbequipos/engrase/catalogo/aceitesCatalogo.errors.ts
```

Reutilizar un dialog accesible existente si cumple el contrato.

## Creación

```txt
Nuevo aceite
→ completar nombre/estado
→ validar
→ guardar directamente
→ recibir item con impacto 0
→ agregar al store
→ cerrar detalle
→ anunciar éxito
```

No abrir confirmación de impacto al crear.

## Actualización

```txt
Editar
→ modificar nombre o estado
→ validar
→ abrir confirmación
→ confirmar
→ guardar una vez
→ reemplazar por ID con el item retornado
→ anunciar éxito
```

Si el aceite sale de los filtros actuales después del éxito, cerrar detalle y anunciar el cambio antes de retirarlo visualmente.

## Modal

Título:

```txt
Confirmar actualización
```

Mensaje:

```txt
Esta actualización se reflejará en N equipos.
```

Desglose:

```txt
COMBINADAS                   11
TRACTORES                     7
Total asignaciones           23
```

Aviso:

```txt
Solo se actualizarán los datos del catálogo.
Los sistemas y las asociaciones con equipos no se modificarán.
```

Cambios posibles:

```txt
Nombre: 15W40 → 15W-40
Estado: Activo → Desactivado
```

Mostrar únicamente campos modificados. El `aceite.id` permanece estable.

Acciones:

```txt
Cancelar
Confirmar y guardar
```

## Conteos

- Proceden del item cargado, sin request previo.
- `Intl.NumberFormat("es")` y cifras tabulares.
- No sumar sistemas/tipos para inferir el total.
- No afirmar que se actualizarán N filas de equipos.

## Guardando

- Deshabilitar acciones duplicables.
- Primario con spinner y `Guardando…`.
- `aria-busy="true"`, `cursor-wait`.
- Escape/scrim no cierran durante la operación.
- Sin actualización optimista.
- Item retornado como fuente final.

## Éxito

- Crear agrega; editar reemplaza por ID.
- No recargar listado.
- Toast/región `aria-live="polite"`, 3–5 segundos.

```txt
El aceite se creó correctamente.
El aceite se actualizó correctamente.
```

## Errores funcionales

| Código | Mensaje UI | Ubicación |
|---|---|---|
| `ACEITE_NOMBRE_REQUERIDO` | Ingresa un nombre para mostrar. | Campo nombre |
| `ACEITE_NOMBRE_DUPLICADO` | Ya existe un aceite con ese nombre. | Campo nombre |
| `ACEITE_NO_ENCONTRADO` | El aceite ya no está disponible. Actualiza el listado. | Drawer/banner |
| `AUTENTICACION_REQUERIDA` | Tu sesión ya no es válida. Inicia sesión nuevamente. | Flujo global |
| `PAYLOAD_INVALIDO` | No se pudieron validar los datos enviados. | Formulario |
| `REGISTRO_NO_ENCONTRADO` | El registro ya no existe o fue modificado. | Drawer/banner |

Desconocido:

```txt
No se pudo guardar el aceite. Intenta nuevamente.
```

- Mantener draft recuperable.
- Error de nombre con `aria-describedby`.
- Reintento sin operaciones paralelas.
- Un fallo no modifica el item actual.

## Responsive y accesibilidad

Desktop:

```txt
ancho 480px–560px
texto sm; metadatos xs
acciones alineadas al final
```

Mobile:

```txt
margen 16px o sheet adaptado
contenido con scroll y footer visible
acciones apiladas si hace falta
targets 44px
```

- Título referenciado, focus trap y retorno de foco.
- Escape cancela solo cuando no guarda.
- Aviso textual y contraste AA.
- Reduced motion.
- Habilitado `cursor-pointer`; disabled `cursor-not-allowed`.

## Pruebas

- Crear no abre confirmación.
- Sin cambios no permite guardar.
- Editar muestra impacto y solo cambios reales.
- Conteos no generan request.
- Cancelar no llama servicio.
- Doble click confirma una sola vez.
- Duplicado aparece junto al nombre.
- Error conserva draft.
- Desactivar bajo Activos retira el item después del éxito.

## Criterios de aceptación

- Confirmación no sugiere cambios de asociaciones.
- Crear y editar tienen flujos distintos.
- Respuesta actualiza el store sin recarga.
- Errores son comprensibles y recuperables.
- Loading, disabled y cursores Tailwind son consistentes.

