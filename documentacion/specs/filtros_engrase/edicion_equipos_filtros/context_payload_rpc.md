# Payloads y respuestas de RPC para edición de equipos

Este documento describe los contratos actuales de las RPC de edición del esquema `engrase`.

---

# 1. `rpc_obtener_equipo_para_edicion`

## Envío

```json
{
  "p_codigo": "410002"
}
```

## Respuesta exitosa

```json
{
  "ok": true,
  "equipo": {
    "id": 6,
    "codigo": "410002",
    "tipo_equipo_id": 1,
    "tipo_equipo": "Buses",
    "subtipo": "Bus",
    "estado": "activo"
  },
  "etapas": [
    {
      "id": 1,
      "nombre": "Cultivo"
    },
    {
      "id": 2,
      "nombre": "Zafra"
    }
  ],
  "filtros": [
    {
      "id": 101,
      "equipo_id": 6,
      "tipo_filtro_id": 1,
      "filtro_id": 35,
      "cantidad": 1,
      "tipoFiltro": {
        "id": 1,
        "nombre": "Filtro de aceite 1"
      },
      "filtro": {
        "id": 35,
        "codigo": "B7030",
        "esta_en_lista_compras": true
      },
      "cantidad_equivalencias": 0
    }
  ],
  "aceites": [
    {
      "equipo_aceite_id": 10,
      "sistema": {
        "id": 1,
        "nombre": "Motor"
      },
      "aceite": {
        "id": 1,
        "nombre": "15W-40"
      }
    }
  ]
}
```

## Error posible

```text
EQUIPO_NO_ENCONTRADO: 410002
```

---

# 2. `rpc_obtener_auxiliares_edicion_equipo`

## Envío

```json
{}
```

## Respuesta exitosa

```json
{
  "ok": true,
  "tipos_equipo": [
    {
      "id": 1,
      "nombre": "Buses",
      "subtipos_sugeridos": [
        "Bus",
        "Bus Blue Bird",
        "Bus International"
      ]
    },
    {
      "id": 2,
      "nombre": "Camecos",
      "subtipos_sugeridos": [
        "Cameco"
      ]
    }
  ],
  "etapas": [
    {
      "id": 1,
      "nombre": "Cultivo"
    },
    {
      "id": 2,
      "nombre": "Zafra"
    }
  ],
  "tipos_filtro": [
    {
      "id": 1,
      "nombre": "Filtro de aceite 1",
      "tipos_equipo_que_lo_usan": [
        "Buses",
        "Camiones",
        "Cargadores"
      ]
    },
    {
      "id": 2,
      "nombre": "Filtro de aire primario",
      "tipos_equipo_que_lo_usan": [
        "Buses",
        "Combinadas"
      ]
    }
  ],
  "sistemas_aceite": [
    {
      "id": 1,
      "nombre": "Motor"
    },
    {
      "id": 2,
      "nombre": "Transmisión"
    }
  ],
  "aceites": [
    {
      "id": 1,
      "nombre": "15W-40"
    },
    {
      "id": 2,
      "nombre": "Hy-Tran"
    }
  ]
}
```

Todos los arreglos vacíos se devuelven como `[]`.

---

# 3. `rpc_buscar_filtro_original_para_asignar`

## Envío

```json
{
  "p_codigo": "LFP3191",
  "p_codigo_equipo": "410002"
}
```

`p_codigo_equipo` es opcional.

## Respuesta cuando el código existe

```json
{
  "ok": true,
  "encontrado": true,
  "codigo": "FILTRO_ENCONTRADO",
  "filtro": {
    "id": 35,
    "codigo": "LFP3191",
    "esta_en_lista_compras": true
  },
  "requiere_seleccionar_tipo": false,
  "sin_tipos_registrados": false,
  "tipos_posibles": [
    {
      "tipo_filtro": {
        "id": 1,
        "nombre": "Filtro de aceite 1"
      },
      "tipos_equipo_que_lo_usan": [
        "Cargadores",
        "Combinadas",
        "Grabs",
        "Jaivas"
      ],
      "ya_asignado_al_equipo": false,
      "equipo_filtro_actual": null
    }
  ]
}
```

## Respuesta cuando el código tiene varios tipos

