# RPC `rpc_reporte_actividad_equipos_general`

## Objetivo

El RPC `public.rpc_reporte_actividad_equipos_general` concentra en una sola llamada todos los datos de `captura_operador` necesarios para las dos diapositivas del resumen general de actividad de equipos dentro de un rango de fechas.

Está pensado para evitar llamar individualmente los RPC de detalle por equipo.

## Endpoint

```text
POST /rest/v1/rpc/rpc_reporte_actividad_equipos_general
```

## Parámetros de entrada

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---:|---|
| `p_desde` | `date` | No | Fecha inicial del reporte. Por defecto: un mes antes de la fecha actual. |
| `p_hasta` | `date` | No | Fecha final inclusiva. Por defecto: fecha actual. |

Las fechas se interpretan usando la zona horaria:

```text
America/Panama
```

El rango efectivo es:

```text
p_desde 00:00:00
hasta
p_hasta 23:59:59.999...
```

en hora de Panamá.

## Payload de envío

```json
{
  "p_desde": "2026-08-17",
  "p_hasta": "2026-09-05"
}
```

Ejemplo con Supabase JS:

```ts
const { data, error } = await supabase.rpc(
  "rpc_reporte_actividad_equipos_general",
  {
    p_desde: "2026-08-17",
    p_hasta: "2026-09-05",
  },
);
```

## Seguridad

El RPC:

- requiere `auth.uid()`;
- no permite ejecución a `anon`;
- permite ejecución a `authenticated` y `service_role`;
- reutiliza `private.reporte_permite_operador(...)`;
- por lo tanto respeta la configuración existente para excluir o incluir `operadorget@cadasa.com`.

Si no hay usuario autenticado devuelve:

```text
USUARIO_NO_AUTENTICADO
```

Si `p_desde > p_hasta` devuelve:

```text
RANGO_FECHAS_INVALIDO
```

---

# Estructura general del retorno

```json
{
  "rango": {},
  "diapositiva_1": {},
  "diapositiva_2": {}
}
```

## Ejemplo simplificado de retorno

```json
{
  "rango": {
    "desde": "2026-08-17",
    "hasta": "2026-09-05",
    "zona_horaria": "America/Panama"
  },
  "diapositiva_1": {
    "resumen": {
      "equipos": 6,
      "jornadas": 13,
      "tiempo_total_segundos": 189422,
      "tiempo_total": "52:37",
      "tiempo_efectivo_segundos": 99152,
      "tiempo_efectivo": "27:32",
      "efectividad": 52.34,
      "tiempo_parado_segundos": 90270,
      "tiempo_parado": "25:04",
      "porcentaje_parado": 47.66
    },
    "mejor_dia": {
      "fecha": "2026-08-27",
      "dia_semana": "Jue",
      "efectividad": 99.89,
      "porcentaje_parado": 0.11,
      "tiempo_efectivo": "01:09",
      "tiempo_parado": "00:00",
      "equipos": 2,
      "jornadas": 2
    },
    "peor_dia": {
      "fecha": "2026-09-03",
      "dia_semana": "Jue",
      "efectividad": 0.15,
      "porcentaje_parado": 99.85,
      "tiempo_efectivo": "00:00",
      "tiempo_parado": "08:30",
      "equipos": 1,
      "jornadas": 1
    },
    "top_labores": [
      {
        "labor_id": "uuid",
        "labor": "Rastra pesada",
        "tiempo_segundos": 47385,
        "tiempo": "13:09",
        "porcentaje_tiempo_efectivo": 47.79,
        "jornadas": 5,
        "equipos": 2
      }
    ],
    "top_causas_parada": [
      {
        "tipo_parada_id": "uuid",
        "motivo": "Cambio/Calibre implemento",
        "tiempo_segundos": 32334,
        "tiempo": "08:58",
        "porcentaje_paradas": 35.82,
        "ocurrencias": 2,
        "jornadas": 2,
        "equipos": 2
      }
    ],
    "rendimiento_equipos": [
      {
        "equipo_numero": "484102",
        "jornadas": 2,
        "tiempo_total_segundos": 52066,
        "tiempo_total": "14:27",
        "tiempo_efectivo_segundos": 38576,
        "tiempo_efectivo": "10:42",
        "tiempo_parado_segundos": 13490,
        "tiempo_parado": "03:44",
        "efectividad": 74.09,
        "porcentaje_parado": 25.91
      }
    ]
  },
  "diapositiva_2": {
    "actividad_diaria": [
      {
        "fecha": "2026-09-04",
        "dia_semana": "Vie",
        "equipos": 1,
        "jornadas": 1,
        "tiempo_total": "06:17",
        "tiempo_efectivo": "04:21",
        "efectividad": 69.28,
        "tiempo_parado": "01:55",
        "porcentaje_parado": 30.72
      }
    ],
    "mejores_equipos": [
      {
        "equipo_numero": "484102",
        "efectividad": 74.09,
        "porcentaje_parado": 25.91,
        "tiempo_efectivo": "10:42",
        "tiempo_parado": "03:44",
        "tiempo_total": "14:27",
        "jornadas": 2
      }
    ],
    "peores_equipos": [
      {
        "equipo_numero": "484095",
        "efectividad": 34.35,
        "porcentaje_parado": 65.65,
        "tiempo_efectivo": "05:08",
        "tiempo_parado": "09:49",
        "tiempo_total": "14:58",
        "jornadas": 4
      }
    ],
    "top_operadores": [
      {
        "operador_id": "uuid",
        "operador": "AMILCAR MORALES",
        "jornadas": 5,
        "tiempo_efectivo": "21:12",
        "tiempo_parado": "15:14",
        "tiempo_total": "36:26",
        "efectividad": 58.18,
        "participacion_tiempo_efectivo": 77.0
      }
    ]
  }
}
```

