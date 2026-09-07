# Cambio solicitado — Ranking de mejores y peores equipos

## 1. Objetivo

Modificar la presentación y la lógica del bloque **Mejores equipos / Equipos a revisar** del reporte de actividad de equipos.

El problema del diseño anterior es que mostraba como valor principal un **índice combinado** o un valor alto asociado al riesgo/parada.

Ejemplo problemático:

```text
484095   73.6 pts
```

Aunque el equipo tuviera baja efectividad, un valor como `73.6` podía interpretarse visualmente como una buena calificación.

La nueva regla será:

> **El índice combinado se utiliza únicamente para ordenar.  
> El valor principal mostrado al usuario siempre será la efectividad real del equipo.**

---

# 2. Regla mínima de horas para participar en el ranking

Se consideran **8 horas de trabajo esperadas por cada día filtrado**.

```text
horas_esperadas = 8 × cantidad_dias_filtrados
```

El equipo debe acumular al menos el **80%** de esas horas para poder entrar al ranking.

```text
horas_minimas_evaluables =
8 × cantidad_dias_filtrados × 0.80
```

Ejemplos:

| Días filtrados | Horas esperadas | Mínimo 80% |
|---:|---:|---:|
| 1 | 08:00 | 06:24 |
| 2 | 16:00 | 12:48 |
| 3 | 24:00 | 19:12 |
| 5 | 40:00 | 32:00 |
| 7 | 56:00 | 44:48 |

La validación debe hacerse contra:

```text
tiempo_total = tiempo_efectivo + tiempo_parado
```

Un equipo que no alcance el mínimo:

- no participa en `mejores_equipos`;
- no participa en `peores_equipos`;
- puede seguir apareciendo en `rendimiento_equipos`;
- no debe utilizarse para determinar el ranking ejecutivo.

---

# 3. Mejores equipos

## Criterio interno

Los mejores deben considerar dos factores:

1. **Efectividad**
2. **Cantidad de horas efectivas acumuladas**

La efectividad continúa siendo la medida de calidad:

```text
efectividad =
tiempo_efectivo / tiempo_total × 100
```

Las horas efectivas representan el volumen real de trabajo realizado.

El RPC puede calcular internamente un índice de ranking, por ejemplo:

```text
factor_horas_efectivas =
min(
  tiempo_efectivo / horas_esperadas,
  1
) × 100
```

```text
indice_mejor =
(efectividad × 0.60)
+
(factor_horas_efectivas × 0.40)
```

El índice se utiliza solamente para ordenar.

## Datos mostrados en UI

Por cada equipo:

```text
Código del equipo
Efectividad %
Tiempo efectivo
Tiempo parado
Tiempo total
```

El valor visual principal será:

```text
efectividad
```

Ejemplo:

```text
1   484102                         91.8%
    ██████████████████░
    18:25 efectivo · 01:39 parado · 20:04 total
```

No mostrar:

```text
80.9 pts
```

aunque dicho índice exista internamente.

---

# 4. Equipos a revisar

Se recomienda utilizar el título:

```text
EQUIPOS A REVISAR
```

en lugar de presentar un número alto bajo el concepto de “peor”.

## Criterio interno

Debe considerar:

1. **Porcentaje de tiempo parado**
2. **Cantidad real de horas paradas**

```text
porcentaje_parado =
tiempo_parado / tiempo_total × 100
```

```text
factor_horas_paradas =
min(
  tiempo_parado / horas_esperadas,
  1
) × 100
```

```text
indice_revision =
(porcentaje_parado × 0.60)
+
(factor_horas_paradas × 0.40)
```

El índice se utiliza únicamente para priorizar qué equipos aparecen primero.

## Datos mostrados en UI

El número principal también será la **efectividad**.

Ejemplo:

```text
1   484095                         34.4%
    ███████░░░░░░░░░░░
    05:08 efectivo · 09:49 parado · 14:57 total
    65.6% TIEMPO PERDIDO
```

La pérdida debe mostrarse explícitamente como:

```text
65.6% tiempo perdido
```

y no solamente como:

```text
65.6%
```

Esto evita que un porcentaje alto de parada sea interpretado como algo positivo.

---

# 5. Semántica visual

## Mejores equipos

```text
Número principal:
efectividad

Barra:
efectividad

Color:
success / verde
```

Lectura:

```text
más alto = mejor
```

## Equipos a revisar

```text
Número principal:
efectividad

Barra:
efectividad

Color:
danger / rojo
```

Dato secundario:

```text
porcentaje_parado + " tiempo perdido"
```

Lectura:

```text
menor efectividad = peor
mayor tiempo perdido = mayor problema
```

Así ambas tarjetas utilizan la misma métrica principal y son directamente comparables.

---

# 6. Cambio recomendado en `rpc_reporte_actividad_equipos_general`

El RPC actual devuelve:

```text
diapositiva_2.mejores_equipos
diapositiva_2.peores_equipos
```

Se recomienda mantener esos nombres para evitar cambios innecesarios en el frontend.

Agregar dentro de `diapositiva_2` un objeto:

```json
{
  "criterio_ranking": {
    "dias_filtrados": 5,
    "horas_por_dia": 8,
    "porcentaje_minimo_horas": 80,
    "tiempo_esperado_segundos": 144000,
    "tiempo_esperado": "40:00",
    "tiempo_minimo_evaluable_segundos": 115200,
    "tiempo_minimo_evaluable": "32:00",
    "equipos_evaluables": 12,
    "equipos_no_evaluables": 3
  }
}
```

---

# 7. Payload recomendado por equipo

## `mejores_equipos[]`

