# SPEC-14 — Inicio y clasificación espacial

## Objetivo

Reemplazar el inicio desde el listado por un flujo guiado desde el mapa.

## Inicio

El flujo se habilita cuando existen área, fecha y al menos uno entre trabajador
o equipo. El mapa muestra la acción `Elegir punto`; el botón `Nueva tarea` no
aparece en el panel de lista. El recurso no elegido sigue siendo obligatorio en
el panel, antes del guardado.

## Clasificación

1. Se captura y ajusta un acceso vial.
2. El supervisor dibuja la primera zona.
3. Se calcula para cada finca la cobertura acumulada:

```txt
area(intersección de zonas y finca) / area(total de zonas)
```

4. Una finca es candidata desde 11% y gana la de mayor cobertura.
5. Sólo se crea `finca` si esa finca tiene un acceso vial compatible. En otro
   caso se crea `zona`.
6. Tras clasificar, se muestra el panel derecho con el tipo y la geometría
   prellenados. El usuario puede cambiar tipo, con la consecuencia explícita de
   reiniciar el contexto geométrico incompatible.

## Interacción de vértices

- Cada clic válido crea inmediatamente un vértice visible.
- Una línea continua une los vértices confirmados.
- Desde el último vértice se muestra una línea elástica hasta el cursor.
- La UI informa cuántos vértices existen y cuántos faltan para cerrar.
- El primer vértice se distingue en verde y, desde el tercero, tocarlo cierra
  el polígono.
- El polígono no se cierra automáticamente al crear el segundo o tercer punto.
- `Limpiar vértices` elimina únicamente el dibujo en curso; conserva el punto
  enrutado y la línea de control calculada.
- Los límites, vías y polígonos informativos del mapa no deben interceptar los
  clics de creación.

## Aceptación

- No hay trigger de creación en el listado.
- No se guarda sin trabajador y equipo.
- La finca se decide por cobertura total, no por el orden de dibujo.
