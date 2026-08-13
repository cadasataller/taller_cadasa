# Contexto funcional y visual — Creación de equipos en Engrase

## 1. Objetivo

Implementar una **pantalla de creación de equipos para un ERP** usando un flujo guiado por pasos, manteniendo el mismo lenguaje visual y patrones de interacción que ya utiliza la vista de edición de equipos.

La creación no debe usar pestañas. Debe utilizar un **wizard de 5 pasos**:

1. **Datos del equipo**
2. **Filtros**
3. **Aceites**
4. **Revisar**
5. **Imagen**

Los pasos 1, 2 y 3 trabajan sobre un **borrador local en el frontend**.  
El equipo se persiste únicamente en el paso 4 al presionar **Crear equipo**.  
El paso 5 ocurre **después de que el equipo ya existe en la base de datos** y permite agregar una imagen principal de forma opcional.

---

# 2. Principios generales del flujo

## 2.1. Borrador local

Antes de crear el equipo no se deben hacer inserciones parciales de:

- equipo;
- etapas;
- filtros;
- tipos de filtro nuevos;
- códigos de filtro nuevos;
- aceites;
- sistemas de aceite;
- tipos de equipo nuevos.

Todo debe mantenerse localmente hasta el paso **Revisar**.

La única llamada de escritura de los pasos 1–4 debe ser:

`engrase.rpc_crear_equipo_completo`

Esta RPC crea todo dentro de una sola transacción.

---

## 2.2. Imagen separada

La imagen:

- no forma parte de `rpc_crear_equipo_completo`;
- se gestiona únicamente después de crear el equipo;
- es opcional;
- puede omitirse;
- se sube físicamente a Supabase Storage;
- después se registra mediante `engrase.rpc_administrar_imagen_equipo`.

La imagen se aplica inmediatamente y no necesita un segundo guardado general.

---

## 2.3. Actualización del store

Después de crear el equipo:

`rpc_crear_equipo_completo`

devuelve:

`equipo_lista`

Ese objeto debe insertarse directamente en el store local de equipos.

No se debe volver a consultar toda la lista.

Después de agregar la imagen:

`rpc_administrar_imagen_equipo`

devuelve:

- `main_storage_path`;
- `tiene_imagen_main`;
- `imagen_actualizada_en`.

Estos campos deben aplicarse directamente al mismo registro recién agregado al store.

---

# 3. Flujo funcional completo

```text
Abrir "Crear equipo"
        |
        v
PASO 1 — Datos del equipo
        |
        +--> validar código en Engrase
        |
        v
PASO 2 — Filtros
        |
        +--> mínimo 1 filtro
        |
        v
PASO 3 — Aceites
        |
        +--> opcional
        |
        v
PASO 4 — Revisar
        |
        +--> Crear equipo
        |
        +--> rpc_crear_equipo_completo
        |
        +--> transacción exitosa
        |
        +--> insertar respuesta.equipo_lista en store
        |
        v
PASO 5 — Imagen
        |
        +--> opcional
        |
        +--> convertir a WebP
        +--> subir a Storage
        +--> rpc_administrar_imagen_equipo
        +--> actualizar imagen en store
        |
        v
FINALIZAR
```

---

# 4. Estructura visual general

La UI debe mantener el mismo estilo visual de la pantalla actual de edición.

## 4.1. Identidad visual

Características principales:

- fondo general beige claro cálido;
- tarjetas blancas;
- bordes gris/beige suaves;
- esquinas redondeadas;
- sombra muy ligera;
- verde petróleo / teal oscuro como color principal;
- verde claro para estados exitosos;
- chips beige para información secundaria;
- azul claro para mensajes informativos;
- rojo únicamente para acciones destructivas o errores;
- tipografía limpia, compacta y propia de un ERP;
- alta densidad de información sin verse saturada;
- jerarquía clara entre títulos, labels, datos y acciones.

### Tokens visuales aproximados

Los valores son de referencia visual, no una obligación exacta:

```text
Fondo principal:       #F4F1E9 / beige muy claro
Superficie / cards:    #FFFFFF
Teal principal:        #005C56 aprox.
Teal hover:            más oscuro que el principal
Borde neutro:          #D8D1C5 aprox.
Chip neutro:           #EEEAE2 aprox.
Éxito fondo:           verde muy claro
Éxito texto:           verde medio/oscuro
Info fondo:            azul muy claro
Info texto:            azul medio
Error / eliminar:      rojo
Texto principal:       gris muy oscuro
Texto secundario:      gris medio
```

No utilizar colores saturados fuera de estas funciones.

---

# 5. Shell de la pantalla

## 5.1. Header superior

Debe conservar la lógica visual de la edición actual.

Contenido:

```text
← Volver a la lista de equipos | Nuevo equipo | Creación                      ● Borrador
```

### Elementos

- icono `ArrowLeft`;
- acción: **Volver a la lista de equipos**;
- separador vertical;
- pill principal: **Nuevo equipo**;
- pill secundaria: **Creación**;
- estado a la derecha.

Antes de crear:

```text
● Borrador
```

Después de crear correctamente:

```text
✓ Creado
```

El header debe permanecer visualmente estable durante todo el wizard.

---

# 6. Stepper

Debajo del header debe existir un stepper horizontal:

```text
1. Datos del equipo ─── 2. Filtros ─── 3. Aceites ─── 4. Revisar ─── 5. Imagen
```

## Estados

### Paso futuro

- círculo blanco;
- borde neutro;
- número gris;
- texto gris.

### Paso activo

- círculo teal oscuro;
- número blanco;
- título teal;
- línea inferior teal.

### Paso completado

- círculo teal;
- icono `Check`;
- texto teal;
- conector hacia el siguiente paso activo/completado.

---

# 7. Footer de navegación

Debe existir una barra inferior visualmente separada del contenido.

Preferentemente **sticky** en escritorio y móvil.

## Pasos 1–3

Botones:

```text
[ Atrás ] [ Siguiente ]
```

En el paso 1:

```text
[ Cancelar ] [ Siguiente ]
```

## Paso 4

```text
[ Atrás ] [ Crear equipo → ]
```

## Paso 5

Como el equipo ya fue persistido:

```text
[ Omitir por ahora ] [ Finalizar → ]
```

No debe mostrarse un botón **Atrás** normal en el paso 5 que haga pensar que la creación todavía puede cancelarse.

---

# 8. Paso 1 — Datos del equipo

## Objetivo

Capturar la identidad y clasificación principal del equipo.

## Campos

- Código.
- Tipo de equipo.
- Modelo / subtipo.
- Etapas.
- Estado.

No mostrar la imagen en este paso.

---

## 8.1. Layout escritorio

Tarjeta principal:

```text
┌───────────────────────────────────────────────────────────────┐
│ DATOS DEL EQUIPO                                              │
│                                                               │
│ Código *                     Tipo de equipo *                  │
│ [410003          disponible] [Buses                     ▼]    │
│                                                               │
│ Modelo / subtipo *           Etapas *                         │
│ [Bus Blue Bird             ] [ZAFRA ×] [CULTIVO ×]      ▼    │
│                                                               │
│ Estado *                                                      │
│ [          Activo          ][         Descartado          ]   │
│                                                               │
│ ℹ La imagen se agregará en el paso 5 después de crear.        │
└───────────────────────────────────────────────────────────────┘
```

Opcionalmente, en escritorio puede existir una pequeña tarjeta lateral:

```text
Validación de código

✓ El código está disponible para Engrase.
```

---

## 8.2. Código

El código se valida mediante:

`engrase.rpc_validar_codigo_equipo_para_creacion`

### Envío

```json
{
  "p_codigo": "410003"
}
```

### Si puede crearse

Respuesta:

```json
{
  "puede_crearse": true
}
```

UI:

- borde normal o verde sutil;
- check verde;
- texto:
  **Código disponible**
  o
  **El código está disponible para Engrase**.

No mostrar datos adicionales.

---

### Si no puede crearse

