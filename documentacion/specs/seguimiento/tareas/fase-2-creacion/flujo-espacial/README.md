# Subespecificaciones — Flujo espacial de creación

Estas subespecificaciones extienden la fase 2 para que la creación comience en
el mapa una vez seleccionado el contexto mínimo: área, fecha y **uno** de los
dos recursos operativos (trabajador o equipo).

## Dependencias

```txt
SPEC-07 a SPEC-13 de fase-2-creacion
documentacion/rastreo_tarea/rpcs_funciones_bd.md
obtener_geografia_operativa_area_v2()
supabaseRastreoTareas
```

La UI se implementa con Vue 3, TypeScript, Tailwind y `lucide-vue-next`. La
validación local permanece en Zod y el selector de fecha usa Vue Date Picker.

## Documentos

1. [SPEC-14 — Inicio y clasificación espacial](SPEC-14-inicio-y-clasificacion-espacial.md)
2. [SPEC-15 — Snap, punto enrutado y línea de control](SPEC-15-snap-punto-y-linea-control.md)
3. [SPEC-16 — Zonas múltiples, bloqueo y RPC](SPEC-16-zonas-multiples-bloqueo-rpc.md)
