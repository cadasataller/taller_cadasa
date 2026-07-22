# Specs granulares — Detalle de Solicitudes de Compra

> Modulo: Compras / Solicitudes de Compra  
> Stack: Vue 3 + TypeScript estricto + Pinia + Supabase + Tailwind  
> Fuente de verdad funcional: `documentacion/specs/utils/contexto.md`  
> Fuente de verdad de datos: `documentacion/specs/utils/bd_compras.sql`  
> Modelo de estados: `estado_contexto` + `estado`  

## Contexto obligatorio antes de implementar

Antes de implementar este spec, leer:

```txt
documentacion/specs/utils/contexto.md
documentacion/specs/utils/bd_compras.sql
documentacion/specs/specs_listado_solicitudes_compra/specs/SPEC-04-config-roles-columnas-indicadores.md
documentacion/specs/specs_listado_solicitudes_compra/specs/SPEC-17-preparacion-futura-detalle.md
```

Reglas transversales:

- No depender de IDs numericos de estado.
- Resolver estados por `estado_contexto_id` + `estado.codigo`.
- No usar `activo` como unica fuente para decidir agrupacion funcional.
- El detalle debe respetar la misma segmentacion de visibilidad por rol/area del listado.
- La pantalla detalle no debe exponer datos que el rol no deberia ver aunque existan en la respuesta.
- El ciclo visible principal es el `ciclo_estado` actual de la solicitud.
- `linea_solicitud` solo ordena cuando exista.
- Si no existe `linea_solicitud`, ordenar por `created_at`.
- En una linea con multiples OC, la fila principal muestra agregados; el desglose por OC es opcional y expandible.
- El futuro estado "descartado en OC" no forma parte de `Descartados`; sigue dentro de `Activas`.

---

# SPEC-01 — Logica de visualizacion del detalle

## Objetivo

Definir la logica funcional del detalle de una solicitud de compra, incluyendo:

- permisos visuales por rol;
- agrupacion de detalles;
- reglas por ciclo;
- reglas por tipo de solicitud;
- columnas de cantidades segun avance del flujo;
- comportamiento cuando existe o no existe OC;
- trazabilidad de cantidades e indicadores en la misma linea del detalle.

## Contexto funcional consolidado

La vista detalle representa una sola solicitud filtrada por `id`, pero debe seguir la misma logica de acceso del listado:

- `admin`, `gerencia`, `almacen` y `secretaria` pueden ver solicitudes dentro de sus estados visibles.
- `operativo` solo puede ver solicitudes de su area o creadas por el mismo.
- El detalle no debe usar un `select by id` libre si eso permite saltarse la logica del listado.

La fuente de detalle futura puede ser:

```txt
vw_solicitud_detalle_completo
RPC dedicada por usuario actual
```

pero siempre debe devolver datos ya filtrados por visibilidad funcional.

## Subspec logica

### 1. Dimensiones de visualizacion

La visualizacion del detalle depende al mismo tiempo de:

- rol del usuario;
- area del usuario;
- tipo de solicitud;
- estado de la solicitud;
- estado del detalle;
- ciclo actual;
- existencia o no de OC;
- existencia o no de `linea_solicitud`.

No se debe resolver solo por un factor aislado.

### 2. Tipos de solicitud

#### Productos

Aplica a:

```txt
zafra
cultivo
otros
```

Reglas:

- puede pasar por almacen;
- puede tener `cantidad_inventario`;
- puede tener productos temporales;
- puede tener diferencias contra sistema y contra OC;
- puede tener descarte por almacen o gerencia.

#### Servicios

Reglas:

- no pasa por almacen como parte del flujo normal;
- no muestra `cantidad_inventario`;
- no calcula diferencias OC por producto;
- igual debe poder mostrar descarte;
- mantiene agrupaciones `Activas` y `Descartados`.

### 3. Agrupacion principal de detalles

La pantalla debe mostrar dos agrupaciones funcionales:

```txt
Activas
Descartados
```

#### Activas

Incluye detalles que no fueron descartados en ningun momento.

Pueden tener estados como:

```txt
pendiente
activo
aprobado_gerencia
subido_sistema
```

En el futuro, si existe estado relacionado con OC como descarte o diferencia en compras, el detalle sigue en `Activas` y se comunica dentro de la zona de diferencias/OC.

#### Descartados

Incluye cualquier detalle descartado, incluso de servicios.

