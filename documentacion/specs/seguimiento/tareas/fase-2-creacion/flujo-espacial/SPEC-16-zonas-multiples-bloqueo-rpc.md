# SPEC-16 — Zonas múltiples, bloqueo y RPC

## Reglas de dibujo

Una tarea `finca` tiene de una a N zonas independientes. Si la cobertura
acumulada es 100% de una finca, las siguientes zonas sólo pueden dibujarse
dentro de su límite. El mapa puede navegarse normalmente; se bloquea la captura
fuera de esa finca.

Mientras no haya contención total, se permite agregar zonas para que la finca
dominante se calcule por área total. Al cambiar la finca dominante se recalcula
el acceso vial y la línea de control.

Una tarea `zona` conserva exactamente una zona lógica, que puede ser
`Polygon` o `MultiPolygon`.

## Payload de `crear_tarea_v2`

```ts
type FincaPayload = {
  p_tipo_codigo: "finca";
  p_ubicacion_id: string;
  p_linea_control_geojson: GeoJSON.MultiLineString;
  p_zona_control_geojson: GeoJSON.MultiPolygon[];
};

type ZonaPayload = {
  p_tipo_codigo: "zona";
  p_ubicacion_id: null;
  p_linea_control_geojson: null;
  p_zona_control_geojson: GeoJSON.Polygon | GeoJSON.MultiPolygon;
};
```

El RPC devuelve `zona_control_ids` para finca. Cada identificador representa
una zona operativa y visitas independientes.

## Aceptación

- Finca nunca envía zona nula.
- Zona nunca envía más de una zona lógica.
- La UI usa tipos discriminados y validación Zod antes de llamar a
  `supabaseRastreoTareas.rpc('crear_tarea_v2', ...)`.