```json
{
  "ok": true,
  "encontrado": true,
  "codigo": "FILTRO_CON_TIPOS_MULTIPLES",
  "filtro": {
    "id": 80,
    "codigo": "ABC1234",
    "esta_en_lista_compras": true
  },
  "requiere_seleccionar_tipo": true,
  "sin_tipos_registrados": false,
  "tipos_posibles": [
    {
      "tipo_filtro": {
        "id": 4,
        "nombre": "Filtro diésel 1"
      },
      "tipos_equipo_que_lo_usan": [
        "Buses",
        "Camiones"
      ],
      "ya_asignado_al_equipo": false,
      "equipo_filtro_actual": null
    },
    {
      "tipo_filtro": {
        "id": 5,
        "nombre": "Filtro diésel 2"
      },
      "tipos_equipo_que_lo_usan": [
        "Camecos",
        "Forklift"
      ],
      "ya_asignado_al_equipo": true,
      "equipo_filtro_actual": {
        "equipo_filtro_id": 105,
        "codigo": "LFF3349",
        "cantidad": 1
      }
    }
  ]
}
```

## Respuesta cuando el código existe sin tipos registrados

```json
{
  "ok": true,
  "encontrado": true,
  "codigo": "FILTRO_ENCONTRADO",
  "filtro": {
    "id": 90,
    "codigo": "XYZ100",
    "esta_en_lista_compras": true
  },
  "requiere_seleccionar_tipo": false,
  "sin_tipos_registrados": true,
  "tipos_posibles": []
}
```

## Respuesta cuando el código no existe

```json
{
  "ok": true,
  "encontrado": false,
  "codigo": "FILTRO_NO_ENCONTRADO",
  "codigo_buscado": "XYZ123",
  "puede_crearse": true
}
```

## Errores posibles

```text
CODIGO_FILTRO_INVALIDO
EQUIPO_NO_ENCONTRADO: 410002
```

---

# 4. `rpc_actualizar_equipo_completo`

## Envío

```json
{
  "p_codigo_equipo": "410002",
  "p_cambios": {
    "datos_equipo": {
      "estado_operacion": "actualizado",
      "codigo_nuevo": "410002",
      "subtipo": "Bus urbano",
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
      ],
      "eliminadas": [
        {
          "estado_operacion": "eliminado",
          "etapa_id": 1
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
            "id": 3,
            "nombre": "Filtro de aire primario"
          },
          "filtro": {
            "estado": "existente",
            "id": 58,
            "codigo": "LAP9545",
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
      ],
      "actualizados": [
        {
          "estado_operacion": "actualizado",
          "equipo_filtro_id": 101,
          "tipo_filtro": {
            "estado": "existente",
            "id": 1,
            "nombre": "Filtro de aceite 1"
          },
          "filtro": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_filtro_2",
            "codigo": "LFP3191-N",
            "esta_en_lista_compras": true
          },
          "cantidad": 2,
          "motivo_cambio": "Actualización del código utilizado"
        }
      ],
      "eliminados": [
        {
          "estado_operacion": "eliminado",
          "equipo_filtro_id": 104
        }
      ]
    },
    "aceites": {
      "nuevos": [
        {
          "estado_operacion": "nuevo",
          "temp_id": "tmp_equipo_aceite_1",
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
      ],
      "actualizados": [
        {
          "estado_operacion": "actualizado",
          "equipo_aceite_id": 10,
          "sistema": {
            "estado": "existente",
            "id": 1,
            "nombre": "Motor"
          },
          "aceite": {
            "estado": "nuevo",
            "id": null,
            "temp_id": "tmp_aceite_2",
            "nombre": "15W-40 API CK-4"
          }
        }
      ],
      "eliminados": [
        {
          "estado_operacion": "eliminado",
          "equipo_aceite_id": 11
        }
      ]
    }
  }
}
```

## Elementos existentes y nuevos

Cuando un elemento tiene `id`, la RPC reutiliza ese registro:

```json
{
  "estado": "existente",
  "id": 3,
  "nombre": "Filtro de aire primario"
}
```

Cuando no tiene `id`, la RPC intenta resolverlo por nombre o código y lo crea si no existe:

```json
{
  "estado": "nuevo",
  "id": null,
  "temp_id": "tmp_tipo_filtro_1",
  "nombre": "Filtro de respiradero"
}
```

La RPC resuelve principalmente por:

- `id` para registros existentes.
- `nombre` para tipos, sistemas y aceites nuevos.
- `codigo` para filtros nuevos.

## Respuesta exitosa

