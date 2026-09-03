# Especificación UI — Reporte ERP de equipos

> Documento orientado exclusivamente a la estructura visual, división de responsabilidades y migración de la vista a **Vue 3 + Tailwind CSS + TypeScript**.  
> La vista conserva el patrón ERP de **3 columnas**: listado de equipos a la izquierda, contenido analítico al centro y detalle técnico del equipo a la derecha.

---

# 1. Objetivo de la vista

La pantalla debe permitir analizar un equipo seleccionado desde tres perspectivas:

- **Resumen**
- **Paradas**
- **Operadores**

El equipo continúa siendo el contexto principal de toda la pantalla.

```text
Equipo seleccionado
      │
      ├── Resumen
      ├── Paradas
      └── Operadores
```

La selección del equipo debe actualizar:

- métricas;
- tablas;
- paradas;
- operadores;
- implementos;
- historial;
- perfil técnico;
- uso de motor.

---

# 2. Estructura global de la UI

```text
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR                                                       │
├──────────────────────────────────────────────────────────────┤
│ TOOLBAR / FILTROS / TABS                                     │
├──────────────┬──────────────────────────────┬────────────────┤
│              │                              │                │
│ LISTA DE     │ CONTENIDO PRINCIPAL          │ DETALLES       │
│ EQUIPOS      │                              │ DEL EQUIPO     │
│              │ Resumen / Paradas /          │                │
│              │ Operadores                    │ Perfil         │
│              │                              │ Motor          │
│              │                              │                │
└──────────────┴──────────────────────────────┴────────────────┘
```

---

# 3. ID raíz de la vista

```html
<div id="equipment-report-view">
```

### Tailwind

```text
h-dvh
min-h-0
overflow-hidden
flex
flex-col
bg-second
text-gray-900
font-body
text-sm
```

### Vue

Este es el contenedor raíz de la vista.

No debe contener lógica de negocio específica, solo:

- layout;
- estado de navegación;
- selección de equipo;
- coordinación entre las columnas.

### TypeScript

```ts
type ReportTab = 'resumen' | 'paradas' | 'operadores'

const activeTab = ref<ReportTab>('resumen')
const selectedEquipmentCode = ref<string | null>(null)
```

---

# 4. Cabecera global

## ID

```html
<header id="equipment-report-topbar">
```

### Responsabilidad UI

Mostrar:

- botón de navegación;
- breadcrumb;
- nombre del módulo;
- contexto actual;
- usuario autenticado.

### Tailwind

```text
h-12
shrink-0
flex
items-center
justify-between
px-5
bg-white
border-b
border-gray-200
```

---

## 4.1 Breadcrumb

### ID

```html
<nav id="equipment-report-breadcrumb">
```

### Tailwind

```text
flex
items-center
gap-2
text-xs
font-semibold
text-gray-500
min-w-0
```

---

## 4.2 Información del usuario

### ID

```html
<div id="equipment-report-user-context">
```

### Tailwind

```text
flex
items-center
gap-2
text-xs
```

---

## 4.3 Avatar

### ID

```html
<div id="equipment-report-user-avatar">
```

### Tailwind

```text
size-8
rounded-full
grid
place-items-center
bg-accent
font-bold
text-xs
```

---

# 5. Barra de filtros y navegación

## ID

```html
<section id="equipment-report-toolbar">
```

### Responsabilidad UI

Contiene:

- rango de fechas;
- agrupación;
- tabs;
- filtros;
- limpiar filtros.

### Tailwind

```text
shrink-0
flex
items-end
justify-between
gap-3
px-5
py-2
```

---

## 5.1 Filtros principales

### ID

```html
<div id="equipment-report-filters">
```

### Datos

```ts
interface ReportFilters {
  startDate: string
  endDate: string
  groupBy: 'equipos'
}
```

### Tailwind

```text
flex
items-end
gap-2
```

---

## 5.2 Rango de fechas

### ID

```html
<div id="equipment-report-date-filter">
```

### Tailwind

```text
flex
flex-col
gap-1
```

Control:

