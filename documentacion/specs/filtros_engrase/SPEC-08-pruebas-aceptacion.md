# SPEC-08 — Pruebas y aceptación integral

## Objetivo

Verificar navegación, permisos, contratos, consultas, estado Pinia y comportamiento responsive antes de considerar completa la primera entrega.

## Dependencias

Ejecutar después de `SPEC-00` a `SPEC-07`.

## Archivos de prueba previstos

```txt
src/stores/dbequipos/engrase/filtrosEngrase.mappers.test.ts
src/stores/dbequipos/engrase/filtrosEngrase.store.test.ts
src/components/engrase/filtros/FiltroCodigoAutocomplete.test.ts
src/components/engrase/filtros/EquiposEngrasePanel.test.ts
src/components/engrase/filtros/FiltrosEquipoPanel.test.ts
src/components/engrase/filtros/FiltroDetallePanel.test.ts
```

Añadir pruebas de router/layout donde el patrón actual del repositorio lo permita.

## Pruebas unitarias de datos

- Mapear columnas de `vw_equipos_con_imagen_main` sin perder nulos.
- Presentar `subtipo` como Modelo en UI.
- Equipo sin imagen produce fallback.
- Equipo sin etapas produce `Sin etapa`.
- Cantidad mayor que uno se conserva.
- Dedupe de resultados obtenidos por original y equivalencia.
- Equivalencias inactivas no aparecen.
- Códigos conservan capitalización.

## Pruebas del store

- Estado inicial filtra `activo`.
- Puede cambiar a `descartado`.
- Combina tipo de equipo, modelo, etapa y tipo de filtro.
- Carga catálogos una vez salvo force.
- Seleccionar equipo carga sus filtros.
- Cambiar equipo limpia filtro seleccionado.
- Equipo fuera de resultados deja una selección válida.
- Fallos limpian loading en todos los casos.
- Una respuesta de sugerencias obsoleta no reemplaza la actual.

## Pruebas del autocomplete

- Menos del mínimo de caracteres no consulta.
- Texto parcial muestra sugerencias.
- Escribir texto no aplica por sí solo un resultado parcial.
- Clic, tap o Enter sobre sugerencia emite selección exacta.
- `4T-6788` no se sustituye silenciosamente por `4t-6788`.
- Editar el texto después de seleccionar limpia el código exacto.
- Escape cierra sugerencias.
- Estados ARIA se actualizan.

## Pruebas de paneles

### Equipos

- Renderiza código, tipo, modelo y estado.
- Sin modelo muestra `Sin modelo`.
- Sin imagen muestra fallback.
- Selección emite el ID correcto.

### Filtros del equipo

- Total filtros cuenta asignaciones, no cantidades.
- Conteos de equivalencias y compras son correctos.
- Equipo sin filtros muestra estado vacío.
- Tarjeta emite la asignación seleccionada.

### Detalle

- Muestra el filtro seleccionado.
- Lista solamente códigos equivalentes activos.
- No muestra fabricantes.
- No muestra Editar, Agregar ni Eliminar.
- Cerrar conserva el equipo seleccionado.

## Pruebas de permisos y navegación

Casos mínimos:

| `module_engrase` | `ver_filtros_engrase` | Resultado |
|---|---|---|
| false | false | No se muestra Engrase; ruta denegada |
| true | false | Se muestra el módulo, no Filtros; ruta denegada |
| true | true | Se muestra Filtros y la ruta abre |

- `editar_filtros_engrase` no cambia la UI en esta entrega.
- Recarga directa de `/engrase/filtros` conserva la protección.
- Desktop expande el padre según la ruta.
- Móvil muestra subpestañas como botones de una por fila.

## Verificación real de Supabase

Con una sesión autenticada del proyecto Equipos:

1. Consultar `engrase.vw_equipos_con_imagen_main` mediante `.schema('engrase')`.
2. Confirmar que el esquema está expuesto en Data API.
3. Confirmar que `authenticated` puede leer las relaciones necesarias.
4. Consultar un equipo activo y uno descartado.
5. Consultar un equipo sin etapas.
6. Consultar un equipo sin filtros.
7. Buscar un código original exacto.
8. Buscar un código equivalente exacto.
9. Generar una URL firmada válida para `main.webp`.
10. Confirmar que una ruta inexistente o no autorizada no expone datos.

Registrar cualquier diferencia entre la BD real y los documentos antes de adaptar contratos.

## Verificación responsive manual

Probar como mínimo:

```txt
desktop ancho
laptop
tablet vertical y horizontal
móvil estrecho
```

- No hay scroll horizontal accidental.
- Los dropdowns no quedan cortados.
- El detalle funciona como panel/drawer según ancho.
- Volver en móvil conserva filtros y selección del equipo.
- Los controles tienen área táctil suficiente.

## Comandos de calidad

```bash
pnpm test:run
pnpm typecheck
pnpm build
```

## Criterios de aceptación final

- Todos los escenarios críticos tienen prueba automática o verificación manual documentada.
- TypeScript no reporta errores.
- La compilación finaliza correctamente.
- El módulo respeta `app_feature_access`.
- La búsqueda parcial solo genera sugerencias y la selección consulta de forma exacta.
- Se muestran activos por defecto y descartados bajo elección explícita.
- La interfaz no expone ninguna operación de escritura.

