# SPEC-17 — Wizard guiado de creación desde el mapa

## Objetivo

Convertir la creación espacial en una secuencia explícita de tarjetas sobre el
mapa. La primera zona no abre el formulario automáticamente: primero deja la
geometría en pausa y la persona decide cuándo definir los detalles.

## Dependencias

- `SPEC-09-store-composable-maquina-estados-creacion.md`
- `SPEC-11-geometria-mapa-posicion-ruta.md`
- `flujo-espacial/SPEC-14-inicio-y-clasificacion-espacial.md`
- `flujo-espacial/SPEC-16-zonas-multiples-bloqueo-rpc.md`
- `documentacion/rastreo_tarea/mockup-rastreo-body-desktop.html`
- `documentacion/rastreo_tarea/mockup-rastreo-mobile.html`
- `documentacion/rastreo_tarea/rpcs_funciones_bd.md`

## Flujo de UI

| Paso | Estado                    | Tarjeta                                     | Resultado                                                                     |
| ---- | ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| 1    | `ready`                   | **Definir punto de control**                | La acción Iniciar crea el borrador con fecha, área y filtro cruzado actuales. |
| 2    | `selecting-control-point` | **Elegir punto de control**                 | El mapa captura el acceso vial; no muestra formulario.                        |
| 3    | `drawing-initial-zone`    | **Dibuje la zona de tareas**                | Se dibuja y cierra la primera zona de control.                                |
| 4    | `details-pending`         | **Definir detalles de tarea**               | La geometría queda pausada; no se añaden zonas por clic accidental.           |
| 5    | `editing-details`         | Panel derecho + **Agregar zona de control** | La persona completa asignación, detalles y ruta.                              |
| 6    | `drawing-extra-zone`      | **Dibuje la zona de control**               | Sólo para tareas `finca`; al terminar se vuelve a `details-pending`.          |

## Reglas de interacción

- El wizard sólo se habilita con permiso de creación, fecha y al menos un
  trabajador o equipo seleccionados.
- Durante los pasos 2, 3 y 6 se bloquea el cambio de trabajador/equipo en la
  barra superior para preservar el contexto del borrador.
- Al cerrar la primera zona, el sistema clasifica `finca` o `zona` con las
  reglas existentes. La tarjeta ofrece **Definir detalles de tarea** y, para
  `finca`, **Agregar zona** sin obligar a abrir primero el panel.
- La tarjeta **Agregar zona de control** se ofrece sólo para `finca`. Una tarea
  `zona` conserva exactamente una geometría lógica, como exige el RPC.
- Cancelar una zona adicional conserva el panel y el borrador. Cancelar el
  inicio o la geometría inicial descarta el borrador completo.
- En móvil, al entrar a dibujo adicional se vuelve al mapa; al finalizar queda
  disponible de nuevo la tarjeta para continuar con los detalles.

## Arquitectura Vue / Pinia

- `tareaCreacion.store.ts` conserva `wizardStep` como fuente de verdad y expone
  acciones explícitas: abrir detalles, iniciar, terminar y cancelar una zona
  adicional.
- `TaskCreationWizardCard.vue` es presentacional: recibe el paso y los
  vértices, y emite `action` o `cancel`; no muta el borrador.
- `SeguimientoTareasView.vue` coordina el mapa, tarjetas, panel y navegación
  móvil mediante props descendentes y eventos ascendentes.
- Cada zona de una finca puede editarse directamente en el mapa (vértices
  arrastrables, insertables o eliminables) y eliminarse de forma individual
  desde el panel. La validación Zod impide guardar una finca sin zonas.
- `persistDraftOnNavigation` prepara la persistencia del borrador entre vistas;
  queda en `false`, por lo que al salir de Seguimiento/Tareas el borrador se
  descarta. Al activarlo en el futuro, el store Pinia conservará el estado.
- La UI usa Vue 3, TypeScript, Tailwind y los iconos Lucide. Su disposición de
  mapa con capas flotantes sigue los mockups de `rastreo_tarea`.

## Datos y validación

- El borrador continúa validándose con Zod antes de construir el payload.
- La única mutación remota sigue siendo
  `supabaseRastreoTareas.rpc('crear_tarea_v2', params)`.
- El payload mantiene los tipos del RPC documentado:
  - `finca`: una o más zonas y línea de control;
  - `zona`: una única zona lógica y línea de control nula.

## Criterios de aceptación

- La UI muestra **Definir punto de control** antes de capturar geometría; la
  acción Iniciar es la que dispara el flujo.
- La segunda tarjeta dice **Elegir punto de control**.
- Tras el punto, la guía dice **Dibuje la zona de tareas**.
- La primera zona no abre el panel automáticamente.
- Pulsar **Definir detalles de tarea** detiene el dibujo y abre el panel.
- La acción **Agregar zona de control** requiere una decisión explícita y sólo
  está disponible para `finca`.
- Las pruebas del store cubren las transiciones de pausa, detalles y zona
  adicional.