```text
h-8
min-w-44
px-2
rounded-md
border
border-gray-200
bg-white
text-xs
shadow-sm
```

---

## 5.3 Agrupar por

### ID

```html
<div id="equipment-report-group-filter">
```

Actualmente:

```text
Equipos
```

La vista se interpreta siempre desde el equipo seleccionado.

---

# 6. Tabs principales

## ID

```html
<nav id="equipment-report-tabs">
```

Tabs:

```text
Resumen
Paradas
Operadores
```

### Tailwind

```text
h-8
flex
overflow-hidden
rounded-md
border
border-gray-200
bg-white
```

### Vue

```vue
<button
  v-for="tab in tabs"
  :key="tab.key"
  :id="`equipment-report-tab-${tab.key}`"
  @click="activeTab = tab.key"
>
```

### Estado activo

```text
bg-main
text-white
```

### Estado inactivo

```text
bg-white
text-gray-600
```

---

# 7. Workspace principal

## ID

```html
<main id="equipment-report-workspace">
```

### Distribución

```text
250 px
│
├── listado
│
minmax(0, 1fr)
│
├── centro
│
300 px
│
└── detalle
```

### Tailwind

```text
flex-1
min-h-0
grid
grid-cols-[250px_minmax(0,1fr)_300px]
gap-3
px-5
pb-4
overflow-hidden
items-stretch
```

## Regla importante

El workspace **no debe hacer scroll**.

```text
overflow-hidden
```

Los scrolls deben existir únicamente en elementos internos.

---

# 8. Columna izquierda — Listado de equipos

## ID

```html
<aside id="equipment-sidebar">
```

### Tailwind

```text
h-full
min-h-0
flex
flex-col
overflow-hidden
rounded-lg
border
border-gray-200
bg-white
shadow-sm
```

---

## 8.1 Cabecera del listado

### ID

```html
<header id="equipment-sidebar-header">
```

Contenido:

```text
Equipos
```

---

## 8.2 Buscador

### ID

```html
<div id="equipment-sidebar-search">
```

### Tailwind

```text
h-8
flex
items-center
px-2
rounded-md
border
border-gray-200
bg-white
```

### Vue

```ts
const equipmentSearch = ref('')
```

---

## 8.3 Lista de equipos

### ID

```html
<div id="equipment-sidebar-list">
```

### Scroll

```text
flex-1
min-h-0
overflow-y-auto
px-2
pb-2
```

Cada fila debe mostrar:

- código;
- tipo;
- tiempo registrado;
- jornadas.

No mostrar implementos en esta lista.

---

## 8.4 Fila de equipo

### ID dinámico

```vue
<button
  :id="`equipment-row-${equipment.code}`"
>
```

Ejemplo:

```html
id="equipment-row-484091"
```

### Tailwind

```text
w-full
min-h-[50px]
grid
grid-cols-[minmax(0,1fr)_auto]
gap-2
items-center
px-2
py-1.5
rounded-md
border
border-gray-200
bg-white
text-left
```

### Seleccionado

```text
bg-success-bg
border-main/40
shadow-[inset_3px_0_0_var(--color-main)]
```

### TypeScript

```ts
interface EquipmentListRow {
  code: string
  type: string | null
  totalTime: string
  journeys: number
}
```

---

# 9. Columna central

## ID

```html
<section id="equipment-report-center">
```

### Tailwind

```text
h-full
min-h-0
overflow-hidden
```

Contiene exclusivamente la vista activa.

---

# 10. Vista Resumen

## ID

```html
<section id="equipment-summary-view">
```

### Vue

```vue
<section
  id="equipment-summary-view"
  v-if="activeTab === 'resumen'"
>
```

### Tailwind

```text
h-full
min-h-0
grid
grid-rows-[auto_auto_minmax(0,1fr)]
gap-2
overflow-hidden
```

---

# 11. Card principal del equipo

## ID

```html
<article id="equipment-summary-main-card">
```

### Contenido

- imagen;
- código;
- tipo;
- estado;
- jornadas;
- horas registradas;
- horas efectivas;
- efectividad.

### Tailwind

