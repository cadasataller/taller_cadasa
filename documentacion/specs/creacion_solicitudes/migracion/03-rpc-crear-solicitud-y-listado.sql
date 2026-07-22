-- ================================================================
-- MIGRACION 03
-- TEMA: RPC de creacion + RPC de listado
-- MODULO: compras / solicitudes de compra
-- FECHA: 2026-07-02
-- EJECUCION: manual
-- ================================================================

begin;

-- ------------------------------------------------
-- 1. RPC DE CREACION
-- ------------------------------------------------
-- Cambios incluidos:
-- - p_equipos se reemplaza por p_contextos_destino jsonb
-- - producto temporal usa nombre obligatorio y descripcion opcional
-- - servicio exige minimo 5 caracteres y ya no tiene limite maximo en RPC
-- - contexto destino deja de ser obligatorio
-- - no se permite mezclar tipos de destino

drop function if exists public.rpc_crear_solicitud_compra_go(
  text,
  date,
  text,
  text[],
  jsonb,
  jsonb,
  boolean,
  boolean,
  text,
  jsonb,
  boolean
);

drop function if exists public.rpc_crear_solicitud_compra_go(
  text,
  date,
  text,
  jsonb,
  jsonb,
  jsonb,
  boolean,
  boolean,
  text,
  jsonb,
  boolean
);

