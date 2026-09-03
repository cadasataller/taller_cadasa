# Backend del reporte ERP de equipos

## Estado de implementación

Este paquete define la implementación backend requerida por la UI `reporte_equipos_erp_v7_operadores.html`.

Incluye:

- una nueva Edge Function: `buscar-equipos-reporte`;
- seis RPC de lectura en `captura_operador`;
- rango de fechas en todos los RPC;
- último mes como rango por defecto;
- zona horaria de negocio `America/Panama`;
- tiempos listos en `HH:MM`;
- timestamps crudos para poder formatear nuevamente en Vue si se requiere.

> La Edge Function nueva no replica manualmente la whitelist ni la lógica interna de `buscar-equipos`. Llama a `buscar-equipos` como fuente de verdad y enriquece su respuesta con un RPC batch. Esto evita que ambas funciones se desalineen.

---

# 1. Flujo general

```text
ABRIR REPORTE
│
└── buscar-equipos-reporte
      │
      ├── buscar-equipos
      │     └── cod_equipo + tipo
      │
      └── rpc_reporte_equipos_lista
            └── jornadas + tiempo total


CLICK EN EQUIPO
│
├── fuente maestra de equipos
│     └── tipo / modelo / marca / activo / imagen
│
├── rpc_reporte_equipo_contexto
│     └── contexto común + motor
│
└── RPC DE LA TAB ACTIVA
      │
      ├── Resumen
      │     └── rpc_reporte_equipo_resumen
      │
      ├── Paradas
      │     └── rpc_reporte_equipo_paradas
      │
      └── Operadores
            └── rpc_reporte_equipo_operadores
                  │
                  └── click operador
                        └── rpc_reporte_equipo_operador_detalle
```

---

# 2. Rango de fechas

Los seis RPC aceptan:

```text
p_desde date
p_hasta date
```

Si se omiten:

```text
p_desde = current_date - 1 mes
p_hasta = current_date
```

Los días son inclusivos en la UI.

Internamente:

```text
desde = p_desde 00:00 America/Panama
hasta = día posterior a p_hasta 00:00 America/Panama (exclusivo)
```

Esto evita problemas por UTC al consultar un día completo.

---

# 3. Formato de duración

Todas las respuestas incluyen:

```json
{
  "tiempo_segundos": 52740,
  "tiempo": "14:39"
}
```

La UI debe mostrar:

```text
HH:MM
```

El campo de segundos queda disponible para:

- ordenar;
- recalcular porcentajes;
- gráficos;
- validaciones;
- exportaciones.

---

# 4. Edge Function `buscar-equipos-reporte`

## Objetivo

Alimentar el listado izquierdo:

```text
#equipment-sidebar-list
```

Cada card necesita:

```text
cod_equipo
tipo
jornadas
tiempo_total
```

## Endpoint esperado

```text
/functions/v1/buscar-equipos-reporte
```

Debe desplegarse con:

```text
verify_jwt = true
```

## Envío POST

```json
{
  "q": "484",
  "limit": 50,
  "full": false,
  "desde": "2026-08-03",
  "hasta": "2026-09-03"
}
```

## Envío GET

```text
?q=484&limit=50&full=false&desde=2026-08-03&hasta=2026-09-03
```

`desde` y `hasta` son opcionales.

Si no se envían, el RPC interno usa el último mes.

## Qué hace

```text
1. recibe JWT
2. llama a buscar-equipos
3. conserva su lógica actual
4. obtiene cod_equipo de la respuesta
5. envía todos los códigos juntos a rpc_reporte_equipos_lista
6. mezcla los resultados por cod_equipo
7. retorna la misma lista enriquecida
```

No hace una petición RPC por equipo.

## Retorno

```json
{
  "data": [
    {
      "cod_equipo": "484091",
      "tipo": "TRACTOR",
      "jornadas": 6,
      "tiempo_total": "14:39",
      "tiempo_total_segundos": 52740
    }
  ],
  "count": 1,
  "query": "484",
  "full": false,
  "reporte": {
    "rango": {
      "desde": "2026-08-03",
      "hasta": "2026-09-03",
      "zona_horaria": "America/Panama"
    }
  }
}
```

## Falla del RPC de enriquecimiento

La función es fail-soft.

Si `buscar-equipos` responde correctamente pero falla el RPC:

```json
{
  "cod_equipo": "484091",
  "tipo": "TRACTOR",
  "jornadas": null,
  "tiempo_total": null,
  "tiempo_total_segundos": null
}
```

De esta forma el catálogo de equipos continúa visible y la UI puede mostrar estado de error solamente para los datos de reporte.

---

# 5. RPC `rpc_reporte_equipos_lista`

## Uso UI

```text
#equipment-sidebar-list
└── #equipment-row-{cod_equipo}
```

No lo llama directamente Vue en el flujo normal.

Lo llama:

```text
buscar-equipos-reporte
```

## Payload

```json
{
  "p_equipos": [
    "484091",
    "484095",
    "484041"
  ],
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno

```json
{
  "rango": {
    "desde": "2026-08-03",
    "hasta": "2026-09-03",
    "zona_horaria": "America/Panama"
  },
  "data": [
    {
      "equipo_numero": "484091",
      "jornadas": 6,
      "tiempo_total_segundos": 52740,
      "tiempo_total": "14:39"
    }
  ]
}
```

## Fuente

```text
jornada
→ jornada_asignacion
→ jornada_periodo
```

## Regla

Se excluyen:

```text
jornada.estado = cancelada
jornada_asignacion.estado = cancelada
```

---

# 6. RPC `rpc_reporte_equipo_contexto`

## Momento

Se ejecuta inmediatamente después de seleccionar un equipo.

Se puede ejecutar en paralelo con:

```text
consulta del detalle en la fuente maestra
+
RPC de la tab activa
```

## Uso UI

### Perfil del equipo

```text
#equipment-profile-card
```

Alimenta:

```text
Total jornadas
Primera actividad
Última actividad
```

Los campos:

```text
Tipo
Modelo
Marca
Código
Imagen
Activo
```

deben venir de las fuentes externas de equipos/engrase.

### Uso de motor

```text
#equipment-engine-usage-card
```

## Payload

```json
{
  "p_equipo": "484091",
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno

```json
{
  "equipo_numero": "484091",
  "rango": {},
  "jornadas": 6,
  "primera_actividad": "timestamp",
  "ultima_actividad": "timestamp",
  "tiempo_total_segundos": 52740,
  "tiempo_total": "14:39",
  "motor": [
    {
      "motor_encendido": true,
      "estado": "encendido",
      "tiempo_segundos": 41940,
      "tiempo": "11:39",
      "porcentaje": 79.5,
      "periodos": 19
    },
    {
      "motor_encendido": false,
      "estado": "apagado",
      "tiempo_segundos": 10800,
      "tiempo": "03:00",
      "porcentaje": 20.5,
      "periodos": 11
    }
  ]
}
```

## Motor

Cuando el período está trabajando:

```text
labor.motor_encendido
```

Cuando está parado:

```text
periodo_parada_causa
→ tipo_parada.motor_encendido
```

No se supone automáticamente:

```text
trabajando = encendido
parado = apagado
```

---

# 7. RPC `rpc_reporte_equipo_resumen`

## Uso UI

Toda la vista:

```text
#equipment-summary-view
```

Alimenta:

```text
#summary-total-time-card
#summary-effective-time-card
#summary-effectiveness-card

#summary-classification-card
#summary-main-stops-card
#summary-operator-usage-card

#summary-equipment-implements-card
#summary-history-card
```

## Payload

```json
{
  "p_equipo": "484091",
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno resumido

```json
{
  "equipo_numero": "484091",
  "rango": {},
  "metricas": {
    "tiempo_total_segundos": 52740,
    "tiempo_total": "14:39",
    "tiempo_trabajando_segundos": 41940,
    "tiempo_trabajando": "11:39",
    "tiempo_parado_segundos": 10800,
    "tiempo_parado": "03:00",
    "efectividad": 79.5
  },
  "clasificaciones": [],
  "principales_paradas": [],
  "operadores": [],
  "implementos": [],
  "historial": []
}
```

## Clasificación

Para trabajo:

```text
jornada_asignacion.labor_id
→ labor.clasificacion
```

Para parada:

```text
periodo_parada_causa.tipo_parada_id
→ tipo_parada.clasificacion
```

## Historial

Máximo:

```text
10 registros
```

Combina:

```text
trabajando → labor
parado → causa
```

---

# 8. RPC `rpc_reporte_equipo_paradas`

## Uso UI

Toda la vista:

```text
#equipment-stops-view
```

Alimenta:

```text
#stops-total-time-card
#stops-percentage-card
#stops-count-card
#stops-average-duration-card

#stops-classification-card
#stops-origin-card
#stops-main-reasons-card
#stops-detail-card
```

## Payload

```json
{
  "p_equipo": "484091",
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno

```json
{
  "equipo_numero": "484091",
  "rango": {},
  "metricas": {
    "tiempo_parado_segundos": 10800,
    "tiempo_parado": "03:00",
    "porcentaje_parado": 20.5,
    "cantidad_paradas": 12,
    "duracion_promedio_segundos": 900,
    "duracion_promedio": "00:15"
  },
  "por_clasificacion": [],
  "por_origen": [],
  "principales_motivos": [],
  "detalle": []
}
```

## Detalle

Máximo:

```text
10 últimos tramos de causa
```

Cada fila puede incluir:

```json
{
  "inicio_local": "02/09/2026 13:33",
  "fin_local": "02/09/2026 13:56",
  "duracion": "00:23",
  "motivo": "Máquina parada por falta de combustible",
  "origen": "equipo",
  "clasificacion": "TALLER",
  "motor_encendido": false,
  "motor": "Apagado",
  "implemento": null
}
```

Si:

```text
origen = implemento
```

la propiedad `implemento` contiene:

```text
id
numero
nombre
```

---

# 9. RPC `rpc_reporte_equipo_operadores`

## Uso UI

Primera parte de:

```text
#equipment-operators-view
```

Alimenta:

```text
#operators-unique-count-card
#operators-total-time-card
#operators-journeys-card
#operators-top-participation-card
#operators-usage-table-card
```

## Momento

Se ejecuta al abrir:

```text
Operadores
```

No calcula todavía el detalle pesado de cada operador.

## Payload

```json
{
  "p_equipo": "484091",
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno

```json
{
  "equipo_numero": "484091",
  "rango": {},
  "metricas": {
    "operadores_unicos": 3,
    "tiempo_total_segundos": 52740,
    "tiempo_total": "14:39",
    "jornadas": 6,
    "mayor_participacion": {
      "operador_id": "uuid",
      "operador": "amilcarm@cadasa.com",
      "porcentaje": 91.9
    }
  },
  "operadores": [
    {
      "operador_id": "uuid",
      "operador": "amilcarm@cadasa.com",
      "jornadas": 3,
      "tiempo_total_segundos": 48480,
      "tiempo_total": "13:28",
      "tiempo_trabajando_segundos": 39000,
      "tiempo_trabajando": "10:50",
      "tiempo_parado_segundos": 9480,
      "tiempo_parado": "02:38",
      "porcentaje_uso": 91.9,
      "primera_actividad": "timestamp",
      "ultima_actividad": "timestamp"
    }
  ]
}
```

Esto permite eliminar los `—` que existían en el mockup para jornadas/trabajando/parado.

---

# 10. RPC `rpc_reporte_equipo_operador_detalle`

## Uso UI

Solo se ejecuta al seleccionar un operador en:

```text
#operators-usage-table-card
```

Alimenta:

```text
#operator-time-distribution-card
#operator-main-stops-card
#operator-engine-usage-card
#operator-implements-card
#operator-history-card
```

## Payload

```json
{
  "p_equipo": "484091",
  "p_operador": "UUID-DEL-OPERADOR",
  "p_desde": "2026-08-03",
  "p_hasta": "2026-09-03"
}
```

## Retorno

```json
{
  "equipo_numero": "484091",
  "operador": {
    "id": "uuid",
    "label": "amilcarm@cadasa.com"
  },
  "rango": {},
  "metricas": {
    "jornadas": 3,
    "tiempo_total": "13:28",
    "tiempo_trabajando": "10:50",
    "tiempo_parado": "02:38"
  },
  "distribucion_estado": [],
  "distribucion_clasificacion": [],
  "principales_paradas": [],
  "motor": [],
  "implementos": [],
  "historial": []
}
```

## `distribucion_estado`

Entrega:

```text
trabajando
parado
```

## `distribucion_clasificacion`

También se incluye para que la UI pueda evolucionar posteriormente a:

```text
EFECTIVO
OPERATIVO
TALLER
IMPONDERABLE
```

sin crear otro RPC.

## Historial

Máximo:

```text
10 últimos
```

Columnas de UI:

```text
Inicio
Fin
Labor / Motivo
Tiempo
```

---

# 11. Peticiones desde Vue

## Carga inicial

```ts
await fetch('/functions/v1/buscar-equipos-reporte', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full: true,
    desde: filters.startDate,
    hasta: filters.endDate,
  }),
})
```

---

# 12. Click en equipo

Las llamadas independientes deben ejecutarse en paralelo.

```ts
const equipmentCode = selectedEquipmentCode.value