```text
grid
grid-cols-[minmax(280px,1.55fr)_repeat(3,minmax(120px,.75fr))]
gap-2
items-stretch
p-2
```

---

## 11.1 Identidad del equipo

### ID

```html
<div id="equipment-summary-identity">
```

### Tailwind

```text
min-w-0
grid
grid-cols-[76px_minmax(0,1fr)]
gap-3
items-center
```

---

## 11.2 Imagen del equipo

### ID

```html
<div id="equipment-summary-image">
```

La imagen solo debe mostrarse aquí.

No debe mostrarse:

- en el listado;
- en Perfil del equipo;
- en otras cards.

### Tailwind

```text
w-[76px]
h-[58px]
rounded-md
border
border-gray-200
bg-gray-50
overflow-hidden
```

Imagen:

```text
w-full
h-full
object-contain
```

---

# 12. Cards métricas del resumen

## 12.1 Horas registradas

### ID

```html
<article id="summary-total-time-card">
```

---

## 12.2 Horas efectivas

### ID

```html
<article id="summary-effective-time-card">
```

---

## 12.3 Efectividad

### ID

```html
<article id="summary-effectiveness-card">
```

### Tailwind común

```text
self-center
min-h-[70px]
flex
flex-col
justify-center
px-2
py-2
rounded-md
border
border-gray-200
```

## Regla

El contenido debe estar centrado verticalmente.

---

# 13. Grid analítico del Resumen

## ID

```html
<section id="equipment-summary-analytics">
```

### Tailwind

```text
grid
grid-cols-3
gap-2
items-stretch
```

---

## 13.1 Distribución por clasificación

### ID

```html
<article id="summary-classification-card">
```

Datos:

- EFECTIVO;
- OPERATIVO;
- TALLER;
- IMPONDERABLE.

---

## 13.2 Principales paradas

### ID

```html
<article id="summary-main-stops-card">
```

Datos:

- motivo;
- tiempo;
- porcentaje.

---

## 13.3 Uso por operador

### ID

```html
<article id="summary-operator-usage-card">
```

Datos:

- operador;
- tiempo;
- porcentaje.

---

# 14. Fila inferior del Resumen

## ID

```html
<section id="equipment-summary-bottom-row">
```

### Tailwind

```text
min-h-0
grid
grid-cols-[0.42fr_0.58fr]
gap-2
overflow-hidden
```

---

# 15. Implementos usados por equipo

## ID

```html
<article id="summary-equipment-implements-card">
```

Columnas:

```text
Implemento
Descripción
Jornadas
Tiempo
% uso
```

### TypeScript

```ts
interface EquipmentImplementRow {
  implementCode: string
  implementLabel: string
  journeys: number
  time: string
  percentage: number
}
```

---

# 16. Historial reciente

## ID

```html
<article id="summary-history-card">
```

### Scroll interno

```html
<div id="summary-history-scroll">
```

### Tailwind

```text
flex-1
min-h-0
overflow-y-auto
rounded-md
border
border-gray-100
```

### Columnas

```text
Inicio
Fin
Labor / Motivo
Tiempo
```

## Regla

`Labor / Motivo`:

```text
whitespace-normal
break-words
leading-tight
```

Máximo visible inicialmente:

```text
10 registros
```

---

# 17. Vista Paradas

## ID

```html
<section id="equipment-stops-view">
```

### Vue

```vue
<section
  id="equipment-stops-view"
  v-else-if="activeTab === 'paradas'"
>
```

### Tailwind

```text
h-full
min-h-0
grid
grid-rows-[auto_auto_auto_minmax(0,1fr)]
gap-2
overflow-hidden
```

---

# 18. KPIs de Paradas

## ID contenedor

```html
<section id="stops-kpi-grid">
```

### Tailwind

```text
grid
grid-cols-4
gap-2
```

---

## 18.1 Tiempo parado

```html
<article id="stops-total-time-card">
```

---

## 18.2 Porcentaje parado

```html
<article id="stops-percentage-card">
```

---

## 18.3 Número de paradas

```html
<article id="stops-count-card">
```

---

## 18.4 Duración promedio

```html
<article id="stops-average-duration-card">
```

