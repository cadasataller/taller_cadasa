# SPEC-03 — Validación final y matriz de pruebas

> Fase: 5 — Responsive, calidad y cierre

## Cobertura automatizada

Extender o crear pruebas de los artefactos de las fases 0 a 4, sin sustituir sus contratos:

| Capa                | Cobertura de cierre                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Servicios y mappers | Parámetros de cada RPC, mapeo de nulos, campos incompletos, errores y descarte de respuesta obsoleta.                                          |
| Store               | Selección de equipo, rango, tab inicial `resumen`, invalidación entre tabs, selección diferida de operador y limpieza ante cambio de contexto. |
| Componentes         | Render de KPI, tabla, estados y eventos de toolbar, tabs y filas seleccionables.                                                               |
| Layout responsive   | Modo de tres columnas sobre 1050px, una columna en 1050px y por debajo, y ownership correcto de cada scroll.                                   |

No se simulan consultas directas a tablas ni se usa `supabaseRastreoTareas`: las pruebas mockean el servicio tipado del reporte que utiliza `supabaseCapturaOperador`, más el detalle maestro existente de `supabaseEquipos` cuando corresponda.

## Matriz de estados

Cada bloque debe verificarse de manera independiente. Un error parcial no borra datos válidos de otro bloque ni bloquea la navegación entre pestañas.

| Bloque                     | Loading                                  | Empty                       | Error             | Datos faltantes                                         |
| -------------------------- | ---------------------------------------- | --------------------------- | ----------------- | ------------------------------------------------------- |
| Lista y contexto de equipo | Skeleton conservando ancho               | Sin equipos o sin selección | Reintento visible | Imagen, nombre o metadata en `—`                        |
| Resumen                    | Geometría de KPIs/analíticas             | Sin actividad en rango      | Error local       | Métricas, motivos o historial nulos                     |
| Paradas                    | KPIs, breakdown y tabla reservan espacio | Cero paradas                | Error local       | Motor, implemento, origen, clasificación o motivo nulos |
| Operadores                 | KPIs y tabla reservan espacio            | Sin operadores              | Error local       | Jornadas, tiempos o campos de tabla nulos               |
| Detalle de operador        | Solo tras seleccionar fila               | Sin detalle del operador    | Error local       | Distribución, motor, implementos e historial nulos      |

## Comparación visual contra el HTML

La comparación se realiza contra `reporte_equipos_erp_v7_operadores.html`, única fuente visual. Revisar al menos capturas o una revisión lado a lado en estos escenarios:

1. Desktop mayor a 1050px: toolbar, tres columnas, densidad, panel derecho y scrolls internos.
2. Ancho exactamente 1050px: una columna, grillas reducidas y scroll exterior.
3. Móvil: espaciador y navegación de `DefaultLayout` sin contenido tapado.
4. Cada tab con datos, loading, vacío, error y campos incompletos.

La comparación es de composición y estados. El mockup puede mostrar otra tab activa; el producto mantiene la decisión funcional de abrir en `resumen`.

## Checklist de cierre

```txt
pnpm exec prettier --write <archivos-modificados>
pnpm run typecheck
pnpm run test:run
pnpm run build
git diff --check
```

La fase queda cerrada únicamente si no hay errores de formato, tipos, pruebas o build, la auditoría no encuentra `any` ni `unknown` en el dominio del reporte y la comparación visual cumple los criterios anteriores.
