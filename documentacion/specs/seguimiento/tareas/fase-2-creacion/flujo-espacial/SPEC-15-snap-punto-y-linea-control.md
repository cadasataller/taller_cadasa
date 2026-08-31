# SPEC-15 — Snap, punto enrutado y línea de control

## Fuente de datos

El frontend usa `obtener_geografia_operativa_area_v2()` ya cargado mediante
`supabaseRastreoTareas`; no realiza una segunda consulta para resolver el snap.

## Algoritmo

El clic se ajusta al segmento más cercano de `red_vial_enrutable`. El punto
ajustado es `p_punto_latitud/longitud`. A partir de la dirección local del
segmento se genera una `MultiLineString` perpendicular de 28 m, centrada en el
punto, como `p_linea_control_geojson`.

Cuando la finca dominante no coincide con la red inicialmente seleccionada, se
repite el snap sólo contra la red de la finca final. El resultado debe estar a
un máximo de 100 m; sin acceso compatible la tarea pasa a tipo `zona`.

## Responsabilidades

Vue/TypeScript calcula, previsualiza y permite corregir la selección. Supabase
recibe y valida las geometrías, persiste la tarea y procesa eventos GPS. El
backend debe rechazar como resguardo un punto de finca fuera de su límite o
alejado de su red vial.