Respuesta:

```json
{
  "puede_crearse": false,
  "modelo": "Bus",
  "activo": true
}
```

Esto significa que el código **ya existe en `engrase.equipo`**.

La UI debe:

- marcar el campo como inválido;
- bloquear el botón `Siguiente`;
- mostrar el modelo retornado;
- mostrar si está activo.

Ejemplo:

```text
Este código ya existe en Engrase.

Modelo: Bus
Estado: Activo
```

No bloquear porque exista únicamente en `public.equipos`.

---

## 8.3. Cuándo validar

Recomendado:

- debounce mientras se escribe;
- o validar al hacer blur;
- volver a validar antes de abandonar el paso 1.

Mientras valida:

```text
Validando código...
```

No habilitar `Siguiente` hasta tener un resultado válido.

---

## 8.4. Tipo de equipo

Dropdown con tipos existentes.

Debe permitir también el flujo para crear un tipo nuevo si la funcionalidad actual ya lo permite.

Un tipo nuevo queda en memoria y se envía como:

```json
{
  "estado": "nuevo",
  "id": null,
  "temp_id": "tmp_tipo_equipo_1",
  "nombre": "Nuevo tipo"
}
```

No guardar inmediatamente.

---

## 8.5. Modelo / subtipo

Input de texto.

Debe ocupar el valor de:

`engrase.equipo.subtipo`

Obligatorio.

---

## 8.6. Etapas

Multi-select.

El usuario solo puede seleccionar etapas disponibles en:

`engrase.etapa`

No se permite crear etapas desde este formulario.

Debe existir al menos una.

Visualmente usar chips:

```text
[ ZAFRA × ] [ CULTIVO × ]
```

---

## 8.7. Estado

Segmented control de dos opciones:

```text
[ Activo ] [ Descartado ]
```

Activo seleccionado:

- fondo verde muy claro;
- borde verde;
- texto verde.

Descartado seleccionado:

- usar el mismo patrón de selección;
- no convertirlo en una acción destructiva roja.

---

## 8.8. Validación para pasar al paso 2

Requiere:

- código no vacío;
- código con `puede_crearse = true`;
- tipo de equipo;
- subtipo;
- mínimo una etapa;
- estado válido.

---

# 9. Paso 2 — Filtros

## Objetivo

Configurar los filtros iniciales del equipo.

Debe existir **mínimo un filtro**.

---

## 9.1. Tarjeta principal

Título:

**FILTROS DEL EQUIPO**

Texto secundario:

**Debe existir al menos un filtro.**

Botón superior derecho:

`+ Agregar filtro`

---

## 9.2. Lista

Cada filtro debe aparecer en una fila compacta.

Ejemplo:

```text
[icono] Filtro de aceite 1        Cantidad: x1   En lista de compras    [✎] [🗑]
        B7030
```

Campos visibles:

- icono según tipo;
- nombre del tipo de filtro;
- código original;
- cantidad;
- estado en lista de compras;
- editar;
- eliminar.

No es necesario mostrar IDs.

---

## 9.3. Estilo de fila

- fondo blanco;
- separador inferior muy fino;
- icono dentro de cuadrado redondeado con fondo teal muy claro;
- nombre en teal oscuro / semibold;
- código más fuerte o monoespaciado;
- cantidad en chip beige;
- lista de compras en chip beige;
- editar con icono teal;
- eliminar con icono rojo dentro de botón outline.

---

# 10. Drawer — Agregar filtro

En escritorio:

**drawer lateral derecho**.

En móvil:

**bottom sheet**.

Debe reutilizar la lógica visual del drawer de edición.

---

## 10.1. Estado inicial

Header:

```text
Agregar filtro
Busque un filtro existente por código original.
                                                ×
```

Contenido:

```text
Código original
[ B7577                                  ] [ Buscar ]
```

---

## 10.2. RPC de búsqueda

Reutilizar:

`engrase.rpc_buscar_filtro_original_para_asignar`

Durante creación:

```json
{
  "p_codigo": "B7577",
  "p_codigo_equipo": null
}
```

