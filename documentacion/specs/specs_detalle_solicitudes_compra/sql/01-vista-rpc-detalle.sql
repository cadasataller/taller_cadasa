-- ============================================================
-- DETALLE DE SOLICITUDES DE COMPRA
-- Vista base + RPC filtrado por usuario
-- Fuente de referencia:
-- - documentacion/specs/utils/bd_compras.sql
-- - documentacion/specs/specs_detalle_solicitudes_compra/specs/
-- ============================================================

drop function if exists public.rpc_obtener_solicitud_detalle_usuario(uuid);
drop view if exists public.vw_solicitud_detalle_completo;

create or replace view public.vw_solicitud_detalle_completo as
select
  v.id,
  sc.solicitante_email,
  v.solicitante_nombre,
  v.folio_sol,
  v.folio_oc_principal,
  v.folios_oc,
  v.observacion,
  v.estado_codigo,
  v.estado_nombre,
  v.badge_codigo,
  v.badge_label,
  v.prioridad_codigo,
  v.prioridad_nombre,
  v.tipo_codigo,
  v.tipo_nombre,
  ts.requiere_almacen,
  ts.permite_productos,
  ts.permite_servicios,
  v.area_solicitante_codigo,
  v.area_solicitante_nombre,
  v.role_solicitante_codigo,
  v.role_solicitante_nombre,
  sc.fecha_entrega as fecha_entrega_solicitud,
  sc.fecha_entrega_sistema,
  v.fecha_entrega_proveedor,
  v.fecha_entrega_mostrada,
  v.fecha_entrega_origen,
  sc.fecha_subida_sistema,
  sc.estado_importado_codigo,
  sc.estado_importado_raw,
  sc.estado_importado_at,
  sc.ciclo_estado,
  v.grupo_listado,
  v.disponible_desde,
  v.bloqueada,
  v.locked_by_email,
  v.locked_at,
  v.cantidad_adjuntos,
  v.tiene_adjuntos,
  v.cantidad_oc,
  v.ordenes_compra_resumen,
  v.estado_oc_principal,
  v.evaluacion_principal,
  v.recepcion_principal,
  v.proveedor_principal,
  v.cantidad_diferencias,
  v.tiene_diferencia_oc,
  v.destinos,
  v.destinos_total,
  coalesce(v.cantidad_oc, 0) > 0 as hay_oc,
  case
    when coalesce(v.cantidad_oc, 0) > 0 then 'con_oc'::text
    else 'sin_oc'::text
  end as modo_detalle,
  coalesce(adj.adjuntos, '[]'::jsonb) as adjuntos,
  coalesce(det.detalles_activos, '[]'::jsonb) as detalles_activos,
  coalesce(det.detalles_descartados, '[]'::jsonb) as detalles_descartados,
  coalesce(det.detalles_activos_total, 0::bigint) as detalles_activos_total,
  coalesce(det.detalles_descartados_total, 0::bigint) as detalles_descartados_total,
  sc.created_at,
  sc.updated_at
from public.vw_solicitudes_lista v
join public.solicitud_compra sc
  on sc.id = v.id
join public.tipo_solicitud ts
  on ts.id = sc.tipo_solicitud_id
