# Specs — Aceites

Implementación progresiva de la pestaña **Aceites** del Catálogo de engrase.

## Fuentes de verdad

```txt
../../contexto.md
../../catalogo_aceite.png
../general/SPEC-00-vista-general-catalogo.md
```

La imagen define composición y jerarquía. `contexto.md` prevalece funcionalmente: un sistema no pertenece directamente a un aceite; la relación se origina en `equipo_aceite` y es informativa dentro del Catálogo.

## Orden obligatorio

1. `SPEC-00-alcance-reglas-base.md`
2. `SPEC-01-contratos-mapper-servicio.md`
3. `SPEC-02-store-composable-filtros.md`
4. `SPEC-03-toolbar-tabla-desktop.md`
5. `SPEC-04-lista-mobile-responsive.md`
6. `SPEC-05-drawer-detalle-formulario.md`
7. `SPEC-06-confirmacion-guardado-errores.md`
8. `SPEC-07-integracion-pruebas-aceptacion.md`

Cada spec habilita solo su entrega. No adelantar lógica, UI o conexión de specs posteriores.

## Principio de dominio

```txt
Catálogo: edita aceite.nombre y aceite.activo.
Equipo: administra equipo_aceite, sistema_aceite_id y aceite_id.
```

No consultar ni modificar Supabase durante la elaboración de estos specs. Las RPC se documentan exclusivamente como contratos objetivo de `contexto.md`.

## Base visual ERP

- Desktop: `text-xs`/`text-sm`, controles `h-8`/`h-9`, tabla compacta.
- Mobile: tipografía visual `xs/sm`, inputs `text-base` cuando evite zoom y targets mínimos `44×44px`.
- Habilitado y clickeable: Tailwind `cursor-pointer`.
- Deshabilitado: `cursor-not-allowed`; operación en curso: `cursor-wait`.
- Sin tabla comprimida ni overflow horizontal en mobile.
- Iconos de `lucide-vue-next`, nunca emoji.

## Stack esperado

```txt
Vue 3 + <script setup lang="ts">
Composition API
Pinia Setup Store
Tailwind CSS
lucide-vue-next
```