Como todavía no existe el equipo, la prevención de duplicados se hace contra el **borrador local**.

---

## 10.3. Coincidencia exacta

Mostrar tarjeta:

```text
[icono] B7577                         EN LISTA DE COMPRAS
        Seleccione el tipo de filtro

Tipo de filtro
[Filtro de aceite 2                                  ▼]

Cantidad
[-] [1] [+]

[                 Agregar al equipo                 ]
```

---

## 10.4. Código con varios tipos

El dropdown debe mostrar los tipos disponibles.

Los tipos que ya están asignados en el borrador local deben aparecer:

- deshabilitados;
- con menor contraste;
- no seleccionables.

Se mantiene la restricción de un filtro por tipo para cada equipo.

---

## 10.5. Código sin coincidencia exacta

Debe mantenerse el patrón ya definido:

```text
No encontramos una coincidencia exacta para B7

Códigos sugeridos

B7030                  Ya agregado al equipo
B7577                  En lista de compras

[ Crear filtro nuevo ]
```

---

# 11. Drawer — Crear filtro nuevo

Se utiliza cuando el código no existe y puede crearse.

Header:

```text
← Volver | Crear filtro nuevo                         ×
```

Campos:

- Código original.
- Tipo de filtro.
- En lista de compras.
- Cantidad.

Ejemplo:

```text
Código original
[B7]

Tipo de filtro
[Filtro de aceite 2                                ▼]

[✓] En lista de compras       Cantidad
                              [-] [1] [+]

[                 Agregar al equipo                 ]
```

---

## 11.1. Tipos de filtro

Puede elegirse:

- tipo existente;
- tipo nuevo.

Si se elige un tipo existente, puede mostrarse una tarjeta informativa:

```text
Tipos de equipo que utilizan este filtro

Buses        Camiones
Combinadas   Trailers
```

Esta información es de apoyo; no debe bloquear el flujo.

---

## 11.2. Filtros en borrador

Agregar un filtro desde el drawer:

- no escribe en Supabase;
- agrega un objeto al estado local;
- cierra el drawer;
- actualiza la lista del paso 2.

Eliminarlo antes de crear:

- solo lo quita del estado local.

---

## 11.3. Validación para pasar al paso 3

Debe existir al menos:

```text
1 filtro
```

Si el usuario intenta borrar el último:

- bloquear;
- mostrar mensaje informativo:
  **Debe existir al menos un filtro.**

---

# 12. Paso 3 — Aceites

## Objetivo

Asociar aceites a sistemas del equipo.

Los aceites son **opcionales**.

---

## 12.1. Tarjeta principal

Título:

**ACEITES ASOCIADOS**

Texto secundario:

**Los aceites son opcionales.**

Botón:

`+ Agregar aceite`

Tabla/lista compacta:

```text
Sistema                         Aceite                          Acciones

⚙ HIDRAULICO                    ◇ 15W40                         [✎] [🗑]
⚙ MOTOR                         ◇ AW100                         [✎] [🗑]
```

---

## 12.2. Regla

Solo puede existir un aceite por sistema en un mismo equipo.

El frontend debe evitar seleccionar nuevamente un sistema que ya exista en el borrador.

---

# 13. Drawer — Agregar aceite

En escritorio:

drawer derecho.

En móvil:

bottom sheet.

Header:

```text
◇ Agregar aceite
  Asocia un aceite a un sistema del equipo.            ×
```

Campos:

```text
Sistema
⚙ [TRANSMISIÓN                                      ▼]

Aceite
◇ [AW100                                             ▼]

ℹ La asociación se aplicará al crear el equipo.

[                     Agregar                         ]
```

---

## 13.1. Sistemas y aceites

Se reutilizan los auxiliares cargados mediante:

`engrase.rpc_obtener_auxiliares_edicion_equipo`

El filtrado puede realizarse localmente.

Debe poder utilizar:

- sistema existente;
- sistema nuevo;
- aceite existente;
- aceite nuevo.