left join lateral (
  select
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'tipo_codigo', ta.codigo,
        'tipo_nombre', ta.nombre,
        'bucket_id', a.bucket_id,
        'storage_path', a.storage_path,
        'nombre_original', a.nombre_original,
        'mime_type', a.mime_type,
        'extension', a.extension,
        'size_bytes', a.size_bytes,
        'descripcion', a.descripcion,
        'subido_por_email', a.subido_por_email,
        'created_at', a.created_at
      )
      order by a.created_at desc
    ) as adjuntos
  from public.solicitud_adjunto a
  join public.tipo_adjunto ta
    on ta.id = a.tipo_adjunto_id
  where a.solicitud_id = sc.id
    and a.eliminado = false
) adj on true
left join lateral (
  with detalles as (
    select
      'producto'::text as detalle_tipo,
      case
        when e_det.codigo in ('descartado_almacen', 'descartado_gerencia')
          then 'descartados'::text
        else 'activas'::text
      end as agrupacion,
      d.id as detalle_id,
      d.ciclo,
      d.linea_solicitud,
      d.created_at,
      e_det.codigo as estado_codigo,
      e_det.nombre as estado_nombre,
      case
        when e_det.codigo = 'descartado_almacen' then 'almacen'::text
        when e_det.codigo = 'descartado_gerencia' then 'gerencia'::text
        else null::text
      end as descartado_por,
      d.descartado_por_email,
      p.id as item_id,
      p.cod_producto as codigo_item,
      coalesce(
        nullif(trim(p.nombre), ''),
        nullif(trim(p.descripcion), ''),
        nullif(trim(d.descripcion_original_supervisor), ''),
        p.cod_producto
      ) as nombre,
      coalesce(
        nullif(trim(d.descripcion_original_supervisor), ''),
        nullif(trim(p.descripcion), '')
      ) as descripcion_secundaria,
      um.codigo as unidad_codigo,
      um.abreviatura as unidad_abreviatura,
      d.cantidad_inventario,
      d.cantidad,
      d.cantidad_gerencia,
      d.cantidad_solicitada_sistema,
      coalesce(oc_line.cantidad_oc_total, 0::numeric) as cantidad_oc_total,
      coalesce(oc_line.cantidad_recibida_total, 0::numeric) as cantidad_recibida_total,
      coalesce(oc_line.folios_oc, array[]::text[]) as oc_folios,
      coalesce(oc_line.oc_detalles, '[]'::jsonb) as oc_detalles,
      coalesce(dif_line.cantidad_diferencias, 0::bigint) as cantidad_diferencias,
      coalesce(dif_line.diferencias, '[]'::jsonb) as diferencias,
      true as comparable_oc,
      null::text as comparacion_oc_motivo,
      false as requiere_lectura_manual_oc,
      d.requiere_revision_almacen,
      d.requiere_revision_sistema,
      d.revision_sistema_codigo,
      d.revision_sistema_label,
      coalesce(oc_line.cantidad_oc_total, 0::numeric) > 0 as tiene_oc_linea,
      case
        when coalesce(oc_line.cantidad_oc_total, 0::numeric) > 0 then 'con_oc'::text
        else 'sin_oc'::text
      end as modo_detalle_linea
    from public.solicitud_producto_detalle d
    join public.producto p
      on p.id = d.producto_id
    join public.unidad_medida um
      on um.id = p.unidad_medida_id
    join public.estado_contexto ec_det
      on ec_det.id = d.estado_contexto_id
     and ec_det.contexto = 'detalle_producto'
     and ec_det.activo = true
    join public.estado e_det
      on e_det.id = ec_det.estado_id
     and e_det.activo = true
    left join lateral (
      select
        count(distinct od.folio_oc)::bigint as cantidad_oc_linea,
        coalesce(sum(od.cantidad), 0::numeric) as cantidad_oc_total,
        coalesce(sum(od.cantidad_recibida), 0::numeric) as cantidad_recibida_total,
        array_agg(distinct od.folio_oc order by od.folio_oc) as folios_oc,
        jsonb_agg(
          jsonb_build_object(
            'id', od.id,
            'folio_oc', od.folio_oc,
            'cantidad', od.cantidad,
            'cantidad_recibida', od.cantidad_recibida,
            'linea_fuente', od.linea_fuente,
            'source_identity_key', od.source_identity_key,
            'revision_codigo', od.revision_codigo,
            'revision_label', od.revision_label,
            'descripcion_importada', od.descripcion_importada,
            'imported_at', od.imported_at
          )
          order by od.imported_at desc nulls last, od.created_at desc
        ) filter (where od.id is not null) as oc_detalles
      from public.orden_compra_detalle od
      where (od.solicitud_id = sc.id or od.folio_sol = sc.folio_sol)
        and od.activo_fuente = true
        and coalesce(od.es_servicio_importado, false) = false
        and od.cod_producto = p.cod_producto
    ) oc_line on true
    left join lateral (
      select
        count(*)::bigint as cantidad_diferencias,
        jsonb_agg(
          jsonb_build_object(
            'id', dif.id,
            'folio_oc', dif.folio_oc,
            'cod_producto', dif.cod_producto,
            'diferencia_codigo', dif.diferencia_codigo,
            'diferencia_label', dif.diferencia_label,
            'severidad', dif.severidad,
            'cantidad_gerencia', dif.cantidad_gerencia,
            'cantidad_solicitada_sistema', dif.cantidad_solicitada_sistema,
            'cantidad_comprada', dif.cantidad_comprada,
            'raw_data', dif.raw_data,
            'created_at', dif.created_at
          )
          order by dif.created_at desc
        ) filter (where dif.id is not null) as diferencias
      from public.solicitud_compra_diferencia dif
      where dif.solicitud_id = sc.id
        and dif.solicitud_producto_detalle_id = d.id
        and dif.activo = true
    ) dif_line on true
    where d.solicitud_id = sc.id

    union all

    select
      'servicio'::text as detalle_tipo,
      case
        when e_det.codigo = 'descartado_gerencia' then 'descartados'::text
        else 'activas'::text
      end as agrupacion,
      s.id as detalle_id,
      s.ciclo,
      null::integer as linea_solicitud,
      s.created_at,
      e_det.codigo as estado_codigo,
      e_det.nombre as estado_nombre,
      case
        when e_det.codigo = 'descartado_gerencia' then 'gerencia'::text
        else null::text
      end as descartado_por,
      s.descartado_por_email,
      null::uuid as item_id,
      null::text as codigo_item,
      s.descripcion as nombre,
      null::text as descripcion_secundaria,
      um.codigo as unidad_codigo,
      um.abreviatura as unidad_abreviatura,
      null::numeric as cantidad_inventario,
      s.cantidad,
      s.cantidad_gerencia,
      null::numeric as cantidad_solicitada_sistema,
      null::numeric as cantidad_oc_total,
      null::numeric as cantidad_recibida_total,
      array[]::text[] as oc_folios,
      '[]'::jsonb as oc_detalles,
      0::bigint as cantidad_diferencias,
      '[]'::jsonb as diferencias,
      false as comparable_oc,
      'servicio_sin_codigo_producto'::text as comparacion_oc_motivo,
      true as requiere_lectura_manual_oc,
      false as requiere_revision_almacen,
      false as requiere_revision_sistema,
      null::text as revision_sistema_codigo,
      null::text as revision_sistema_label,
      false as tiene_oc_linea,
      'servicio_sin_comparacion_oc'::text as modo_detalle_linea
    from public.solicitud_servicio_detalle s
    join public.unidad_medida um
      on um.id = s.unidad_medida_id
    join public.estado_contexto ec_det
      on ec_det.id = s.estado_contexto_id
     and ec_det.contexto = 'detalle_servicio'
     and ec_det.activo = true
    join public.estado e_det
      on e_det.id = ec_det.estado_id
     and e_det.activo = true
    where s.solicitud_id = sc.id
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'detalle_id', detalle_id,
          'detalle_tipo', detalle_tipo,
          'agrupacion', agrupacion,
          'ciclo', ciclo,
          'linea_solicitud', linea_solicitud,
          'created_at', created_at,
          'estado_codigo', estado_codigo,
          'estado_nombre', estado_nombre,
          'descartado_por', descartado_por,
          'descartado_por_email', descartado_por_email,
          'item_id', item_id,
          'codigo_item', codigo_item,
          'nombre', nombre,
          'descripcion_secundaria', descripcion_secundaria,
          'unidad_codigo', unidad_codigo,
          'unidad_abreviatura', unidad_abreviatura,
          'cantidad_inventario', cantidad_inventario,
          'cantidad', cantidad,
          'cantidad_gerencia', cantidad_gerencia,
          'cantidad_solicitada_sistema', cantidad_solicitada_sistema,
          'cantidad_oc_total', cantidad_oc_total,
          'cantidad_recibida_total', cantidad_recibida_total,
          'oc_folios', oc_folios,
          'oc_detalles', oc_detalles,
          'cantidad_diferencias', cantidad_diferencias,
          'diferencias', diferencias,
          'comparable_oc', comparable_oc,
          'comparacion_oc_motivo', comparacion_oc_motivo,
          'requiere_lectura_manual_oc', requiere_lectura_manual_oc,
          'requiere_revision_almacen', requiere_revision_almacen,
          'requiere_revision_sistema', requiere_revision_sistema,
          'revision_sistema_codigo', revision_sistema_codigo,
          'revision_sistema_label', revision_sistema_label,
          'tiene_oc_linea', tiene_oc_linea,
          'modo_detalle_linea', modo_detalle_linea
        )
        order by
          case when linea_solicitud is null then 1 else 0 end,
          linea_solicitud asc nulls last,
          created_at asc
      ) filter (where agrupacion = 'activas'),
      '[]'::jsonb
    ) as detalles_activos,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'detalle_id', detalle_id,
          'detalle_tipo', detalle_tipo,
          'agrupacion', agrupacion,
          'ciclo', ciclo,
          'linea_solicitud', linea_solicitud,
          'created_at', created_at,
          'estado_codigo', estado_codigo,
          'estado_nombre', estado_nombre,
          'descartado_por', descartado_por,
          'descartado_por_email', descartado_por_email,
          'item_id', item_id,
          'codigo_item', codigo_item,
          'nombre', nombre,
          'descripcion_secundaria', descripcion_secundaria,
          'unidad_codigo', unidad_codigo,
          'unidad_abreviatura', unidad_abreviatura,
          'cantidad_inventario', cantidad_inventario,
          'cantidad', cantidad,
          'cantidad_gerencia', cantidad_gerencia,
          'cantidad_solicitada_sistema', cantidad_solicitada_sistema,
          'cantidad_oc_total', cantidad_oc_total,
          'cantidad_recibida_total', cantidad_recibida_total,
          'oc_folios', oc_folios,
          'oc_detalles', oc_detalles,
          'cantidad_diferencias', cantidad_diferencias,
          'diferencias', diferencias,
          'comparable_oc', comparable_oc,
          'comparacion_oc_motivo', comparacion_oc_motivo,
          'requiere_lectura_manual_oc', requiere_lectura_manual_oc,
          'requiere_revision_almacen', requiere_revision_almacen,
          'requiere_revision_sistema', requiere_revision_sistema,
          'revision_sistema_codigo', revision_sistema_codigo,
          'revision_sistema_label', revision_sistema_label,
          'tiene_oc_linea', tiene_oc_linea,
          'modo_detalle_linea', modo_detalle_linea
        )
        order by
          ciclo desc,
          case when linea_solicitud is null then 1 else 0 end,
          linea_solicitud asc nulls last,
          created_at asc
      ) filter (where agrupacion = 'descartados'),
      '[]'::jsonb
    ) as detalles_descartados,
    count(*) filter (where agrupacion = 'activas')::bigint as detalles_activos_total,
    count(*) filter (where agrupacion = 'descartados')::bigint as detalles_descartados_total
  from detalles
) det on true;

