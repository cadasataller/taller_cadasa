# Specs — Sistemas

Implementación progresiva de la pestaña **Sistemas** del Catálogo de engrase.

## Fuentes de verdad

```txt
../../contexto.md
../../catalogo_sistemas.png
../general/SPEC-00-vista-general-catalogo.md
```

La imagen define composición y jerarquía. `contexto.md` prevalece: `sistema_aceite` es un objeto maestro independiente; aceites y equipos relacionados son información derivada, no campos editables.

## Orden obligatorio

1. `SPEC-00-alcance-reglas-base.md`
2. `SPEC-01-contratos-mapper-servicio.md`
3. `SPEC-02-store-composable-filtros.md`
4. `SPEC-03-toolbar-tabla-desktop.md`
5. `SPEC-04-lista-mobile-responsive.md`
6. `SPEC-05-drawer-detalle-formulario.md`
7. `SPEC-06-confirmacion-guardado-errores.md`
8. `SPEC-07-integracion-pruebas-aceptacion.md`

Cada spec habilita únicamente su entrega.

## Principio de dominio

```txt
Catálogo: edita sistema_aceite.nombre y sistema_aceite.activo.
Equipo: administra equipo_aceite, sistema_aceite_id y aceite_id.
```

No consultar ni modificar Supabase. Las RPC son contratos objetivo extraídos de `contexto.md`.

## Base visual ERP

- Desktop compacto: `text-xs`/`text-sm`, controles `h-8`/`h-9`.
- Mobile: base visual `xs/sm`, inputs `text-base` cuando evite zoom y targets `44×44px`.
- Clickeable habilitado: `cursor-pointer`.
- Deshabilitado: `cursor-not-allowed`; guardando: `cursor-wait`.
- Sin tabla comprimida ni overflow horizontal mobile.
- `lucide-vue-next`, sin emoji.

## Stack

```txt
Vue 3 + <script setup lang="ts">
Composition API
Pinia Setup Store
Tailwind CSS
lucide-vue-next
```