Debe mostrar una columna dedicada:

```txt
descartado_por
```

Valores esperados:

```txt
Almacen
Gerencia
```

La agrupacion `Descartados` no se divide en subgrupos visuales separados.

### 4. Estado del detalle

En `Activas` debe existir una columna visible:

```txt
estado_detalle
```

para que el usuario vea si la linea esta:

```txt
pendiente
activo
aprobado_gerencia
subido_sistema
```

En `Descartados`, la fila debe mostrar:

- `estado_detalle`;
- `descartado_por`;
- `ciclo`;
- cantidades historicas visibles;
- `linea_solicitud` si existe.

### 5. Reglas por ciclo

El `ciclo` existe desde la creacion del detalle y no depende del descarte.

Reglas:

- cuando gerencia devuelve a operativo, aumenta el ciclo;
- los descartes no cambian el ciclo;
- los detalles descartados conservan su ciclo historico;
- la vista principal prioriza el `ciclo_estado` actual;
- aun asi, todos los descartados deben verse y deben mostrar su ciclo.

Comportamiento recomendado:

- mostrar primero las agrupaciones del ciclo actual;
- mostrar descartados de ciclos anteriores tambien visibles, identificando el ciclo en la fila;
- no mezclar el ciclo como sustituto de estado de descarte.

### 6. Ordenamiento de detalles

#### Cuando existe `linea_solicitud`

Ordenar por:

```txt
linea_solicitud asc
```

y luego por `created_at` como desempate si hace falta.

#### Cuando no existe `linea_solicitud`

Ordenar por:

```txt
created_at asc
```

Esto aplica a revisiones previas a aprobacion de gerencia.

#### Descartados

Dentro de `Descartados`, ordenar por:

```txt
ciclo desc
linea_solicitud asc si existe
created_at asc si no existe linea
```

### 7. Cadena de cantidades para productos

La secuencia funcional de cantidades es:

```txt
cantidad_inventario
cantidad
cantidad_gerencia
cantidad_solicitada_sistema
cantidad_oc_total
cantidad_recibida_total
```

Interpretacion:

- `cantidad_inventario`: cantidad que almacén informa disponible.
- `cantidad`: cantidad que operativo define despues de la devolucion de almacen.
- `cantidad_gerencia`: cantidad aprobada por gerencia.
- `cantidad_solicitada_sistema`: cantidad detectada/importada desde el sistema externo.
- `cantidad_oc_total`: suma agregada de `orden_compra_detalle.cantidad` para la linea.
- `cantidad_recibida_total`: suma agregada de `orden_compra_detalle.cantidad_recibida` para la linea.

### 8. Modos visuales de cantidades

#### Modo sin OC

Aplica cuando la linea o la solicitud todavia no tiene datos de OC suficientes.

La fila debe mostrar de forma progresiva solo las columnas que ya tienen sentido segun el estado del flujo:

- `cantidad_inventario` aparece despues de revision de almacen.
- `cantidad` aparece cuando operativo ya definio la cantidad.
- `cantidad_gerencia` aparece despues de aprobacion de gerencia.
- `cantidad_solicitada_sistema` aparece cuando ya existe dato importado/subido a sistema.

No se deben mostrar columnas futuras vacias como si fueran permanentes.

#### Modo con OC

Aplica cuando ya existen datos de OC asociados a la linea.

La fila debe priorizar:

- `cantidad_gerencia`
- `cantidad_solicitada_sistema`
- `cantidad_oc_total`
- `cantidad_recibida_total`

Regla:

- una vez que ya existe OC, no mostrar `cantidad_inventario` en la fila principal.

### 9. Diferencias

Las diferencias deben convivir en la misma linea del detalle, no en una pantalla separada.

#### Sin OC

La diferencia principal visible es:

```txt
cantidad_gerencia vs cantidad_solicitada_sistema
```

#### Con OC

Las diferencias visibles pasan a priorizar:

```txt
cantidad_solicitada_sistema vs cantidad_oc_total
cantidad_oc_total vs cantidad_recibida_total
```

No mezclar todas las diferencias con el mismo peso visual.

### 10. Multiples OC para una misma linea

Cuando una sola linea de solicitud termina repartida en varias OC:

- la fila principal no se duplica;
- `cantidad_oc_total` es la suma de todas las OC asociadas;
- `cantidad_recibida_total` es la suma de todas las recepciones asociadas;
- el detalle por `folio_oc` queda en un expandible opcional de la misma fila.

