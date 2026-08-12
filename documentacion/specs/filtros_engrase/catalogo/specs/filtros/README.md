# Specs — Filtros

Implementación progresiva de la pestaña **Filtros** del Catálogo de engrase.

## Fuentes de verdad

```txt
../../contexto.md
../../catalogo_filtro.png
../general/SPEC-00-vista-general-catalogo.md
```

La imagen define composición y jerarquía visual. `contexto.md` prevalece en reglas funcionales: un filtro no tiene nombre ni tipo directo; los tipos relacionados se consultan, pero no se editan desde Catálogo.

## Orden obligatorio

1. `SPEC-00-alcance-reglas-base.md`
2. `SPEC-01-contratos-mapper-servicio.md`
3. `SPEC-02-store-composable-filtros.md`
4. `SPEC-03-toolbar-tabla-desktop.md`
5. `SPEC-04-lista-mobile-responsive.md`
6. `SPEC-05-drawer-detalle-formulario.md`
7. `SPEC-06-confirmacion-guardado-errores.md`
8. `SPEC-07-integracion-pruebas-aceptacion.md`

Cada spec habilita únicamente su entrega. No adelantar componentes, lógica o conexión descritos en specs posteriores.

## Principio de dominio

```txt
Catálogo: edita filtro.codigo, filtro.esta_en_lista_compras y filtro.activo.
Equipo: administra equipo_filtro y sus asociaciones.
```

No consultar ni modificar Supabase durante la elaboración de estos specs. Las RPC documentadas son contratos objetivo tomados de `contexto.md`.

## Base visual ERP

- Desktop compacto: `text-xs`/`text-sm`, controles `h-8`/`h-9` y filas de `44px–52px`.
- Mobile legible: tipografía visual `xs/sm`, inputs de `text-base` cuando evite zoom y targets mínimos de `44×44px`.
- Todo control habilitado y clickeable usa Tailwind `cursor-pointer`.
- Deshabilitado usa `cursor-not-allowed`; operación en curso usa `cursor-wait`.
- Sin tabla comprimida ni scroll horizontal de página en mobile.
- Iconos de `lucide-vue-next`, nunca emoji.

## Stack de implementación

```txt
Vue 3 + <script setup lang="ts">
Pinia Setup Store
Composition API
Tailwind CSS
lucide-vue-next
```

