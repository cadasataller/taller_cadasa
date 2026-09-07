# UI — Resumen general de actividad de equipos

## Formato general

La presentación tiene dos vistas tipo diapositiva.

Proporción:

```text
16:9
```

La UI debe mantenerse compacta y pensada para proyectarse en una reunión.

No usar scroll dentro de la diapositiva.

La prioridad visual debe ser:

1. porcentaje de efectividad;
2. porcentaje parado;
3. mejor y peor día;
4. rankings;
5. comparaciones.

---

# Paleta corporativa

| Uso | Color | Hex |
|---|---|---|
| Main | Verde petróleo | `#004643` |
| Accent | Dorado | `#D4A853` |
| Success | Verde | `#2D8A4E` |
| Warning | Naranja | `#C97B2F` |
| Danger | Rojo | `#C0392B` |
| Info | Azul | `#1A6B9A` |

## Regla de uso

### Main — `#004643`

Usar para:

- identidad principal;
- títulos importantes;
- barras de efectividad;
- mejor día;
- elementos positivos principales.

No usar como fondo completo de toda la diapositiva.

### Accent — `#D4A853`

Usar como acento:

- líneas;
- pequeños indicadores;
- separadores;
- estados destacados secundarios.

Evitar usarlo para bloques grandes.

### Success — `#2D8A4E`

Usar cuando sea necesario reforzar:

- buen desempeño;
- valores positivos;
- rankings altos.

### Warning — `#C97B2F`

Usar para:

- valores intermedios;
- atención moderada;
- elementos que no son críticos.

### Danger — `#C0392B`

Reservar para:

- peor día;
- equipos con peor efectividad;
- tiempo parado cuando necesite énfasis;
- valores negativos.

### Info — `#1A6B9A`

Usar para:

- información comparativa;
- categorías neutrales;
- elementos secundarios.

---

# DIAPOSITIVA 1 — Resumen general

## Objetivo

Permitir que una persona vea en pocos segundos:

- qué tan efectivo fue el rango;
- cuánto tiempo se perdió;
- cuántos equipos y jornadas participaron;
- cuál fue el mejor y peor día;
- qué labores dominaron;
- cuáles fueron las principales causas de parada;
- cómo rindieron los tipos de equipo.

---

## Encabezado

Mostrar:

```text
ACTIVIDAD DE EQUIPOS
Resumen general
```

Y el rango:

```text
17 AGO — 05 SEP 2026
```

El rango debe ser claramente visible, pero no competir con las métricas.

---

## Primera fila — Efectividad y parada

Dos indicadores principales.

### Efectividad

Mostrar en la misma fila:

```text
EFECTIVIDAD
52.34% · 27:32 h
```

No crear una card separada para tiempo acumulado.

Jerarquía:

- porcentaje = valor principal;
- horas = valor secundario;
- label = pequeño.

Color predominante:

```text
#004643
```

### Tiempo parado

Mostrar:

```text
TIEMPO PARADO
47.66% · 25:04 h
```

Usar:

```text
#C0392B
```

de forma controlada.

---

## Segunda fila — Equipos, jornadas, mejor día y peor día

Deben ser cards más altas que los pequeños indicadores normales.

Tienen que permitir lectura inmediata desde una pantalla proyectada.

### Equipos

Ejemplo:

```text
6
EQUIPOS
```

### Jornadas

```text
13
JORNADAS
```

### Mejor día

Ejemplo:

```text
99.89%
JUE · 27 AGO
MEJOR DÍA
```

Color:

```text
Main #004643
```

La card puede utilizar borde, icono o valor principal en main.

### Peor día

```text
0.15%
JUE · 03 SEP
PEOR DÍA
```

Color:

```text
Danger #C0392B
```

Debe diferenciarse claramente del mejor día sin convertir toda la card en rojo intenso.

---

## Tercera fila — Top labores y Top causas de parada

Dos columnas del mismo ancho.

Los dos bloques deben usar exactamente el mismo patrón visual que:

```text
Mejores equipos
Peores equipos
```

de la segunda diapositiva.

### Top labores realizadas

Máximo 3 filas.

Cada fila:

```text
1  Rastra pesada                    13:09
   ███████████████████████
```

Debe presentar:

- posición;
- nombre;
- tiempo;
- barra horizontal.

La barra representa el tiempo relativo respecto a la labor #1.

La labor #1 tiene 100% del ancho disponible.

No mostrar warnings de cobertura.

### Top 3 causas de parada

Mismo componente visual.

Ejemplo:

```text
1  Cambio/Calibre implemento       35.82%
   ███████████████████████
```

Mostrar:

- posición;
- nombre de causa;
- porcentaje de tiempo parado;
- barra.

El valor principal recomendado es:

```text
porcentaje_paradas
```

El tiempo puede mostrarse como dato secundario si existe espacio.

---

# Rendimiento por tipo de equipo

Este bloque ocupa una fila inferior.

Los datos no vienen agrupados directamente del RPC.

El frontend:

