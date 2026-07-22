ESPECIFICACION COMPLEMENTARIA — SERVICIOS UI Y LOGICA
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 2 / Servicios / Creacion y edicion manual
FECHA DE CONTEXTO: 2026-06-26
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir el ajuste funcional, tecnico y visual del paso 2 cuando la solicitud sea de tipo `servicio`.

Nuevo enfoque obligatorio:

- El paso 2 de servicios no usa buscador.
- Debe existir un boton principal `Agregar servicio`.
- Cada servicio se crea manualmente mediante formulario.
- El formulario debe abrir en drawer en desktop y bottom sheet en mobile/tablet.
- El listado visual debe reutilizar el lenguaje visual del listado de productos manuales, pero con componentes separados.
- Debe poder agregarse, editarse y eliminarse servicios desde el mismo paso.

=====================================================================
2. ALCANCE
=====================================================================

Incluye:

- UI dedicada para paso 2 de servicios.
- Formulario interno unico para alta y edicion.
- Drawer shell para `lg`.
- Bottom sheet shell para `md` y `sm`.
- Integracion con el store del wizard actual.
- Validacion del paso 2 para exigir al menos un servicio antes de avanzar.
- Uso del catalogo dinamico `public.unidad_medida`.

No incluye:

- Busqueda de servicios desde catalogo.
- Replanteamiento del flujo de productos.
- Cambio del contrato base de `p_equipos`.
- Catalogo de contextos/codigos de servicio dentro de este documento.

Referencia complementaria:

- `documentacion/specs/creacion_solicitudes/SPEC-05-contextos-servicio-catalogo.md`

Nota de contexto:

- El paso 1 de solicitudes de servicio usa una fuente unificada de seleccion.
- Esa fuente puede mezclar:
  - equipos reales
  - contextos operativos de servicio
- La seleccion final sigue persistiendo dentro de `p_equipos`.
- Las reglas de disponibilidad de contextos viven en `SPEC-05`.

=====================================================================
3. REGLAS FUNCIONALES DEL PASO 2 SERVICIOS
=====================================================================

3.1 Estructura general del paso

Cuando `tipoSolicitud = servicio`, el paso 2 debe cambiar por completo respecto al flujo de productos.

Debe mostrar:

1. Boton `Agregar servicio`.
2. Listado visual de servicios agregados.
3. Empty state cuando no existan servicios.
4. Error del paso si el usuario intenta avanzar sin al menos un servicio.

No debe mostrar:

- input de busqueda
- resultados de busqueda
- CTA de producto temporal
- filas de productos existentes

3.2 Apertura del formulario

El formulario de servicio puede abrirse de dos maneras:

1. Desde el boton `Agregar servicio`
- Debe abrir el formulario vacio.
- Solo la unidad debe iniciar precargada.

2. Desde la accion `Editar` de una fila existente
- Debe abrir el mismo formulario con los datos actuales del item.

3.3 Edicion

- Los servicios agregados pueden editarse completamente.
- Campos editables:
  - cantidad
  - descripcion
  - unidad

3.4 Eliminacion

- La accion `Eliminar` no debe borrar directo.
- Debe solicitar confirmacion.
- La confirmacion debe mostrar la descripcion del servicio que sera eliminado.

=====================================================================
4. COMPORTAMIENTO DEL OVERLAY
=====================================================================

El flujo de servicios debe heredar el mismo comportamiento de cierre estricto definido para producto temporal.

4.1 Reglas obligatorias de cierre

La unica accion permitida para cerrar el drawer o bottom sheet debe ser `Cancelar`.

No cerrar por:

- click fuera
- overlay click
- tecla escape
- gesto de swipe dismiss
- boton `X`, salvo que sea una forma explicita de `Cancelar`

4.2 Variante responsive

Desktop `lg`:

- abrir drawer lateral derecho
- mostrar overlay sobre el paso 2
- mantener visible el contexto del wizard de fondo

Tablet y mobile `md` / `sm`:

- abrir bottom sheet
- crecer segun el contenido
- usar scroll interno solo si hace falta

=====================================================================
5. FORMULARIO INTERNO DE SERVICIO
=====================================================================

Debe existir un solo formulario interno reutilizado por drawer y bottom sheet.

5.1 Campos

Campos obligatorios del formulario:

1. Cantidad
2. Descripcion
3. Unidad

Orden obligatorio:

1. Cantidad
2. Descripcion
3. Unidad
4. Acciones

5.2 Unidad por defecto

