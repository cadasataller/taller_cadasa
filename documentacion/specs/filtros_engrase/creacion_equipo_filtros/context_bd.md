# Contexto BD — Creación de equipos en Engrase

## Objetivo

Implementar un flujo de creación de equipos por pasos en la UI, manteniendo en memoria los datos, filtros y aceites hasta el momento de crear el equipo. La imagen se gestiona después de que el equipo ya fue creado correctamente y es opcional.

El flujo recomendado es:

1. Datos del equipo.
2. Filtros.
3. Aceites.
4. Revisar y crear.
5. Imagen opcional.

Los pasos 1–4 trabajan sobre un borrador local. El paso 4 ejecuta la creación transaccional. El paso 5 utiliza la RPC existente de imagen.

---

# Estado de la base de datos relevante

Tablas principales:

- `public.equipos`
- `engrase.equipo`
- `engrase.tipo_equipo`
- `engrase.etapa`
- `engrase.equipo_etapa`
- `engrase.tipo_filtro`
- `engrase.filtro`
- `engrase.equipo_filtro`
- `engrase.sistema_aceite`
- `engrase.aceite`
- `engrase.equipo_aceite`
- `public.equipo_imagen`

La tabla `engrase.equipo` referencia `public.equipos(cod_equipo)` mediante el código.

Existe el trigger:

`engrase.trg_asegurar_equipo_en_public`

Este trigger asegura que, al insertar un equipo nuevo en `engrase.equipo`, exista también su registro correspondiente en `public.equipos`. Si el equipo ya existe en `public.equipos`, no crea un duplicado.

Por esta razón, la RPC de creación inserta en `engrase.equipo` y deja que la lógica existente determine si debe crear o reutilizar el registro de `public.equipos`.

Por ahora no se modifica la lógica existente para sincronizar posteriormente `modelo` o `tipo` en `public.equipos`.

---

# RPC nuevas

## 1. `engrase.rpc_validar_codigo_equipo_para_creacion`

### Objetivo

Validar exclusivamente si un código puede crearse dentro del módulo de Engrase.

No debe bloquear la creación porque el código exista solamente en `public.equipos`.

La creación se bloquea únicamente si el código ya existe en `engrase.equipo`.

### Seguridad

- Requiere `auth.uid()`.
- `SECURITY DEFINER`.
- Ejecutable por `authenticated`.
- No ejecutable por `anon`.

### Envío

```json
{
  "p_codigo": "410003"
}
```

### Respuesta cuando puede crearse

La respuesta debe ser mínima:

```json
{
  "puede_crearse": true
}
```

No devuelve modelo, activo ni otros datos cuando el equipo puede crearse.

### Respuesta cuando NO puede crearse

```json
{
  "puede_crearse": false,
  "modelo": "Bus",
  "activo": true
}
```

`modelo` se obtiene preferentemente de `public.equipos.modelo` y, si no está disponible, utiliza `engrase.equipo.subtipo`.

`activo` se obtiene preferentemente de `public.equipos.activo` y, si no está disponible, se deriva de `engrase.equipo.estado = 'activo'`.

### Error

```text
AUTENTICACION_REQUERIDA
CODIGO_EQUIPO_REQUERIDO
```

### Uso en UI

Se recomienda ejecutarla al finalizar la entrada del código o al salir del campo.

Si devuelve:

```json
{
  "puede_crearse": true
}
```

el wizard puede continuar.

Si devuelve:

```json
{
  "puede_crearse": false,
  "modelo": "Bus",
  "activo": true
}
```

la UI debe bloquear la creación e informar que el equipo ya existe en Engrase.

---

# 2. `engrase.rpc_crear_equipo_completo`

## Objetivo

Crear de forma transaccional:

- Equipo.
- Tipo de equipo nuevo, si corresponde.
- Etapas.
- Filtros.
- Tipos de filtro nuevos.
- Códigos de filtro nuevos.
- Aceites.
- Sistemas de aceite nuevos.
- Aceites nuevos.

La imagen NO forma parte de esta transacción.

## Seguridad

- Requiere `auth.uid()`.
- `SECURITY DEFINER`.
- Ejecutable por `authenticated`.
- No ejecutable por `anon`.