const [externalDetail, context, activeView] = await Promise.all([
  loadExternalEquipmentDetail(equipmentCode),

  supabase.rpc('rpc_reporte_equipo_contexto', {
    p_equipo: equipmentCode,
    p_desde: filters.startDate,
    p_hasta: filters.endDate,
  }),

  loadActiveTab(equipmentCode),
])
```

No hacer:

```text
detalle
↓ esperar
contexto
↓ esperar
tab
```

---

# 13. Carga por tab

```ts
async function loadActiveTab(equipmentCode: string) {
  if (activeTab.value === 'resumen') {
    return supabase.rpc('rpc_reporte_equipo_resumen', {
      p_equipo: equipmentCode,
      p_desde: filters.startDate,
      p_hasta: filters.endDate,
    })
  }

  if (activeTab.value === 'paradas') {
    return supabase.rpc('rpc_reporte_equipo_paradas', {
      p_equipo: equipmentCode,
      p_desde: filters.startDate,
      p_hasta: filters.endDate,
    })
  }

  return supabase.rpc('rpc_reporte_equipo_operadores', {
    p_equipo: equipmentCode,
    p_desde: filters.startDate,
    p_hasta: filters.endDate,
  })
}
```

---

# 14. Click en operador

```ts
await supabase.rpc('rpc_reporte_equipo_operador_detalle', {
  p_equipo: selectedEquipmentCode.value,
  p_operador: selectedOperatorId.value,
  p_desde: filters.startDate,
  p_hasta: filters.endDate,
})
```

---

# 15. Estados de carga UI

No se debe bloquear toda la página hasta que terminen todas las peticiones.

Usar estados independientes:

```ts
type LoadState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
```

Ejemplo:

```ts
const loadState = reactive({
  equipmentList: 'idle' as LoadState,
  profile: 'idle' as LoadState,
  context: 'idle' as LoadState,
  summary: 'idle' as LoadState,
  stops: 'idle' as LoadState,
  operators: 'idle' as LoadState,
  operatorDetail: 'idle' as LoadState,
})
```

Así pueden aparecer progresivamente:

```text
Lista              READY
Perfil             READY
Uso motor          LOADING
Resumen            LOADING
```

---

# 16. Seguridad

Los RPC son:

```text
SECURITY DEFINER
```

y verifican:

```text
auth.uid() IS NOT NULL
```

Permisos:

```text
authenticated
service_role
```

No se concede `EXECUTE` a `anon` ni `PUBLIC`.

La Edge Function debe usar:

```text
verify_jwt = true
```

La función nueva reenvía el JWT del usuario al RPC.

---

# 17. Archivos del paquete

```text
reporte_equipos_rpcs.sql
```

Contiene:

```text
private.reporte_hhmm
rpc_reporte_equipos_lista
rpc_reporte_equipo_contexto
rpc_reporte_equipo_resumen
rpc_reporte_equipo_paradas
rpc_reporte_equipo_operadores
rpc_reporte_equipo_operador_detalle
```

```text
buscar-equipos-reporte/index.ts
buscar-equipos-reporte/deno.json
```

Contiene la nueva Edge Function.

---

# 18. Orden de despliegue

```text
1. aplicar reporte_equipos_rpcs.sql
2. comprobar los 6 RPC
3. desplegar buscar-equipos-reporte con verify_jwt=true
4. probar full=true
5. probar búsqueda q
6. probar rango personalizado
7. integrar frontend Vue
```

---

# 19. Arquitectura final

```text
NO
RPC por card

NO
mega-RPC que calcule todas las tabs

SÍ
RPC por ámbito analítico
+
peticiones paralelas
+
detalle de operador bajo demanda
```

Total:

```text
6 RPC
1 Edge Function nueva
```
