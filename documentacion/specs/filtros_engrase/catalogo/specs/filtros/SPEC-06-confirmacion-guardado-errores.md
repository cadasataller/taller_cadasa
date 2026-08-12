# SPEC-06 — Confirmación de impacto, guardado y errores

## Objetivo

Completar creación y actualización con validación, confirmación informativa, feedback y recuperación.

## Dependencia

Implementar después de `SPEC-05`.

## Archivos

```txt
src/components/engrase/catalogo/filtros/FiltroUpdateConfirmDialog.vue
src/components/engrase/catalogo/filtros/FiltroChangeSummary.vue
src/stores/dbequipos/engrase/catalogo/filtrosCatalogo.errors.ts
```

Reutilizar un dialog accesible existente si cumple el contrato; no duplicar infraestructura global.

## Creación

```txt
Nuevo filtro
→ completar código/compras/estado
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
→ modificar uno o más campos
→ validar
→ abrir confirmación
→ confirmar
→ guardar una vez
→ reemplazar por ID con item retornado
→ cerrar confirmación
→ anunciar éxito
```

Si el cambio hace que el item salga de los filtros actuales, cerrar detalle y comunicarlo después del éxito.

## Modal de confirmación

Título:

```txt
Confirmar actualización
```

Mensaje:

```txt
Esta actualización se reflejará en N equipos.
```

Desglose informativo:

```txt
COMBINADAS                   11
TRACTORES                     7
Total asignaciones           20
```

Aviso obligatorio:

```txt
Solo se actualizarán los datos del catálogo.
Las asociaciones con equipos no se modificarán.
```

Cambios posibles:

```txt
Código: B7030 → B7030-A
En compras: Sí → No
Estado: Activo → Desactivado
```

Mostrar únicamente campos modificados. Cambiar el código mantiene el mismo ID y, por tanto, las relaciones continúan válidas.

Acciones:

```txt
Cancelar
Confirmar y guardar
```

## Fuente de conteos

- Usar el item ya cargado; no consultar antes de confirmar.
- Formatear con `Intl.NumberFormat("es")`.
- No sumar agrupaciones para inferir `totalEquipos`.
- No afirmar que se actualizarán filas de equipo.

## Guardando

- Deshabilitar acciones duplicables.
- Primario con spinner y `Guardando…`.
- `aria-busy="true"` y `cursor-wait`.
- Escape y scrim no cierran durante guardado.
- No aplicar actualización optimista.
- El item retornado es la fuente final.

## Éxito

- Creación agrega; actualización reemplaza.
- Sin recarga total.
- Toast/región `aria-live="polite"` visible 3–5 segundos.

Mensajes:

```txt
El filtro se creó correctamente.
El filtro se actualizó correctamente.
```

## Errores funcionales

| Código | Mensaje UI | Ubicación |
|---|---|---|
| `CODIGO_FILTRO_REQUERIDO` | Ingresa el código del filtro. | Campo código |
| `CODIGO_FILTRO_DUPLICADO` | Ya existe un filtro con ese código. | Campo código |
| `FILTRO_NO_ENCONTRADO` | El filtro ya no está disponible. Actualiza el listado. | Drawer/banner |
| `AUTENTICACION_REQUERIDA` | Tu sesión ya no es válida. Inicia sesión nuevamente. | Flujo global |
| `PAYLOAD_INVALIDO` | No se pudieron validar los datos enviados. | Formulario |
| `REGISTRO_NO_ENCONTRADO` | El registro ya no existe o fue modificado. | Drawer/banner |

Desconocido:

```txt
No se pudo guardar el filtro. Intenta nuevamente.
```

- Conservar draft después del error.
- Error de código usa `aria-describedby`.
- Reintentar no inicia operaciones paralelas.
- Un fallo no elimina ni reemplaza el item actual.

## Responsive

Desktop:

```txt
ancho: 480px–560px
texto: sm
metadatos: xs
acciones alineadas al final
```

Mobile:

```txt
margen: 16px o sheet adaptado
contenido con scroll
footer visible
acciones apiladas si no caben
targets: 44px
```

## Accesibilidad

- Dialog modal con título referenciado.
- Foco inicial seguro y focus trap.
- Retorno a `Guardar cambios` al cancelar.
- Reduced motion.
- Aviso mediante texto, no solo icono.
- Botón habilitado `cursor-pointer`; disabled `cursor-not-allowed`.

## Pruebas

- Crear no abre confirmación.
- Sin cambios no permite guardar.
- Editar abre modal con impacto y cambios reales.
- Conteos se toman del item, sin request.
- Cancelar no llama servicio.
- Confirmar/doble click llama una vez.
- Duplicado aparece junto al código.
- Error conserva draft.
- Desactivar bajo Activos retira el item después de éxito.
- Cambiar compras bajo filtro contrario actualiza la visibilidad.

## Criterios de aceptación

- La confirmación explica impacto sin sugerir edición de relaciones.
- Crear y actualizar tienen flujos distintos.
- Estado local se actualiza con la respuesta y sin recarga.
- Errores son comprensibles y recuperables.
- Loading, disabled y cursores Tailwind son coherentes.