---

# 19. Desglose de Paradas

## ID

```html
<section id="stops-breakdown-grid">
```

### Tailwind

```text
grid
grid-cols-2
gap-2
items-stretch
```

---

# 20. Paradas por clasificación

## ID

```html
<article id="stops-classification-card">
```

Columnas:

```text
Clasificación
Tiempo
N.º
% parada
```

---

# 21. Paradas por origen

## ID

```html
<article id="stops-origin-card">
```

Orígenes:

```text
Equipo
Implemento
Otro
```

Columnas:

```text
Origen
Tiempo
N.º
% parada
```

---

# 22. Principales motivos de parada

## ID

```html
<article id="stops-main-reasons-card">
```

Columnas:

```text
Motivo
Ocurrencias
Tiempo
% parada
```

---

# 23. Detalle de Paradas

## ID

```html
<article id="stops-detail-card">
```

### Scroll

```html
<div id="stops-detail-scroll">
```

### Tailwind

```text
flex-1
min-h-0
overflow-y-auto
rounded-md
border
border-gray-100
```

### Columnas

```text
Inicio
Fin
Duración
Motivo
Origen
Clasificación
Motor
Implemento
```

### TypeScript

```ts
interface StopDetailRow {
  id: string
  startAt: string
  endAt: string
  duration: string
  reason: string
  origin: 'equipo' | 'implemento' | 'otro'
  classification: string
  engineOn: boolean
  implementLabel: string | null
}
```

---

# 24. Vista Operadores

## ID

```html
<section id="equipment-operators-view">
```

### Vue

```vue
<section
  id="equipment-operators-view"
  v-else-if="activeTab === 'operadores'"
>
```

### Tailwind

```text
h-full
min-h-0
grid
grid-rows-[auto_auto_auto_minmax(0,1fr)]
gap-2
overflow-hidden
```

---

# 25. KPIs de Operadores

## ID contenedor

```html
<section id="operators-kpi-grid">
```

### Tailwind

```text
grid
grid-cols-4
gap-2
```

---

## 25.1 Operadores únicos

```html
<article id="operators-unique-count-card">
```

---

## 25.2 Tiempo registrado

```html
<article id="operators-total-time-card">
```

---

## 25.3 Jornadas del equipo

```html
<article id="operators-journeys-card">
```

---

## 25.4 Mayor participación

```html
<article id="operators-top-participation-card">
```

---

# 26. Uso del equipo por operador

## ID

```html
<article id="operators-usage-table-card">
```

### Responsabilidad

Es la tabla principal de la pestaña.

Debe permitir seleccionar un operador.

### Columnas

```text
Operador
Jornadas
Total
Trabajando
Parado
% uso
```

### Vue

```vue
<tr
  v-for="operator in operatorUsage"
  :key="operator.operatorId"
  :id="`operator-row-${operator.operatorId}`"
  @click="selectedOperatorId = operator.operatorId"
>
```

### TypeScript

```ts
interface OperatorUsageRow {
  operatorId: string
  operatorLabel: string
  journeys: number | null
  totalTime: string
  workingTime: string | null
  stoppedTime: string | null
  participation: number
}
```

---

# 27. Grid analítico del operador seleccionado

## ID

```html
<section id="operators-analysis-grid">
```

### Tailwind

```text
grid
grid-cols-3
gap-2
items-stretch
```

El contenido debe depender de:

```text
selectedEquipmentCode
+
selectedOperatorId
+
dateRange
```

---

# 28. Distribución del tiempo del operador

## ID

```html
<article id="operator-time-distribution-card">
```

Datos:

```text
Trabajando
Parado
```

o, si el backend entrega clasificación:

```text
EFECTIVO
OPERATIVO
TALLER
IMPONDERABLE
```

---

# 29. Principales paradas del operador

## ID

```html
<article id="operator-main-stops-card">
```

Columnas:

```text
Motivo
Tiempo
% detenido
```

---

# 30. Uso de motor del operador

## ID

```html
<article id="operator-engine-usage-card">
```

Datos:

```text
Encendido
Apagado
```