- La unidad debe iniciar precargada.
- El usuario puede cambiarla.
- Debe usarse el mismo catalogo dinamico `public.unidad_medida`.
- La unidad inicial obligatoria para servicios debe ser el registro con:
  - `codigo = 'un'`
  - `abreviatura = 'Un'`
  - `descripcion = 'UNIDAD'`

5.3 Cantidad

La cantidad debe mostrarse en el formulario y ser editable.

Reglas:

- si el usuario deja la cantidad vacia y guarda, frontend debe normalizarla a `1`
- si el usuario escribe `0`, frontend debe normalizarla a `1`
- si el usuario escribe un valor negativo, debe mostrarse error y no permitir guardar
- si el usuario escribe texto no numerico, debe mostrarse error y no permitir guardar

5.4 Descripcion

- La descripcion es obligatoria.
- No permitir guardar descripcion vacia o en blanco.

5.5 Acciones

Acciones del formulario:

- `Cancelar`
- `Agregar` cuando es alta
- `Guardar cambios` cuando es edicion

No incluir:

- `Agregar y seguir creando`

=====================================================================
6. LISTADO VISUAL DE SERVICIOS
=====================================================================

El listado de servicios debe mantener la misma intencion visual del listado de productos manuales, pero en componentes separados.

6.1 Desktop

Columnas obligatorias:

- Cantidad
- Descripcion
- Unidad
- Acciones

Cada fila debe incluir:

- boton icon de editar
- boton icon de eliminar

6.2 Mobile

Debe aplicar la misma logica de concatenacion visual usada hoy en las filas mobile del listado de productos.

Orden recomendado de lectura:

- cantidad
- descripcion
- unidad

Acciones mobile:

- `Editar`
- `Eliminar`

6.3 Empty state

Si no existen servicios agregados, mostrar:

- `No hay servicios agregados. Debe agregar al menos 1 servicio.`

=====================================================================
7. VALIDACIONES DEL PASO 2
=====================================================================

Regla obligatoria:

- No se puede avanzar al paso 3 si no existe al menos un servicio agregado.

Mensajes esperados:

- paso vacio:
  - `Debe agregar al menos un servicio para continuar.`
- descripcion vacia:
  - `La descripcion del servicio es obligatoria.`
- cantidad negativa:
  - `La cantidad del servicio no puede ser negativa.`
- cantidad no numerica:
  - `La cantidad del servicio debe ser un numero valido.`

Nota:

- `0` o vacio no generan error; deben normalizarse a `1` antes de guardar.

=====================================================================
8. ESTRUCTURA DE DATOS DEL ITEM SERVICIO
=====================================================================

Referencia conceptual:

```ts
type ServicioSolicitudDraft = {
  cantidad: number;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
};
```

Referencia conceptual del item persistido en store:

```ts
type ServicioSolicitudItem = {
  localId: string;
  cantidad: number;
  descripcion: string;
  unidadCodigo: string;
  unidadLabel: string;
};
```

Reglas:

- `localId` se usa solo en frontend
- `unidadCodigo` es el valor persistido al payload
- `unidadLabel` se usa para render visual

=====================================================================
9. REGLAS DE PAYLOAD
=====================================================================

Para solicitudes de tipo servicio:

- `p_productos = []`
- `p_servicios` debe mapear cada item con:
  - `descripcion`
  - `cantidad`
  - `unidad_codigo`

Referencia conceptual:

```json
{
  "p_servicios": [
    {
      "descripcion": "Reparacion de porton principal",
      "cantidad": 1,
      "unidad_codigo": "un"
    }
  ]
}
```

La normalizacion de cantidad a `1` debe ocurrir en frontend antes del submit, aunque el RPC tambien tenga fallback defensivo.

=====================================================================
10. CRITERIOS DE ACEPTACION
=====================================================================

1. Cuando el usuario selecciona `servicio`, el paso 2 ya no muestra buscador de productos.
2. El usuario puede abrir un formulario vacio desde `Agregar servicio`.
3. La unidad inicia precargada en `UNIDAD` y puede cambiarse.
4. Si el usuario deja cantidad vacia o en `0`, al guardar se persiste `1`.
5. Si el usuario escribe cantidad negativa, no puede guardar.
6. Si el usuario escribe texto no numerico, no puede guardar.
7. El usuario puede editar un servicio existente con el mismo formulario.
8. El usuario puede eliminar un servicio luego de confirmar la accion.
9. No se puede avanzar al siguiente paso sin al menos un servicio agregado.
10. Drawer y bottom sheet comparten el mismo formulario interno y las mismas reglas estrictas de cierre.
