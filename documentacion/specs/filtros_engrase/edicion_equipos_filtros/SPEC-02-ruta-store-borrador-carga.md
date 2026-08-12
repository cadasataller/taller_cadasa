# SPEC-02 — Ruta, store, carga inicial y ciclo de vida del borrador

## 1. Objetivo

Crear la pantalla completa de edición, su ruta protegida y el store Pinia que mantiene el snapshot original y el borrador local. Al finalizar este spec debe existir una vista navegable con estados de carga, error y salida segura, aunque las secciones funcionales todavía sean contenedores básicos.

## 2. Fuentes de verdad

- Contratos de `context.md` y `context_payload_rpc.md`.
- Flujo de pantalla completa descrito en `context_view.md`.
- `view_edit_equipo.png` como guía de jerarquía visual.
- Las imágenes restantes sólo anticipan drawers que se implementan después.

## 3. Dependencias

- Requiere `SPEC-01` terminado.
- Es requisito para `SPEC-03` a `SPEC-08`.

## 4. Alcance

Incluye:

- ruta de edición;
- conexión del botón existente del listado;
- store setup de Pinia;
- carga paralela de equipo y auxiliares;
- snapshot y borrador independientes;
- detección de cambios;
- estado del overlay activo;
- confirmación al abandonar;
- regreso al listado sin perder su estado montado cuando la arquitectura de rutas lo permita;
- shell visual responsive de edición.

No incluye:

- formularios completos;
- drawers funcionales;
- generación final de payload;
- persistencia;
- administración de imagen.

## 5. Archivos

Crear:

```text
src/views/engrase/EquipoEngraseEditarView.vue
src/components/engrase/edicion/EquipoEdicionShell.vue
src/components/engrase/edicion/EquipoEdicionHeader.vue
src/components/engrase/edicion/EquipoEdicionFooter.vue
src/composables/engrase/useEquipoEngraseEditor.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.ts
src/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.store.test.ts
```

Modificar:

```text
src/router/index.ts
src/views/engrase/FiltrosEngraseView.vue
src/components/engrase/filtros/FiltrosEquipoPanel.vue
```

## 6. Ruta y permisos

Ruta requerida:

```text
/engrase/filtros/equipos/:codigo/editar
```

Nombre recomendado:

```text
EquipoEngraseEditar
```

Metadatos obligatorios:

```ts
requiredFeatures: [
  "module_engrase",
  "ver_filtros_engrase",
  "editar_filtros_engrase",
]
```

El botón `Editar equipo` del panel actual debe navegar usando el código, no abrir un drawer sobre el listado.

## 7. Regla estructural principal

La edición es una pantalla completa. El listado no debe permanecer visible debajo de los drawers internos.

Flujo:

```text
listado → ruta de edición → drawer interno sobre edición → cierre del drawer → edición
```

No implementar:

```text
listado → drawer de edición
listado visible → drawer de filtro
```

## 8. Store Pinia

Usar setup store con Composition API. Estado mínimo:

```ts
interface EquipoEdicionStoreState {
  codigoOriginal: string | null
  original: EquipoEdicionSnapshot | null
  draft: EquipoEdicionDraft | null
  auxiliares: AuxiliaresEdicionEquipo | null
  activeOverlay: EquipoEdicionOverlay | null
  loading: boolean
  saving: boolean
  loadError: EquipoEdicionError | null
  saveError: EquipoEdicionError | null
}
```

El store debe retornar todas sus propiedades reactivas. En componentes se usa `storeToRefs()` para estado y getters; las acciones pueden destructurarse directamente.

`original` y `draft` no pueden compartir referencias mutables. Modificar el borrador nunca debe alterar el snapshot.

## 9. Modelo de borrador

Debe contener:

- datos del equipo;
- etapas;
- filtros;
- aceites;
- estado persistido actual de imagen;
- metadatos locales de operación.

Los cambios derivados se calculan con `computed`, no con watchers que escriban flags redundantes.

Getters mínimos:

- `isReady`;
- `isDirty`;
- `hasActiveOverlay`;
- `canSave`;
- `activeFiltersCount`;
- `activeStagesCount`;
- `activeOilsCount`.

## 10. Carga inicial

Al entrar a la ruta:

1. Validar `route.params.codigo` como cadena no vacía.
2. Activar carga.
3. Ejecutar en paralelo:
   - `rpc_obtener_equipo_para_edicion`;
   - `rpc_obtener_auxiliares_edicion_equipo`.
4. Construir snapshot.
5. Clonar un borrador independiente.
6. Establecer la imagen persistida actual usando el equipo disponible en el store del listado o mediante los campos compatibles disponibles.
7. Mostrar contenido.

Si el código no existe, mostrar error de ámbito completo con acciones `Volver a equipos` y `Reintentar` cuando corresponda.

No seleccionar silenciosamente otro equipo.

## 11. Recargas y carreras

- Si cambia el parámetro de ruta, cancelar lógicamente la respuesta anterior mediante un identificador de solicitud.
- Una respuesta obsoleta no puede sobrescribir un borrador más reciente.
- No usar watch profundo sobre todo el borrador.
- Los side effects de ruta viven en el composable o la vista, no en getters.
- Al desmontar, limpiar listeners y bloqueo de scroll.

## 12. Salida segura

Si `isDirty` es falso:

- volver inmediatamente al listado.

Si `isDirty` es verdadero:

- interceptar botón volver, cancelar y navegación de router;
- mostrar confirmación accesible;
- opciones: `Seguir editando` y `Descartar cambios`;
- no guardar automáticamente.

La imagen se persiste inmediatamente en specs posteriores y no forma parte de `isDirty` una vez que la RPC de imagen responde correctamente.

## 13. Shell visual

