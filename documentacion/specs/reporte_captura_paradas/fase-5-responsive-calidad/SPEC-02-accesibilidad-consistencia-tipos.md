# SPEC-02 — Accesibilidad, iconos y tipos

> Fase: 5 — Responsive, calidad y cierre

## Interacción por teclado

| Elemento                      | Requisito                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botones de filtros y acciones | Elementos `button` con `type="button"`, nombre accesible y foco visible.                                                                                                                                         |
| Búsqueda                      | `label` asociado o `aria-label` específico; `Escape` puede limpiar solo si el control expone esa acción de forma visible.                                                                                        |
| Tabs                          | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` y panel asociado. Flechas izquierda/derecha cambian foco; `Home` y `End` van al primero y último tab; `Enter` o espacio activa el tab enfocado. |
| Filas de equipo y operador    | Usar un `button` o patrón de fila interactiva accesible, con foco visible, `Enter` y espacio. La fila activa comunica selección mediante `aria-selected` o estado equivalente.                                   |
| Tablas                        | Encabezados con `th` y `scope` apropiado; la cabecera sticky no debe tapar ni impedir enfocar las filas.                                                                                                         |

El foco usa clases Tailwind visibles y consistentes con la paleta del HTML. No se elimina el outline sin reemplazarlo por un indicador perceptible. Los estados de carga, error y selección se anuncian de forma no intrusiva cuando cambian como resultado de una acción del usuario.

## Iconografía y consistencia visual

- Todos los iconos proceden de `lucide-vue-next`; no se usan emojis, iconos de texto ni otra biblioteca.
- Un icono decorativo se marca `aria-hidden="true"`. Todo botón que solo muestra icono recibe nombre accesible mediante `aria-label` o texto visually hidden.
- Usar Tailwind para estilos, espaciado, responsive, estado activo y scroll. No trasladar CSS del HTML a hojas o estilos locales salvo una limitación de Tailwind que se documente y sea estrictamente necesaria.
- La copia, separadores, radios, densidad, colores y jerarquía deben tomar como referencia exclusiva `reporte_equipos_erp_v7_operadores.html`, sin reintroducir su topbar mockup.

## Tipos y límites de datos

- No introducir `any`, `unknown`, `as any`, `as unknown` ni parámetros implícitamente tipados en los archivos del dominio del reporte.
- Las respuestas de Edge Functions y RPC siguen el flujo de las fases 0 a 4: tipo de transporte concreto, `safeParse` de Zod y mapper hacia modelos de UI tipados.
- Los valores opcionales, nulos o incompletos se representan con modelos y fallbacks tipados (`—`); no con casting para ocultar una discrepancia de contrato.
- Como control de cierre, auditar los archivos del reporte con una búsqueda de los patrones prohibidos y corregir cada hallazgo antes de aprobar la fase.

## Criterios de aceptación

- El flujo completo de filtros, tabs y selección de filas se opera sin ratón.
- Ningún control iconográfico pierde nombre accesible.
- La auditoría del dominio del reporte no devuelve usos prohibidos de `any` ni `unknown`.
