-- ================================================================
-- MIGRACION 02
-- TEMA: catalogo_contexto_destino + solicitud_contexto_destino
-- MODULO: compras / solicitudes de compra
-- FECHA: 2026-07-02
-- EJECUCION: manual
-- ================================================================

begin;

-- ------------------------------------------------
-- 1. RENOMBRAR CATALOGO ACTUAL
-- ------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'catalogo_servicio_contexto'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'catalogo_contexto_destino'
  ) then
    alter table public.catalogo_servicio_contexto
      rename to catalogo_contexto_destino;
  end if;
end;
$$;

-- ------------------------------------------------
-- 2. AMPLIAR ESTRUCTURA DEL CATALOGO
-- ------------------------------------------------

alter table public.catalogo_contexto_destino
  add column if not exists tipo_origen text null,
  add column if not exists restringido_a_servicios boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalogo_contexto_destino_tipo_origen_chk'
      and conrelid = 'public.catalogo_contexto_destino'::regclass
  ) then
    alter table public.catalogo_contexto_destino
      add constraint catalogo_contexto_destino_tipo_origen_chk
      check (
        tipo_origen in (
          'area_operativa',
          'instalacion_taller',
          'grupo_equipo',
          'otros'
        )
      );
  end if;
end;
$$;

comment on column public.catalogo_contexto_destino.tipo_origen is
'Tipo del destino seleccionado desde catalogo. No incluye equipo porque equipo viene de otra fuente.';

comment on column public.catalogo_contexto_destino.restringido_a_servicios is
'Si es true, solo aparece para admin, gerencia y secretaria cuando la solicitud es de tipo servicio.';

-- ------------------------------------------------
-- 3. MIGRAR CATALOGO EXISTENTE
-- ------------------------------------------------
-- Los registros historicos del antiguo catalogo eran exclusivamente para
-- escenarios de servicio, por eso se migran como restringidos.

update public.catalogo_contexto_destino
set
  tipo_origen = case
    when codigo = 'taller' then 'instalacion_taller'
    when codigo = 'otros' then 'otros'
    else 'area_operativa'
  end,
  restringido_a_servicios = true
where tipo_origen is null;

alter table public.catalogo_contexto_destino
  alter column tipo_origen set not null;

-- ------------------------------------------------
-- 4. RENOMBRAR INDICE Y TRIGGER SI EXISTEN
-- ------------------------------------------------

do $$
begin
  if exists (
    select 1
    from pg_class
    where relkind = 'i'
      and relname = 'idx_catalogo_servicio_contexto_activo'
  ) then
    alter index public.idx_catalogo_servicio_contexto_activo
      rename to idx_catalogo_contexto_destino_activo;
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgname = 'trg_catalogo_servicio_contexto_updated_at'
  ) then
    alter trigger trg_catalogo_servicio_contexto_updated_at
      on public.catalogo_contexto_destino
      rename to trg_catalogo_contexto_destino_updated_at;
  end if;
end;
$$;

-- ------------------------------------------------
-- 5. RECREAR POLICIES CON NOMBRE NUEVO
-- ------------------------------------------------

drop policy if exists "catalogo_servicio_contexto_select_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_servicio_contexto_insert_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_servicio_contexto_update_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_servicio_contexto_delete_authenticated"
  on public.catalogo_contexto_destino;

drop policy if exists "catalogo_contexto_destino_select_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_contexto_destino_insert_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_contexto_destino_update_authenticated"
  on public.catalogo_contexto_destino;
drop policy if exists "catalogo_contexto_destino_delete_authenticated"
  on public.catalogo_contexto_destino;

create policy "catalogo_contexto_destino_select_authenticated"
on public.catalogo_contexto_destino
for select
to authenticated
using (true);

create policy "catalogo_contexto_destino_insert_authenticated"
on public.catalogo_contexto_destino
for insert
to authenticated
with check (true);

create policy "catalogo_contexto_destino_update_authenticated"
on public.catalogo_contexto_destino
for update
to authenticated
using (true)
with check (true);

create policy "catalogo_contexto_destino_delete_authenticated"
on public.catalogo_contexto_destino
for delete
to authenticated
using (true);

-- ------------------------------------------------
-- 6. NUEVA TABLA TRANSACCIONAL
-- ------------------------------------------------

