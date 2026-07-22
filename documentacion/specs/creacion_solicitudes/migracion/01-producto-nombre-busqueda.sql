-- ================================================================
-- MIGRACION 01
-- TEMA: producto.nombre + descripcion opcional + RPC de busqueda
-- MODULO: compras / solicitudes de compra
-- FECHA: 2026-07-02
-- EJECUCION: manual
-- ================================================================

begin;

-- ------------------------------------------------
-- 1. AGREGAR COLUMNA nombre AL CATALOGO DE PRODUCTOS
-- ------------------------------------------------

alter table public.producto
  add column if not exists nombre text null;

comment on column public.producto.nombre is
'Nombre principal del producto para UI, busqueda y seleccion en solicitudes.';

alter table public.producto
  alter column descripcion drop not null;

-- ------------------------------------------------
-- 2. REGLAS DE CALIDAD MINIMAS
-- ------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'producto_nombre_not_blank'
      and conrelid = 'public.producto'::regclass
  ) then
    alter table public.producto
      add constraint producto_nombre_not_blank
      check (
        nombre is null
        or length(trim(nombre)) > 0
      );
  end if;
end;
$$;

-- ------------------------------------------------
-- 3. MIGRAR DATA ACTUAL
-- ------------------------------------------------
-- Decision confirmada:
-- - el valor historico de descripcion actual pasa a nombre
-- - descripcion queda en null

update public.producto
set nombre = nullif(trim(descripcion), '')
where nombre is null;

update public.producto
set descripcion = null
where descripcion is not null;

-- ------------------------------------------------
-- 4. RPC DE BUSQUEDA DE PRODUCTOS
-- ------------------------------------------------
-- Reglas confirmadas:
-- - buscar por codigo, nombre y unidad
-- - descripcion ya no participa en la busqueda
-- - la salida principal para UI sera nombre
-- - solo deben salir productos activos no temporales

drop function if exists public.rpc_buscar_productos_solicitud_go(text, integer);

create or replace function public.rpc_buscar_productos_solicitud_go(
  p_query text,
  p_limit integer default 10
)
returns table (
  producto_id uuid,
  cod_producto text,
  nombre text,
  unidad_mostrar text,
  unidad_medida_id bigint,
  unidad_codigo text,
  unidad_abreviatura text
)
language sql
security definer
set search_path to public
as $$
  with base as (
    select
      p.id as producto_id,
      p.cod_producto,
      p.nombre,
      p.unidad_medida_id,
      um.codigo as unidad_codigo,
      um.abreviatura as unidad_abreviatura,
      coalesce(nullif(trim(um.abreviatura), ''), nullif(trim(um.descripcion), ''), um.codigo) as unidad_mostrar
    from public.producto p
    join public.unidad_medida um
      on um.id = p.unidad_medida_id
    where p.activo = true
      and coalesce(p.es_temporal, false) = false
      and nullif(trim(p.nombre), '') is not null
  )
  select
    b.producto_id,
    b.cod_producto,
    b.nombre,
    b.unidad_mostrar,
    b.unidad_medida_id,
    b.unidad_codigo,
    b.unidad_abreviatura
  from base b
  where
    nullif(trim(coalesce(p_query, '')), '') is not null
    and (
      b.cod_producto ilike '%' || trim(p_query) || '%'
      or b.nombre ilike '%' || trim(p_query) || '%'
      or b.unidad_codigo ilike '%' || trim(p_query) || '%'
      or coalesce(b.unidad_abreviatura, '') ilike '%' || trim(p_query) || '%'
      or coalesce(b.unidad_mostrar, '') ilike '%' || trim(p_query) || '%'
    )
  order by
    case
      when b.cod_producto ilike trim(p_query) || '%' then 0
      when b.nombre ilike trim(p_query) || '%' then 1
      else 2
    end,
    b.nombre asc,
    b.cod_producto asc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

grant execute on function public.rpc_buscar_productos_solicitud_go(text, integer)
to authenticated;

commit;

-- ------------------------------------------------
-- 5. FASE POSTERIOR
-- ------------------------------------------------
-- Ejecutar solo cuando la app ya use nombre como campo obligatorio en todos
-- los flujos que crean o sincronizan productos.
--
-- begin;
--
-- update public.producto
-- set nombre = cod_producto
-- where nullif(trim(nombre), '') is null;
--
-- alter table public.producto
--   alter column nombre set not null;
--
-- commit;