```json
{
  "equipo_numero": "484102",
  "efectividad": 91.8,
  "porcentaje_parado": 8.2,

  "tiempo_efectivo_segundos": 66300,
  "tiempo_efectivo": "18:25",

  "tiempo_parado_segundos": 5940,
  "tiempo_parado": "01:39",

  "tiempo_total_segundos": 72240,
  "tiempo_total": "20:04",

  "jornadas": 3,

  "cumple_minimo_horas": true,
  "indice_ranking": 84.6
}
```

`indice_ranking` puede ser utilizado por frontend para depuración o mantenerse únicamente como información técnica.

**No debe mostrarse como indicador principal en la UI.**

---

## `peores_equipos[]`

```json
{
  "equipo_numero": "484095",
  "efectividad": 34.4,
  "porcentaje_parado": 65.6,

  "tiempo_efectivo_segundos": 18480,
  "tiempo_efectivo": "05:08",

  "tiempo_parado_segundos": 35340,
  "tiempo_parado": "09:49",

  "tiempo_total_segundos": 53820,
  "tiempo_total": "14:57",

  "jornadas": 2,

  "cumple_minimo_horas": true,
  "indice_ranking": 72.3
}
```

En la UI:

```text
34.4%                   ← efectividad
65.6% tiempo perdido    ← indicador negativo explícito
```

No mostrar:

```text
72.3 pts
```

---

# 8. Ejemplo de payload completo de retorno

```json
{
  "rango": {
    "desde": "2026-09-01",
    "hasta": "2026-09-05",
    "zona_horaria": "America/Panama"
  },

  "diapositiva_1": {
    "resumen": {
      "equipos": 15,
      "jornadas": 37,
      "tiempo_total_segundos": 1645200,
      "tiempo_total": "457:00",
      "tiempo_efectivo_segundos": 1112400,
      "tiempo_efectivo": "309:00",
      "efectividad": 67.61,
      "tiempo_parado_segundos": 532800,
      "tiempo_parado": "148:00",
      "porcentaje_parado": 32.39
    },

    "mejor_dia": {},
    "peor_dia": {},
    "top_labores": [],
    "top_causas_parada": [],
    "rendimiento_equipos": []
  },

  "diapositiva_2": {
    "criterio_ranking": {
      "dias_filtrados": 5,
      "horas_por_dia": 8,
      "porcentaje_minimo_horas": 80,

      "tiempo_esperado_segundos": 144000,
      "tiempo_esperado": "40:00",

      "tiempo_minimo_evaluable_segundos": 115200,
      "tiempo_minimo_evaluable": "32:00",

      "equipos_evaluables": 12,
      "equipos_no_evaluables": 3
    },

    "actividad_diaria": [],

    "mejores_equipos": [
      {
        "equipo_numero": "484102",
        "efectividad": 91.8,
        "porcentaje_parado": 8.2,

        "tiempo_efectivo_segundos": 132840,
        "tiempo_efectivo": "36:54",

        "tiempo_parado_segundos": 11880,
        "tiempo_parado": "03:18",

        "tiempo_total_segundos": 144720,
        "tiempo_total": "40:12",

        "jornadas": 5,
        "cumple_minimo_horas": true,
        "indice_ranking": 91.24
      },
      {
        "equipo_numero": "484091",
        "efectividad": 81.4,
        "porcentaje_parado": 18.6,

        "tiempo_efectivo_segundos": 126000,
        "tiempo_efectivo": "35:00",

        "tiempo_parado_segundos": 28800,
        "tiempo_parado": "08:00",

        "tiempo_total_segundos": 154800,
        "tiempo_total": "43:00",

        "jornadas": 5,
        "cumple_minimo_horas": true,
        "indice_ranking": 83.84
      }
    ],

    "peores_equipos": [
      {
        "equipo_numero": "484095",
        "efectividad": 34.4,
        "porcentaje_parado": 65.6,

        "tiempo_efectivo_segundos": 43020,
        "tiempo_efectivo": "11:57",

        "tiempo_parado_segundos": 82080,
        "tiempo_parado": "22:48",

        "tiempo_total_segundos": 125100,
        "tiempo_total": "34:45",

        "jornadas": 5,
        "cumple_minimo_horas": true,
        "indice_ranking": 62.16
      },
      {
        "equipo_numero": "484088",
        "efectividad": 47.6,
        "porcentaje_parado": 52.4,

        "tiempo_efectivo_segundos": 62340,
        "tiempo_efectivo": "17:19",

        "tiempo_parado_segundos": 68640,
        "tiempo_parado": "19:04",

        "tiempo_total_segundos": 130980,
        "tiempo_total": "36:23",

        "jornadas": 5,
        "cumple_minimo_horas": true,
        "indice_ranking": 50.50
      }
    ],

    "top_operadores": []
  }
}
```

---

# 9. Regla importante

Los datos de:

```text
efectividad
porcentaje_parado
tiempo_efectivo
tiempo_parado
tiempo_total
```

son métricas reales.

El campo:

```text
indice_ranking
```

es únicamente una herramienta interna para ordenar.

No debe sustituir ni reinterpretarse como:

```text
efectividad
calificación
porcentaje de rendimiento
```

---

# 10. Resultado esperado en frontend

## Mejores

```text
484102                         91.8%
18:25 efectivo · 01:39 parado · 20:04 total
```

## Equipos a revisar

```text
484095                         34.4%
05:08 efectivo · 09:49 parado · 14:57 total
65.6% TIEMPO PERDIDO
```

Esto permite que el supervisor compare inmediatamente ambos lados utilizando la misma escala:

```text
91.8% → buen rendimiento
34.4% → rendimiento deficiente
```

sin confundir un índice técnico alto con una buena calificación.