create table if not exists public.solicitud_contexto_destino (
  id bigint generated always as identity primary key,
  solicitud_id uuid not null references public.solicitud_compra(id) on delete cascade,
  tipo_origen text not null,
  codigo text not null,
  created_at timestamptz not null default now(),
  constraint solicitud_contexto_destino_tipo_origen_chk check (
    tipo_origen in (
      'equipo',
      'area_operativa',
      'instalacion_taller',
      'grupo_equipo',
      'otros'
    )
  ),
  constraint solicitud_contexto_destino_codigo_not_blank check (
    length(trim(codigo)) > 0
  ),
  constraint solicitud_contexto_destino_unique unique (solicitud_id, tipo_origen, codigo)
);

create index if not exists idx_solicitud_contexto_destino_solicitud
  on public.solicitud_contexto_destino (solicitud_id);

create index if not exists idx_solicitud_contexto_destino_tipo_codigo
  on public.solicitud_contexto_destino (tipo_origen, codigo);

comment on table public.solicitud_contexto_destino is
'Relacion transaccional de destinos de una solicitud. No tiene FK al catalogo para permitir resolver labels en tiempo de lectura.';

comment on column public.solicitud_contexto_destino.tipo_origen is
'Tipo de destino elegido en la solicitud. Una solicitud no puede mezclar tipos distintos.';

-- ------------------------------------------------
-- 7. REGLA DE NO MEZCLAR TIPOS EN UNA MISMA SOLICITUD
-- ------------------------------------------------

create or replace function public.fn_solicitud_contexto_destino_validar_tipo_unico()
returns trigger
language plpgsql
as $$
declare
  v_tipo_existente text;
begin
  select scd.tipo_origen
  into v_tipo_existente
  from public.solicitud_contexto_destino scd
  where scd.solicitud_id = new.solicitud_id
    and scd.id <> coalesce(new.id, -1)
  limit 1;

  if v_tipo_existente is not null and v_tipo_existente <> new.tipo_origen then
    raise exception
      'La solicitud % ya tiene destinos de tipo %, no se puede mezclar con %',
      new.solicitud_id,
      v_tipo_existente,
      new.tipo_origen;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_solicitud_contexto_destino_tipo_unico
  on public.solicitud_contexto_destino;

create trigger trg_solicitud_contexto_destino_tipo_unico
before insert or update on public.solicitud_contexto_destino
for each row
execute function public.fn_solicitud_contexto_destino_validar_tipo_unico();

-- ------------------------------------------------
-- 8. MIGRAR DATOS DESDE solicitud_equipo
-- ------------------------------------------------
-- Todo lo existente en solicitud_equipo se interpreta como tipo_origen=equipo.

insert into public.solicitud_contexto_destino (
  solicitud_id,
  tipo_origen,
  codigo
)
select
  se.solicitud_id,
  'equipo',
  trim(se.cod_equipo)
from public.solicitud_equipo se
where nullif(trim(se.cod_equipo), '') is not null
on conflict (solicitud_id, tipo_origen, codigo) do nothing;

commit;

-- ------------------------------------------------
-- 9. CARGA INICIAL OPCIONAL DEL CATALOGO
-- ------------------------------------------------
-- Estos inserts son ejemplos seguros basados en el catalogo anterior.
-- Los registros existentes se mantienen como restringidos a servicios.
--
-- begin;
--
-- insert into public.catalogo_contexto_destino (
--   codigo,
--   nombre,
--   tipo_origen,
--   restringido_a_servicios,
--   activo
-- )
-- values
--   ('oficina_gerencia', 'Oficina de Gerencia', 'area_operativa', true, true),
--   ('area_verde', 'Area Verde', 'area_operativa', true, true),
--   ('oficina_cm', 'Oficina de Cosecha Mecanizada', 'area_operativa', true, true),
--   ('oficina_ep', 'Oficina de Equipo Pesado', 'area_operativa', true, true),
--   ('oficina_eng', 'Oficina de Engrase', 'area_operativa', true, true),
--   ('oficina_sg', 'Oficina de Servicios Generales', 'area_operativa', true, true),
--   ('oficina_mectt', 'Oficina de Mecanica de Transporte', 'area_operativa', true, true),
--   ('taller', 'Instalaciones de taller', 'instalacion_taller', true, true),
--   ('otros', 'Otros', 'otros', true, true)
-- on conflict (codigo) do update
-- set
--   nombre = excluded.nombre,
--   tipo_origen = excluded.tipo_origen,
--   restringido_a_servicios = excluded.restringido_a_servicios,
--   activo = excluded.activo;
--
-- commit;
