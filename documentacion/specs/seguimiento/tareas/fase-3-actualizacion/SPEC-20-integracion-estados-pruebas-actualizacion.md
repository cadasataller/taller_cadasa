# SPEC-20 — Integración, estados y pruebas de actualización

## Objetivo

Integrar la fase 3 sobre el workspace existente y fijar estados visuales, responsive y criterios de prueba.

## Dependencias

Implementar después de:

```txt
SPEC-16-store-composable-borrador-edicion.md
SPEC-17-formulario-edicion-restricciones-ux.md
SPEC-18-geometria-tracker-ruta-edicion.md
SPEC-19-cancelacion-eliminacion-restauracion.md
```

## Integración con el workspace

La actualización se integra sin romper:

- filtros globales;
- listado lateral;
- mapa central;
- detalle de lectura;
- creación previa.

Al abrir edición:

- el panel derecho cambia de `view` a `edit`;
- el mapa permanece visible;
- el listado lateral puede seguir visible;
- la UI debe distinguir claramente el estado de edición activa.

## Estados visuales mínimos

### Carga de borrador

- loading del panel;
- detalle previo no debe contaminarse con datos parciales del draft.

### Edición lista

- snapshot original cargado;
- acciones permitidas visibles;
- campos bloqueados claramente comunicados.

### Con cambios sin guardar

- estado sucio reconocible;
- protección de salida activa.

### Guardado en curso

- bloquear doble submit;
- mostrar loading claro;
- no congelar innecesariamente todo el workspace.

### Error remoto

- conservar borrador;
- mostrar feedback claro;
- permitir corregir y reenviar.

### Éxito

- actualizar tarea visible;
- regresar a detalle o permanecer en estado consistente definido;
- limpiar estado transitorio de edición.

### Acciones administrativas

- loading y error separados del guardado principal;
- confirmación previa;
- integración visible del resultado.

## Responsive

Desktop:

- edición vive en el panel derecho;
- mapa no sale de escena;
- panel con scroll interno.

Mobile:

- el flujo puede ser secuencial;
- confirmaciones deben seguir siendo claras;
- las acciones administrativas no deben quedar demasiado cerca del CTA principal;
- no degradar la claridad del panel por apilar demasiadas acciones en poco espacio.

## Pruebas mínimas recomendadas

Unitarias:

- construcción del draft de edición;
- detección de cambios;
- validaciones locales;
- payload de actualización;
- diferenciación de permisos;
- flujos de acciones administrativas.

Componentes:

- panel de edición;
- secciones reutilizadas de formulario;
- bloque geométrico de edición;
- acciones administrativas y confirmaciones.

Integración:

- abrir edición con permiso;
- bloquear edición sin permiso;
- editar tarea `finca`;
- editar tarea `zona`;
- impedir edición de `duda`;
- cancelar salida con borrador sucio;
- guardar cambios exitosamente;
- manejar error remoto sin perder cambios;
- cancelar tarea con confirmación;
- eliminar lógicamente con confirmación;
- restaurar tarea cuando aplique.

## No hacer

- No introducir creación nueva dentro de los tests de actualización salvo integración mínima necesaria.
- No recargar toda la aplicación como estrategia de éxito por defecto.
- No mezclar feedback de guardado con feedback de acciones administrativas.

## Criterios de aceptación

- La edición queda integrada al mismo workspace.
- Los estados de carga, error, éxito y acciones administrativas quedan diferenciados.
- Desktop y mobile tienen comportamiento claro.
- Existen criterios de prueba suficientes para edición y acciones administrativas.
