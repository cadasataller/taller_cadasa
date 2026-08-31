# SPEC-08 — Types, contratos y permisos de creación

## Objetivo

Definir el modelo técnico mínimo para creación manual de tareas y los permisos requeridos para habilitar la UI y la mutación.

## Dependencias

Implementar después de:

```txt
SPEC-07-alcance-flujo-general-creacion.md
```

## Tipos funcionales necesarios

La fase 2 necesita modelar al menos:

```txt
tipo de tarea editable
borrador de creación
selección de trabajador
selección de tracker
selección de acompañante
detalle base de tarea
estado de geometría
posición de ruta
resultado de validación
payload de creación
respuesta de creación
```

## Restricción de tipos editables

El conjunto editable en fase 2 es:

```txt
"finca" | "zona"
```

`duda` no debe entrar al contrato de creación manual.

## Contrato conceptual de borrador

El borrador debería poder representar al menos:

- tipo de tarea;
- trabajador seleccionado;
- tracker seleccionado;
- acompañante seleccionado o ausencia explícita;
- descripción o indicaciones;
- fecha programada;
- duración estimada;
- punto de enrutado;
- línea de control si aplica;
- zona o zonas si aplica;
- posición en ruta;
- flags de validez por bloque;
- estado de envío.

## Permisos mínimos

UI de creación:

```txt
module_seguimiento
ver_tareas_seguimiento
crear_tareas_seguimiento
```

Capacidades relacionadas:

```txt
asignar_tracker_tarea_seguimiento
definir_geometria_tarea_seguimiento
ver_mapa_seguimiento
```

Si la política final decide granularidad más fina, la fase 2 igual debe poder colgarse de esta base.

## Reglas de permisos

- Un usuario puede ver tareas sin poder crear.
- El botón o trigger de nueva tarea no debe mostrarse sólo por tener acceso de lectura.
- Si falta permiso de geometría o tracker, la UI no debe simular guardado exitoso.
- El fallback temporal de `testjl@cadasa.com` puede atravesar el flujo en desarrollo, pero no elimina la necesidad de checks por capacidad.

## Frontera de contratos

Separar al menos:

```txt
Draft local de frontend
DTO de payload hacia backend
Entidad creada de retorno
Errores de validación local
Errores remotos de creación
```

No conviene reutilizar directamente el mismo tipo para todas las capas.

## Archivos previstos

```txt
src/stores/seguimiento/tareas/creacion/tareaCreacion.types.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.validation.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.payload.ts
src/stores/seguimiento/tareas/creacion/tareaCreacion.service.ts
```

## No hacer

- No incluir `duda` en el selector manual.
- No diseñar permisos de creación como consecuencia automática de permisos de lectura.
- No usar un solo tipo ambiguo para draft, payload, respuesta y vista.

## Criterios de aceptación

- Queda separado el borrador local del payload remoto.
- Quedan definidos permisos mínimos de creación.
- Queda excluida `duda` del contrato editable.