Los valores nuevos permanecen en el borrador.

---

## 13.2. Continuar sin aceites

El botón `Siguiente` debe estar habilitado aunque la lista esté vacía.

---

# 14. Paso 4 — Revisar y crear

## Objetivo

Mostrar una revisión clara antes de ejecutar la transacción.

No debe sentirse como otro formulario.

Debe ser una pantalla de **confirmación operativa** propia de un ERP.

---

## 14.1. Diseño

Título:

**REVISAR Y CREAR**

Texto:

**Verifique la información antes de crear el equipo.**

Se recomienda dividir la información en tres subcards:

```text
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│ 1. Datos del equipo│ │ 2. Filtros         │ │ 3. Aceites         │
│                    │ │                    │ │                    │
│ Código 410003      │ │ 4 configurados     │ │ 2 asociados        │
│ Tipo Buses         │ │                    │ │                    │
│ Modelo Bus...      │ │ Aire primario ... │ │ HIDRAULICO 15W40  │
│ Etapas ZAFRA ...   │ │ Aceite 1 ...      │ │ MOTOR AW100        │
│ Estado Activo      │ │ ...                │ │                    │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 14.2. Panel resumen

En escritorio puede mostrarse a la derecha:

```text
Resumen

Etapas     2
Filtros    4
Aceites    2
```

Usar iconos y contadores.

No convertirlo en un dashboard complejo.

---

## 14.3. Mensaje previo a creación

Mostrar:

```text
ℹ La imagen principal se agregará en el siguiente paso.
```

---

## 14.4. Botón Crear equipo

Botón principal:

`Crear equipo →`

Al presionar:

1. bloquear navegación;
2. mostrar estado loading;
3. llamar `rpc_crear_equipo_completo`;
4. no permitir doble submit.

Texto durante operación:

```text
Creando equipo...
```

---

# 15. RPC — Crear equipo completo

RPC:

`engrase.rpc_crear_equipo_completo`

## Payload de ejemplo

```json
{
  "p_datos": {
    "datos_equipo": {
      "codigo": "410003",
      "subtipo": "Bus Blue Bird",
      "estado": "activo",
      "tipo_equipo": {
        "estado": "existente",
        "id": 1,
        "nombre": "Buses"
      }
    },
    "etapas": {
      "agregadas": [
        {
          "estado_operacion": "nuevo",
          "etapa_id": 2
        }
      ]
    },
    "filtros": {
      "nuevos": [
        {
          "estado_operacion": "nuevo",
          "temp_id": "tmp_equipo_filtro_1",
          "tipo_filtro": {
            "estado": "existente",
            "id": 1,
            "nombre": "Filtro de aceite 1"
          },
          "filtro": {
            "estado": "existente",
            "id": 35,
            "codigo": "B7030",
            "esta_en_lista_compras": true
          },
          "cantidad": 1
        }
      ]
    },
    "aceites": {
      "nuevos": [
        {
          "estado_operacion": "nuevo",
          "temp_id": "tmp_equipo_aceite_1",
          "sistema": {
            "estado": "existente",
            "id": 1,
            "nombre": "HIDRAULICO"
          },
          "aceite": {
            "estado": "existente",
            "id": 1,
            "nombre": "15W40"
          }
        }
      ]
    }
  }
}
```

---

## 15.1. Respuesta

```json
{
  "ok": true,
  "codigo": "EQUIPO_CREADO",
  "mensaje": "El equipo 410003 se creó correctamente.",
  "equipo_lista": {
    "id": 125,
    "codigo": "410003",
    "tipo_equipo_id": 1,
    "tipo_equipo": "Buses",
    "subtipo": "Bus Blue Bird",
    "estado": "activo",
    "main_storage_path": null,
    "tiene_imagen_main": false,
    "imagen_actualizada_en": null,
    "etapas": [
      {
        "id": 2,
        "nombre": "Zafra"
      }
    ]
  },
  "resumen_operaciones": {
    "etapas_agregadas": 1,
    "filtros_agregados": 4,
    "aceites_agregados": 2
  }
}
```

---

## 15.2. Después del éxito

Inmediatamente:

```text
store.equipos.push(response.equipo_lista)
```

o equivalente según la implementación del store.

No hacer:

```text
rpc_obtener_equipos_lista()
```

solo para volver a obtener el equipo recién creado.

Después:

- cambiar estado superior de `Borrador` a `Creado`;
- marcar pasos 1–4 como completados;
- entrar automáticamente al paso 5.

---

# 16. Paso 5 — Imagen

## Estado conceptual

Este paso es diferente a los anteriores:

> El equipo ya existe.

Por eso debe mostrarse claramente un mensaje de éxito.

---

## 16.1. Banner

```text
✓ Equipo 410003 creado correctamente.
```

Fondo verde muy claro.

Borde verde suave.

---

## 16.2. Tarjeta

Título:

**IMAGEN PRINCIPAL DEL EQUIPO**

Layout escritorio:

```text
┌──────────────────────────────────────────────────────────────────┐
│ IMAGEN PRINCIPAL DEL EQUIPO                                      │
│                                                                  │
│ ┌─────────────────────────────┐  Selecciona una imagen            │
│ │                             │  Se convertirá a WebP...           │
│ │          icono imagen       │                                   │
│ │      Aún no hay imagen      │  [ Galería ]   [ Tomar foto ]     │
│ │                             │                                   │
│ └─────────────────────────────┘  ℹ Los cambios se aplican...       │
│                                                                  │
│ Equipo 410003 · Buses · Bus Blue Bird                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 16.3. Estado sin imagen