## Fuente

Cuando trabaja:

```text
labor.motor_encendido
```

Cuando está parado:

```text
tipo_parada.motor_encendido
```

No inferir:

```text
trabajando = motor encendido
parado = motor apagado
```

porque conceptualmente no son equivalentes.

---

# 31. Fila inferior de Operadores

## ID

```html
<section id="operators-bottom-row">
```

### Tailwind

```text
min-h-0
grid
grid-cols-[0.38fr_0.62fr]
gap-2
overflow-hidden
```

---

# 32. Implementos usados por operador

## ID

```html
<article id="operator-implements-card">
```

Columnas:

```text
Implemento
Tipo / Nombre
Jornadas
Tiempo
```

### Filtro

```text
equipo seleccionado
+
operador seleccionado
+
rango de fechas
```

### TypeScript

```ts
interface OperatorImplementRow {
  implementCode: string
  implementLabel: string
  journeys: number
  time: string
}
```

---

# 33. Historial del operador

## ID

```html
<article id="operator-history-card">
```

### Scroll

```html
<div id="operator-history-scroll">
```

### Columnas

```text
Inicio
Fin
Labor / Motivo
Tiempo
```

### Regla

Máximo inicial:

```text
10 últimos
```

### Tailwind

```text
flex-1
min-h-0
overflow-y-auto
```

`Labor / Motivo`:

```text
whitespace-normal
break-words
leading-tight
```

---

# 34. Columna derecha — Detalle técnico

## ID

```html
<aside id="equipment-detail-sidebar">
```

### Tailwind

```text
h-full
min-h-0
overflow-y-auto
flex
flex-col
gap-2
```

Esta columna debe permanecer visible independientemente de si el usuario está en:

- Resumen;
- Paradas;
- Operadores.

---

# 35. Perfil del equipo

## ID

```html
<article id="equipment-profile-card">
```

### Debe mostrar

```text
Tipo
Modelo
Marca
Código
Total jornadas
Primera actividad
Última actividad
```

## No debe mostrar

```text
Implementos usados
Imagen
```

Los implementos ya tienen cards propias.

---

# 36. Tabla de Uso de motor

## ID

```html
<article id="equipment-engine-usage-card">
```

### Tabla

```html
<table id="equipment-engine-usage-table">
```

Columnas:

```text
Estado
Tiempo
%
Períodos
```

Filas:

```text
Encendido
Apagado
```

### TypeScript

```ts
interface EngineUsageRow {
  engineOn: boolean
  time: string
  percentage: number
  periods: number
}
```

---

# 37. Convención de IDs

Todos los IDs deben ser:

- únicos;
- semánticos;
- estables;
- independientes de estilos;
- escritos en `kebab-case`.

## Prefijos

```text
equipment-report-*     → estructura global
equipment-sidebar-*    → columna izquierda
equipment-summary-*    → Resumen
summary-*              → cards de Resumen
stops-*                → Paradas
operators-*            → estructura general de Operadores
operator-*             → operador seleccionado
equipment-detail-*     → columna derecha
equipment-profile-*    → perfil
equipment-engine-*     → motor
```

---

# 38. IDs dinámicos

Usar IDs dinámicos solo para elementos repetidos.

## Equipos

```vue
:id="`equipment-row-${equipment.code}`"
```

Ejemplo:

```text
equipment-row-484091
```

---

## Operadores

Preferir un identificador estable que no contenga caracteres conflictivos.

```vue
:id="`operator-row-${operator.operatorId}`"
```

No usar el email para construir el ID si existe un UUID.

---

## Implementos

```vue
:id="`implement-row-${implement.implementCode}`"
```

---

# 39. Estado Vue recomendado

```ts
const activeTab = ref<ReportTab>('resumen')

const selectedEquipmentCode = ref<string | null>(null)

const selectedOperatorId = ref<string | null>(null)

const filters = reactive<ReportFilters>({
  startDate: '',
  endDate: '',
  groupBy: 'equipos'
})
```

---

# 40. Relación entre estados

```text
selectedEquipmentCode
        │
        ├── Resumen
        │
        ├── Paradas
        │
        └── Operadores
                │
                └── selectedOperatorId
```

