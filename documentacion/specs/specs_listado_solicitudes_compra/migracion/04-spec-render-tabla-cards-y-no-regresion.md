# SPEC DE MIGRACION 04 — TABLA, CARDS Y NO REGRESION

## Objetivo

Actualizar el render visual del listado al modelo `seguimiento` sin romper la
interfaz ya implementada.

## Tabla desktop

Archivo:

```txt
src/components/compras/list/desktop/SolicitudesDesktopTable.vue
```

### Se conserva

- tabla desktop
- fila clickeable
- layout denso tipo ERP
- columnas por rol

### Se adapta

- columna visual principal de avance:
  - antes: `estado`
  - ahora: `seguimiento`

Mostrar:

- `seguimiento.label`
- opcionalmente debajo:
  - `seguimiento.fecha_label`
  - `seguimiento.fecha`

## Cards mobile

Archivo:

```txt
src/components/compras/list/mobile/SolicitudMobileCard.vue
```

### Se conserva

- card clickeable
- observacion como contenido principal
- layout por familia de rol

### Se adapta

- badge principal de avance pasa a usar `seguimiento`
- si aplica, mostrar tambien fecha de seguimiento

## Regla especial de completadas

Para roles donde el backend devuelva un seguimiento de accion/evento en
completadas, la UI debe mostrar:

- `seguimiento.label`
- `seguimiento.fecha_label`
- `seguimiento.fecha`

No debe reconstruir o exponer un "estado real alterno" por fuera de
`seguimiento`.

## Celdas reutilizables

Archivo:

```txt
src/components/compras/list/cells/**
```

Recomendacion:

- adaptar la celda/badge de `estado` a una celda orientada a `seguimiento`
- evitar mezclar ambos conceptos en paralelo

## Checklist de no regresion

Antes de cerrar la migracion validar:

1. La vista sigue cargando listado inicial.
2. La busqueda existente no se rompe.
3. El scroll o cargar mas sigue funcionando.
4. Cambiar de grupo no rompe tabla ni cards.
5. Sin config remota, el listado sigue apareciendo.
6. El toast por config fallida se muestra una sola vez por intento de carga.
7. Roles `operativo`, `almacen`, `gerencia`, `secretaria`, `admin` siguen
   viendo su estructura general esperada.
8. No se rompe:
   - crear
   - borradores
   - retorno desde overlay de crear

## Criterio de aceptacion

La migracion visual debe sentirse como una adaptacion del listado existente, no
como una reimplementacion total del modulo.
