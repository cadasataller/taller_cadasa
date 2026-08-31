# Spec — Navegación del shell responsivo

## Propósito

Define la navegación global del ERP. Mantiene la jerarquía de módulos y adapta
el modo de interacción a escritorio, tablet y teléfono sin alterar las rutas,
los permisos ni la lógica de negocio de cada módulo.

## Alcance

- Sidebar tipo icon rail expandible en escritorio (`lg` o superior).
- Navegación de tablet y teléfono común para anchos menores a `lg`.
- Barra inferior con Inicio, Mantenimiento, Seguimiento, Compras y Más.
- Bottom sheet de módulos secundarios y selector de destinos de Engrase.
- Agrupación visual de la navegación de escritorio.

No incluye contadores, notificaciones, fecha operativa global ni cambios de
RPC o base de datos.

## Fuente de verdad

- Rutas: `src/router/index.ts`.
- Permisos: `app_feature_access`, mediante `useFeatureAccessStore`.
- Shell: `src/layouts/DefaultLayout.vue`.
- Iconos: `lucide-vue-next`.

La interfaz solo muestra rutas autorizadas. No debe usar la navegación como
sustituto de los guards del router.

## Breakpoints

| Rango           | Navegación                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| `< lg`          | Experiencia de tablet/teléfono: topbar y bottom navigation. No se muestra sidebar.  |
| `lg` o superior | Sidebar lateral, inicialmente expandido, que el usuario puede contraer a icon rail. |

El breakpoint `lg` es intencional: tablet utiliza la misma experiencia de
navegación que teléfono, incluso en orientación horizontal.

## Escritorio

El sidebar inicia compacto y tiene dos estados durante la sesión de la vista:

1. Compacto (predeterminado): mide `56px`, muestra iconos y presenta nombres
   mediante una etiqueta visual al pasar el cursor o recibir foco.
2. Expandido: mide `256px` y muestra icono, etiqueta y grupos.

Los grupos son:

```text
Dashboard

Operación
├─ Mantenimiento
├─ Reparaciones
├─ Calificaciones
├─ Engrase
└─ Seguimiento

Gestión
├─ Compras
└─ Catálogo

Sistema
└─ Panel admin
```

Un destino activo mantiene estilo destacado. Cuando el rail está compacto,
Engrase y Seguimiento despliegan un panel flotante a la derecha; el rail no se
expande. Cuando está expandido, las opciones se muestran anidadas bajo el
agrupador. Elegir un destino hijo cierra su menú inmediatamente; para volver a
verlo se debe activar de nuevo el agrupador.

El botón de expansión vive en la parte superior del sidebar. El nombre de la
marca no se muestra dentro del rail para preservar el ancho compacto.

La lista de módulos se desplaza internamente. La sesión queda fija al fondo y
no forma parte del scroll. Gradientes en el borde superior o inferior indican
que existen módulos fuera del área visible en la dirección correspondiente.

El navbar mide `48px` y se organiza en una sola fila: fecha actual a la
izquierda (`dom, 30 agos 2026`), `Bienvenido {nombre}` al centro y área con
avatar de perfil a la derecha.

## Engrase

`Engrase` es un agrupador, no una ruta. No se debe añadir una pantalla ni una
ruta `/engrase`.

Sus destinos autorizables son:

```text
Engrase
├─ Filtros     → /engrase/filtros
└─ Catálogo    → /engrase/catalogo
```

En cualquier destino hijo el agrupador Engrase permanece activo. La visibilidad
de cada hijo depende de `ver_filtros_engrase` y `ver_catalogo_engrase`.

## Tablet y teléfono

La barra inferior es fija y tiene cinco posiciones visuales:

```text
Inicio | Mantenimiento | Seguimiento | Compras | Más
```

Los cuatro destinos directos aparecen solamente si el usuario tiene permiso.
`Más` siempre conserva su posición y contiene los destinos secundarios
autorizados: Reparaciones, Calificaciones, Catálogo, Panel admin y Engrase.

Al elegir `Más` se abre un bottom sheet modal sobre la vista actual. Al elegir
Engrase, el sheet cambia a su selector de Filtros/Catálogo; volver restaura el
listado de módulos sin navegar. Entrar a uno de sus destinos cierra el sheet.

El área de contenido reserva `76px` inferiores en `< lg` para que mapas,
formularios y listas no queden debajo de la barra fija.

## Accesibilidad

- Los agrupadores y el botón Más son botones con `aria-expanded`.
- El sheet usa `role="dialog"`, `aria-modal="true"` y cierra al pulsar el
  backdrop o su botón de cierre.
- Los botones de rail compacto conservan nombre accesible mediante `title`.

Evolución recomendada: añadir gestión de foco, Escape y focus trap si el sheet
adopta flujos con formularios o acciones destructivas.

## Criterios de aceptación

- En un viewport de 1024 px el sidebar está disponible y puede compactarse.
- En un viewport de 1023 px no existe sidebar y se ve la barra inferior.
- Ningún módulo sin permiso aparece en desktop, tablet o teléfono.
- Engrase nunca navega a una ruta padre; presenta primero Filtros/Catálogo.
- En `/engrase/filtros` y `/engrase/catalogo`, Engrase y Más quedan activos en
  la navegación correspondiente.
- Las rutas fullscreen siguen ocultando todo el shell.
- El contenido móvil/tablet puede desplazarse sin quedar tapado por la barra
  inferior.
- El sidebar inicia compacto a 56 px; sus etiquetas aparecen como tooltip
  estilizado y no dependen del tooltip nativo del navegador.
- Si los módulos superan la altura disponible, solo la lista navega; Cerrar
  sesión permanece fijo y los gradientes indican el contenido desplazable.