La vista debe seguir la intención de `view_edit_equipo.png`:

- nodo raíz con `bg-second text-gray-900`, usando los tokens base definidos dentro de `@theme` en `src/index.css`;
- fondo operativo claro, superficies, bordes, estados, sombras y focos construidos sólo con esos tokens base;
- encabezado con regreso, código, tipo, subtipo, estado y etapas;
- tres secciones principales en tarjetas;
- barra inferior de acciones;
- jerarquía compacta de aplicación administrativa, no landing page;
- `text-sm` como texto operativo predeterminado, `text-xs` para metadatos/ayudas y `text-lg` como máximo para el título principal;
- ningún texto inferior a 12 px ni títulos `text-xl` o mayores;
- controles de 36–40 px visuales en desktop y área táctil mínima de 44 px en móvil;
- separación `gap-2` dentro de grupos y `gap-3`/`gap-4` entre secciones;
- tarjetas con `p-3`/`p-4`, `rounded-md`/`rounded-lg` y sombra discreta;
- sin campos adicionales de las otras maquetas.

No usar colores literales, clases arbitrarias de color ni paletas externas como `slate-*`, `blue-*` o `red-*`. Las acciones usan `main*`/`accent*`; las superficies `second*`/`white`; los neutrales `gray-*`; y los estados los pares `success`, `warning`, `danger` e `info` con su correspondiente `*-bg`.

Desktop:

- contenido en una columna amplia;
- footer de acciones fijo o sticky sin cubrir contenido;
- espacio reservado bajo el contenido.

Móvil:

- tarjetas apiladas;
- controles a ancho disponible;
- footer respetando safe area;
- sin scroll horizontal.

## 14. Mapa inicial de componentes

```text
EquipoEngraseEditarView
└── EquipoEdicionShell
    ├── EquipoEdicionHeader
    ├── slot/sección Datos
    ├── slot/sección Filtros
    ├── slot/sección Aceites
    ├── EquipoEdicionFooter
    └── host de overlays
```

Responsabilidades:

- La vista conecta ruta y composable.
- El shell compone layout.
- El header sólo presenta resumen y navegación.
- El footer emite `cancel` y `save`; todavía no persiste.
- El store posee el borrador.

## 15. Reglas Vue y TypeScript

- Usar Vue 3, Composition API y `<script setup lang="ts">`.
- Orden SFC: script, template, style.
- Props de sólo lectura y eventos tipados.
- Está prohibido usar `any` o `unknown`, incluyendo casts, payloads, mocks y helpers.
- No usar `Record<string, unknown>`.
- No crear ni modificar `Database`, `database.types.ts` o equivalentes para la carga RPC; el store consume exclusivamente funciones de servicio tipadas según `SPEC-01`.
- Los argumentos simples permanecen en la firma del service y los complejos usan tipos locales de la funcionalidad, nunca tipos globales del esquema.
- Usar `shallowRef` para primitivos locales y `computed` para derivados.
- No mutar props.
- No declarar lógica de negocio dentro del template.
- No usar `v-html`.

## 16. Botones e iconografía

Todos los botones disponibles deben incluir explícitamente `cursor-pointer`.

Botones deshabilitados:

- deben usar el atributo `disabled`;
- deben mostrar `cursor-not-allowed`;
- no deben conservar `cursor-pointer` mientras estén deshabilitados.

Usar iconos de `lucide-vue-next` cuando aporten significado:

- `ArrowLeft` para volver;
- `Save` para guardar;
- `X` para cancelar/cerrar;
- `RefreshCw` para reintentar;
- `AlertTriangle` para confirmación de descarte.

Los botones sólo con icono requieren `aria-label`. Los iconos decorativos usan `aria-hidden="true"`.

## 17. Accesibilidad

- Un único `h1` para “Editar equipo”.
- Foco visible en controles.
- Regreso disponible por teclado.
- Mensajes de carga y error anunciables.
- Confirmación de salida con foco atrapado y retorno al disparador.
- Targets táctiles mínimos de 44 px.
- En móvil, los inputs y selectores usan `text-base` aunque el resto de la interfaz conserve densidad `text-sm`/`text-xs`.
- No depender sólo de color para estados.
- Respetar `prefers-reduced-motion`.

## 18. Pruebas

Cubrir:

- permiso requerido en ruta;
- navegación desde el botón del listado;
- carga paralela exitosa;
- equipo no encontrado;
- error parcial convertido en error de carga completo;
- snapshot y borrador sin referencias compartidas;
- `isDirty` falso al iniciar;
- confirmación al salir con cambios;
- salida directa sin cambios;
- respuesta obsoleta ignorada;
- layout sin montar listado debajo de edición.
- escala tipográfica sin valores menores a 12 px;
- densidad desktop y targets móviles conforme a la escala ERP.
- uso exclusivo de los tokens base de `@theme` y ausencia de colores ajenos a ellos.

## 19. Criterios de aceptación

- La edición abre como ruta completa.
- La ruta exige `editar_filtros_engrase`.
- El listado no queda como fondo de los futuros drawers.
- La carga usa las dos RPC en paralelo.
- Existe una única fuente de verdad del borrador.
- El snapshot no se muta.
- La navegación protege cambios pendientes.
- El shell aplica la escala ERP: texto general `text-sm`, mínimo `text-xs`, título máximo `text-lg` y densidad responsive definida.
- El shell usa únicamente el tema principal declarado en `@theme` y no contiene valores cromáticos literales ni paletas paralelas.
- Todos los botones disponibles muestran `cursor-pointer`.
- La iconografía usa Lucide.
- No existe `any` ni `unknown` en archivos creados o modificados.
- `pnpm typecheck` y las pruebas del spec pasan.
