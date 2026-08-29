# SPEC-13 — Integración UI, estados y pruebas de creación

## Objetivo

Integrar la fase 2 sobre el workspace existente y fijar estados visuales, comportamiento responsive y criterios mínimos de prueba.

## Dependencias

Implementar después de:

```txt
SPEC-09-store-composable-maquina-estados-creacion.md
SPEC-10-formulario-asignacion-detalles-base.md
SPEC-11-geometria-mapa-posicion-ruta.md
SPEC-12-validaciones-payload-frontera-rpc.md
```

## Integración con la fase 1

La creación se integra sin romper:

- filtros globales;
- listado lateral;
- mapa central;
- detalle de tareas existente.

Al abrir creación:

- el panel derecho cambia de `view` a `create`;
- el mapa permanece visible;
- el listado lateral puede seguir visible;
- la UI debe indicar claramente que el panel actual es de creación.

## Estados visuales mínimos

### Estado inicial

- panel abierto con borrador base;
- CTA principal listo para completar;
- sin errores mostrados antes de interacción.

### Borrador incompleto

- se muestran validaciones necesarias al intentar avanzar o guardar;
- el usuario no pierde información.

### Submit en curso

- botón principal en loading;
- evitar doble envío;
- bloquear acciones conflictivas del panel;
- no congelar innecesariamente todo el workspace.

### Error remoto

- el panel conserva los datos;
- se muestra feedback claro;
- se permite corregir y reenviar.

### Éxito

- feedback visible;
- limpieza o transición controlada;
- integración de la tarea creada en el workspace.

## Responsive

Desktop:

- el formulario ocupa el panel derecho del workspace;
- no desplaza el mapa fuera de escena;
- el contenido del panel puede scrollear internamente.

Mobile:

- el formulario puede ocupar la superficie principal de forma secuencial;
- los bloques deben seguir siendo legibles;
- geometría y mapa deben conservar una interacción viable;
- evitar controles diminutos o apilados sin separación.

## Pruebas mínimas recomendadas

Unitarias:

- validaciones del draft;
- helpers de payload;
- máquina de estados de creación;
- reglas de tipo `finca` vs `zona`.

Componentes:

- selector de tipo;
- bloque de asignación;
- stepper de duración;
- sección de geometría;
- panel de creación;
- footer del formulario.

Integración:

- abrir creación con permiso;
- bloquear creación sin permiso;
- cambiar tipo;
- validar campos obligatorios;
- guardar `finca` válida;
- guardar `zona` válida;
- manejar error remoto sin perder borrador;
- integrar tarea creada al workspace.

## No hacer

- No introducir aquí edición.
- No cerrar el panel antes de confirmar éxito si el submit sigue en curso.
- No recargar toda la aplicación como estrategia por defecto post éxito.
- No degradar mobile a una copia estrecha del desktop sin adaptación.

## Criterios de aceptación

- La creación queda integrada al mismo workspace.
- Los estados de carga, error y éxito quedan diferenciados.
- Desktop y mobile tienen comportamiento claro.
- Existen criterios de prueba suficientes para el flujo de creación.