Cuando cambia el equipo:

```ts
watch(selectedEquipmentCode, () => {
  selectedOperatorId.value = null
})
```

---

# 41. Tipos TypeScript generales

```ts
type HhMm = string

type ReportTab =
  | 'resumen'
  | 'paradas'
  | 'operadores'

interface EquipmentListRow {
  code: string
  type: string | null
  totalTime: HhMm
  journeys: number
}

interface EquipmentProfile {
  code: string
  type: string | null
  model: string | null
  brand: string | null
  journeys: number
  firstActivity: string | null
  lastActivity: string | null
}

interface TimeMetric {
  time: HhMm
  percentage?: number
}
```

---

# 42. Formato de tiempo

Todos los datos que representen duración deben entregarse a la UI como:

```text
HH:MM
```

Ejemplos:

```text
00:03
01:24
03:00
14:39
21:40
```

No mostrar:

```text
3.00 h
14.65 h
1.4 h
```

---

# 43. Scroll

## No debe tener scroll

```text
#equipment-report-view
#equipment-report-workspace
#equipment-report-center
```

## Sí debe tener scroll interno

```text
#equipment-sidebar-list
#summary-history-scroll
#stops-detail-scroll
#operator-history-scroll
#equipment-detail-sidebar
```

### Tailwind

```text
min-h-0
overflow-y-auto
```

---

# 44. Alturas

Las tres columnas principales deben usar toda la altura disponible.

```text
workspace
│
├── sidebar      h-full
├── center       h-full
└── detail       h-full
```

### Tailwind

```text
h-full
min-h-0
items-stretch
```

No utilizar alturas basadas en contenido para las columnas principales.

---

# 45. Responsive

## Desktop

```text
grid-cols-[250px_minmax(0,1fr)_300px]
```

Es la estructura principal del ERP.

---

## Tablet / ancho reducido

Puede pasar a:

```text
grid-cols-1
```

pero únicamente cuando el viewport sea realmente estrecho.

---

## Grids internos

### KPIs

Desktop:

```text
grid-cols-4
```

Tablet:

```text
grid-cols-2
```

Mobile:

```text
grid-cols-1
```

---

## Analíticas

Desktop:

```text
grid-cols-3
```

Tablet/mobile:

```text
grid-cols-1
```

---

# 46. Densidad visual ERP

## Texto base

```text
text-sm
```

## Tablas, labels y datos auxiliares

```text
text-xs
```

o cuando sea necesario:

```text
text-[10px]
```

## Títulos de card

```text
text-xs
font-bold
text-main
```

## Métricas

```text
text-base
font-bold
text-main
```

Evitar títulos demasiado grandes.

---

# 47. Reglas visuales comunes para cards

Todas las cards deben partir de:

```text
rounded-lg
border
border-gray-200
bg-white
shadow-sm
min-h-0
```

Cuando forman parte de un grid con alturas iguales:

```text
h-full
```

---

# 48. Tabla base reusable

Visualmente todas las tablas deben seguir la misma densidad:

```text
w-full
table-fixed
border-collapse
text-xs
```

Headers:

```text
text-gray-500
font-semibold
```

Filas:

```text
border-b
border-gray-100
```

---

# 49. Separación conceptual para Vue

No es necesario que cada card sea obligatoriamente un componente.

La división debe depender de responsabilidad.

## Bloques con estado propio

Conviene separar:

```text
Listado de equipos
Tabs
Vista Resumen
Vista Paradas
Vista Operadores
Perfil del equipo
Uso de motor
```

## Cards puramente visuales

Pueden mantenerse dentro de la vista si:

- no tienen estado;
- solo reciben datos;
- no se reutilizan.

---

# 50. Jerarquía final de IDs

