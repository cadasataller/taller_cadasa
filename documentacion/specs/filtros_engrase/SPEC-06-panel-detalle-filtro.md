# SPEC-06 — Panel lateral derecho de detalle del filtro

## Objetivo

Mostrar el detalle ampliado de una asignación seleccionada y sus códigos equivalentes activos, sin permitir modificaciones.

## Dependencia

Implementar después de `SPEC-05`.

## Archivos a crear

```txt
src/components/engrase/filtros/FiltroDetallePanel.vue
src/components/engrase/filtros/FiltroEquivalenciasList.vue
```

## Apertura y cierre

- El panel se abre al seleccionar una tarjeta de filtro.
- Cerrar limpia solamente `filtroSeleccionadoId`; no cambia el equipo.
- Cambiar de equipo cierra cualquier detalle anterior.
- Cambiar de tarjeta actualiza el contenido sin duplicar paneles.
- Escape cierra el drawer en móvil y devuelve foco al elemento que lo abrió cuando sea posible.

## Información principal

Mostrar:

```txt
tipo de filtro
código original
cantidad
etapas del equipo
en lista de compras: Sí/No
```

Reglas:

- Si el equipo no tiene etapas, mostrar `Sin etapa`.
- No mostrar `Obligatorio`.
- No mostrar `Estado del filtro` porque no existe un campo confirmado para ello.
- El estado activo de una equivalencia no debe confundirse con el estado del filtro original.
- No mostrar botón Editar durante esta entrega.

## Equivalencias

- Mostrar únicamente equivalencias activas.
- Mostrar solo el código equivalente.
- Ignorar fabricantes, marcas y nombres presentados en el mockup.
- No renderizar equivalencias inactivas por defecto.
- Evitar duplicados por código.
- Preservar capitalización exacta.
- Si no hay equivalencias, mostrar `Sin equivalencias activas`.
- Si falla solo esta consulta, mantener visible el detalle principal y ofrecer reintento local.

## Contrato

Props sugeridas:

```txt
open
equipo
filtro
equivalencias
loadingEquivalencias
errorEquivalencias
```

Emits sugeridos:

```txt
close
retry-equivalencias
```

## Responsive

- Desktop: columna derecha persistente dentro de la composición de tres paneles.
- Si no hay filtro seleccionado, puede mostrar una instrucción compacta o permanecer vacío conservando el espacio definido por el diseño.
- Tablet/móvil: drawer superpuesto o panel de navegación posterior.
- En modo drawer, incluir backdrop, bloqueo de scroll y foco controlado.
- No usar hover como única forma de descubrir acciones.

## Criterios de aceptación

- El detalle corresponde siempre a la tarjeta seleccionada.
- Cerrar no borra el equipo seleccionado.
- Las equivalencias muestran solo códigos activos.
- Sin equivalencias existe un estado vacío explícito.
- No aparecen fabricantes, edición ni atributos no existentes.
- El comportamiento móvil es táctil y accesible.

