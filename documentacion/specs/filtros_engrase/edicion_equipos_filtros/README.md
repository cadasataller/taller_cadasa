# Edición de equipos y filtros — orden SDD

## Objetivo del conjunto

Implementar la edición completa de un equipo de Engrase como una pantalla independiente, con borrador transaccional para datos, etapas, filtros y aceites, y administración inmediata de la imagen principal.

Cada spec es una unidad de entrega verificable. Deben implementarse en este orden:

1. `SPEC-01-contratos-tipos-servicios.md`
2. `SPEC-02-ruta-store-borrador-carga.md`
3. `SPEC-03-datos-equipo-etapas-tipo-nuevo.md`
4. `SPEC-04-filtros-busqueda-edicion-eliminacion.md`
5. `SPEC-05-crear-filtro-tipo-temporal.md`
6. `SPEC-06-aceites-sistemas.md`
7. `SPEC-07-administrar-imagen-storage.md`
8. `SPEC-08-payload-guardado-integracion-pruebas.md`

## Decisiones inmutables para toda la serie

- La edición se abre como pantalla completa desde el listado.
- Todo drawer o bottom sheet se superpone sobre la vista de edición, nunca sobre el listado.
- Desktop usa drawer lateral; móvil y tablet usan bottom sheet.
- Las imágenes son guía aproximada de composición y estilo.
- Los contratos RPC determinan los campos y comportamientos reales.
- `subtipo` es el modelo o descripción del equipo.
- La búsqueda para asignar filtros usa sólo código original, nunca equivalencias.
- Los drawers de tipo, filtro y aceite sólo modifican el borrador local.
- La imagen se administra inmediatamente y de forma independiente.
- La RPC general recibe únicamente secciones y propiedades con cambios.
- Después de guardar se reemplaza el equipo del listado con `equipo_lista` y se invalida su detalle cacheado.
- Si cambia el código, después de la RPC general se mueve físicamente la imagen desde la ruta persistida más reciente hacia la ruta devuelta.
- Si ese movimiento falla, no se repite la RPC: queda una sincronización recuperable.

## Reglas técnicas globales

- Vue 3, Composition API y `<script setup lang="ts">`.
- Setup stores de Pinia y `storeToRefs()` para estado/getters.
- Props hacia abajo, eventos tipados hacia arriba.
- Servicios como única capa de acceso a Supabase.
- No crear, generar ni modificar archivos `Database`, `database.types.ts` o equivalentes para registrar, limitar o tipar los argumentos de estas RPC.
- Tipar cada llamada en la firma de su función de servicio, siguiendo el patrón de `solicitudesCompraCrear.service.ts`: parámetros primitivos directos para llamadas simples y un tipo local de argumento únicamente cuando el payload sea complejo.
- Los tipos locales de argumentos y respuestas pertenecen a esta funcionalidad; no representan ni intentan reproducir el esquema global de Supabase.
- La respuesta de una RPC puede convertirse al tipo local concreto después de comprobar `error`, sin introducir `any` ni `unknown`.
- Usar `vue-multiselect@3.5.0` como base de los selectores de catálogos, sugerencias, multiselección y creación temporal definidos en `SPEC-03` a `SPEC-06`.
- Encapsular `vue-multiselect` en adaptadores locales con props y emits estrictamente tipados; no propagar tipos laxos de la dependencia al store ni a los formularios.
- Importar `vue-multiselect/dist/vue-multiselect.css` una sola vez y personalizarlo con los tokens existentes de la aplicación.
- Está prohibido usar `any` y `unknown` en todos los archivos creados o modificados por esta funcionalidad, incluidos tests, mocks, casts y eventos.
- Está prohibido usar `Record<string, unknown>`, `as any` o `as unknown`.
- Todo botón disponible debe declarar `cursor-pointer`.
- Todo botón deshabilitado debe usar `disabled` y `cursor-not-allowed`, sin `cursor-pointer`.
- Usar `lucide-vue-next` para iconos funcionales cuando aporten significado.
- No usar emojis ni caracteres de texto como sustitutos de iconos.
- Todo botón sólo con icono requiere `aria-label`.
- No usar `v-html`.
- Mantener targets táctiles mínimos de 44 px, foco visible y mensajes de error cercanos al campo.
- Respetar `prefers-reduced-motion`.

## Referencias del conjunto

- `context.md`
- `context_view.md`
- `context_payload_rpc.md`
- `view_edit_equipo.png`
- `drawer_add_filter.png`
- `drawer_add_new_filters.png`
- `drawer_new_equipo_type.png`
- `drawer_add_aceite_to_equipo.png`

Las referencias siguen disponibles para contexto, pero cada spec contiene el alcance, reglas, pruebas y criterios necesarios para su propia implementación.
