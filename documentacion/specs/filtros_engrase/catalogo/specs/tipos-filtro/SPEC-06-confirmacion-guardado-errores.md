# SPEC-06 — Confirmación de impacto, guardado y errores

## Objetivo

Completar creación y actualización con validación, confirmación informativa, feedback y recuperación.

## Dependencia

Implementar después de `SPEC-05`.

## Archivos

```txt
src/components/engrase/catalogo/tipos-filtro/TipoFiltroUpdateConfirmDialog.vue
src/components/engrase/catalogo/tipos-filtro/TipoFiltroChangeSummary.vue
src/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.errors.ts
```

Reutilizar un modal accesible existente si cumple el contrato; no duplicar infraestructura global.

## Creación

```txt
Nuevo
→ completar nombre/estado
→ validar
→ guardar directamente
→ recibir item con impacto 0
→ agregar a items
→ cerrar drawer
→ toast de éxito
```

No abrir confirmación de impacto al crear.

## Actualización

```txt
Editar
→ cambiar nombre o estado
→ validar
→ abrir confirmación
→ confirmar
→ guardar
→ reemplazar item por ID
→ cerrar confirmación
→ mostrar éxito
```

Si cambia a desactivado bajo filtro `Activos`, el item deja de verse después de éxito; cerrar drawer y anunciar el cambio.

## Modal de confirmación

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
Resumen por tipo de equipo
COMBINADAS                   11
TRACTORES                     7
```

Aviso:

```txt
Solo se actualizarán los datos del catálogo.
Las asociaciones con equipos no se modificarán.
```

Cambios posibles:

```txt
Nombre: valor anterior → valor nuevo
Estado: Activo → Desactivado
```

Mostrar solo campos modificados.

Acciones:

```txt
Cancelar
Confirmar y guardar
```

## Conteos

- Total y desglose provienen del item cargado.
- No consultar antes de confirmar.
- Usar `Intl.NumberFormat("es")`.
- No sumar tipos para inferir el total.
- Total de equipos representa equipos distintos.
- No afirmar que se actualizarán N filas de equipo.

## Guardando

- Deshabilitar acciones duplicables.
- Primario muestra spinner y `Guardando…`.
- `aria-busy="true"` y `cursor-wait`.
- No cerrar hasta éxito.
- Escape y scrim no cierran durante guardado.
- No mutar lista antes de respuesta exitosa.

## Éxito

- El item retornado es la fuente final.
- Creación agrega; actualización reemplaza por ID.
- Toast `aria-live="polite"`, 3–5 segundos.
- Evitar recargar listado.

Mensajes esperados:

```txt
El tipo de filtro se creó correctamente.
El tipo de filtro se actualizó correctamente.
```

## Errores funcionales

| Código | Mensaje UI | Ubicación |
|---|---|---|
| `TIPO_FILTRO_NOMBRE_REQUERIDO` | Ingresa un nombre para mostrar. | Campo nombre |
| `TIPO_FILTRO_NOMBRE_DUPLICADO` | Ya existe un tipo de filtro con ese nombre. | Campo nombre |
| `TIPO_FILTRO_NO_ENCONTRADO` | El tipo de filtro ya no está disponible. Actualiza el listado. | Drawer/banner |
| `AUTENTICACION_REQUERIDA` | Tu sesión ya no es válida. Inicia sesión nuevamente. | Flujo global |
| `PAYLOAD_INVALIDO` | No se pudieron validar los datos enviados. | Formulario |
| `REGISTRO_NO_ENCONTRADO` | El registro ya no existe o fue modificado. | Drawer/banner |

Desconocido:

```txt
No se pudo guardar el tipo de filtro. Intenta nuevamente.
```

- Conservar draft y superficies recuperables.
- Error de campo usa `aria-describedby` y región viva apropiada.
- Reintentar no crea operaciones paralelas.

## Responsive

Desktop:

```txt
ancho 480px–560px
texto sm
metadatos xs
acciones al final
```

Mobile:

```txt
sheet/dialog con margen 16px
acciones apiladas si no caben
targets 44px
contenido con scroll y footer visible
```

No copiar un ancho fijo de la imagen.

## Accesibilidad

- Dialog modal con título referenciado.
- Foco inicial en Cancelar o patrón estándar seguro.
- Focus trap y retorno a Guardar cambios.
- Escape cancela solo si no guarda.
- Aviso con texto, no solo icono.
- Reduced motion.
- Todo botón habilitado usa `cursor-pointer`.

## Pruebas

- Crear no abre confirmación.
- Sin cambios no habilita guardar.
- Actualizar abre confirmación con impacto.
- Solo muestra campos modificados.
- Confirmar llama una vez.
- Cancelar no llama servicio.
- Doble click no duplica.
- Duplicado se muestra junto al nombre.
- Error conserva draft.
- Desactivar bajo Activos retira item y cierra drawer.

## Criterios de aceptación

- El modal explica impacto sin sugerir cambios de asociaciones.
- Crear y actualizar tienen flujos distintos.
- La respuesta actualiza estado sin recarga.
- Errores recuperables y comprensibles.
- La operación no se duplica.
- Cursores, disabled y loading son coherentes.