No realiza validaciones adicionales de permisos de catálogo porque esas reglas se gestionan en otra parte de la aplicación.

---

# Payload de creación

## Ejemplo completo

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
        },
        {
          "estado_operacion": "nuevo",
          "temp_id": "tmp_equipo_filtro_2",
          "tipo_filtro": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_tipo_filtro_1",
            "nombre": "Filtro de respiradero"
          },
          "filtro": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_filtro_1",
            "codigo": "ABC123",
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
        },
        {
          "estado_operacion": "nuevo",
          "temp_id": "tmp_equipo_aceite_2",
          "sistema": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_sistema_aceite_1",
            "nombre": "Mandos finales"
          },
          "aceite": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_aceite_1",
            "nombre": "SAE 50"
          }
        }
      ]
    }
  }
}
```

---

# Datos del equipo

## Tipo de equipo existente

```json
{
  "estado": "existente",
  "id": 1,
  "nombre": "Buses"
}
```

El `id` existente se reutiliza.

## Tipo de equipo nuevo

```json
{
  "estado": "nuevo",
  "id": null,
  "temp_id": "tmp_tipo_equipo_1",
  "nombre": "Nuevo tipo"
}
```

La RPC reutiliza la función existente:

`engrase.fn_resolver_tipo_equipo`

Si encuentra el mismo nombre, reutiliza el registro; si no existe, lo crea.

---

# Etapas

Solo pueden seleccionarse etapas existentes en `engrase.etapa`.

Ejemplo:

```json
{
  "etapas": {
    "agregadas": [
      {
        "estado_operacion": "nuevo",
        "etapa_id": 1
      },
      {
        "estado_operacion": "nuevo",
        "etapa_id": 2
      }
    ]
  }
}
```

La creación exige al menos una etapa.

---

# Filtros

La creación exige al menos un filtro.

Cada filtro nuevo para el equipo utiliza el mismo contrato conceptual de la edición.

## Filtro existente

```json
{
  "estado_operacion": "nuevo",
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
```

## Código de filtro nuevo

```json
{
  "estado_operacion": "nuevo",
  "tipo_filtro": {
    "estado": "existente",
    "id": 2,
    "nombre": "Filtro de aire primario"
  },
  "filtro": {
    "estado": "nuevo",
    "id": null,
    "temp_id": "tmp_filtro_1",
    "codigo": "NUEVO123",
    "esta_en_lista_compras": true
  },
  "cantidad": 1
}
```

## Tipo de filtro nuevo

```json
{
  "estado_operacion": "nuevo",
  "tipo_filtro": {
    "estado": "nuevo",
    "id": null,
    "temp_id": "tmp_tipo_filtro_1",
    "nombre": "Filtro de respiradero"
  },
  "filtro": {
    "estado": "nuevo",
    "id": null,
    "temp_id": "tmp_filtro_2",
    "codigo": "RESP100",
    "esta_en_lista_compras": false
  },
  "cantidad": 1
}
```

La RPC reutiliza:

- `engrase.fn_resolver_tipo_filtro`
- `engrase.fn_resolver_filtro`

La restricción actual mantiene un único filtro por tipo para cada equipo.

---

# Aceites

Los aceites son opcionales.

Ejemplo:

```json
{
  "aceites": {
    "nuevos": [
      {
        "estado_operacion": "nuevo",
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
```

La RPC reutiliza:

- `engrase.fn_resolver_sistema_aceite`
- `engrase.fn_resolver_aceite`

La restricción actual mantiene un solo aceite por sistema para cada equipo.

---

# Respuesta de `rpc_crear_equipo_completo`

## Respuesta exitosa

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
    "filtros_agregados": 5,
    "aceites_agregados": 2
  }
}
```

## Uso de `equipo_lista`

`equipo_lista` utiliza el mismo formato generado por:

`engrase.fn_equipo_lista_item`

Es compatible con el objeto devuelto por la actualización de equipos.

Por lo tanto, después de crear un equipo, el frontend puede insertar directamente `equipo_lista` en el store local sin ejecutar nuevamente `rpc_obtener_equipos_lista`.

---

# Errores principales de creación

```text
AUTENTICACION_REQUERIDA
PAYLOAD_CREACION_INVALIDO
DATOS_EQUIPO_REQUERIDOS
CODIGO_EQUIPO_REQUERIDO
EQUIPO_YA_EXISTE_EN_ENGRASE
SUBTIPO_EQUIPO_REQUERIDO
ESTADO_EQUIPO_INVALIDO
TIPO_EQUIPO_REQUERIDO
TIPO_EQUIPO_NO_EXISTE
ETAPA_NO_EXISTE
ETAPA_MINIMA_REQUERIDA
FILTRO_MINIMO_REQUERIDO
CANTIDAD_FILTRO_INVALIDA
TIPO_FILTRO_NO_EXISTE
FILTRO_NO_EXISTE
ACEITE_NO_EXISTE
SISTEMA_ACEITE_NO_EXISTE
CONFLICTO_DATOS_DUPLICADOS
DATOS_INVALIDOS
```

También pueden propagarse errores específicos de las funciones resolver si falta nombre o código de un elemento nuevo.

---

# RPC reutilizadas durante el wizard

## `engrase.rpc_obtener_auxiliares_edicion_equipo`

Se reutiliza para cargar:

- Tipos de equipo.
- Subtipos sugeridos.
- Etapas disponibles.
- Tipos de filtro.
- Sistemas de aceite.
- Aceites.

No requiere una RPC nueva para auxiliares de creación.

---

## `engrase.rpc_buscar_filtro_original_para_asignar`

Se reutiliza para buscar códigos originales.

Durante creación debe invocarse sin código de equipo:

```json
{
  "p_codigo": "B7577",
  "p_codigo_equipo": null
}
```

La prevención de duplicados dentro del nuevo equipo se realiza en el borrador local del frontend.

---

# Paso de imagen

La imagen se administra únicamente después de que `rpc_crear_equipo_completo` terminó correctamente.

La imagen es opcional.

El frontend puede mostrar:

- Agregar imagen.
- Omitir y finalizar.

La subida física sigue realizándose directamente en Supabase Storage.

Bucket:

`imagenes-equipos`

Ruta esperada:

```text
equipos/{codigo}/main_thumb/{archivo}.webp
```

Después de subir el archivo se reutiliza:

`engrase.rpc_administrar_imagen_equipo`

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
    "imagen_actualizada_en": "2026-08-13T08:45:00-05:00"
  },
  "storage_path_anterior": null
}
```

El frontend puede actualizar directamente esos tres campos dentro del equipo recién insertado en el store:

- `main_storage_path`
- `tiene_imagen_main`
- `imagen_actualizada_en`

No necesita volver a consultar la lista de equipos.

---

# Flujo frontend recomendado

```text
PASO 1
Datos del equipo
    |
    +-- rpc_validar_codigo_equipo_para_creacion
    |
    v
PASO 2
Filtros
    |
    +-- rpc_buscar_filtro_original_para_asignar
    |
    v
PASO 3
Aceites
    |
    v
PASO 4
Revisión
    |
    +-- rpc_crear_equipo_completo
    |
    +-- respuesta.equipo_lista
    |       |
    |       +-- agregar directamente al store local
    |
    v
PASO 5
Imagen opcional
    |
    +-- convertir a WebP
    +-- subir a Storage
    +-- rpc_administrar_imagen_equipo
    |
    +-- actualizar datos de imagen del mismo item del store
    |
    v
FINALIZAR
```

---

# Reglas confirmadas

- El código se valida respecto a si ya existe en `engrase.equipo`.
- Un código presente únicamente en `public.equipos` sí puede incorporarse a Engrase.
- La lógica existente decide si se crea o reutiliza el registro de `public.equipos`.
- Debe existir al menos una etapa.
- Debe existir al menos un filtro.
- Solo pueden seleccionarse etapas disponibles en `engrase.etapa`.
- Los aceites son opcionales.
- La imagen es opcional.
- La imagen se agrega después de crear el equipo.
- La creación completa devuelve `equipo_lista` para actualizar el store sin consulta adicional.
- La RPC de imagen devuelve los campos necesarios para actualizar la imagen del mismo item del store sin consulta adicional.
- Las RPC validan únicamente que exista `auth.uid()` a nivel de autorización interna.
- De momento no se modifica la sincronización posterior de `modelo` ni `tipo` hacia `public.equipos`.