---

# Definición de métricas

## Efectividad general

```text
tiempo efectivo / tiempo total × 100
```

Donde:

```text
tiempo efectivo = suma de jornada_periodo con estado = 'trabajando'
tiempo parado   = suma de jornada_periodo con estado = 'parado'
tiempo total    = efectivo + parado
```

## Equipos

Cantidad de códigos distintos en:

```text
jornada_asignacion.equipo_numero
```

Los códigos se normalizan eliminando guiones y espacios.

## Jornadas

```text
count(distinct jornada.id)
```

## Mejor y peor día

Cada período se divide correctamente por día calendario en `America/Panama`.

Después se calcula:

```text
efectividad diaria = tiempo efectivo diario / tiempo total diario × 100
```

- mejor día = mayor efectividad;
- peor día = menor efectividad.

## Top 3 labores

Se toman solamente períodos:

```text
estado = 'trabajando'
```

con `labor_id` válido.

Se agrupan por labor y se ordenan por mayor tiempo efectivo acumulado.

Máximo:

```text
3 filas
```

## Top 3 causas de parada

Se utilizan:

```text
jornada_periodo
→ periodo_parada_causa
→ tipo_parada
```

Se agrupan por causa y se ordenan por mayor duración acumulada.

El porcentaje representa:

```text
tiempo de la causa / tiempo parado total × 100
```

## Actividad diaria

Devuelve todos los días con actividad dentro del rango.

Cada fila incluye:

- fecha;
- día de semana;
- equipos;
- jornadas;
- tiempo total;
- tiempo efectivo;
- efectividad;
- tiempo parado;
- porcentaje parado.

## Mejores equipos

Top 3 ordenado por:

1. mayor efectividad;
2. mayor tiempo efectivo;
3. mayor tiempo total;
4. código del equipo.

## Peores equipos

Top 3 ordenado por:

1. menor efectividad;
2. mayor tiempo parado;
3. mayor tiempo total;
4. código del equipo.

## Top operadores

Top 3 según mayor tiempo efectivo acumulado.

También devuelve:

```text
participacion_tiempo_efectivo
```

que representa cuánto del tiempo efectivo general corresponde a ese operador.

---

# Rendimiento por tipo de equipo

`captura_operador` no conoce el tipo maestro del equipo.

Por eso el RPC devuelve:

```text
diapositiva_1.rendimiento_equipos
```

con un registro para cada código de equipo.

Flujo recomendado:

```text
RPC captura_operador
        ↓
rendimiento_equipos
        ↓
extraer equipo_numero[]
        ↓
consultar BD maestra de equipos
        ↓
cod_equipo → tipo
        ↓
merge
        ↓
agrupar por tipo
```

No se deben promediar directamente las efectividades individuales.

Incorrecto:

```text
(80% + 60%) / 2
```

Correcto:

```text
efectividad_tipo =
sum(tiempo_efectivo_segundos)
/
sum(tiempo_total_segundos)
× 100
```

Ejemplo de resultado después de enriquecer y agrupar:

```json
[
  {
    "tipo": "TRACTOR",
    "equipos": 4,
    "tiempo_efectivo_segundos": 165200,
    "tiempo_parado_segundos": 42700,
    "tiempo_total_segundos": 207900,
    "efectividad": 79.46,
    "porcentaje_parado": 20.54
  }
]
```

---

# Observaciones de frontend

Para gráficos y cálculos adicionales usar siempre los campos `*_segundos`.

Los campos:

```text
"13:09"
"27:32"
"52:37"
```

son valores de presentación `HH:MM` y pueden superar 24 horas.

No convertirlos a objetos `Date`.
