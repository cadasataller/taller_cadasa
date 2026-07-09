create view public.vw_solicitudes_lista as
select
  sc.id,
  sc.folio_sol,
  sc.solicitante_email,
  COALESCE(
    NULLIF(
      TRIM(
        both
        from
          au.nombre
      ),
      ''::text
    ),
    sc.solicitante_email
  ) as solicitante_nombre,
  sc.fecha_entrega,
  sc.fecha_entrega_sistema,
  oc.fecha_entrega_proveedor,
  COALESCE(
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
        'oc_recibido_parcial_almacen'::text,
        'oc_recibido_completo_almacen'::text
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
  COALESCE(l.activo, false) as bloqueada,
  case
    when l.activo = true then 'bloqueada'::text
    when e.codigo = any (
      array[
        'para_revision_almacen'::text,
        'para_revision_supervisor'::text,
        'para_revision_gerencia'::text,
        'aprobado_gerencia'::text,
        'subido_sistema_compra'::text,
        'subiendo_sistema_compras'::text
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
        'subido_sistema_compra'::text,
        'subiendo_sistema_compras'::text
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
  COALESCE(prod.productos_total, 0::bigint) as productos_total,
  COALESCE(prod.productos_activos, 0::bigint) as productos_activos,
  COALESCE(serv.servicios_total, 0::bigint) as servicios_total,
  COALESCE(adj.cantidad_adjuntos, 0::bigint) as cantidad_adjuntos,
  COALESCE(adj.cantidad_adjuntos, 0::bigint) > 0 as tiene_adjuntos,
  COALESCE(oc.cantidad_oc, 0::bigint) as cantidad_oc,
  oc.folio_oc_principal,
  COALESCE(oc.folios_oc, array[]::text[]) as folios_oc,
  COALESCE(oc.ordenes_compra_resumen, '[]'::jsonb) as ordenes_compra_resumen,
  oc.estado_oc_principal,
  oc.evaluacion_principal,
  oc.recepcion_principal,
  oc.proveedor_principal,
  COALESCE(dif.cantidad_diferencias, 0::bigint) as cantidad_diferencias,
  COALESCE(dif.cantidad_diferencias, 0::bigint) > 0 as tiene_diferencia_oc,
  COALESCE(dif.cantidad_diferencias, 0::bigint) > 0 as tiene_alerta_oc,
  COALESCE(dest.destinos, array[]::text[]) as destinos,
  COALESCE(dest.destinos_total, 0::bigint) as destinos_total
from
  solicitud_compra sc
  join tipo_solicitud ts on ts.id = sc.tipo_solicitud_id
  join estado_contexto ec_sc on ec_sc.id = sc.estado_contexto_id
  and ec_sc.contexto = 'solicitud'::text
  and ec_sc.activo = true
  join estado e on e.id = ec_sc.estado_id
  and e.activo = true
  join prioridad p on p.id = sc.prioridad_id
  left join app_area ar on ar.id = sc.area_solicitante_id
  left join app_role rr on rr.id = sc.role_solicitante_id
  left join app_usuario au on lower(au.email) = lower(sc.solicitante_email)
  left join lateral (
    select
      hh.fecha_inicio
    from
      solicitud_estado_historial hh
    where
      hh.solicitud_id = sc.id
      and hh.estado_contexto_id = sc.estado_contexto_id
      and hh.ciclo = sc.ciclo_estado
      and hh.fecha_fin is null
      and hh.invalidado = false
    order by
      hh.fecha_inicio desc
    limit
      1
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
    from
      solicitud_compra_lock ll
    where
      ll.solicitud_id = sc.id
      and ll.activo = true
      and ll.released_at is null
    order by
      ll.locked_at desc
    limit
      1
  ) l on true
  left join lateral (
    select
      count(*) as productos_total,
      count(*) filter (
        where
          d.activo = true
      ) as productos_activos
    from
      solicitud_producto_detalle d
    where
      d.solicitud_id = sc.id
  ) prod on true
  left join lateral (
    select
      count(*) as servicios_total
    from
      solicitud_servicio_detalle s
    where
      s.solicitud_id = sc.id
  ) serv on true
  left join lateral (
    select
      count(*) as cantidad_adjuntos
    from
      solicitud_adjunto a
    where
      a.solicitud_id = sc.id
      and a.eliminado = false
  ) adj on true
  left join lateral (
    select
      array_agg(
        case
          when scd.tipo_origen = 'equipo'::text then scd.codigo
          else COALESCE(
            NULLIF(
              TRIM(
                both
                from
                  ccd.nombre
              ),
              ''::text
            ),
            scd.codigo
          )
        end
        order by
          (
            case
              when scd.tipo_origen = 'equipo'::text then scd.codigo
              else COALESCE(
                NULLIF(
                  TRIM(
                    both
                    from
                      ccd.nombre
                  ),
                  ''::text
                ),
                scd.codigo
              )
            end
          )
      ) as destinos,
      count(*) as destinos_total
    from
      solicitud_contexto_destino scd
      left join catalogo_contexto_destino ccd on ccd.codigo = scd.codigo
      and ccd.tipo_origen = scd.tipo_origen
    where
      scd.solicitud_id = sc.id
  ) dest on true
  left join lateral (
    select
      count(*) as cantidad_diferencias
    from
      solicitud_compra_diferencia d
    where
      d.solicitud_id = sc.id
      and d.activo = true
  ) dif on true
  left join lateral (
    select
      count(*) as cantidad_oc,
      (
        array_agg(
          x.folio_oc
          order by
            x.imported_at desc nulls last,
            x.created_at desc
        )
      ) [1] as folio_oc_principal,
      array_agg(
        x.folio_oc
        order by
          x.imported_at desc nulls last,
          x.created_at desc
      ) as folios_oc,
      min(x.fecha_entrega) filter (
        where
          x.fecha_entrega is not null
      ) as fecha_entrega_proveedor,
      (
        array_agg(
          x.estado
          order by
            x.imported_at desc nulls last,
            x.created_at desc
        )
      ) [1] as estado_oc_principal,
      (
        array_agg(
          x.evaluacion
          order by
            x.imported_at desc nulls last,
            x.created_at desc
        )
      ) [1] as evaluacion_principal,
      (
        array_agg(
          x.recepcion
          order by
            x.imported_at desc nulls last,
            x.created_at desc
        )
      ) [1] as recepcion_principal,
      (
        array_agg(
          x.proveedor
          order by
            x.imported_at desc nulls last,
            x.created_at desc
        )
      ) [1] as proveedor_principal,
      jsonb_agg(
        jsonb_build_object(
          'id',
          x.id,
          'folio_oc',
          x.folio_oc,
          'estado',
          x.estado,
          'evaluacion',
          x.evaluacion,
          'recepcion',
          x.recepcion,
          'proveedor',
          x.proveedor,
          'fecha_entrega',
          x.fecha_entrega,
          'fecha_compromiso',
          x.fecha_compromiso,
          'fecha_oc',
          x.fecha_oc
        )
        order by
          x.imported_at desc nulls last,
          x.created_at desc
      ) as ordenes_compra_resumen
    from
      orden_compra x
    where
      x.solicitud_id = sc.id
      or x.folio_sol = sc.folio_sol
  ) oc on true;

  create table public.orden_compra_detalle (
  id uuid not null default gen_random_uuid (),
  orden_compra_id uuid null,
  solicitud_id uuid null,
  folio_oc text not null,
  folio_sol text not null,
  cod_producto text null,
  cantidad numeric null,
  cantidad_recibida numeric null,
  precio_unitario numeric null,
  precio_total numeric null,
  raw_data jsonb null,
  source_updated_at timestamp with time zone null,
  imported_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  row_hash text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  requiere_revision boolean not null default false,
  revision_codigo text null,
  revision_label text null,
  linea_fuente text null,
  source_identity_key text not null,
  source_name text not null default 'powerbi_excel'::text,
  last_seen_batch_id uuid null,
  activo_fuente boolean not null default true,
  source_deleted_at timestamp with time zone null,
  source_deleted_batch_id uuid null,
  change_detected_at timestamp with time zone null,
  es_servicio_importado boolean not null default false,
  descripcion_importada text null,
  constraint orden_compra_detalle_pkey primary key (id),
  constraint orden_compra_detalle_unique_source_key unique (folio_oc, folio_sol, source_identity_key),
  constraint orden_compra_detalle_orden_compra_id_fkey foreign KEY (orden_compra_id) references orden_compra (id) on delete CASCADE,
  constraint orden_compra_detalle_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete set null,
  constraint orden_compra_detalle_source_deleted_batch_fkey foreign KEY (source_deleted_batch_id) references oc_import_batch (id) on delete set null,
  constraint orden_compra_detalle_last_seen_batch_fkey foreign KEY (last_seen_batch_id) references oc_import_batch (id) on delete set null,
  constraint orden_compra_detalle_precio_total_check check ((precio_total >= (0)::numeric)),
  constraint orden_compra_detalle_cantidad_recibida_check check ((cantidad_recibida >= (0)::numeric)),
  constraint orden_compra_detalle_cantidad_check check ((cantidad >= (0)::numeric)),
  constraint orden_compra_detalle_precio_unitario_check check ((precio_unitario >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_detalle_identity on public.orden_compra_detalle using btree (folio_oc, folio_sol, source_identity_key) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_detalle_source_active on public.orden_compra_detalle using btree (source_name, activo_fuente) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_detalle_last_seen_batch on public.orden_compra_detalle using btree (last_seen_batch_id) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_detalle_servicio_importado on public.orden_compra_detalle using btree (
  folio_oc,
  folio_sol,
  source_name,
  es_servicio_importado
) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_detalle_folio_sol on public.orden_compra_detalle using btree (folio_sol) TABLESPACE pg_default;

create trigger trg_orden_compra_detalle_updated_at BEFORE
update on orden_compra_detalle for EACH row
execute FUNCTION fn_set_updated_at (); 

create table public.orden_compra (
  id uuid not null default gen_random_uuid (),
  folio_oc text not null,
  solicitud_id uuid null,
  folio_sol text not null,
  estado text not null,
  fecha_entrega date null,
  fecha_compromiso date null,
  proveedor text not null,
  source_updated_at timestamp with time zone null,
  imported_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone not null default now(),
  row_hash text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  estado_codigo text null,
  evaluacion text null,
  evaluacion_codigo text null,
  recepcion text null,
  recepcion_codigo text null,
  comprador text null,
  responsable text null,
  area text null,
  monto_oc numeric null,
  fecha_oc timestamp with time zone null,
  source_name text not null default 'powerbi_excel'::text,
  last_seen_batch_id uuid null,
  activo_fuente boolean not null default true,
  source_deleted_at timestamp with time zone null,
  source_deleted_batch_id uuid null,
  change_detected_at timestamp with time zone null,
  constraint orden_compra_pkey primary key (id),
  constraint orden_compra_folio_oc_key unique (folio_oc),
  constraint orden_compra_last_seen_batch_fkey foreign KEY (last_seen_batch_id) references oc_import_batch (id) on delete set null,
  constraint orden_compra_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete set null,
  constraint orden_compra_source_deleted_batch_fkey foreign KEY (source_deleted_batch_id) references oc_import_batch (id) on delete set null,
  constraint orden_compra_folio_sol_not_blank check (
    (
      length(
        TRIM(
          both
          from
            folio_sol
        )
      ) > 0
    )
  ),
  constraint orden_compra_folio_oc_not_blank check (
    (
      length(
        TRIM(
          both
          from
            folio_oc
        )
      ) > 0
    )
  ),
  constraint orden_compra_proveedor_not_blank check (
    (
      length(
        TRIM(
          both
          from
            proveedor
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_source_active on public.orden_compra using btree (source_name, activo_fuente) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_last_seen_batch on public.orden_compra using btree (last_seen_batch_id) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_source_deleted_batch on public.orden_compra using btree (source_deleted_batch_id) TABLESPACE pg_default;

create index IF not exists idx_orden_compra_folio_sol on public.orden_compra using btree (folio_sol) TABLESPACE pg_default;

create trigger trg_orden_compra_updated_at BEFORE
update on orden_compra for EACH row
execute FUNCTION fn_set_updated_at ();

create table public.producto_codigo_resolucion (
  id uuid not null default gen_random_uuid (),
  solicitud_producto_detalle_id uuid not null,
  producto_temporal_id uuid not null,
  producto_real_id uuid not null,
  codigo_temporal text not null,
  codigo_real text not null,
  descripcion_original_supervisor text null,
  resuelto_por_email text not null,
  created_at timestamp with time zone not null default now(),
  constraint producto_codigo_resolucion_pkey primary key (id),
  constraint producto_codigo_resolucion_producto_real_id_fkey foreign KEY (producto_real_id) references producto (id),
  constraint producto_codigo_resolucion_producto_temporal_id_fkey foreign KEY (producto_temporal_id) references producto (id),
  constraint producto_codigo_resolucion_solicitud_producto_detalle_id_fkey foreign KEY (solicitud_producto_detalle_id) references solicitud_producto_detalle (id) on delete CASCADE
) TABLESPACE pg_default; 

create table public.producto (
  id uuid not null default gen_random_uuid (),
  cod_producto text not null,
  descripcion text null,
  unidad_medida_id bigint not null,
  activo boolean not null default true,
  es_temporal boolean not null default false,
  estado_catalogo text not null default 'confirmado'::text,
  creado_por_email text null,
  validado_por_almacen_email text null,
  fecha_validacion_almacen timestamp with time zone null,
  descripcion_original_supervisor text null,
  codigo_temporal_original text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  nombre text not null,
  constraint producto_pkey primary key (id),
  constraint producto_cod_producto_key unique (cod_producto),
  constraint producto_unidad_medida_id_fkey foreign KEY (unidad_medida_id) references unidad_medida (id),
  constraint producto_nombre_not_blank check (
    (
      (nombre is null)
      or (
        length(
          TRIM(
            both
            from
              nombre
          )
        ) > 0
      )
    )
  ),
  constraint producto_estado_catalogo_chk check (
    (
      estado_catalogo = any (
        array[
          'temporal'::text,
          'confirmado'::text,
          'resuelto'::text,
          'inactivo'::text
        ]
      )
    )
  ),
  constraint producto_cod_producto_not_blank check (
    (
      length(
        TRIM(
          both
          from
            cod_producto
        )
      ) > 0
    )
  ),
  constraint producto_descripcion_not_blank check (
    (
      length(
        TRIM(
          both
          from
            descripcion
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_producto_cod on public.producto using btree (cod_producto) TABLESPACE pg_default;

create index IF not exists idx_producto_cod_producto_trgm on public.producto using gin (cod_producto gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_producto_descripcion_trgm on public.producto using gin (descripcion gin_trgm_ops) TABLESPACE pg_default;

create index IF not exists idx_producto_temporal on public.producto using btree (es_temporal, estado_catalogo) TABLESPACE pg_default;

create trigger trg_producto_updated_at BEFORE
update on producto for EACH row
execute FUNCTION fn_set_updated_at (); create table public.solicitud_adjunto (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  tipo_adjunto_id bigint not null default fn_tipo_adjunto_id ('general'::text),
  bucket_id text not null default 'solicitudes-compras'::text,
  storage_path text not null,
  nombre_original text not null,
  mime_type text not null,
  extension text null,
  size_bytes bigint null,
  descripcion text null,
  subido_por_email text not null,
  subido_por_area_id bigint null,
  subido_por_role_id bigint null,
  eliminado boolean not null default false,
  eliminado_por_email text null,
  eliminado_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint solicitud_adjunto_pkey primary key (id),
  constraint solicitud_adjunto_storage_path_key unique (storage_path),
  constraint solicitud_adjunto_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_adjunto_subido_por_area_id_fkey foreign KEY (subido_por_area_id) references app_area (id),
  constraint solicitud_adjunto_subido_por_role_id_fkey foreign KEY (subido_por_role_id) references app_role (id),
  constraint solicitud_adjunto_tipo_adjunto_id_fkey foreign KEY (tipo_adjunto_id) references tipo_adjunto (id),
  constraint solicitud_adjunto_size_bytes_check check (
    (
      (size_bytes is null)
      or (size_bytes >= 0)
    )
  ),
  constraint solicitud_adjunto_email_not_blank check (
    (
      length(
        TRIM(
          both
          from
            subido_por_email
        )
      ) > 0
    )
  ),
  constraint solicitud_adjunto_mime_not_blank check (
    (
      length(
        TRIM(
          both
          from
            mime_type
        )
      ) > 0
    )
  ),
  constraint solicitud_adjunto_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre_original
        )
      ) > 0
    )
  ),
  constraint solicitud_adjunto_deleted_consistency check (
    (
      (
        (eliminado = false)
        and (eliminado_at is null)
      )
      or (
        (eliminado = true)
        and (eliminado_at is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_adjunto_solicitud on public.solicitud_adjunto using btree (solicitud_id, created_at desc) TABLESPACE pg_default
where
  (eliminado = false);

create index IF not exists idx_solicitud_adjunto_tipo on public.solicitud_adjunto using btree (tipo_adjunto_id) TABLESPACE pg_default
where
  (eliminado = false);

create index IF not exists idx_solicitud_adjunto_subido_por on public.solicitud_adjunto using btree (subido_por_email, created_at desc) TABLESPACE pg_default;

create trigger trg_solicitud_adjunto_updated_at BEFORE
update on solicitud_adjunto for EACH row
execute FUNCTION fn_set_updated_at (); 
create table public.solicitud_compra (
  id uuid not null default gen_random_uuid (),
  folio_sol text null,
  tipo_solicitud_id bigint not null,
  prioridad_id bigint not null,
  area_solicitante_id bigint null,
  role_solicitante_id bigint null,
  solicitante_email text not null,
  fecha_entrega date not null,
  observacion text not null default ''::text,
  ciclo_estado integer not null default 1,
  fecha_subida_sistema date null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  fecha_entrega_sistema date null,
  estado_importado_codigo text null,
  estado_importado_raw text null,
  estado_importado_at timestamp with time zone null,
  estado_importado_batch_id uuid null,
  estado_contexto_id bigint not null,
  constraint solicitud_compra_pkey primary key (id),
  constraint solicitud_compra_folio_sol_key unique (folio_sol),
  constraint solicitud_compra_estado_importado_batch_fkey foreign KEY (estado_importado_batch_id) references oc_import_batch (id) on delete set null,
  constraint solicitud_compra_area_solicitante_id_fkey foreign KEY (area_solicitante_id) references app_area (id),
  constraint solicitud_compra_estado_contexto_id_fkey foreign KEY (estado_contexto_id) references estado_contexto (id),
  constraint solicitud_compra_prioridad_id_fkey foreign KEY (prioridad_id) references prioridad (id),
  constraint solicitud_compra_role_solicitante_id_fkey foreign KEY (role_solicitante_id) references app_role (id),
  constraint solicitud_compra_tipo_solicitud_id_fkey foreign KEY (tipo_solicitud_id) references tipo_solicitud (id),
  constraint solicitud_compra_ciclo_estado_check check ((ciclo_estado >= 1)),
  constraint solicitud_solicitante_email_not_blank check (
    (
      length(
        TRIM(
          both
          from
            solicitante_email
        )
      ) > 0
    )
  ),
  constraint solicitud_folio_sol_not_blank check (
    (
      (folio_sol is null)
      or (
        length(
          TRIM(
            both
            from
              folio_sol
          )
        ) > 0
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_fecha_entrega_sistema on public.solicitud_compra using btree (fecha_entrega_sistema) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_estado_contexto on public.solicitud_compra using btree (estado_contexto_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_tipo on public.solicitud_compra using btree (tipo_solicitud_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_solicitante on public.solicitud_compra using btree (solicitante_email) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_fecha_entrega on public.solicitud_compra using btree (fecha_entrega) TABLESPACE pg_default;

create trigger trg_solicitud_compra_updated_at BEFORE
update on solicitud_compra for EACH row
execute FUNCTION fn_set_updated_at ();
create table public.solicitud_compra_borrador (
  id uuid not null default gen_random_uuid (),
  creado_por_user_id uuid null,
  creado_por_email text not null,
  creado_por_nombre text not null,
  creado_por_area text null,
  activo boolean not null default true,
  schema_version integer not null default 1,
  current_step smallint not null,
  tipo_solicitud character varying(20) not null,
  fecha_entrega date not null,
  observacion character varying(250) not null,
  solicitar_urgente boolean not null default false,
  motivo_urgencia text null,
  destinos jsonb not null default '[]'::jsonb,
  productos jsonb not null default '[]'::jsonb,
  servicios jsonb not null default '[]'::jsonb,
  enviado_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint solicitud_compra_borrador_pkey primary key (id),
  constraint solicitud_compra_borrador_equipos_array_chk check ((jsonb_typeof(destinos) = 'array'::text)),
  constraint solicitud_compra_borrador_motivo_urgencia_chk check (
    (
      (solicitar_urgente = false)
      or (
        NULLIF(btrim(motivo_urgencia), ''::text) is not null
      )
    )
  ),
  constraint solicitud_compra_borrador_current_step_chk check (
    (
      (current_step >= 2)
      and (current_step <= 4)
    )
  ),
  constraint solicitud_compra_borrador_productos_array_chk check ((jsonb_typeof(productos) = 'array'::text)),
  constraint solicitud_compra_borrador_servicios_array_chk check ((jsonb_typeof(servicios) = 'array'::text)),
  constraint solicitud_compra_borrador_tipo_solicitud_chk check (
    (
      (tipo_solicitud)::text = any (
        (
          array[
            'zafra'::character varying,
            'cultivo'::character varying,
            'otros'::character varying,
            'servicio'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_borrador_creado_por_email_activo on public.solicitud_compra_borrador using btree (creado_por_email, activo, updated_at desc) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_borrador_creado_por_user_id_activo on public.solicitud_compra_borrador using btree (creado_por_user_id, activo, updated_at desc) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_borrador_activo on public.solicitud_compra_borrador using btree (activo) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_borrador_updated_at on public.solicitud_compra_borrador using btree (updated_at desc) TABLESPACE pg_default;

create trigger trg_set_borrador_creado_por_user_id BEFORE INSERT on solicitud_compra_borrador for EACH row
execute FUNCTION set_borrador_creado_por_user_id ();

create trigger trg_solicitud_compra_borrador_updated_at BEFORE
update on solicitud_compra_borrador for EACH row
execute FUNCTION set_updated_at (); 
create table public.solicitud_compra_diferencia (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid null,
  solicitud_producto_detalle_id uuid null,
  orden_compra_detalle_id uuid null,
  folio_sol text null,
  folio_oc text null,
  cod_producto text null,
  producto_id uuid null,
  fuente text not null,
  diferencia_codigo text not null,
  diferencia_label text not null,
  severidad text not null default 'warning'::text,
  cantidad_gerencia numeric null,
  cantidad_solicitada_sistema numeric null,
  cantidad_comprada numeric null,
  raw_data jsonb null,
  origen_calculo text not null default 'auto'::text,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  linea_solicitud integer null,
  constraint solicitud_compra_diferencia_pkey primary key (id),
  constraint solicitud_compra_diferencia_detalle_fkey foreign KEY (solicitud_producto_detalle_id) references solicitud_producto_detalle (id) on delete set null,
  constraint solicitud_compra_diferencia_producto_fkey foreign KEY (producto_id) references producto (id) on delete set null,
  constraint solicitud_compra_diferencia_solicitud_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_diferencia_solicitud on public.solicitud_compra_diferencia using btree (solicitud_id, activo) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_diferencia_folio_sol on public.solicitud_compra_diferencia using btree (folio_sol) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_diferencia_cod_producto on public.solicitud_compra_diferencia using btree (cod_producto) TABLESPACE pg_default;

create index IF not exists idx_solicitud_compra_diferencia_linea on public.solicitud_compra_diferencia using btree (solicitud_id, linea_solicitud) TABLESPACE pg_default
where
  (linea_solicitud is not null);

create trigger trg_solicitud_compra_diferencia_updated_at BEFORE
update on solicitud_compra_diferencia for EACH row
execute FUNCTION fn_set_updated_at ();
 create table public.solicitud_compra_lock (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  locked_by_email text not null,
  locked_by_area_id bigint null,
  locked_by_role_id bigint null,
  locked_at timestamp with time zone not null default now(),
  released_at timestamp with time zone null,
  activo boolean not null default true,
  constraint solicitud_compra_lock_pkey primary key (id),
  constraint solicitud_compra_lock_locked_by_area_id_fkey foreign KEY (locked_by_area_id) references app_area (id),
  constraint solicitud_compra_lock_locked_by_role_id_fkey foreign KEY (locked_by_role_id) references app_role (id),
  constraint solicitud_compra_lock_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_lock_email_not_blank check (
    (
      length(
        TRIM(
          both
          from
            locked_by_email
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists solicitud_compra_lock_one_active on public.solicitud_compra_lock using btree (solicitud_id) TABLESPACE pg_default
where
  (activo = true); create table public.solicitud_contexto_destino (
  id bigint generated always as identity not null,
  solicitud_id uuid not null,
  tipo_origen text not null,
  codigo text not null,
  created_at timestamp with time zone not null default now(),
  constraint solicitud_contexto_destino_pkey primary key (id),
  constraint solicitud_contexto_destino_unique unique (solicitud_id, tipo_origen, codigo),
  constraint solicitud_contexto_destino_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_contexto_destino_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint solicitud_contexto_destino_tipo_origen_chk check (
    (
      tipo_origen = any (
        array[
          'equipo'::text,
          'area_operativa'::text,
          'instalacion_taller'::text,
          'grupo_equipo'::text,
          'otros'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_contexto_destino_solicitud on public.solicitud_contexto_destino using btree (solicitud_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_contexto_destino_tipo_codigo on public.solicitud_contexto_destino using btree (tipo_origen, codigo) TABLESPACE pg_default;

create trigger trg_solicitud_contexto_destino_tipo_unico BEFORE INSERT
or
update on solicitud_contexto_destino for EACH row
execute FUNCTION fn_solicitud_contexto_destino_validar_tipo_unico (); 
create table public.solicitud_estado_historial (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  fecha_inicio timestamp with time zone not null default now(),
  fecha_fin timestamp with time zone null,
  creado_por text null,
  observacion text null,
  ciclo integer not null default 1,
  invalidado boolean not null default false,
  estado_contexto_id bigint not null,
  constraint solicitud_estado_historial_pkey primary key (id),
  constraint solicitud_estado_historial_estado_contexto_id_fkey foreign KEY (estado_contexto_id) references estado_contexto (id),
  constraint solicitud_estado_historial_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_estado_historial_ciclo_check check ((ciclo >= 1))
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_estado_historial_estado_contexto on public.solicitud_estado_historial using btree (estado_contexto_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_historial_solicitud on public.solicitud_estado_historial using btree (solicitud_id, fecha_inicio desc) TABLESPACE pg_default;

create index IF not exists idx_solicitud_historial_actual on public.solicitud_estado_historial using btree (solicitud_id) TABLESPACE pg_default
where
  (
    (fecha_fin is null)
    and (invalidado = false)
  );

create table public.solicitud_estado_transicion (
  id bigint generated always as identity not null,
  action_key text not null,
  actor_role_codigo text not null,
  tipo_solicitud_codigo text null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  estado_origen_contexto_id bigint not null,
  estado_destino_contexto_id bigint not null,
  constraint solicitud_estado_transicion_pkey primary key (id),
  constraint solicitud_transicion_contexto_unique unique (
    estado_origen_contexto_id,
    estado_destino_contexto_id,
    action_key,
    actor_role_codigo,
    tipo_solicitud_codigo
  ),
  constraint solicitud_estado_transicion_destino_contexto_fkey foreign KEY (estado_destino_contexto_id) references estado_contexto (id) on delete CASCADE,
  constraint solicitud_estado_transicion_origen_contexto_fkey foreign KEY (estado_origen_contexto_id) references estado_contexto (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_estado_transicion_origen_contexto on public.solicitud_estado_transicion using btree (estado_origen_contexto_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_estado_transicion_destino_contexto on public.solicitud_estado_transicion using btree (estado_destino_contexto_id) TABLESPACE pg_default;

create table public.solicitud_evento (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  ciclo integer not null default 1,
  action_key text not null,
  creado_por_email text null,
  area_codigo text null,
  role_codigo text null,
  observacion text null,
  payload_anterior jsonb null,
  payload_nuevo jsonb null,
  created_at timestamp with time zone not null default now(),
  estado_anterior_contexto_id bigint null,
  estado_nuevo_contexto_id bigint null,
  constraint solicitud_evento_pkey primary key (id),
  constraint solicitud_evento_estado_anterior_contexto_fkey foreign KEY (estado_anterior_contexto_id) references estado_contexto (id),
  constraint solicitud_evento_estado_nuevo_contexto_fkey foreign KEY (estado_nuevo_contexto_id) references estado_contexto (id),
  constraint solicitud_evento_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_evento_estado_anterior_contexto on public.solicitud_evento using btree (estado_anterior_contexto_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_evento_estado_nuevo_contexto on public.solicitud_evento using btree (estado_nuevo_contexto_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_evento_solicitud on public.solicitud_evento using btree (solicitud_id, created_at desc) TABLESPACE pg_default;

create table public.solicitud_prioridad_peticion (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  prioridad_actual_id bigint not null,
  prioridad_solicitada_id bigint not null,
  motivo text null,
  observacion_revision text null,
  solicitada_por_email text not null,
  solicitada_por_area_codigo text null,
  solicitada_por_role_codigo text null,
  revisada_por_email text null,
  revisada_por_area_codigo text null,
  revisada_por_role_codigo text null,
  revisada_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  estado_contexto_id bigint not null default fn_estado_contexto_id (
    'prioridad_pendiente'::text,
    'peticion_prioridad'::text
  ),
  constraint solicitud_prioridad_peticion_pkey primary key (id),
  constraint solicitud_prioridad_peticion_estado_contexto_id_fkey foreign KEY (estado_contexto_id) references estado_contexto (id),
  constraint solicitud_prioridad_peticion_prioridad_actual_fkey foreign KEY (prioridad_actual_id) references prioridad (id),
  constraint solicitud_prioridad_peticion_prioridad_solicitada_fkey foreign KEY (prioridad_solicitada_id) references prioridad (id),
  constraint solicitud_prioridad_peticion_solicitud_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_prioridad_peticion_email_chk check (
    (
      length(
        TRIM(
          both
          from
            solicitada_por_email
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_solicitud_prioridad_peticion_solicitud on public.solicitud_prioridad_peticion using btree (solicitud_id) TABLESPACE pg_default;

create index IF not exists idx_solicitud_prioridad_peticion_created_at on public.solicitud_prioridad_peticion using btree (created_at desc) TABLESPACE pg_default;

create trigger trg_solicitud_prioridad_peticion_updated_at BEFORE
update on solicitud_prioridad_peticion for EACH row
execute FUNCTION fn_set_updated_at ();

create trigger trg_validate_solicitud_prioridad_peticion BEFORE INSERT
or
update OF estado_contexto_id,
prioridad_actual_id,
prioridad_solicitada_id on solicitud_prioridad_peticion for EACH row
execute FUNCTION trg_validate_solicitud_prioridad_peticion ();

create table public.solicitud_producto_detalle (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  producto_id uuid not null,
  descripcion_original_supervisor text null,
  cantidad numeric null,
  cantidad_inventario numeric null,
  cantidad_gerencia numeric null,
  cantidad_solicitada_sistema numeric null,
  activo boolean not null default true,
  requiere_revision_almacen boolean not null default true,
  ciclo integer not null default 1,
  descartado_por_email text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  requiere_revision_sistema boolean not null default false,
  revision_sistema_codigo text null,
  revision_sistema_label text null,
  linea_solicitud integer null,
  estado_contexto_id bigint not null default fn_estado_contexto_id ('pendiente'::text, 'detalle_producto'::text),
  constraint solicitud_producto_detalle_pkey primary key (id),
  constraint solicitud_producto_detalle_linea_unique unique (solicitud_id, ciclo, linea_solicitud),
  constraint solicitud_producto_unique_producto_ciclo unique (solicitud_id, producto_id, ciclo),
  constraint solicitud_producto_detalle_estado_contexto_id_fkey foreign KEY (estado_contexto_id) references estado_contexto (id),
  constraint solicitud_producto_detalle_producto_id_fkey foreign KEY (producto_id) references producto (id),
  constraint solicitud_producto_detalle_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_producto_detalle_linea_check check ((linea_solicitud >= 1)),
  constraint solicitud_producto_detalle_cantidad_gerencia_check check ((cantidad_gerencia >= (0)::numeric)),
  constraint solicitud_producto_detalle_cantidad_inventario_check check ((cantidad_inventario >= (0)::numeric)),
  constraint solicitud_producto_detalle_cantidad_solicitada_sistema_check check (
    (
      (cantidad_solicitada_sistema is null)
      or (cantidad_solicitada_sistema >= (0)::numeric)
    )
  ),
  constraint solicitud_producto_detalle_ciclo_check check ((ciclo >= 1)),
  constraint solicitud_producto_detalle_cantidad_check check (
    (
      (cantidad is null)
      or (cantidad > (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_producto_detalle_solicitud on public.solicitud_producto_detalle using btree (solicitud_id) TABLESPACE pg_default;

create trigger trg_solicitud_producto_detalle_updated_at BEFORE
update on solicitud_producto_detalle for EACH row
execute FUNCTION fn_set_updated_at ();

create table public.solicitud_servicio_detalle (
  id uuid not null default gen_random_uuid (),
  solicitud_id uuid not null,
  descripcion text not null,
  cantidad numeric not null default 1,
  unidad_medida_id bigint not null default fn_unidad_id ('servicio'::text),
  cantidad_gerencia numeric null,
  activo boolean not null default true,
  ciclo integer not null default 1,
  descartado_por_email text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  estado_contexto_id bigint not null default fn_estado_contexto_id ('pendiente'::text, 'detalle_servicio'::text),
  constraint solicitud_servicio_detalle_pkey primary key (id),
  constraint solicitud_servicio_detalle_unidad_medida_id_fkey foreign KEY (unidad_medida_id) references unidad_medida (id),
  constraint solicitud_servicio_detalle_estado_contexto_id_fkey foreign KEY (estado_contexto_id) references estado_contexto (id),
  constraint solicitud_servicio_detalle_solicitud_id_fkey foreign KEY (solicitud_id) references solicitud_compra (id) on delete CASCADE,
  constraint solicitud_servicio_descripcion_not_blank check (
    (
      length(
        TRIM(
          both
          from
            descripcion
        )
      ) > 0
    )
  ),
  constraint solicitud_servicio_detalle_cantidad_check check ((cantidad > (0)::numeric)),
  constraint solicitud_servicio_detalle_cantidad_gerencia_check check ((cantidad_gerencia >= (0)::numeric)),
  constraint solicitud_servicio_detalle_ciclo_check check ((ciclo >= 1))
) TABLESPACE pg_default;

create index IF not exists idx_servicio_detalle_solicitud on public.solicitud_servicio_detalle using btree (solicitud_id) TABLESPACE pg_default;

create trigger trg_solicitud_servicio_detalle_updated_at BEFORE
update on solicitud_servicio_detalle for EACH row
execute FUNCTION fn_set_updated_at ();

create table public.tipo_adjunto (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint tipo_adjunto_pkey primary key (id),
  constraint tipo_adjunto_codigo_key unique (codigo),
  constraint tipo_adjunto_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint tipo_adjunto_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default; 

create table public.tipo_solicitud (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  requiere_almacen boolean not null default true,
  permite_productos boolean not null default true,
  permite_servicios boolean not null default false,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint tipo_solicitud_pkey primary key (id),
  constraint tipo_solicitud_codigo_key unique (codigo),
  constraint tipo_solicitud_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint tipo_solicitud_no_mezcla check (
    (
      not (
        (permite_productos = true)
        and (permite_servicios = true)
      )
    )
  ),
  constraint tipo_solicitud_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create table public.unidad_medida (
  id bigint generated always as identity not null,
  codigo text not null,
  abreviatura text not null,
  descripcion text null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint unidad_medida_pkey primary key (id),
  constraint unidad_medida_abreviatura_key unique (abreviatura),
  constraint unidad_medida_codigo_key unique (codigo),
  constraint unidad_medida_abreviatura_not_blank check (
    (
      length(
        TRIM(
          both
          from
            abreviatura
        )
      ) > 0
    )
  ),
  constraint unidad_medida_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create table public.estado_contexto (
  id bigint generated always as identity not null,
  estado_id bigint not null,
  contexto text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint estado_contexto_pkey primary key (id),
  constraint estado_contexto_unique unique (estado_id, contexto),
  constraint estado_contexto_estado_id_fkey foreign KEY (estado_id) references estado (id) on delete CASCADE,
  constraint estado_contexto_contexto_chk check (
    (
      contexto = any (
        array[
          'solicitud'::text,
          'detalle_producto'::text,
          'detalle_servicio'::text,
          'orden_compra'::text,
          'importacion_oc'::text,
          'peticion_prioridad'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;create table public.estado (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  descripcion text null,
  activo boolean not null default true,
  orden integer not null default 1,
  created_at timestamp with time zone not null default now(),
  constraint estado_pkey primary key (id),
  constraint estado_codigo_key unique (codigo),
  constraint estado_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint estado_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default; 

create table public.catalogo_contexto_destino (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  tipo_origen text not null,
  restringido_a_servicios boolean not null default false,
  constraint catalogo_servicio_contexto_pkey primary key (id),
  constraint catalogo_servicio_contexto_codigo_key unique (codigo),
  constraint catalogo_contexto_destino_tipo_origen_chk check (
    (
      tipo_origen = any (
        array[
          'area_operativa'::text,
          'instalacion_taller'::text,
          'grupo_equipo'::text,
          'otros'::text
        ]
      )
    )
  ),
  constraint catalogo_servicio_contexto_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint catalogo_servicio_contexto_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_catalogo_contexto_destino_activo on public.catalogo_contexto_destino using btree (activo) TABLESPACE pg_default;

create trigger trg_catalogo_contexto_destino_updated_at BEFORE
update on catalogo_contexto_destino for EACH row
execute FUNCTION fn_set_updated_at (); 

create table public.app_usuario (
  id bigint generated always as identity not null,
  email text not null,
  nombre text null,
  area_id bigint not null,
  role_id bigint not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint app_usuario_pkey primary key (id),
  constraint app_usuario_email_key unique (email),
  constraint app_usuario_area_id_fkey foreign KEY (area_id) references app_area (id),
  constraint app_usuario_role_id_fkey foreign KEY (role_id) references app_role (id),
  constraint app_usuario_email_lower_chk check ((email = lower(email))),
  constraint app_usuario_email_not_blank check (
    (
      length(
        TRIM(
          both
          from
            email
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create table public.app_role (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint app_role_pkey primary key (id),
  constraint app_role_codigo_key unique (codigo),
  constraint app_role_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint app_role_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

create table public.app_area (
  id bigint generated always as identity not null,
  codigo text not null,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint app_area_pkey primary key (id),
  constraint app_area_codigo_key unique (codigo),
  constraint app_area_codigo_not_blank check (
    (
      length(
        TRIM(
          both
          from
            codigo
        )
      ) > 0
    )
  ),
  constraint app_area_nombre_not_blank check (
    (
      length(
        TRIM(
          both
          from
            nombre
        )
      ) > 0
    )
  )
) TABLESPACE pg_default;

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

-- 2. RPC DE LISTADO
-- ------------------------------------------------
-- Estrategia:
-- - se mantiene como fuente base `vw_solicitudes_lista`
-- - ya no se usa el arreglo `equipos` que expone la vista
-- - se resuelve `destinos` desde la nueva tabla transaccional
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

create table public.estado_contexto (
  id bigint generated always as identity not null,
  estado_id bigint not null,
  contexto text not null,
  activo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint estado_contexto_pkey primary key (id),
  constraint estado_contexto_unique unique (estado_id, contexto),
  constraint estado_contexto_estado_id_fkey foreign KEY (estado_id) references estado (id) on delete CASCADE,
  constraint estado_contexto_contexto_chk check (
    (
      contexto = any (
        array[
          'solicitud'::text,
          'detalle_producto'::text,
          'detalle_servicio'::text,
          'orden_compra'::text,
          'importacion_oc'::text,
          'peticion_prioridad'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;