create or replace function public.rpc_obtener_solicitud_detalle_usuario(
  p_solicitud_id uuid
)
returns table (
  id uuid,
  viewer_email text,
  viewer_role_codigo text,
  viewer_area_codigo text,
  can_ver_folio boolean,
  can_ver_oc boolean,
  can_ver_area boolean,
  can_ver_solicitante boolean,
  can_ver_fecha boolean,
  can_ver_adjuntos boolean,
  can_ver_diferencia_oc boolean,
  can_ver_destinos boolean,
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
  tipo_codigo text,
  tipo_nombre text,
  requiere_almacen boolean,
  permite_productos boolean,
  permite_servicios boolean,
  area_solicitante_codigo text,
  area_solicitante_nombre text,
  solicitante_nombre text,
  fecha_entrega_solicitud date,
  fecha_entrega_sistema date,
  fecha_entrega_proveedor date,
  fecha_entrega_mostrada date,
  fecha_entrega_origen text,
  fecha_subida_sistema date,
  estado_importado_codigo text,
  estado_importado_raw text,
  estado_importado_at timestamptz,
  ciclo_estado integer,
  grupo_listado text,
  disponible_desde timestamptz,
  bloqueada boolean,
  locked_by_email text,
  locked_at timestamptz,
  cantidad_adjuntos bigint,
  tiene_adjuntos boolean,
  adjuntos jsonb,
  cantidad_oc bigint,
  ordenes_compra_resumen jsonb,
  estado_oc_principal text,
  evaluacion_principal text,
  recepcion_principal text,
  proveedor_principal text,
  cantidad_diferencias bigint,
  tiene_diferencia_oc boolean,
  destinos text[],
  destinos_total bigint,
  hay_oc boolean,
  modo_detalle text,
  detalles_activos jsonb,
  detalles_descartados jsonb,
  detalles_activos_total bigint,
  detalles_descartados_total bigint,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path to public
as $$
declare
  v_email text;
  v_role text;
  v_area text;
  v_estados_visibles text[];
  v_can_ver_folio boolean;
  v_can_ver_oc boolean;
  v_can_ver_area boolean;
  v_can_ver_solicitante boolean;
  v_can_ver_fecha boolean;
  v_can_ver_adjuntos boolean;
  v_can_ver_diferencia_oc boolean;
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

  if p_solicitud_id is null then
    raise exception 'p_solicitud_id es obligatorio';
  end if;

  v_estados_visibles :=
    case v_role
      when 'admin' then null
      when 'almacen' then array[
        'para_revision_almacen',
        'en_revision_almacen',
        'revisado_por_almacen',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen'
      ]
      when 'gerencia' then array[
        'borrador',
        'para_revision_gerencia',
        'en_revision_gerencia',
        'aprobado_gerencia',
        'subiendo_sistema_compras',
        'subido_sistema_compra',
        'orden_compra',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen',
        'rechazado'
      ]
      when 'secretaria' then array[
        'aprobado_gerencia',
        'subiendo_sistema_compras',
        'subido_sistema_compra',
        'orden_compra',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen'
      ]
      when 'operativo' then array[
        'borrador',
        'para_revision_almacen',
        'en_revision_almacen',
        'revisado_por_almacen',
        'para_revision_supervisor',
        'en_revision_supervisor',
        'para_revision_gerencia',
        'en_revision_gerencia',
        'aprobado_gerencia',
        'subiendo_sistema_compras',
        'subido_sistema_compra',
        'orden_compra',
        'oc_recibido_parcial_almacen',
        'oc_recibido_completo_almacen',
        'rechazado',
        'descartado_por_supervisor'
      ]
      else array[]::text[]
    end;

  v_can_ver_folio := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');
  v_can_ver_oc := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');
  v_can_ver_area := v_role in ('admin', 'gerencia', 'almacen', 'secretaria');
  v_can_ver_solicitante := v_role in ('admin', 'secretaria');
  v_can_ver_fecha := v_role in ('operativo', 'admin', 'gerencia', 'secretaria');
  v_can_ver_adjuntos := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_diferencia_oc := v_role in ('operativo', 'admin', 'gerencia');
  v_can_ver_destinos := v_role in ('operativo', 'admin', 'gerencia');

  return query
  with base as (
    select d.*
    from public.vw_solicitud_detalle_completo d
    where d.id = p_solicitud_id
      and (
        v_role = 'admin'
        or d.estado_codigo = any(v_estados_visibles)
      )
      and (
        v_role in ('admin', 'gerencia', 'almacen', 'secretaria')
        or (
          v_role = 'operativo'
          and (
            d.area_solicitante_codigo = v_area
            or lower(d.solicitante_email) = lower(v_email)
          )
        )
      )
  )
  select
    b.id,
    v_email as viewer_email,
    v_role as viewer_role_codigo,
    v_area as viewer_area_codigo,
    v_can_ver_folio as can_ver_folio,
    v_can_ver_oc as can_ver_oc,
    v_can_ver_area as can_ver_area,
    v_can_ver_solicitante as can_ver_solicitante,
    v_can_ver_fecha as can_ver_fecha,
    v_can_ver_adjuntos as can_ver_adjuntos,
    v_can_ver_diferencia_oc as can_ver_diferencia_oc,
    v_can_ver_destinos as can_ver_destinos,
    case when v_can_ver_folio then b.folio_sol else null end as folio_sol,
    case when v_can_ver_oc then b.folio_oc_principal else null end as folio_oc_principal,
    case when v_can_ver_oc then b.folios_oc else array[]::text[] end as folios_oc,
    b.observacion,
    b.estado_codigo,
    b.estado_nombre,
    b.badge_codigo,
    b.badge_label,
    b.prioridad_codigo,
    b.prioridad_nombre,
    b.tipo_codigo,
    b.tipo_nombre,
    b.requiere_almacen,
    b.permite_productos,
    b.permite_servicios,
    case when v_can_ver_area then b.area_solicitante_codigo else null end as area_solicitante_codigo,
    case when v_can_ver_area then b.area_solicitante_nombre else null end as area_solicitante_nombre,
    case when v_can_ver_solicitante then b.solicitante_nombre else null end as solicitante_nombre,
    case when v_can_ver_fecha then b.fecha_entrega_solicitud else null end as fecha_entrega_solicitud,
    case when v_can_ver_fecha then b.fecha_entrega_sistema else null end as fecha_entrega_sistema,
    case when v_can_ver_fecha and v_can_ver_oc then b.fecha_entrega_proveedor else null end as fecha_entrega_proveedor,
    case when v_can_ver_fecha then b.fecha_entrega_mostrada else null end as fecha_entrega_mostrada,
    case when v_can_ver_fecha then b.fecha_entrega_origen else null end as fecha_entrega_origen,
    case when v_can_ver_fecha then b.fecha_subida_sistema else null end as fecha_subida_sistema,
    case when v_can_ver_oc then b.estado_importado_codigo else null end as estado_importado_codigo,
    case when v_can_ver_oc then b.estado_importado_raw else null end as estado_importado_raw,
    case when v_can_ver_oc then b.estado_importado_at else null end as estado_importado_at,
    b.ciclo_estado,
    b.grupo_listado,
    b.disponible_desde,
    b.bloqueada,
    case when b.bloqueada then b.locked_by_email else null end as locked_by_email,
    case when b.bloqueada then b.locked_at else null end as locked_at,
    case when v_can_ver_adjuntos then b.cantidad_adjuntos else 0 end as cantidad_adjuntos,
    case when v_can_ver_adjuntos then b.tiene_adjuntos else false end as tiene_adjuntos,
    case when v_can_ver_adjuntos then b.adjuntos else '[]'::jsonb end as adjuntos,
    case when v_can_ver_oc then b.cantidad_oc else 0 end as cantidad_oc,
    case when v_can_ver_oc then b.ordenes_compra_resumen else '[]'::jsonb end as ordenes_compra_resumen,
    case when v_can_ver_oc then b.estado_oc_principal else null end as estado_oc_principal,
    case when v_can_ver_oc then b.evaluacion_principal else null end as evaluacion_principal,
    case when v_can_ver_oc then b.recepcion_principal else null end as recepcion_principal,
    case when v_can_ver_oc then b.proveedor_principal else null end as proveedor_principal,
    case when v_can_ver_diferencia_oc then b.cantidad_diferencias else 0 end as cantidad_diferencias,
    case when v_can_ver_diferencia_oc then b.tiene_diferencia_oc else false end as tiene_diferencia_oc,
    case when v_can_ver_destinos then b.destinos else array[]::text[] end as destinos,
    case when v_can_ver_destinos then b.destinos_total else 0 end as destinos_total,
    case when v_can_ver_oc then b.hay_oc else false end as hay_oc,
    case when v_can_ver_oc then b.modo_detalle else 'sin_oc'::text end as modo_detalle,
    case
      when v_role in ('admin', 'gerencia', 'operativo') then b.detalles_activos
      when v_role = 'secretaria' then (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'detalle_id', e->'detalle_id',
              'detalle_tipo', e->'detalle_tipo',
              'agrupacion', e->'agrupacion',
              'ciclo', e->'ciclo',
              'linea_solicitud', e->'linea_solicitud',
              'created_at', e->'created_at',
              'estado_codigo', e->'estado_codigo',
              'estado_nombre', e->'estado_nombre',
              'descartado_por', e->'descartado_por',
              'nombre', e->'nombre',
              'codigo_item', e->'codigo_item',
              'descripcion_secundaria', e->'descripcion_secundaria',
              'unidad_codigo', e->'unidad_codigo',
              'unidad_abreviatura', e->'unidad_abreviatura',
              'cantidad', e->'cantidad',
              'cantidad_gerencia', e->'cantidad_gerencia',
              'cantidad_solicitada_sistema', e->'cantidad_solicitada_sistema',
              'cantidad_oc_total', e->'cantidad_oc_total',
              'cantidad_recibida_total', e->'cantidad_recibida_total',
              'oc_folios', e->'oc_folios',
              'oc_detalles', e->'oc_detalles',
              'comparable_oc', e->'comparable_oc',
              'comparacion_oc_motivo', e->'comparacion_oc_motivo',
              'requiere_lectura_manual_oc', e->'requiere_lectura_manual_oc',
              'tiene_oc_linea', e->'tiene_oc_linea',
              'modo_detalle_linea', e->'modo_detalle_linea'
            )
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(b.detalles_activos) e
      )
      when v_role = 'almacen' then (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'detalle_id', e->'detalle_id',
              'detalle_tipo', e->'detalle_tipo',
              'agrupacion', e->'agrupacion',
              'ciclo', e->'ciclo',
              'linea_solicitud', e->'linea_solicitud',
              'created_at', e->'created_at',
              'estado_codigo', e->'estado_codigo',
              'estado_nombre', e->'estado_nombre',
              'descartado_por', e->'descartado_por',
              'nombre', e->'nombre',
              'codigo_item', e->'codigo_item',
              'descripcion_secundaria', e->'descripcion_secundaria',
              'unidad_codigo', e->'unidad_codigo',
              'unidad_abreviatura', e->'unidad_abreviatura',
              'cantidad_inventario', e->'cantidad_inventario',
              'requiere_revision_almacen', e->'requiere_revision_almacen'
            )
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(b.detalles_activos) e
      )
      else '[]'::jsonb
    end as detalles_activos,
    case
      when v_role in ('admin', 'gerencia', 'operativo') then b.detalles_descartados
      when v_role = 'secretaria' then (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'detalle_id', e->'detalle_id',
              'detalle_tipo', e->'detalle_tipo',
              'agrupacion', e->'agrupacion',
              'ciclo', e->'ciclo',
              'linea_solicitud', e->'linea_solicitud',
              'created_at', e->'created_at',
              'estado_codigo', e->'estado_codigo',
              'estado_nombre', e->'estado_nombre',
              'descartado_por', e->'descartado_por',
              'nombre', e->'nombre',
              'codigo_item', e->'codigo_item',
              'descripcion_secundaria', e->'descripcion_secundaria',
              'unidad_codigo', e->'unidad_codigo',
              'unidad_abreviatura', e->'unidad_abreviatura',
              'cantidad', e->'cantidad',
              'cantidad_gerencia', e->'cantidad_gerencia',
              'cantidad_solicitada_sistema', e->'cantidad_solicitada_sistema',
              'cantidad_oc_total', e->'cantidad_oc_total',
              'cantidad_recibida_total', e->'cantidad_recibida_total',
              'oc_folios', e->'oc_folios',
              'oc_detalles', e->'oc_detalles',
              'comparable_oc', e->'comparable_oc',
              'comparacion_oc_motivo', e->'comparacion_oc_motivo',
              'requiere_lectura_manual_oc', e->'requiere_lectura_manual_oc',
              'tiene_oc_linea', e->'tiene_oc_linea',
              'modo_detalle_linea', e->'modo_detalle_linea'
            )
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(b.detalles_descartados) e
      )
      when v_role = 'almacen' then (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'detalle_id', e->'detalle_id',
              'detalle_tipo', e->'detalle_tipo',
              'agrupacion', e->'agrupacion',
              'ciclo', e->'ciclo',
              'linea_solicitud', e->'linea_solicitud',
              'created_at', e->'created_at',
              'estado_codigo', e->'estado_codigo',
              'estado_nombre', e->'estado_nombre',
              'descartado_por', e->'descartado_por',
              'nombre', e->'nombre',
              'codigo_item', e->'codigo_item',
              'descripcion_secundaria', e->'descripcion_secundaria',
              'unidad_codigo', e->'unidad_codigo',
              'unidad_abreviatura', e->'unidad_abreviatura',
              'cantidad_inventario', e->'cantidad_inventario',
              'requiere_revision_almacen', e->'requiere_revision_almacen'
            )
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(b.detalles_descartados) e
      )
      else '[]'::jsonb
    end as detalles_descartados,
    b.detalles_activos_total,
    b.detalles_descartados_total,
    b.created_at,
    b.updated_at
  from base b;
end;
$$;

grant execute on function public.rpc_obtener_solicitud_detalle_usuario(uuid)
to authenticated;