create or replace function public.rpc_crear_solicitud_compra_go(
  p_tipo_codigo text,
  p_fecha_entrega date,
  p_observacion text,
  p_contextos_destino jsonb default '[]'::jsonb,
  p_productos jsonb default '[]'::jsonb,
  p_servicios jsonb default '[]'::jsonb,
  p_enviar boolean default false,
  p_solicitar_urgente boolean default false,
  p_motivo_urgencia text default null,
  p_adjuntos jsonb default '[]'::jsonb,
  p_requerir_adjuntos_storage boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path to public, storage
as $$
declare
  v_actor jsonb;
  v_email text;
  v_area_id bigint;
  v_role_id bigint;
  v_area_codigo text;
  v_role_codigo text;

  v_tipo_id bigint;
  v_tipo record;
  v_estado_codigo text;
  v_estado_id bigint;
  v_estado_pendiente_id bigint;
  v_prioridad_normal_id bigint;
  v_prioridad_urgente_id bigint;
  v_prioridad_pendiente_id bigint;

  v_solicitud_id uuid;
  v_producto_id uuid;
  v_producto_codigo text;
  v_producto_nombre text;
  v_producto_descripcion text;
  v_producto_temp_codigo text;
  v_unidad_id bigint;
  v_temporal boolean;
  v_item jsonb;

  v_contextos_destino jsonb := coalesce(p_contextos_destino, '[]'::jsonb);
  v_productos jsonb := coalesce(p_productos, '[]'::jsonb);
  v_servicios jsonb := coalesce(p_servicios, '[]'::jsonb);
  v_adjuntos jsonb := coalesce(p_adjuntos, '[]'::jsonb);

  v_productos_count integer;
  v_servicios_count integer;
  v_adjuntos_count integer;
  v_destinos_count integer;

  v_destino_tipo text;
  v_destino_tipo_detectado text := null;
  v_destino_codigo text;

  v_cantidad numeric;
  v_servicio_desc text;
  v_servicio_unidad_codigo text;
begin
  v_actor := public.fn_require_actor(ARRAY['operativo', 'supervisor', 'gerencia', 'admin', 'secretaria']);
  v_email := v_actor->>'email';
  v_area_id := (v_actor->>'area_id')::bigint;
  v_role_id := (v_actor->>'role_id')::bigint;
  v_area_codigo := v_actor->>'area_codigo';
  v_role_codigo := v_actor->>'role_codigo';

  if p_tipo_codigo is null or length(trim(p_tipo_codigo)) = 0 then
    raise exception 'El tipo de solicitud es obligatorio';
  end if;

  if p_fecha_entrega is null then
    raise exception 'La fecha de entrega es obligatoria';
  end if;

  if p_fecha_entrega < current_date then
    raise exception 'La fecha de entrega no puede ser menor a la fecha actual';
  end if;

  if length(trim(coalesce(p_observacion, ''))) = 0 then
    raise exception 'La observación es obligatoria';
  end if;

  if jsonb_typeof(v_contextos_destino) <> 'array' then
    raise exception 'p_contextos_destino debe ser un arreglo JSON';
  end if;

  if jsonb_typeof(v_productos) <> 'array' then
    raise exception 'p_productos debe ser un arreglo JSON';
  end if;

  if jsonb_typeof(v_servicios) <> 'array' then
    raise exception 'p_servicios debe ser un arreglo JSON';
  end if;

  if jsonb_typeof(v_adjuntos) <> 'array' then
    raise exception 'p_adjuntos debe ser un arreglo JSON';
  end if;

  v_tipo_id := public.fn_tipo_solicitud_id(trim(p_tipo_codigo));
  if v_tipo_id is null then
    raise exception 'Tipo de solicitud inválido: %', p_tipo_codigo;
  end if;

  select *
  into v_tipo
  from public.tipo_solicitud
  where id = v_tipo_id
    and activo = true;

  v_productos_count := jsonb_array_length(v_productos);
  v_servicios_count := jsonb_array_length(v_servicios);
  v_adjuntos_count := jsonb_array_length(v_adjuntos);
  v_destinos_count := jsonb_array_length(v_contextos_destino);

  for v_item in select value from jsonb_array_elements(v_contextos_destino)
  loop
    v_destino_tipo := nullif(trim(coalesce(v_item->>'tipo_origen', '')), '');
    v_destino_codigo := nullif(trim(coalesce(v_item->>'codigo', '')), '');

    if v_destino_tipo is null then
      raise exception 'tipo_origen es obligatorio en p_contextos_destino';
    end if;

    if v_destino_tipo not in (
      'equipo',
      'area_operativa',
      'instalacion_taller',
      'grupo_equipo',
      'otros'
    ) then
      raise exception 'tipo_origen inválido en p_contextos_destino: %', v_destino_tipo;
    end if;

    if v_destino_codigo is null then
      raise exception 'codigo es obligatorio en p_contextos_destino';
    end if;

    if v_destino_tipo_detectado is null then
      v_destino_tipo_detectado := v_destino_tipo;
    elsif v_destino_tipo_detectado <> v_destino_tipo then
      raise exception
        'No se pueden mezclar tipos de destino en la misma solicitud. Detectados: % y %',
        v_destino_tipo_detectado,
        v_destino_tipo;
    end if;
  end loop;

  if v_productos_count > 0 and v_servicios_count > 0 then
    raise exception 'No se pueden mezclar productos y servicios en la misma solicitud';
  end if;

  if v_tipo.permite_productos then
    if v_servicios_count > 0 then
      raise exception 'El tipo % no permite servicios', p_tipo_codigo;
    end if;

    if p_enviar and v_productos_count = 0 then
      raise exception 'Debe indicar al menos un producto para enviar la solicitud';
    end if;
  end if;

  if v_tipo.permite_servicios then
    if v_productos_count > 0 then
      raise exception 'El tipo % no permite productos', p_tipo_codigo;
    end if;

    if p_enviar and v_servicios_count = 0 then
      raise exception 'Debe indicar al menos un servicio para enviar solicitud';
    end if;
  end if;

  if not v_tipo.permite_productos and not v_tipo.permite_servicios then
    raise exception 'El tipo de solicitud % no permite productos ni servicios', p_tipo_codigo;
  end if;

  if p_enviar = false then
    v_estado_codigo := 'borrador';
  elsif v_tipo.permite_servicios then
    v_estado_codigo := 'para_revision_gerencia';
  else
    v_estado_codigo := 'para_revision_almacen';
  end if;

  if p_solicitar_urgente and p_enviar and length(trim(coalesce(p_motivo_urgencia, ''))) = 0 then
    raise exception 'Debe indicar motivo para solicitar prioridad urgente';
  end if;

  perform public.rpc_validar_adjuntos_storage_go(v_adjuntos, p_requerir_adjuntos_storage);

  v_estado_id := public.fn_estado_id(v_estado_codigo);
  v_estado_pendiente_id := public.fn_estado_id('pendiente');
  v_prioridad_normal_id := public.fn_prioridad_id('normal');
  v_prioridad_urgente_id := public.fn_prioridad_id('urgente');
  v_prioridad_pendiente_id := public.fn_estado_id('prioridad_pendiente');

  if v_estado_id is null then
    raise exception 'Estado no encontrado: %', v_estado_codigo;
  end if;

  if v_estado_pendiente_id is null then
    raise exception 'Estado detalle pendiente no encontrado';
  end if;

  if v_prioridad_normal_id is null then
    raise exception 'Prioridad normal no encontrada';
  end if;

  insert into public.solicitud_compra (
    folio_sol,
    tipo_solicitud_id,
    estado_id,
    prioridad_id,
    area_solicitante_id,
    role_solicitante_id,
    solicitante_email,
    fecha_entrega,
    observacion,
    ciclo_estado
  ) values (
    null,
    v_tipo_id,
    v_estado_id,
    v_prioridad_normal_id,
    v_area_id,
    v_role_id,
    v_email,
    p_fecha_entrega,
    regexp_replace(trim(p_observacion), '\s+', ' ', 'g'),
    1
  )
  returning id into v_solicitud_id;

  for v_item in select value from jsonb_array_elements(v_contextos_destino)
  loop
    insert into public.solicitud_contexto_destino (
      solicitud_id,
      tipo_origen,
      codigo
    ) values (
      v_solicitud_id,
      trim(v_item->>'tipo_origen'),
      trim(v_item->>'codigo')
    )
    on conflict (solicitud_id, tipo_origen, codigo) do nothing;
  end loop;

  if v_tipo.permite_productos then
    for v_item in select value from jsonb_array_elements(v_productos)
    loop
      v_temporal := lower(coalesce(v_item->>'temporal', 'false')) in ('true', '1', 'si', 'sí', 'yes');

      if v_temporal then
        v_producto_nombre := nullif(trim(coalesce(v_item->>'nombre', '')), '');
        v_producto_descripcion := nullif(trim(coalesce(v_item->>'descripcion', '')), '');

        if v_producto_nombre is null then
          raise exception 'El nombre del producto temporal es obligatorio';
        end if;

        if char_length(v_producto_nombre) > 56 then
          raise exception 'El nombre del producto temporal no puede superar 56 caracteres';
        end if;

        v_unidad_id := public.fn_unidad_id(coalesce(nullif(trim(v_item->>'unidad_codigo'), ''), 'unidad'));
        if v_unidad_id is null then
          raise exception 'Unidad de medida inválida para producto temporal: %', v_item->>'unidad_codigo';
        end if;

        v_producto_temp_codigo := public.fn_generar_codigo_producto_temporal();

        insert into public.producto (
          cod_producto,
          nombre,
          descripcion,
          unidad_medida_id,
          activo,
          es_temporal,
          estado_catalogo,
          creado_por_email,
          descripcion_original_supervisor,
          codigo_temporal_original
        ) values (
          v_producto_temp_codigo,
          v_producto_nombre,
          v_producto_descripcion,
          v_unidad_id,
          true,
          true,
          'temporal',
          v_email,
          v_producto_descripcion,
          v_producto_temp_codigo
        )
        returning id into v_producto_id;
      else
        v_producto_codigo := nullif(trim(coalesce(v_item->>'cod_producto', '')), '');
        if v_producto_codigo is null then
          raise exception 'cod_producto es obligatorio para productos existentes';
        end if;

        select p.id
        into v_producto_id
        from public.producto p
        where p.cod_producto = v_producto_codigo
          and p.activo = true
          and p.es_temporal = false
        limit 1;

        if v_producto_id is null then
          raise exception 'Producto inexistente, inactivo o temporal no permitido: %', v_producto_codigo;
        end if;

        v_producto_descripcion := null;
      end if;

      insert into public.solicitud_producto_detalle (
        solicitud_id,
        producto_id,
        descripcion_original_supervisor,
        cantidad,
        cantidad_inventario,
        cantidad_gerencia,
        cantidad_solicitada_sistema,
        estado_detalle_id,
        activo,
        requiere_revision_almacen,
        ciclo,
        requiere_revision_sistema,
        revision_sistema_codigo,
        revision_sistema_label,
        linea_solicitud
      ) values (
        v_solicitud_id,
        v_producto_id,
        case when v_temporal then v_producto_descripcion else null end,
        null,
        null,
        null,
        null,
        v_estado_pendiente_id,
        true,
        true,
        1,
        false,
        null,
        null,
        null
      );
    end loop;
  end if;

  if v_tipo.permite_servicios then
    for v_item in select value from jsonb_array_elements(v_servicios)
    loop
      v_servicio_desc := nullif(trim(coalesce(v_item->>'descripcion', '')), '');
      if v_servicio_desc is null then
        raise exception 'La descripción del servicio es obligatoria';
      end if;

      if char_length(v_servicio_desc) < 5 then
        raise exception 'La descripción del servicio debe tener al menos 5 caracteres';
      end if;

      if nullif(trim(coalesce(v_item->>'cantidad', '')), '') is null then
        v_cantidad := 1;
      else
        v_cantidad := (v_item->>'cantidad')::numeric;
        if v_cantidad <= 0 then
          v_cantidad := 1;
        end if;
      end if;

      v_servicio_unidad_codigo := coalesce(nullif(trim(v_item->>'unidad_codigo'), ''), 'servicio');
      v_unidad_id := public.fn_unidad_id(v_servicio_unidad_codigo);
      if v_unidad_id is null then
        raise exception 'Unidad inválida para servicio: %', v_servicio_unidad_codigo;
      end if;

      insert into public.solicitud_servicio_detalle (
        solicitud_id,
        descripcion,
        cantidad,
        unidad_medida_id,
        cantidad_gerencia,
        estado_detalle_id,
        activo,
        ciclo
      ) values (
        v_solicitud_id,
        v_servicio_desc,
        v_cantidad,
        v_unidad_id,
        null,
        v_estado_pendiente_id,
        true,
        1
      );
    end loop;
  end if;

  insert into public.solicitud_estado_historial (
    solicitud_id,
    estado_id,
    fecha_inicio,
    fecha_fin,
    creado_por,
    observacion,
    ciclo,
    invalidado
  ) values (
    v_solicitud_id,
    v_estado_id,
    now(),
    null,
    v_email,
    case
      when v_estado_codigo = 'borrador' then 'Solicitud creada como borrador desde flujo inicial'
      when v_estado_codigo = 'para_revision_almacen' then 'Solicitud creada y enviada a almacén desde flujo inicial'
      when v_estado_codigo = 'para_revision_gerencia' then 'Solicitud de servicio creada y enviada a gerencia desde flujo inicial'
      else 'Solicitud creada desde flujo inicial con estado ' || v_estado_codigo
    end,
    1,
    false
  );

  insert into public.solicitud_evento (
    solicitud_id,
    ciclo,
    action_key,
    estado_anterior_id,
    estado_nuevo_id,
    creado_por_email,
    area_codigo,
    role_codigo,
    observacion,
    payload_nuevo
  ) values (
    v_solicitud_id,
    1,
    case when p_enviar then 'crear_y_enviar_inicial' else 'crear_borrador_inicial' end,
    null,
    v_estado_id,
    v_email,
    v_area_codigo,
    v_role_codigo,
    'Creación de solicitud desde flujo inicial',
    jsonb_build_object(
      'tipo_codigo', p_tipo_codigo,
      'estado_codigo', v_estado_codigo,
      'productos', v_productos_count,
      'servicios', v_servicios_count,
      'destinos', v_destinos_count,
      'tipo_destino', v_destino_tipo_detectado,
      'adjuntos', v_adjuntos_count,
      'solicitar_urgente', case when p_enviar then coalesce(p_solicitar_urgente, false) else false end,
      'urgente_ignorado_por_borrador', (coalesce(p_solicitar_urgente, false) and not p_enviar),
      'folio_sol_inicial', null,
      'linea_solicitud_inicial', null
    )
  );

  if v_adjuntos_count > 0 then
    perform public.rpc_registrar_adjuntos_solicitud_go(
      v_solicitud_id,
      v_adjuntos,
      p_requerir_adjuntos_storage
    );
  end if;

  if p_enviar and coalesce(p_solicitar_urgente, false) then
    if v_prioridad_urgente_id is null then
      raise exception 'Prioridad urgente no encontrada';
    end if;

    if v_prioridad_pendiente_id is null then
      raise exception 'Estado prioridad_pendiente no encontrado';
    end if;

    insert into public.solicitud_prioridad_peticion (
      solicitud_id,
      prioridad_actual_id,
      prioridad_solicitada_id,
      estado_id,
      motivo,
      solicitada_por_email,
      solicitada_por_area_codigo,
      solicitada_por_role_codigo
    ) values (
      v_solicitud_id,
      v_prioridad_normal_id,
      v_prioridad_urgente_id,
      v_prioridad_pendiente_id,
      trim(p_motivo_urgencia),
      v_email,
      v_area_codigo,
      v_role_codigo
    );

    insert into public.solicitud_evento (
      solicitud_id,
      ciclo,
      action_key,
      creado_por_email,
      area_codigo,
      role_codigo,
      observacion,
      payload_nuevo
    ) values (
      v_solicitud_id,
      1,
      'solicitar_prioridad_urgente_inicial',
      v_email,
      v_area_codigo,
      v_role_codigo,
      'Solicitud de prioridad urgente creada desde flujo inicial',
      jsonb_build_object(
        'prioridad_actual', 'normal',
        'prioridad_solicitada', 'urgente',
        'estado_peticion', 'prioridad_pendiente',
        'motivo', trim(p_motivo_urgencia)
      )
    );
  end if;

  return jsonb_build_object(
    'solicitud_id', v_solicitud_id,
    'folio_sol', null,
    'tipo_codigo', p_tipo_codigo,
    'estado_codigo', v_estado_codigo,
    'prioridad_codigo', 'normal',
    'ciclo_estado', 1,
    'productos_total', v_productos_count,
    'servicios_total', v_servicios_count,
    'destinos_total', v_destinos_count,
    'adjuntos_total', v_adjuntos_count,
    'peticion_urgente_creada', (p_enviar and coalesce(p_solicitar_urgente, false)),
    'urgente_ignorado_por_borrador', (coalesce(p_solicitar_urgente, false) and not p_enviar)
  );
end;
$$;

grant execute on function public.rpc_crear_solicitud_compra_go(
  text,
  date,
  text,
  jsonb,
  jsonb,
  jsonb,
  boolean,
  boolean,
  text,
  jsonb,
  boolean
) to authenticated;

-- ------------------------------------------------
-- 2. RPC DE LISTADO
-- ------------------------------------------------
-- Estrategia:
-- - `vw_solicitudes_lista` se actualiza para exponer `destinos`
-- - el RPC consume `destinos` y `destinos_total` directo desde la vista
-- - el label visible se arma asi:
--   * equipo -> codigo
--   * catalogo_contexto_destino -> nombre actual, incluso si esta inactivo

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

DROP VIEW IF EXISTS public.vw_solicitudes_lista;

create or replace view public.vw_solicitudes_lista as
select
  sc.id,
  sc.folio_sol,
  sc.solicitante_email,
  coalesce(
    nullif(trim(both from au.nombre), ''),
    sc.solicitante_email
  ) as solicitante_nombre,
  sc.fecha_entrega,
  sc.fecha_entrega_sistema,
  oc.fecha_entrega_proveedor,
  coalesce(
    oc.fecha_entrega_proveedor,
    sc.fecha_entrega_sistema,
    sc.fecha_entrega
  ) as fecha_entrega_mostrada,
  case
    when oc.fecha_entrega_proveedor is not null then 'proveedor'::text
    when sc.fecha_entrega_sistema is not null then 'sistema'::text
    else 'solicitud'::text
  end as fecha_entrega_origen,
  sc.fecha_subida_sistema,
  sc.observacion,
  sc.ciclo_estado,
  sc.created_at,
  sc.updated_at,
  ts.codigo as tipo_codigo,
  ts.nombre as tipo_nombre,
  e.codigo as estado_codigo,
  e.nombre as estado_nombre,
  p.codigo as prioridad_codigo,
  p.nombre as prioridad_nombre,
  ar.codigo as area_solicitante_codigo,
  ar.nombre as area_solicitante_nombre,
  rr.codigo as role_solicitante_codigo,
  rr.nombre as role_solicitante_nombre,
  case
    when e.codigo = any (
      array[
        'solicitud_con_oc_fecha_entrega'::text,
        'solicitud_cerrada'::text
      ]
    ) then 'completadas'::text
    when e.codigo = any (
      array[
        'rechazado'::text,
        'descartado_por_supervisor'::text,
        'rechazado_comprador'::text,
        'cancelado'::text
      ]
    ) then 'descartadas'::text
    else 'en_proceso'::text
  end as grupo_listado,
  h.fecha_inicio as disponible_desde,
  l.locked_by_email,
  l.locked_at,
  coalesce(l.activo, false) as bloqueada,
  case
    when l.activo = true then 'bloqueada'::text
    when e.codigo = any (
      array[
        'para_revision_almacen'::text,
        'para_revision_supervisor'::text,
        'para_revision_gerencia'::text,
        'aprobado_gerencia'::text,
        'subido_sistema_compra'::text
      ]
    ) then 'pendiente'::text
    when e.codigo = any (
      array[
        'rechazado'::text,
        'descartado_por_supervisor'::text,
        'rechazado_comprador'::text,
        'cancelado'::text
      ]
    ) then 'cerrada'::text
    else e.codigo
  end as badge_codigo,
  case
    when l.activo = true then 'Bloqueada'::text
    when e.codigo = any (
      array[
        'para_revision_almacen'::text,
        'para_revision_supervisor'::text,
        'para_revision_gerencia'::text,
        'aprobado_gerencia'::text,
        'subido_sistema_compra'::text
      ]
    ) then 'Pendiente'::text
    when e.codigo = any (
      array[
        'rechazado'::text,
        'descartado_por_supervisor'::text,
        'rechazado_comprador'::text,
        'cancelado'::text
      ]
    ) then 'Cerrada'::text
    else e.nombre
  end as badge_label,
  coalesce(prod.productos_total, 0::bigint) as productos_total,
  coalesce(prod.productos_activos, 0::bigint) as productos_activos,
  coalesce(serv.servicios_total, 0::bigint) as servicios_total,
  coalesce(adj.cantidad_adjuntos, 0::bigint) as cantidad_adjuntos,
  coalesce(adj.cantidad_adjuntos, 0::bigint) > 0 as tiene_adjuntos,
  coalesce(oc.cantidad_oc, 0::bigint) as cantidad_oc,
  oc.folio_oc_principal,
  coalesce(oc.folios_oc, array[]::text[]) as folios_oc,
  coalesce(oc.ordenes_compra_resumen, '[]'::jsonb) as ordenes_compra_resumen,
  oc.estado_oc_principal,
  oc.evaluacion_principal,
  oc.recepcion_principal,
  oc.proveedor_principal,
  coalesce(dif.cantidad_diferencias, 0::bigint) as cantidad_diferencias,
  coalesce(dif.cantidad_diferencias, 0::bigint) > 0 as tiene_diferencia_oc,
  coalesce(dif.cantidad_diferencias, 0::bigint) > 0 as tiene_alerta_oc,
  coalesce(dest.destinos, array[]::text[]) as equipos,
  coalesce(dest.destinos_total, 0::bigint) as equipos_total,
  coalesce(dest.destinos, array[]::text[]) as destinos,
  coalesce(dest.destinos_total, 0::bigint) as destinos_total
from solicitud_compra sc
join tipo_solicitud ts on ts.id = sc.tipo_solicitud_id
join estado e on e.id = sc.estado_id
join prioridad p on p.id = sc.prioridad_id
left join app_area ar on ar.id = sc.area_solicitante_id
left join app_role rr on rr.id = sc.role_solicitante_id
left join app_usuario au on lower(au.email) = lower(sc.solicitante_email)
left join lateral (
  select hh.fecha_inicio
  from solicitud_estado_historial hh
  where
    hh.solicitud_id = sc.id
    and hh.estado_id = sc.estado_id
    and hh.ciclo = sc.ciclo_estado
    and hh.fecha_fin is null
    and hh.invalidado = false
  order by hh.fecha_inicio desc
  limit 1
) h on true
left join lateral (
  select
    ll.id,
    ll.solicitud_id,
    ll.locked_by_email,
    ll.locked_by_area_id,
    ll.locked_by_role_id,
    ll.locked_at,
    ll.released_at,
    ll.activo
  from solicitud_compra_lock ll
  where
    ll.solicitud_id = sc.id
    and ll.activo = true
    and ll.released_at is null
  order by ll.locked_at desc
  limit 1
) l on true
left join lateral (
  select
    count(*) as productos_total,
    count(*) filter (
      where d.activo = true
    ) as productos_activos
  from solicitud_producto_detalle d
  where d.solicitud_id = sc.id
) prod on true
left join lateral (
  select count(*) as servicios_total
  from solicitud_servicio_detalle s
  where s.solicitud_id = sc.id
) serv on true
left join lateral (
  select count(*) as cantidad_adjuntos
  from solicitud_adjunto a
  where
    a.solicitud_id = sc.id
    and a.eliminado = false
) adj on true
left join lateral (
  select
    array_agg(
      case
        when scd.tipo_origen = 'equipo' then scd.codigo
        else coalesce(nullif(trim(ccd.nombre), ''), scd.codigo)
      end
      order by
        case
          when scd.tipo_origen = 'equipo' then scd.codigo
          else coalesce(nullif(trim(ccd.nombre), ''), scd.codigo)
        end
    ) as destinos,
    count(*) as destinos_total
  from solicitud_contexto_destino scd
  left join catalogo_contexto_destino ccd
    on ccd.codigo = scd.codigo
   and ccd.tipo_origen = scd.tipo_origen
  where scd.solicitud_id = sc.id
) dest on true
left join lateral (
  select count(*) as cantidad_diferencias
  from solicitud_compra_diferencia d
  where
    d.solicitud_id = sc.id
    and d.activo = true
) dif on true
left join lateral (
  select
    count(*) as cantidad_oc,
    (array_agg(
      x.folio_oc
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ))[1] as folio_oc_principal,
    array_agg(
      x.folio_oc
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ) as folios_oc,
    min(x.fecha_entrega) filter (
      where x.fecha_entrega is not null
    ) as fecha_entrega_proveedor,
    (array_agg(
      x.estado
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ))[1] as estado_oc_principal,
    (array_agg(
      x.evaluacion
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ))[1] as evaluacion_principal,
    (array_agg(
      x.recepcion
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ))[1] as recepcion_principal,
    (array_agg(
      x.proveedor
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ))[1] as proveedor_principal,
    jsonb_agg(
      jsonb_build_object(
        'id', x.id,
        'folio_oc', x.folio_oc,
        'estado', x.estado,
        'evaluacion', x.evaluacion,
        'recepcion', x.recepcion,
        'proveedor', x.proveedor,
        'fecha_entrega', x.fecha_entrega,
        'fecha_compromiso', x.fecha_compromiso,
        'fecha_oc', x.fecha_oc
      )
      order by
        x.imported_at desc nulls last,
        x.created_at desc
    ) as ordenes_compra_resumen
  from orden_compra x
  where
    x.solicitud_id = sc.id
    or x.folio_sol = sc.folio_sol
) oc on true;

create or replace function public.rpc_obtener_solicitudes_lista_usuario(
  p_busqueda text default null,
  p_grupo_listado text default 'en_proceso',
  p_estado_codigo text default null,
  p_prioridad_codigo text default null,
  p_fecha_desde date default null,
  p_fecha_hasta date default null,
  p_solo_bloqueadas boolean default false,
  p_solo_diferencia_oc boolean default false,
  p_limit integer default 50,
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
  estado_codigo text,
  estado_nombre text,
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
  disponible_desde timestamptz,
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
  destinos_total bigint
)
language plpgsql
security definer
set search_path to public
as $$
declare
  v_email text;
  v_role text;
  v_area text;
  v_today date;
  v_fecha_desde date;
  v_fecha_hasta date;
  v_busqueda text;
  v_estados_visibles text[];
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

  v_estados_visibles :=
    case v_role
      when 'admin' then null
      when 'almacen' then array[
        'para_revision_almacen',
        'en_revision_almacen',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen'
      ]
      when 'gerencia' then array[
        'para_revision_gerencia',
        'en_revision_gerencia',
        'aprobado_gerencia'
      ]
      when 'secretaria' then array[
        'aprobado_gerencia',
        'subiendo_sistema_compras',
        'orden_compra'
      ]
      when 'operativo' then array[
        'borrador',
        'para_revision_almacen',
        'en_revision_almacen',
        'para_revision_supervisor',
        'en_revision_supervisor',
        'para_revision_gerencia',
        'en_revision_gerencia',
        'aprobado_gerencia',
        'subiendo_sistema_compras',
        'orden_compra',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen',
        'rechazado',
        'descartado_por_supervisor'
      ]
      else array[]::text[]
    end;

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

  return query
  with base_fecha as (
    select s.*
    from public.vw_solicitudes_lista s
    where
      s.created_at >= (v_fecha_desde::timestamp at time zone 'America/Panama')
      and s.created_at < ((v_fecha_hasta + 1)::timestamp at time zone 'America/Panama')
  ),
  base as (
    select s.*
    from base_fecha s
    where
      (
        v_role = 'admin'
        or s.estado_codigo = any(v_estados_visibles)
      )
      and (
        p_grupo_listado is null
        or s.grupo_listado = p_grupo_listado
      )
      and (
        p_estado_codigo is null
        or s.estado_codigo = p_estado_codigo
      )
      and (
        p_prioridad_codigo is null
        or s.prioridad_codigo = p_prioridad_codigo
      )
      and (
        p_solo_bloqueadas = false
        or s.bloqueada = true
      )
      and (
        p_solo_diferencia_oc = false
        or (
          v_can_ver_diferencia_oc = true
          and s.tiene_diferencia_oc = true
          and coalesce(s.cantidad_oc, 0) > 0
        )
      )
      and (
        v_role in ('admin', 'gerencia', 'almacen', 'secretaria')
        or (
          v_role = 'operativo'
          and (
            s.area_solicitante_codigo = v_area
            or lower(s.solicitante_email) = lower(v_email)
          )
        )
      )
      and (
        v_busqueda is null
        or s.observacion ilike '%' || v_busqueda || '%'
        or (
          v_can_ver_folio = true
          and s.folio_sol ilike '%' || v_busqueda || '%'
        )
        or (
          v_can_ver_oc = true
          and (
            s.folio_oc_principal ilike '%' || v_busqueda || '%'
            or exists (
              select 1
              from unnest(coalesce(s.folios_oc, array[]::text[])) as f(folio_oc)
              where f.folio_oc ilike '%' || v_busqueda || '%'
            )
          )
        )
        or (
          v_can_ver_area = true
          and (
            s.area_solicitante_nombre ilike '%' || v_busqueda || '%'
            or s.area_solicitante_codigo ilike '%' || v_busqueda || '%'
          )
        )
        or (
          v_can_ver_solicitante = true
          and s.solicitante_nombre ilike '%' || v_busqueda || '%'
        )
        or (
          v_can_ver_destinos = true
          and exists (
            select 1
            from unnest(coalesce(s.destinos, array[]::text[])) as d(destino)
            where d.destino ilike '%' || v_busqueda || '%'
          )
        )
        or s.estado_nombre ilike '%' || v_busqueda || '%'
        or s.estado_codigo ilike '%' || v_busqueda || '%'
        or s.prioridad_nombre ilike '%' || v_busqueda || '%'
        or s.prioridad_codigo ilike '%' || v_busqueda || '%'
      )
  ),
  counted as (
    select
      b.*,
      count(*) over () as total_count
    from base b
    order by
      b.bloqueada desc,
      b.disponible_desde asc nulls last,
      b.created_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
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
    c.estado_codigo,
    c.estado_nombre,
    c.badge_codigo,
    c.badge_label,
    c.prioridad_codigo,
    c.prioridad_nombre,
    case when v_can_ver_area then c.area_solicitante_codigo else null end as area_solicitante_codigo,
    case when v_can_ver_area then c.area_solicitante_nombre else null end as area_solicitante_nombre,
    case when v_can_ver_solicitante then c.solicitante_nombre else null end as solicitante_nombre,
    case when v_can_ver_fecha then c.fecha_entrega_mostrada else null end as fecha_entrega_mostrada,
    case when v_can_ver_fecha then c.fecha_entrega_origen else null end as fecha_entrega_origen,
    c.grupo_listado,
    c.disponible_desde,
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
    case when v_can_ver_destinos then c.destinos_total else 0 end as destinos_total
  from counted c;
end;
$$;

grant execute on function public.rpc_obtener_solicitudes_lista_usuario(
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
) to authenticated;

commit;