Placeholder grande.

Contenido:

```text
Aún no hay imagen

Agrega una imagen para identificar este equipo.
```

No debe parecer un campo obligatorio.

---

## 16.4. Acciones

Botones:

- `Galería`
- `Tomar foto`

Iconos:

- `FolderOpen`
- `Camera`

---

## 16.5. Procesamiento

El frontend:

1. obtiene la imagen;
2. valida tamaño;
3. convierte a WebP;
4. sube a:
   `imagenes-equipos`;
5. usa una ruta válida:
   `equipos/{codigo}/main_thumb/{archivo}.webp`;
6. llama:
   `engrase.rpc_administrar_imagen_equipo`.

---

# 17. RPC — Imagen

## Envío

```json
{
  "p_codigo_equipo": "410003",
  "p_operacion": "agregar",
  "p_storage_path": "equipos/410003/main_thumb/imagen.webp",
  "p_descripcion": "Imagen principal del equipo"
}
```

## Respuesta

```json
{
  "ok": true,
  "codigo": "410003",
  "equipo_id": 125,
  "operacion": "agregar",
  "imagen": {
    "main_storage_path": "equipos/410003/main_thumb/imagen.webp",
    "tiene_imagen_main": true,
    "imagen_actualizada_en": "2026-08-13T09:00:00-05:00"
  },
  "storage_path_anterior": null
}
```

---

## 17.1. Actualizar store

Aplicar directamente:

```text
equipo.main_storage_path = response.imagen.main_storage_path
equipo.tiene_imagen_main = response.imagen.tiene_imagen_main
equipo.imagen_actualizada_en = response.imagen.imagen_actualizada_en
```

No hacer una consulta adicional.

---

## 17.2. Omitir imagen

Acción:

`Omitir por ahora`

Debe:

- finalizar el wizard;
- mantener el equipo creado;
- no generar error;
- no crear ningún registro en `equipo_imagen`.

---

# 18. Comportamiento responsive

La pantalla debe priorizar tamaños pequeños porque la aplicación también se utilizará en interfaces compactas.

El diseño debe ser **mobile-first**, cuidando especialmente `xs` y `sm`.

---

## 18.1. XS

- contenido en una columna;
- header simplificado;
- stepper horizontal desplazable si no cabe;
- formularios en una columna;
- botones del footer de ancho útil para touch;
- drawers secundarios se convierten en **bottom sheets**;
- listas conservan nombre/código visibles;
- chips pueden envolver;
- acciones edit/delete permanecen accesibles;
- evitar tablas horizontales rígidas.

