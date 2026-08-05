# SPEC-01 — Contratos de datos y servicio Supabase

## Objetivo

Definir los tipos del dominio y una capa de servicios de solo lectura para el proyecto Supabase Equipos y el esquema `engrase`.

## Dependencia

Implementar después de `SPEC-00`.

## Archivos a crear

```txt
src/stores/dbequipos/engrase/filtrosEngrase.types.ts
src/stores/dbequipos/engrase/filtrosEngrase.service.ts
src/stores/dbequipos/engrase/filtrosEngrase.mappers.ts
src/stores/dbequipos/engrase/filtrosEngrase.helpers.ts
```

## Cliente y esquema

- Reutilizar `supabaseEquipos` de `src/lib/supabase.ts`.
- No crear otro cliente y no cambiar globalmente su esquema predeterminado.
- Toda tabla o vista de Engrase debe consultarse así:

```ts
supabaseEquipos.schema('engrase').from('nombre_relacion')
```

- Storage se consulta con `supabaseEquipos.storage` porque el bucket no pertenece a un esquema SQL.
- Antes de dar por terminada la implementación, ejecutar una consulta autenticada y verificar que `engrase` esté expuesto en Data API y que RLS permita `SELECT`.

## Fuentes de datos

```txt
engrase.vw_equipos_con_imagen_main
engrase.tipo_equipo
engrase.equipo
engrase.etapa
engrase.equipo_etapa
engrase.tipo_filtro
engrase.filtro
engrase.equipo_filtro
engrase.filtro_equivalencia
```

`equipo_filtro_historial` no se necesita para la primera vista de lectura y no debe cargarse preventivamente.

## Contratos mínimos

Definir, como mínimo:

```txt
EquipoEngraseRow
EquipoEngraseListItem
TipoEquipoEngrase
EtapaEngrase
TipoFiltroEngrase
FiltroEngrase
EquipoFiltroRow
EquipoFiltroDetalle
FiltroEquivalenciaRow
FiltroCodigoSugerencia
FiltrosEngraseQuery
FiltrosEngraseEstadoEquipo = 'activo' | 'descartado'
```

Reglas de nombres de UI:

- `tipo_equipo` se presenta como **Tipo de equipo**.
- `subtipo` se presenta como **Modelo**.
- Los nombres originales de columnas no se alteran en los contratos de filas de BD.
- Los modelos de UI pueden renombrar mediante mapper, pero no deben perder trazabilidad.

## Operaciones de servicio

El servicio debe exponer funciones enfocadas, no una consulta monolítica:

```txt
obtenerEquipos(filtros)
obtenerTiposEquipo()
obtenerTiposFiltro()
obtenerEtapas()
obtenerFiltrosDeEquipo(equipoId)
obtenerEquivalenciasActivas(filtroOriginalIds)
buscarSugerenciasCodigo(texto, limite)
resolverEquiposPorCodigoExacto(codigo)
crearUrlFirmadaImagen(path)
```

## Búsqueda de códigos

- Las sugerencias aceptan coincidencia parcial.
- Limitar la cantidad de sugerencias; valor recomendado: 10.
- Aplicar debounce desde la capa de orquestación, no dentro del service.
- No buscar sugerencias con texto vacío; longitud mínima recomendada: 2 caracteres.
- Cada sugerencia debe distinguir si el código es original, equivalente o ambos.
- Seleccionar una sugerencia ejecuta una búsqueda exacta por el código seleccionado.
- La búsqueda final no usa coincidencia parcial.
- La exactitud debe respetar la distinción almacenada entre códigos como `4T-6788` y `4t-6788`.
- Si Supabase o Postgres no garantizan comparación sensible a mayúsculas con la operación elegida, filtrar/verificar el valor exacto antes de aceptar el resultado.

## Resolución mediante equivalencias

La búsqueda exacta debe encontrar equipos por dos recorridos:

```txt
código original → equipo_filtro → equipo

código equivalente → filtro_equivalencia activa
                  → filtro original → equipo_filtro → equipo
```

- No mostrar fabricantes: no existen en el modelo confirmado.
- Solo usar equivalencias con `activo = true`.
- Evitar duplicar un equipo cuando el código coincida por más de un recorrido.

## Imágenes privadas

- La vista base es `engrase.vw_equipos_con_imagen_main`.
- Usar `main_storage_path` solamente si `tiene_imagen_main` es verdadero.
- Crear URL firmada temporal desde `imagenes-equipos`.
- No tratar `main_storage_path` como URL pública.
- No firmar rutas nulas.
- La UI debe poder continuar si falla la firma de una imagen.
- Usar `imagen_actualizada_en` como parte de la clave de caché lógica para evitar miniaturas obsoletas.

## Rendimiento

- Seleccionar únicamente columnas utilizadas.
- Cargar equivalencias en lote por IDs, evitando una consulta por tarjeta.
- No generar URLs firmadas para todos los equipos si no están próximos al área visible.
- Cancelar o ignorar respuestas obsoletas de sugerencias.

## Seguridad

- Solo usar la clave pública/anon configurada en el frontend.
- Nunca añadir `service_role`.
- La sesión autenticada de `supabaseEquipos` es obligatoria.
- La aplicación inicia sesión actualmente en el proyecto Equipos; manejar claramente el caso de sesión ausente o expirada.
- No realizar `insert`, `update`, `upsert` ni `delete`.

## Criterios de aceptación

- Ningún componente o vista llama `.from()`, `.schema()`, `.rpc()` o Storage directamente.
- La vista de equipos se consulta desde `engrase` con una sesión autenticada.
- La búsqueda exacta funciona para originales y equivalentes.
- Las sugerencias parciales no se confunden con el resultado definitivo.
- Los códigos conservan su capitalización.
- Las imágenes privadas se muestran mediante URL firmada o fallback.