1. toma `rendimiento_equipos`;
2. consulta la BD maestra;
3. obtiene `tipo`;
4. agrupa tiempos por tipo;
5. calcula efectividad ponderada.

Presentación:

```text
TRACTOR                                  79.46%
████████████████████████████████

COSECHADORA                              71.20%
████████████████████████████

EQUIPO PESADO                            64.80%
████████████████████████
```

Usar el mismo componente de ranking/barra que el resto.

No crear un gráfico diferente si no aporta información adicional.

---

# DIAPOSITIVA 2 — Desglose del rango

## Objetivo

Explicar qué ocurrió internamente durante el rango.

Debe responder rápidamente:

- cómo cambió la efectividad diariamente;
- qué equipos rindieron mejor;
- qué equipos rindieron peor;
- qué operadores acumularon más tiempo efectivo.

---

# Actividad diaria — Efectividad vs parado

Debe ser el bloque de mayor presencia visual de esta diapositiva.

Cada día presenta una barra apilada:

```text
03 SEP |██████████░░░░░░░░░░░░░░|
         efectivo       parado
```

Usar:

```text
Efectividad → #004643
Parado      → #C0392B
```

Mostrar al lado los porcentajes:

```text
69.3% / 30.7%
```

Opcionalmente:

```text
04:21 / 01:55
```

como información secundaria.

## Grosor de barras

Las barras deben ser visualmente gruesas.

Aumentar el `height`, no el `width`.

Referencia:

```css
height: 28px;
```

o proporcionalmente equivalente.

El ancho debe seguir representando el 100% del día.

---

# Mejores equipos

Máximo 3.

Formato:

```text
1  484102                              74.09%
   ███████████████████████████
```

Debe mostrar:

- posición;
- código de equipo;
- efectividad;
- barra.

Opcional secundario:

```text
10:42 efectivo · 03:44 parado
```

Color principal:

```text
Main #004643
```

No usar verde brillante para toda la card.

---

# Peores equipos

Exactamente el mismo componente visual.

Ejemplo:

```text
1  484095                              34.35%
   ████████████
```

Usar:

```text
Danger #C0392B
```

para barra o valor principal.

El layout debe ser idéntico a mejores equipos; solamente cambia la semántica del color.

---

# Top 3 operadores por tiempo efectivo

Ranking máximo de 3.

Orden:

```text
tiempo_efectivo_segundos DESC
```

Ejemplo:

```text
1  AMILCAR MORALES                     21:12
   █████████████████████████████

2  SONIA PAZOS                         06:20
   █████████
```

El ancho de la barra representa tiempo efectivo relativo al operador #1.

Dato principal:

```text
tiempo_efectivo
```

Dato secundario opcional:

```text
efectividad
```

No ordenar por porcentaje de efectividad.

---

# Consistencia entre los rankings

Estos cinco bloques deben compartir el mismo componente visual:

```text
Top labores
Top causas de parada
Rendimiento por tipo
Mejores equipos
Peores equipos
Top operadores
```

Estructura base:

```text
posición | nombre/código                  valor
          barra horizontal
```

Deben compartir:

- altura de fila;
- radio;
- tipografía;
- separación;
- posición del valor;
- tamaño de barra;
- alineación.

Solo cambia el color semántico.

---

# Tipografía y jerarquía

La UI original usa:

```text
Bebas Neue
DM Sans
JetBrains Mono
```

Recomendación:

### Bebas Neue

Usar para:

- título principal;
- números KPI grandes;
- porcentajes principales.

### DM Sans

Usar para:

- labels;
- nombres de labores;
- causas;
- operadores;
- texto descriptivo.

### JetBrains Mono

Usar para:

- códigos de equipo;
- horas;
- porcentajes compactos;
- datos técnicos.

---

# Reglas para una diapositiva

Evitar:

- texto pequeño innecesario;
- más de 3 elementos por ranking;
- tablas tradicionales;
- fondos saturados;
- sombras exageradas;
- demasiados colores simultáneos;
- leyendas separadas cuando el significado pueda estar directamente rotulado.

Favorecer:

- alineación;
- proximidad;
- jerarquía;
- comparación directa;
- barras horizontales;
- números grandes;
- nombres cortos;
- espacio negativo.

---

# Mapeo RPC → UI

## Diapositiva 1

```text
diapositiva_1.resumen
    → KPIs superiores

diapositiva_1.mejor_dia
    → card Mejor día

diapositiva_1.peor_dia
    → card Peor día

diapositiva_1.top_labores
    → ranking Top labores

diapositiva_1.top_causas_parada
    → ranking Top causas

diapositiva_1.rendimiento_equipos
    → enriquecer con tipo
    → agrupar
    → Rendimiento por tipo
```

## Diapositiva 2

```text
diapositiva_2.actividad_diaria
    → barras diario efectivo/parado

diapositiva_2.mejores_equipos
    → ranking mejores

diapositiva_2.peores_equipos
    → ranking peores

diapositiva_2.top_operadores
    → ranking operadores
```