---

## 18.2. SM

- puede usar dos columnas en formularios cuando exista espacio;
- cards ocupan casi todo el ancho;
- mantener stepper legible;
- drawers pueden seguir como bottom sheet o panel según ancho disponible.

---

## 18.3. Escritorio

- contenido central amplio;
- drawers laterales;
- cards con ancho máximo controlado;
- footer sticky;
- panel resumen lateral en el paso 4;
- validación lateral opcional en el paso 1.

---

# 19. Drawers y bottom sheets

Todas las acciones secundarias deben seguir el mismo patrón de edición existente.

## Escritorio

Usar drawer lateral derecho para:

- agregar filtro;
- crear filtro;
- editar filtro;
- agregar aceite;
- editar aceite;
- crear tipo de equipo si se requiere.

## Móvil

Los mismos formularios deben abrirse como bottom sheets.

La lógica y contenido deben ser exactamente los mismos.

---

# 20. Estados de loading

## Validar código

```text
Validando...
```

El botón siguiente puede quedar temporalmente deshabilitado.

## Buscar filtro

Botón:

```text
Buscando...
```

No repetir solicitud mientras esté cargando.

## Crear equipo

Overlay ligero o estado del botón:

```text
Creando equipo...
```

Debe bloquear doble submit.

## Subir imagen

Mostrar:

```text
Procesando imagen...
Subiendo imagen...
```

No cerrar el wizard hasta terminar o informar el error.

---

# 21. Manejo visual de errores

## Campo inválido

- borde rojo;
- texto auxiliar rojo;
- no usar modales para errores simples de campo.

Ejemplo:

```text
Código *
[410002                               ]

Este código ya existe en Engrase.
Modelo: Bus · Estado: Activo
```

---

## Error transaccional al crear

Mostrar error visible cerca del botón o como alerta dentro del paso 4.

No borrar el borrador local.

El usuario debe poder corregir y volver a intentar.

---

## Error de imagen

El equipo ya existe.

Si falla la subida:

- mantener al usuario en paso 5;
- informar el error;
- permitir reintentar;
- también permitir `Omitir por ahora`.

Nunca revertir la creación del equipo por fallar la imagen.

---

# 22. Store local del wizard

Estructura conceptual sugerida:

```ts
type CrearEquipoDraft = {
  datosEquipo: {
    codigo: string
    tipoEquipo: EntidadTemporal
    subtipo: string
    etapaIds: number[]
    estado: 'activo' | 'descartado'
  }

  filtros: FiltroDraft[]

  aceites: AceiteDraft[]

  validacionCodigo: {
    estado: 'idle' | 'loading' | 'valido' | 'invalido' | 'error'
    puedeCrearse?: boolean
    modeloExistente?: string | null
    activoExistente?: boolean | null
  }

  equipoCreado?: EquipoEngraseListItem
}
```

Este estado puede estar en:

- store Pinia específico;
- composable;
- estado del módulo de creación.

Debe destruirse al finalizar o cancelar correctamente.

---

# 23. Carga de auxiliares

Al abrir el wizard cargar una vez:

`engrase.rpc_obtener_auxiliares_edicion_equipo`

Reutilizar:

- `tipos_equipo`;
- `subtipos_sugeridos`;
- `etapas`;
- `tipos_filtro`;
- `sistemas_aceite`;
- `aceites`.

No crear una RPC distinta solo para el wizard de creación.

---

# 24. Componentes visuales sugeridos

Nombres conceptuales:

```text
CrearEquipoPage
CrearEquipoHeader
CrearEquipoStepper
CrearEquipoFooter

PasoDatosEquipo
PasoFiltrosEquipo
PasoAceitesEquipo
PasoRevisarEquipo
PasoImagenEquipo

FiltroEquipoRow
AceiteEquipoRow

AgregarFiltroDrawer
CrearFiltroDrawer
EditarFiltroDrawer

AgregarAceiteDrawer
EditarAceiteDrawer

EquipoCodeValidation
ReviewSummaryCard
ImageUploaderCard
```