```json
{
  "ok": true,
  "codigo": "EQUIPO_ACTUALIZADO",
  "mensaje": "El equipo 410002 se actualizó correctamente.",
  "equipo_lista": {
    "id": 6,
    "codigo": "410002",
    "tipo_equipo_id": 1,
    "tipo_equipo": "Buses",
    "subtipo": "Bus urbano",
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
  "cambios_detalle": {
    "datos_equipo_cambiaron": true,
    "etapas_cambiaron": true,
    "filtros_cambiaron": true,
    "aceites_cambiaron": true
  },
  "resumen_operaciones": {
    "etapas_agregadas": 1,
    "etapas_eliminadas": 1,
    "filtros_agregados": 2,
    "filtros_actualizados": 1,
    "filtros_eliminados": 1,
    "historiales_filtro_creados": 1,
    "aceites_agregados": 1,
    "aceites_actualizados": 1,
    "aceites_eliminados": 1
  }
}
```

`equipo_lista` es compatible con `EquipoEngraseListItem` y permite reemplazar directamente el elemento correspondiente en el store.

## Errores posibles

```text
AUTENTICACION_REQUERIDA
PAYLOAD_CAMBIOS_INVALIDO
EQUIPO_NO_ENCONTRADO
CODIGO_EQUIPO_REQUERIDO
CODIGO_EQUIPO_YA_EXISTE
SUBTIPO_EQUIPO_REQUERIDO
ETAPA_NO_EXISTE
ETAPA_MINIMA_REQUERIDA
FILTRO_MINIMO_REQUERIDO
FILTRO_ASIGNADO_NO_EXISTE
CANTIDAD_FILTRO_INVALIDA
ACEITE_ASIGNADO_NO_EXISTE
CONFLICTO_DATOS_DUPLICADOS
DATOS_INVALIDOS
```

---

# 5. `rpc_administrar_imagen_equipo`

Administra únicamente la imagen principal con rol `main_thumb`.

## Agregar imagen

### Envío

```json
{
  "p_codigo_equipo": "410002",
  "p_operacion": "agregar",
  "p_storage_path": "equipos/410002/main_thumb/imagen.webp",
  "p_descripcion": "Imagen principal del equipo"
}
```

### Respuesta

```json
{
  "ok": true,
  "codigo": "410002",
  "equipo_id": 6,
  "operacion": "agregar",
  "imagen": {
    "main_storage_path": "equipos/410002/main_thumb/imagen.webp",
    "tiene_imagen_main": true,
    "imagen_actualizada_en": "2026-08-06T13:40:00-05:00"
  },
  "storage_path_anterior": null
}
```

## Actualizar imagen

### Envío

```json
{
  "p_codigo_equipo": "410002",
  "p_operacion": "actualizar",
  "p_storage_path": "equipos/410002/main_thumb/nueva-imagen.webp",
  "p_descripcion": "Imagen principal actualizada"
}
```

### Respuesta

```json
{
  "ok": true,
  "codigo": "410002",
  "equipo_id": 6,
  "operacion": "actualizar",
  "imagen": {
    "main_storage_path": "equipos/410002/main_thumb/nueva-imagen.webp",
    "tiene_imagen_main": true,
    "imagen_actualizada_en": "2026-08-06T13:45:00-05:00"
  },
  "storage_path_anterior": "equipos/410002/main_thumb/imagen.webp"
}
```

## Eliminar imagen

### Envío

```json
{
  "p_codigo_equipo": "410002",
  "p_operacion": "eliminar",
  "p_storage_path": null,
  "p_descripcion": null
}
```

### Respuesta

```json
{
  "ok": true,
  "codigo": "410002",
  "equipo_id": 6,
  "operacion": "eliminar",
  "imagen": {
    "main_storage_path": null,
    "tiene_imagen_main": false,
    "imagen_actualizada_en": null
  },
  "storage_path_anterior": "equipos/410002/main_thumb/nueva-imagen.webp"
}
```

## Reglas

- Para `agregar` y `actualizar`, `p_storage_path` es obligatorio.
- La ruta debe terminar en `.webp`.
- El archivo debe existir previamente en el bucket `imagenes-equipos`.
- `agregar` falla si ya existe una imagen principal.
- `actualizar` y `eliminar` fallan si el equipo no tiene imagen principal.
- La RPC administra el registro de `public.equipo_imagen`.
- La eliminación física del archivo se realiza desde el frontend usando `storage_path_anterior`.

## Errores posibles

```text
AUTENTICACION_REQUERIDA
EQUIPO_NO_ENCONTRADO
STORAGE_PATH_REQUERIDO
IMAGEN_DEBE_SER_WEBP
ARCHIVO_STORAGE_NO_ENCONTRADO
EL_EQUIPO_YA_TIENE_IMAGEN_PRINCIPAL
EL_EQUIPO_NO_TIENE_IMAGEN_PRINCIPAL
OPERACION_IMAGEN_INVALIDA
```