```text
equipment-report-view
│
├── equipment-report-topbar
│   ├── equipment-report-breadcrumb
│   ├── equipment-report-user-context
│   └── equipment-report-user-avatar
│
├── equipment-report-toolbar
│   ├── equipment-report-filters
│   │   ├── equipment-report-date-filter
│   │   └── equipment-report-group-filter
│   └── equipment-report-tabs
│
└── equipment-report-workspace
    │
    ├── equipment-sidebar
    │   ├── equipment-sidebar-header
    │   ├── equipment-sidebar-search
    │   └── equipment-sidebar-list
    │
    ├── equipment-report-center
    │   │
    │   ├── equipment-summary-view
    │   │   ├── equipment-summary-main-card
    │   │   │   ├── equipment-summary-identity
    │   │   │   ├── equipment-summary-image
    │   │   │   ├── summary-total-time-card
    │   │   │   ├── summary-effective-time-card
    │   │   │   └── summary-effectiveness-card
    │   │   │
    │   │   ├── equipment-summary-analytics
    │   │   │   ├── summary-classification-card
    │   │   │   ├── summary-main-stops-card
    │   │   │   └── summary-operator-usage-card
    │   │   │
    │   │   └── equipment-summary-bottom-row
    │   │       ├── summary-equipment-implements-card
    │   │       └── summary-history-card
    │   │
    │   ├── equipment-stops-view
    │   │   ├── stops-kpi-grid
    │   │   │   ├── stops-total-time-card
    │   │   │   ├── stops-percentage-card
    │   │   │   ├── stops-count-card
    │   │   │   └── stops-average-duration-card
    │   │   │
    │   │   ├── stops-breakdown-grid
    │   │   │   ├── stops-classification-card
    │   │   │   └── stops-origin-card
    │   │   │
    │   │   ├── stops-main-reasons-card
    │   │   └── stops-detail-card
    │   │
    │   └── equipment-operators-view
    │       ├── operators-kpi-grid
    │       │   ├── operators-unique-count-card
    │       │   ├── operators-total-time-card
    │       │   ├── operators-journeys-card
    │       │   └── operators-top-participation-card
    │       │
    │       ├── operators-usage-table-card
    │       │
    │       ├── operators-analysis-grid
    │       │   ├── operator-time-distribution-card
    │       │   ├── operator-main-stops-card
    │       │   └── operator-engine-usage-card
    │       │
    │       └── operators-bottom-row
    │           ├── operator-implements-card
    │           └── operator-history-card
    │
    └── equipment-detail-sidebar
        ├── equipment-profile-card
        └── equipment-engine-usage-card
```

---

# 51. Regla de actualización de datos

La relación visual debe ser siempre:

```text
Filtro de fecha
      +
Equipo seleccionado
      +
Tab activa
      +
Operador seleccionado (solo si aplica)
      ↓
Datos visibles
```

Nunca deben quedar datos de un equipo anterior al cambiar `selectedEquipmentCode`.

---

# 52. Regla para estados de carga

Cada bloque de datos debería contemplar:

```text
loading
empty
error
ready
```

Ejemplo TypeScript:

```ts
type LoadState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error'
```

Visualmente:

- `loading`: skeleton compacto;
- `empty`: texto corto dentro de la card;
- `error`: mensaje pequeño usando `danger`;
- `ready`: tabla/card normal.

---

# 53. Regla para datos faltantes

No inventar datos.

Mostrar:

```text
—
```

cuando no exista valor para:

- modelo;
- marca;
- jornadas por operador;
- tiempo trabajado por operador;
- tiempo parado por operador;
- implemento.

TypeScript:

```ts
value: string | null
```

Template Vue:

```vue
{{ value ?? '—' }}
```

---

# 54. Paleta

Usar exclusivamente los tokens existentes del proyecto.

Principales:

```text
main
second
accent
success
warning
danger
info
gray-50 ... gray-900
```

No definir colores aislados dentro de componentes cuando ya existe un token equivalente.

---

# 55. Resultado visual esperado

La interfaz final debe conservar una apariencia ERP:

- compacta;
- alta densidad de información;
- jerarquía clara;
- sin scroll global;
- columnas de igual altura;
- tablas compactas;
- cards alineadas;
- datos de tiempo en `HH:MM`;
- equipo como contexto principal;
- tabs como cambio de análisis;
- detalle técnico siempre visible en escritorio.
