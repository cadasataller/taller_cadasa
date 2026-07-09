drop function if exists public.rpc_obtener_solicitudes_lista_usuario(
  text,
  text,
  text,
  text,
  date,
  date,
  boolean,
  boolean,
  integer,
  integer
);

drop function if exists public.rpc_obtener_solicitudes_lista_usuario(
  text,
  text,
  text,
  date,
  date,
  boolean,
  boolean,
  integer,
  integer
);

-- RPC PARA LA CARGA DE SOLICITUDES
create or replace function public.rpc_obtener_solicitudes_lista_usuario(
  p_busqueda text default null,
  p_grupo_listado text default null,
  p_prioridad_codigo text default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_solo_bloqueadas boolean default false,
  p_solo_diferencia_oc boolean default false,
  p_limit integer default 500,
  p_offset integer default 0
)
returns table (
  id uuid,
  viewer_email text,
  viewer_role_codigo text,
  viewer_area_codigo text,

  folio_sol text,
  folio_oc_principal text,
  folios_oc text[],

  observacion text,

  seguimiento jsonb,

  badge_codigo text,
  badge_label text,

  prioridad_codigo text,
  prioridad_nombre text,

  area_solicitante_codigo text,
  area_solicitante_nombre text,
  solicitante_nombre text,

  fecha_entrega_mostrada date,
  fecha_entrega_origen text,

  grupo_listado text,

  bloqueada boolean,
  locked_by_email text,
  locked_at timestamptz,

  cantidad_adjuntos bigint,
  tiene_adjuntos boolean,

  cantidad_oc bigint,
  ordenes_compra_resumen jsonb,
  estado_oc_principal text,
  evaluacion_principal text,
  recepcion_principal text,
  proveedor_principal text,

  cantidad_diferencias bigint,
  tiene_diferencia_oc boolean,

  productos_total bigint,
  productos_activos bigint,
  servicios_total bigint,

  total_count bigint,

  destinos text[],
  destinos_total bigint,

  accion_rol jsonb,
  badge_delegacion jsonb,
  es_delegada boolean,
  tipo_delegacion text,
  es_mia boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_role text;
  v_area text;

  v_today date;
  v_fecha_desde date;
  v_fecha_hasta date;

  v_busqueda text;
  v_grupo_listado text;
  v_prioridad_codigo text;

  v_can_ver_folio boolean;
  v_can_ver_oc boolean;
  v_can_ver_area boolean;
  v_can_ver_solicitante boolean;
  v_can_ver_fecha boolean;
  v_can_ver_adjuntos boolean;
  v_can_ver_diferencia_oc boolean;
  v_can_ver_resumen_oc boolean;
  v_can_ver_conteos boolean;
  v_can_ver_destinos boolean;
  v_can_ver_delegacion boolean;
begin
  v_email := public.fn_current_email();

  if v_email is null then
    raise exception 'Usuario no autenticado';
  end if;

  v_role := public.fn_get_actor_role_codigo(v_email);
  v_area := public.fn_get_actor_area_codigo(v_email);

  if v_role is null then
    raise exception 'El usuario % no tiene perfil activo configurado', v_email;
  end if;

  v_today := (now() at time zone 'America/Panama')::date;
  v_fecha_desde := coalesce(p_fecha_desde, (v_today - interval '6 months')::date);
  v_fecha_hasta := coalesce(p_fecha_hasta, v_today);

  if v_fecha_desde > v_fecha_hasta then
    raise exception
      'Rango de fechas inválido: fecha desde (%) no puede ser mayor que fecha hasta (%)',
      v_fecha_desde,
      v_fecha_hasta;
  end if;

  v_busqueda := nullif(trim(coalesce(p_busqueda, '')), '');
  v_grupo_listado := nullif(trim(coalesce(p_grupo_listado, '')), '');
  v_prioridad_codigo := nullif(trim(coalesce(p_prioridad_codigo, '')), '');

  v_can_ver_folio := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');
  v_can_ver_oc := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_area := v_role in ('admin', 'gerencia', 'almacen', 'secretaria');
  v_can_ver_solicitante := v_role in ('admin', 'secretaria');
  v_can_ver_fecha := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');
  v_can_ver_adjuntos := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_diferencia_oc := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_resumen_oc := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_conteos := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_destinos := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_delegacion := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');

  return query
  with alcances as (
    select
      a.alcance_codigo
    from public.vw_solicitud_listado_alcance_regla a
    where a.role_codigo = v_role
      and a.activo = true
  ),

  reglas as (
    select
      r.*
    from public.vw_solicitud_listado_seguimiento_regla r
    where r.role_codigo = v_role
      and r.activo = true
      and exists (
        select 1
        from alcances a
        where a.alcance_codigo = r.aplica_alcance_codigo
      )
  ),

  base_fecha as (
    select s.*
    from public.vw_solicitudes_lista s
    where
      s.created_at >= (v_fecha_desde::timestamp at time zone 'America/Panama')
      and s.created_at < ((v_fecha_hasta + 1)::timestamp at time zone 'America/Panama')
  ),

  candidatos_estado as (
    select
      s.id,
      s.folio_sol,
      s.solicitante_email,
      s.solicitante_nombre,

      s.fecha_entrega_mostrada,
      s.fecha_entrega_origen,

      s.observacion,
      s.created_at,

      s.prioridad_codigo,
      s.prioridad_nombre,

      s.area_solicitante_codigo,
      s.area_solicitante_nombre,

      s.estado_codigo,

      s.badge_codigo,
      s.badge_label,

      s.disponible_desde,

      s.locked_by_email,
      s.locked_at,
      s.bloqueada,

      s.productos_total,
      s.productos_activos,
      s.servicios_total,

      s.cantidad_adjuntos,
      s.tiene_adjuntos,

      s.cantidad_oc,
      s.folio_oc_principal,
      s.folios_oc,
      s.ordenes_compra_resumen,
      s.estado_oc_principal,
      s.evaluacion_principal,
      s.recepcion_principal,
      s.proveedor_principal,

      s.cantidad_diferencias,
      s.tiene_diferencia_oc,

      s.destinos,
      s.destinos_total,

      s.delegacion_id,
      s.solicitud_origen_id,
      s.creada_por_email,
      s.creada_para_email,
      s.tipo_delegacion,
      s.motivo_delegacion,
      s.badge_delegacion_codigo,
      s.badge_delegacion_label,
      s.es_delegada,

      r.grupo_listado as grupo_listado_calc,
      r.origen_seguimiento,
      'estado_actual'::text as seguimiento_tipo,
      r.seguimiento_codigo,
      r.seguimiento_label,
      s.disponible_desde as seguimiento_fecha,
      r.fecha_label as seguimiento_fecha_label,

      null::text as accion_rol_key,
      null::text as accion_rol_label,
      null::timestamptz as accion_rol_fecha,
      null::text as accion_rol_actor_email,
      null::text as accion_rol_role_codigo,

      r.aplica_alcance_codigo,
      r.prioridad_resolucion,
      r.orden

    from base_fecha s
    join reglas r
      on r.origen_seguimiento = 'estado_actual'
     and r.estado_codigo = s.estado_codigo
    where
      (
        r.aplica_alcance_codigo = 'todas'

        or (
          r.aplica_alcance_codigo = 'propia'
          and lower(s.solicitante_email) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'delegada_para_mi'
          and lower(coalesce(s.creada_para_email, '')) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'creada_por_mi'
          and lower(coalesce(s.creada_por_email, '')) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'por_area'
          and s.area_solicitante_codigo = v_area
        )

        or r.aplica_alcance_codigo = 'por_tarea_rol'
      )
  ),

  candidatos_evento as (
    select
      s.id,
      s.folio_sol,
      s.solicitante_email,
      s.solicitante_nombre,

      s.fecha_entrega_mostrada,
      s.fecha_entrega_origen,

      s.observacion,
      s.created_at,

      s.prioridad_codigo,
      s.prioridad_nombre,

      s.area_solicitante_codigo,
      s.area_solicitante_nombre,

      s.estado_codigo,

      s.badge_codigo,
      s.badge_label,

      s.disponible_desde,

      s.locked_by_email,
      s.locked_at,
      s.bloqueada,

      s.productos_total,
      s.productos_activos,
      s.servicios_total,

      s.cantidad_adjuntos,
      s.tiene_adjuntos,

      s.cantidad_oc,
      s.folio_oc_principal,
      s.folios_oc,
      s.ordenes_compra_resumen,
      s.estado_oc_principal,
      s.evaluacion_principal,
      s.recepcion_principal,
      s.proveedor_principal,

      s.cantidad_diferencias,
      s.tiene_diferencia_oc,

      s.destinos,
      s.destinos_total,

      s.delegacion_id,
      s.solicitud_origen_id,
      s.creada_por_email,
      s.creada_para_email,
      s.tipo_delegacion,
      s.motivo_delegacion,
      s.badge_delegacion_codigo,
      s.badge_delegacion_label,
      s.es_delegada,

      r.grupo_listado as grupo_listado_calc,
      r.origen_seguimiento,
      'accion_rol'::text as seguimiento_tipo,
      r.seguimiento_codigo,
      r.seguimiento_label,
      ev.created_at as seguimiento_fecha,
      r.fecha_label as seguimiento_fecha_label,

      ev.action_key as accion_rol_key,
      r.seguimiento_label as accion_rol_label,
      ev.created_at as accion_rol_fecha,
      ev.creado_por_email as accion_rol_actor_email,
      ev.role_codigo as accion_rol_role_codigo,

      r.aplica_alcance_codigo,
      r.prioridad_resolucion,
      r.orden

    from base_fecha s
    join reglas r
      on r.origen_seguimiento = 'evento'
    join lateral (
      select
        se.action_key,
        se.created_at,
        se.creado_por_email,
        se.role_codigo
      from public.solicitud_evento se
      where se.solicitud_id = s.id
        and se.action_key = r.action_key
      order by se.created_at desc
      limit 1
    ) ev on true
    where
      (
        r.aplica_alcance_codigo = 'todas'

        or (
          r.aplica_alcance_codigo = 'propia'
          and lower(s.solicitante_email) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'delegada_para_mi'
          and lower(coalesce(s.creada_para_email, '')) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'creada_por_mi'
          and lower(coalesce(s.creada_por_email, '')) = lower(v_email)
        )

        or (
          r.aplica_alcance_codigo = 'por_area'
          and s.area_solicitante_codigo = v_area
        )

        or r.aplica_alcance_codigo = 'por_tarea_rol'
      )
  ),

  candidatos as (
    select * from candidatos_estado
    union all
    select * from candidatos_evento
  ),

  resueltos as (
    select
      c.*,
      (
        lower(c.solicitante_email) = lower(v_email)
        or lower(coalesce(c.creada_para_email, '')) = lower(v_email)
      ) as es_mia_calc,

      row_number() over (
        partition by c.id
        order by
          c.prioridad_resolucion asc,
          c.seguimiento_fecha desc nulls last,
          c.orden asc
      ) as rn
    from candidatos c
  ),

  base as (
    select r.*
    from resueltos r
    where r.rn = 1

      and (
        v_grupo_listado is null
        or r.grupo_listado_calc = v_grupo_listado
      )

      and (
        v_prioridad_codigo is null
        or r.prioridad_codigo = v_prioridad_codigo
      )

      and (
        coalesce(p_solo_bloqueadas, false) = false
        or r.bloqueada = true
      )

      and (
        coalesce(p_solo_diferencia_oc, false) = false
        or (
          v_can_ver_diferencia_oc = true
          and r.tiene_diferencia_oc = true
          and coalesce(r.cantidad_oc, 0) > 0
        )
      )

      and (
        v_busqueda is null

        or r.observacion ilike '%' || v_busqueda || '%'

        or (
          v_can_ver_folio = true
          and r.folio_sol ilike '%' || v_busqueda || '%'
        )

        or (
          v_can_ver_oc = true
          and (
            r.folio_oc_principal ilike '%' || v_busqueda || '%'
            or exists (
              select 1
              from unnest(coalesce(r.folios_oc, array[]::text[])) as fo(folio_oc)
              where fo.folio_oc ilike '%' || v_busqueda || '%'
            )
          )
        )

        or (
          v_can_ver_area = true
          and (
            r.area_solicitante_nombre ilike '%' || v_busqueda || '%'
            or r.area_solicitante_codigo ilike '%' || v_busqueda || '%'
          )
        )

        or (
          v_can_ver_solicitante = true
          and r.solicitante_nombre ilike '%' || v_busqueda || '%'
        )

        or (
          v_can_ver_destinos = true
          and exists (
            select 1
            from unnest(coalesce(r.destinos, array[]::text[])) as d(destino)
            where d.destino ilike '%' || v_busqueda || '%'
          )
        )

        or r.prioridad_nombre ilike '%' || v_busqueda || '%'
        or r.prioridad_codigo ilike '%' || v_busqueda || '%'

        or r.seguimiento_label ilike '%' || v_busqueda || '%'
        or r.seguimiento_codigo ilike '%' || v_busqueda || '%'

        or (
          v_can_ver_delegacion = true
          and (
            r.badge_delegacion_label ilike '%' || v_busqueda || '%'
            or r.tipo_delegacion ilike '%' || v_busqueda || '%'
          )
        )
      )
  ),

  counted as (
    select
      b.*,
      count(*) over () as total_count
    from base b
    order by
      b.bloqueada desc,

      case
        when b.grupo_listado_calc = 'en_proceso'
        then b.seguimiento_fecha
      end asc nulls last,

      case
        when b.grupo_listado_calc <> 'en_proceso'
        then b.seguimiento_fecha
      end desc nulls last,

      b.created_at desc

    limit least(greatest(coalesce(p_limit, 500), 1), 1000)
    offset greatest(coalesce(p_offset, 0), 0)
  )

  select
    c.id,
    v_email as viewer_email,
    v_role as viewer_role_codigo,
    v_area as viewer_area_codigo,

    case when v_can_ver_folio then c.folio_sol else null end as folio_sol,
    case when v_can_ver_oc then c.folio_oc_principal else null end as folio_oc_principal,
    case when v_can_ver_oc then c.folios_oc else array[]::text[] end as folios_oc,

    c.observacion,

    jsonb_build_object(
      'tipo', c.seguimiento_tipo,
      'codigo', c.seguimiento_codigo,
      'label', c.seguimiento_label,
      'fecha', c.seguimiento_fecha,
      'fecha_label', c.seguimiento_fecha_label,
      'origen', c.origen_seguimiento,
      'alcance_codigo', c.aplica_alcance_codigo
    ) as seguimiento,

    c.badge_codigo,
    c.badge_label,

    c.prioridad_codigo,
    c.prioridad_nombre,

    case when v_can_ver_area then c.area_solicitante_codigo else null end as area_solicitante_codigo,
    case when v_can_ver_area then c.area_solicitante_nombre else null end as area_solicitante_nombre,

    case when v_can_ver_solicitante then c.solicitante_nombre else null end as solicitante_nombre,

    case when v_can_ver_fecha then c.fecha_entrega_mostrada else null end as fecha_entrega_mostrada,
    case when v_can_ver_fecha then c.fecha_entrega_origen else null end as fecha_entrega_origen,

    c.grupo_listado_calc as grupo_listado,

    c.bloqueada,
    case when c.bloqueada then c.locked_by_email else null end as locked_by_email,
    case when c.bloqueada then c.locked_at else null end as locked_at,

    case when v_can_ver_adjuntos then c.cantidad_adjuntos else 0 end as cantidad_adjuntos,
    case when v_can_ver_adjuntos then c.tiene_adjuntos else false end as tiene_adjuntos,

    case when v_can_ver_oc then c.cantidad_oc else 0 end as cantidad_oc,

    case when v_can_ver_resumen_oc then c.ordenes_compra_resumen else '[]'::jsonb end as ordenes_compra_resumen,
    case when v_can_ver_resumen_oc then c.estado_oc_principal else null end as estado_oc_principal,
    case when v_can_ver_resumen_oc then c.evaluacion_principal else null end as evaluacion_principal,
    case when v_can_ver_resumen_oc then c.recepcion_principal else null end as recepcion_principal,
    case when v_can_ver_resumen_oc then c.proveedor_principal else null end as proveedor_principal,

    case
      when v_can_ver_diferencia_oc and coalesce(c.cantidad_oc, 0) > 0
      then c.cantidad_diferencias
      else 0
    end as cantidad_diferencias,

    case
      when v_can_ver_diferencia_oc
        and coalesce(c.cantidad_oc, 0) > 0
        and c.tiene_diferencia_oc = true
      then true
      else false
    end as tiene_diferencia_oc,

    case when v_can_ver_conteos then c.productos_total else 0 end as productos_total,
    case when v_can_ver_conteos then c.productos_activos else 0 end as productos_activos,
    case when v_can_ver_conteos then c.servicios_total else 0 end as servicios_total,

    c.total_count,

    case when v_can_ver_destinos then c.destinos else array[]::text[] end as destinos,
    case when v_can_ver_destinos then c.destinos_total else 0 end as destinos_total,

    case
      when c.origen_seguimiento = 'evento' then
        jsonb_build_object(
          'key', c.accion_rol_key,
          'label', c.accion_rol_label,
          'fecha', c.accion_rol_fecha,
          'actor_email', c.accion_rol_actor_email,
          'role_codigo', c.accion_rol_role_codigo
        )
      else null::jsonb
    end as accion_rol,

    case
      when v_can_ver_delegacion = true
        and c.badge_delegacion_codigo is not null
      then jsonb_build_object(
        'codigo', c.badge_delegacion_codigo,
        'label', c.badge_delegacion_label,
        'tipo_delegacion', c.tipo_delegacion,
        'solicitud_origen_id', c.solicitud_origen_id,
        'creada_por_email', c.creada_por_email,
        'creada_para_email', c.creada_para_email
      )
      else null::jsonb
    end as badge_delegacion,

    case
      when v_can_ver_delegacion then c.es_delegada
      else false
    end as es_delegada,

    case
      when v_can_ver_delegacion then c.tipo_delegacion
      else null
    end as tipo_delegacion,

    c.es_mia_calc as es_mia

  from counted c;
end;
$$;

-- RPC PARA CONFIGURACION FILTROS DE LISTADO DE SOLICITUDES DE COMPRA
drop function if exists public.rpc_obtener_config_listado_solicitudes();
create or replace function public.rpc_obtener_config_listado_solicitudes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_role text;
  v_area text;
  v_can_ver_delegacion boolean;
begin
  v_email := public.fn_current_email();

  if v_email is null then
    raise exception 'Usuario no autenticado';
  end if;

  v_role := public.fn_get_actor_role_codigo(v_email);
  v_area := public.fn_get_actor_area_codigo(v_email);

  if v_role is null then
    raise exception 'El usuario % no tiene perfil activo configurado', v_email;
  end if;

  v_can_ver_delegacion := v_role in (
    'operativo',
    'admin',
    'gerencia',
    'secretaria'
  );

  return (
    with alcances as (
      select
        a.alcance_codigo,
        a.descripcion,
        a.orden
      from public.vw_solicitud_listado_alcance_regla a
      where a.role_codigo = v_role
        and a.activo = true
    ),

    reglas as (
      select
        r.*
      from public.vw_solicitud_listado_seguimiento_regla r
      where r.role_codigo = v_role
        and r.activo = true
        and exists (
          select 1
          from alcances a
          where a.alcance_codigo = r.aplica_alcance_codigo
        )
    ),

    grupos as (
      select
        r.grupo_listado,
        r.grupo_listado_label,
        min(r.orden) as orden
      from reglas r
      group by
        r.grupo_listado,
        r.grupo_listado_label
    )

    select jsonb_build_object(
      'viewer',
      jsonb_build_object(
        'email', v_email,
        'role_codigo', v_role,
        'area_codigo', v_area
      ),

      'alcances',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'codigo', a.alcance_codigo,
              'descripcion', a.descripcion
            )
            order by a.orden
          )
          from alcances a
        ),
        '[]'::jsonb
      ),

      'grupos',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'codigo', g.grupo_listado,
              'label', g.grupo_listado_label,
              'visible', true,
              'seguimientos',
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'codigo', x.seguimiento_codigo,
                      'label', x.seguimiento_label,
                      'origen', x.origen_seguimiento,
                      'fecha_label', x.fecha_label,
                      'aplica_alcance_codigo', x.aplica_alcance_codigo,
                      'aplica_alcance_codigos', to_jsonb(x.aplica_alcance_codigos),
                      'visible_en_filtro', x.visible_en_filtro
                    )
                    order by x.orden
                  )
                  from (
                    select
                      r.seguimiento_codigo,
                      r.seguimiento_label,
                      r.origen_seguimiento,
                      r.fecha_label,
                      min(r.aplica_alcance_codigo) as aplica_alcance_codigo,
                      array_agg(distinct r.aplica_alcance_codigo order by r.aplica_alcance_codigo) as aplica_alcance_codigos,
                      r.visible_en_filtro,
                      min(r.orden) as orden
                    from reglas r
                    where r.grupo_listado = g.grupo_listado
                      and r.visible_en_filtro = true
                    group by
                      r.seguimiento_codigo,
                      r.seguimiento_label,
                      r.origen_seguimiento,
                      r.fecha_label,
                      r.visible_en_filtro
                  ) x
                ),
                '[]'::jsonb
              )
            )
            order by g.orden
          )
          from grupos g
        ),
        '[]'::jsonb
      ),

      'badges_delegacion',
      case
        when v_can_ver_delegacion then
          jsonb_build_array(
            jsonb_build_object(
              'codigo', 'correccion',
              'label', 'Corrección',
              'tipo_delegacion', 'correccion_sistema_compras'
            ),
            jsonb_build_object(
              'codigo', 'creada_por_secretaria',
              'label', 'Creada por Secretaría',
              'tipo_delegacion', 'solicitud_gerencia_normal'
            )
          )
        else '[]'::jsonb
      end
    )
  );
end;
$$;