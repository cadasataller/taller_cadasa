# SPEC-00 — Base del módulo, navegación y permisos

> Módulo: Engrase / Filtros  
> Ruta confirmada: `/engrase/filtros`  
> Alcance de la primera entrega: consulta y filtrado exclusivamente

## Contexto obligatorio

Antes de implementar, leer completamente:

```txt
documentacion/specs/filtros_engrase/context.md
documentacion/specs/filtros_engrase/context_2.md
documentacion/specs/filtros_engrase/context_view_vault.md
documentacion/specs/filtros_engrase/mockup_filtros_view.png
```

## Objetivo

Crear la entrada del módulo Engrase, su subnavegación y la protección por funcionalidades sin implementar todavía consultas ni paneles funcionales.

## Decisiones confirmadas

- El elemento padre se llama `Engrase`.
- Las subpestañas disponibles son `Filtros` y `Catálogo`.
- La ruta canónica es `/engrase/filtros`.
- `module_engrase` controla la visibilidad del módulo padre.
- `ver_filtros_engrase` controla la visibilidad de la subpestaña y el acceso a la ruta.
- `editar_filtros_engrase` controla adicionalmente la visibilidad y el acceso a `Catálogo`.
- No usar el área del perfil como sustituto de `app_feature_access`.

## Archivos previstos

```txt
src/router/index.ts
src/layouts/DefaultLayout.vue
src/views/engrase/FiltrosEngraseView.vue
```

## Navegación desktop

- `Engrase` debe comportarse como elemento padre desplegable dentro del sidebar.
- Al expandirse muestra `Filtros` con sangría visual y estado activo propio.
- Cuando el usuario tiene permisos de edición también muestra `Catálogo`, con estado activo independiente.
- El padre se considera activo cuando la ruta comienza con `/engrase`.
- Al entrar directamente en `/engrase/filtros`, el grupo debe aparecer expandido.
- Colapsar el grupo no cambia la ruta actual.
- No agregar una ruta funcional `/engrase` que compita con la subruta; si se requiere redirección, debe llevar a `/engrase/filtros` y aplicar los mismos permisos.

## Navegación móvil

- `Engrase` aparece como tab en la navegación móvil solamente con `module_engrase`.
- Al tocarlo se muestra una lista de subpestañas.
- Cada subpestaña se presenta como botón táctil de ancho completo, un botón por fila.
- `Filtros` solo aparece con `ver_filtros_engrase`.
- `Catálogo` aparece con `ver_filtros_engrase` y `editar_filtros_engrase`.
- Tocar `Filtros` navega a `/engrase/filtros`.
- Debe ser posible cerrar la lista sin navegar.
- El patrón debe admitir subpestañas futuras sin reescribir el template.

## Protección de ruta

- Añadir `meta.requiredFeature: 'ver_filtros_engrase'` a la ruta.
- El guard debe esperar la carga de `useFeatureAccessStore`.
- Si no existe acceso, redirigir a una ruta permitida y evitar ciclos de redirección.
- La ocultación del menú no reemplaza la protección de la ruta.
- Mientras se resuelven permisos no debe parpadear contenido restringido.

## Componentes y responsabilidades

```txt
DefaultLayout.vue
  - Renderiza grupos y enlaces permitidos.
  - Controla expansión desktop y selector móvil.

FiltrosEngraseView.vue
  - Superficie delgada de composición.
  - No consulta Supabase directamente.
  - Será completada por los specs posteriores.
```

## No hacer

- No implementar edición, creación ni eliminación.
- No usar `editar_filtros_engrase` para mostrar botones en esta entrega.
- No consultar Supabase desde el layout, router o vista.
- No codificar usuarios o correos permitidos en frontend.
- No duplicar la lógica de `app_feature_access`.

## Criterios de aceptación

- Un usuario sin `module_engrase` no ve Engrase.
- Un usuario con el módulo pero sin `ver_filtros_engrase` no ve Filtros ni puede abrir su ruta.
- Desktop muestra el grupo desplegable.
- Móvil muestra las subpestañas como botones, uno por fila.
- La navegación directa queda protegida.
- La vista inicial no contiene acciones de escritura.
