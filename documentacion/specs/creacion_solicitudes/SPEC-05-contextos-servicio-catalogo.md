ESPECIFICACION COMPLEMENTARIA — CATALOGO DE CONTEXTOS DE SERVICIO
MODULO: Compras / Solicitudes de compra
SUBFLUJO: Paso 1 / Contexto asociado para solicitudes de servicio
FECHA DE CONTEXTO: 2026-06-26
PROYECTO: gestion operativa / solicitudes compras

=====================================================================
1. OBJETIVO
=====================================================================

Definir el catalogo de codigos operativos que se usaran en solicitudes de tipo `servicio` para ocupar el lugar funcional que hoy usa `cod_equipo`.

Estos valores no representan equipos fisicos.

Representan contextos operativos como:

- oficinas
- areas
- instalaciones
- taller
- otros

=====================================================================
2. MOTIVACION
=====================================================================

En solicitudes de servicio, no siempre existe un equipo fisico asociado.

Sin embargo:

- el contrato actual de creacion sigue usando `p_equipos text[]`
- el RPC actual exige al menos un valor en `p_equipos`
- el negocio necesita asociar un contexto operativo aunque no sea un equipo real

Por eso se define un catalogo dedicado y separado de la tabla de equipos.

=====================================================================
3. TABLA PROPUESTA
=====================================================================

Tabla sugerida:

- `public.catalogo_servicio_contexto`

Campos minimos obligatorios:

- `id`
- `codigo`
- `nombre`
- `activo`

Campos tecnicos recomendados:

- `created_at`
- `updated_at`

=====================================================================
4. SCRIPT SQL PROPUESTO
=====================================================================

```sql
create table public.catalogo_servicio_contexto (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint catalogo_servicio_contexto_pkey primary key (id),
  constraint catalogo_servicio_contexto_codigo_key unique (codigo),
  constraint catalogo_servicio_contexto_codigo_not_blank check (
    length(trim(both from codigo)) > 0
  ),
  constraint catalogo_servicio_contexto_nombre_not_blank check (
    length(trim(both from nombre)) > 0
  )
) tablespace pg_default;

create index if not exists idx_catalogo_servicio_contexto_activo
  on public.catalogo_servicio_contexto using btree (activo)
  tablespace pg_default;

create trigger trg_catalogo_servicio_contexto_updated_at
before update on public.catalogo_servicio_contexto
for each row
execute function fn_set_updated_at();
```

=====================================================================
5. DATA INICIAL PROPUESTA
=====================================================================

```sql
insert into public.catalogo_servicio_contexto (codigo, nombre, activo)
values
  ('oficina_gerencia', 'Oficina de Gerencia', true),
  ('area_verde', 'Area Verde', true),
  ('oficina_cm', 'Oficina de Cosecha Mecanizada', true),
  ('oficina_ep', 'Oficina de Equipo Pesado', true),
  ('oficina_eng', 'Oficina de Engrase', true),
  ('oficina_sg', 'Oficina de Servicios Generales', true),
  ('oficina_mectt', 'Oficina de Mecanica de Transporte', true),
  ('taller', 'Instalaciones de taller', true),
  ('otros', 'Otros', true)
on conflict (codigo) do update
set
  nombre = excluded.nombre,
  activo = excluded.activo;
```

=====================================================================
6. REGLAS FUNCIONALES
=====================================================================

6.1 Disponibilidad por rol

Estas opciones solo deben estar disponibles para:

- gerencia
- area `ALL`
- secretaria

6.2 Activacion por tipo

- Deben cargarse cuando `tipoSolicitud = servicio`.
- Este comportamiento pertenece al flujo de paso 1 y debe integrarse como ajuste complementario.

6.3 Filtro

- Solo cargar registros con `activo = true`.

6.4 Persistencia

- El valor persistido en `p_equipos` debe ser `codigo`.
- El label visible para UI debe ser `nombre`.

=====================================================================
7. LOGICA DE CARGA REQUERIDA
=====================================================================

Cuando el usuario elija `tipoSolicitud = servicio`, la UI debe:

1. mantener un solo input visual para seleccion
2. cargar este catalogo como source complementario
3. mostrar contextos disponibles solo al usuario autorizado
4. mantener equipos reales como source disponible para busqueda
5. permitir seleccionar uno o varios items desde cualquiera de los dos sources
6. seguir persistiendo esos valores dentro de `p_equipos`

Importante:

- este catalogo no reemplaza por completo la seleccion de equipo real
- en solicitudes de servicio debe convivir con la busqueda de equipos dentro de una UX unificada
- no debe contaminar la tabla `equipos`
- no debe presentarse como si fueran equipos fisicos

=====================================================================
8. IMPACTO ESPERADO EN FRONTEND
=====================================================================

Se recomienda crear una capa separada de service/composable para este catalogo, pero consumirla desde un selector unificado en paso 1 de servicios.

Motivo:

- el origen de datos es distinto
- la semantica del dato es distinta
- las reglas por rol son distintas
- la experiencia visual debe seguir siendo una sola para el usuario final

Comportamiento esperado del selector unificado:

- si el usuario tiene acceso al catalogo:
  - al enfocar el input puede ver contextos
  - al escribir tambien puede buscar equipos
- si el usuario no tiene acceso al catalogo:
  - el mismo input debe funcionar solo con equipos
- la seleccion final debe seguir entrando al mismo arreglo del wizard
- el store no debe necesitar distinguir visualmente el origen una vez seleccionado

=====================================================================
9. CRITERIOS DE ACEPTACION
=====================================================================

1. Existe un catalogo persistente separado para contextos de servicio.
2. Los codigos se pueden activar o desactivar sin tocar codigo frontend.
3. La UI solo muestra estas opciones cuando el tipo es `servicio`.
4. La UI usa `nombre` como texto visible y `codigo` como valor persistido.
5. Los valores seleccionados siguen viajando en `p_equipos`.
6. En solicitudes de servicio, equipos y contextos conviven dentro de un solo selector.
7. Si el usuario no es `gerencia`, `secretaria` o `area ALL`, el selector de servicio funciona solo con equipos.