La fila principal siempre sigue representando la linea de solicitud, no cada OC individual.

### 11. Fecha de entrega

La UI debe mostrar:

- fecha original de solicitud;
- fecha efectiva proveniente de sistema cuando exista.

Reglas:

- si no existe `fecha_entrega_sistema`, la fecha visible principal es la original;
- si existe `fecha_entrega_sistema`, esa debe verse como la fecha efectiva;
- la fecha de sistema debe verse con tratamiento visual mas opaco/secundario respecto a la original cuando ambas se muestren juntas;
- no usar labels tecnicos como `fecha_entrega_sistema` en la UI final.

### 12. Visibilidad por rol

#### Admin

Debe ver:

- toda la metadata de solicitud;
- todas las agrupaciones de detalle;
- todas las cantidades;
- adjuntos;
- diferencias;
- resumen y desglose de OC;
- ciclos;
- `descartado_por`;
- estados de solicitud y detalle.

#### Gerencia

Debe ver:

- toda la cadena de cantidades del detalle;
- agrupaciones `Activas` y `Descartados`;
- `descartado_por`;
- diferencias;
- OC agregadas y expandibles;
- ciclos;
- fecha original y fecha efectiva.

No necesita email tecnico del solicitante.

#### Operativo

Debe ver:

- toda la cadena de cantidades del detalle;
- inventario cuando aun no exista OC;
- cantidades aprobadas, subidas y de OC cuando existan;
- agrupaciones `Activas` y `Descartados`;
- `descartado_por`;
- diferencias;
- ciclos;
- OC agregadas y expandibles.

#### Secretaria

Debe ver:

- `cantidad_gerencia`;
- `cantidad_solicitada_sistema`;
- OC agregadas y recepcion cuando existan;
- agrupaciones `Activas` y `Descartados`;
- `descartado_por`;
- ciclos.

No debe editar `cantidad_solicitada_sistema` desde esta vista.  
La cantidad en sistema es informativa/importada.

No necesita:

- `cantidad_inventario`;
- cantidad operativa inicial si la UI debe mantenerse enfocada;
- adjuntos si se mantiene la misma regla del listado.

#### Almacen

Debe ver:

- producto o servicio;
- estado del detalle;
- `cantidad_inventario` cuando aplique;
- ciclo;
- si fue descartado y por quien;
- agrupaciones `Activas` y `Descartados`.

No debe ver:

- `cantidad`;
- `cantidad_gerencia`;
- `cantidad_solicitada_sistema`;
- cantidades OC;
- diferencias OC;
- adjuntos.

### 13. Servicios

Para detalle de servicios:

- se mantiene la agrupacion `Activas` y `Descartados`;
- se mantiene columna `estado_detalle`;
- se mantiene columna `descartado_por`;
- no existe `cantidad_inventario`;
- la linea puede pasar de `cantidad` a `cantidad_gerencia` y luego a `cantidad_solicitada_sistema`;
- si se muestran datos de OC para servicios, no deben reutilizar logica de diferencia por producto.

## Subspec types

La capa futura de types debe contemplar al menos:

```txt
estado solicitud
estado detalle
agrupacion detalle
descartado_por
modo de cantidades
desglose por OC
resumen agregado por linea
```

No fijar nombres de interfaces en este spec.

## No hacer

- No mezclar agrupacion de detalles con tabs del listado.
- No usar `activo` como reemplazo de `estado_contexto`.
- No duplicar filas por cada OC en la vista principal.
- No mostrar `cantidad_inventario` una vez que ya existe OC en la fila principal.
- No ocultar los descartados historicos.
- No asumir que servicio nunca puede quedar descartado.

## Criterios de aceptacion

- El detalle respeta la misma visibilidad base del listado.
- La agrupacion principal de detalle queda en `Activas` y `Descartados`.
- Los descartados muestran `descartado_por` y `ciclo`.
- Las lineas se ordenan por `linea_solicitud` cuando exista y por `created_at` cuando no exista.
- La fila principal mantiene la linea de solicitud como unidad visual, aun cuando haya multiples OC.
- Las cantidades cambian de columnas segun el modo `sin OC` y `con OC`.
- `secretaria` ve cantidades aprobadas y subidas, pero no edita lo importado.
- `almacen` no ve cantidades ajenas a su paso del flujo.