---

# 25. Iconografía sugerida — Lucide

```text
ArrowLeft
ChevronLeft
ChevronRight
ChevronDown
Check
Circle
Plus
X
Search
Filter
Droplet
Settings
Pencil
Trash2
Info
Image
FolderOpen
Camera
Save
Layers
```

Los iconos deben ser de línea simple y mantener el estilo de las capturas actuales.

---

# 26. Densidad y diseño ERP

La UI no debe parecer:

- landing page;
- onboarding de app de consumo;
- formulario excesivamente grande;
- interfaz decorativa;
- dashboard con gráficos innecesarios.

Debe parecer un **ERP operativo**:

- información compacta;
- acciones claras;
- bordes sutiles;
- listas legibles;
- botones de tamaño moderado;
- jerarquía visual funcional;
- poca ornamentación;
- feedback inmediato;
- consistencia entre edición y creación.

---

# 27. Reglas visuales importantes

1. Mantener el mismo beige general de la edición.
2. Mantener cards blancas.
3. Mantener teal oscuro para CTA principal.
4. Mantener bordes y radios similares a las capturas actuales.
5. Mantener chips beige para datos secundarios.
6. Mantener azul claro para mensajes informativos.
7. Mantener verde claro para éxito.
8. Mantener rojo únicamente para eliminación/error.
9. No reemplazar el stepper por tabs.
10. No mostrar imagen en el paso 1.
11. No intentar crear el equipo antes del paso 4.
12. El paso 5 debe dejar claro que el equipo ya está creado.
13. No obligar a agregar una imagen.
14. Reutilizar drawers de edición para no introducir un patrón visual nuevo.
15. Mantener el footer de acciones consistente en todos los pasos.

---

# 28. Reglas funcionales definitivas

- El código se valida contra `engrase.equipo`.
- Si existe solo en `public.equipos`, puede crearse en Engrase.
- Si puede crearse, la RPC de validación devuelve únicamente:
  `{"puede-crearse": true}` conceptualmente; el contrato real usa `puede_crearse`.
- Si no puede crearse, devuelve:
  - `puede_crearse: false`;
  - `modelo`;
  - `activo`.
- Debe existir al menos una etapa.
- Solo se pueden elegir etapas existentes.
- Debe existir al menos un filtro.
- Los aceites son opcionales.
- La imagen es opcional.
- La imagen se gestiona después de crear el equipo.
- La autorización interna de estas RPC solo exige `auth.uid()`.
- Los permisos adicionales de catálogo se controlan fuera de estas RPC.
- La creación debe devolver `equipo_lista`.
- La imagen debe devolver los campos necesarios para actualizar el store.
- No realizar consultas extra después de crear o agregar imagen.
- De momento no modificar la sincronización posterior de modelo/tipo hacia `public.equipos`.

---

# 29. RPC utilizadas

## Lectura / auxiliares

```text
engrase.rpc_obtener_auxiliares_edicion_equipo
engrase.rpc_buscar_filtro_original_para_asignar
```

## Creación

```text
engrase.rpc_validar_codigo_equipo_para_creacion
engrase.rpc_crear_equipo_completo
```

## Imagen

```text
engrase.rpc_administrar_imagen_equipo
```

---

# 30. Resultado esperado

La experiencia final debe sentirse como una extensión natural de la edición actual:

```text
MISMO ERP
MISMA PALETA
MISMOS CONTROLES
MISMOS DRAWERS
MISMAS LISTAS

pero:

EDICIÓN = pestañas y guardado general
CREACIÓN = wizard secuencial y confirmación final
```

El usuario debe entender claramente:

```text
Paso 1: qué equipo voy a crear
Paso 2: qué filtros tendrá
Paso 3: qué aceites tendrá
Paso 4: confirmar y crear
Paso 5: agregar imagen opcional
```

La creación debe ser segura, transaccional, visualmente consistente y sin recargas o consultas innecesarias después del guardado.
