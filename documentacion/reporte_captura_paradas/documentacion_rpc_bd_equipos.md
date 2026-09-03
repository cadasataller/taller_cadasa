ESTE ES EL RPC QUE SE UTILIZARA PARA CARGAR DETALLES E IMAGNE DE EQUIPO AL MOMENTO DE SELCIONAR QUE MOSTRARTA LA IMAGNE DEL EQUIPO SI ESTA DIPSONIBLE Y LA INFROAMCION DEL PRFIL DE EQUIPO, ADEMAS ESTO AUNQUE PERMITE MUCHOS EQUIPOS SOLO SE LE ENVIARA UNO

-- ============================================================================
-- RPCs para obtener datos maestros del equipo + imagen principal
--
-- Fuentes:
--   public.equipos.cod_equipo
--   engrase.vw_equipos_con_imagen_main.codigo
--
-- Relación lógica:
--   public.equipos.cod_equipo = engrase.vw_equipos_con_imagen_main.codigo
--
-- Estos RPC NO calculan jornadas, horas, paradas ni operadores.
-- Eso continúa siendo responsabilidad de la BD captura_operador.
--
-- No necesitan p_desde / p_hasta porque estos datos son atributos maestros
-- del equipo y no dependen del rango de fechas.
-- ============================================================================


-- ============================================================================
-- RPC 1
-- DETALLE DE UN EQUIPO SELECCIONADO
--
-- Uso:
-- Al hacer click en una fila/card de la columna izquierda.
--
-- Alimenta principalmente:
--
--   equipment-summary-identity
--   equipment-summary-image
--   equipment-profile-card
--
-- Ejemplo:
--
--   supabase.rpc('rpc_reporte_equipo_detalle', {
--     p_equipo: '484091'
--   })
--
-- ============================================================================

create or replace function public.rpc_reporte_equipo_detalle(
  p_equipo text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, engrase, pg_temp
as $$
declare
  v_equipo text;
  v_result jsonb;
begin

  -- Normalización de la llave transversal.
  v_equipo :=
    regexp_replace(
      trim(coalesce(p_equipo, '')),
      '[-\s]+',
      '',
      'g'
    );

  if v_equipo = '' then
    raise exception 'EQUIPO_REQUERIDO';
  end if;


  select
    jsonb_build_object(

      'encontrado', true,

      'equipo',

      jsonb_build_object(

        -- ------------------------------------------------------------
        -- Identidad principal
        -- ------------------------------------------------------------
        'id', e.id,

        'cod_equipo', e.cod_equipo,

        'tipo', e.tipo,

        'modelo', e.modelo,

        'marca', e.marca,

        'activo', coalesce(e.activo, false),

        'fecha_registro', e.fecha_registro,


        -- ------------------------------------------------------------
        -- Clasificación disponible en engrase
        -- ------------------------------------------------------------
        'engrase',

        case
          when v.id is not null then

            jsonb_build_object(

              'equipo_id', v.id,

              'codigo', v.codigo,

              'tipo_equipo_id', v.tipo_equipo_id,

              'tipo_equipo', v.tipo_equipo,

              'subtipo', v.subtipo,

              'estado', v.estado,

              'creado_en', v.creado_en,

              'actualizado_en', v.actualizado_en

            )

          else null
        end,


        -- ------------------------------------------------------------
        -- Imagen principal
        --
        -- main_storage_path NO es necesariamente una URL pública.
        -- El frontend deberá convertir este path en public URL o
        -- signed URL dependiendo de cómo esté configurado Storage.
        -- ------------------------------------------------------------
        'imagen',

        jsonb_build_object(

          'tiene_imagen',
          coalesce(v.tiene_imagen_main, false),

          'imagen_id',
          v.imagen_id,

          'storage_path',
          v.main_storage_path,

          'actualizada_en',
          v.imagen_actualizada_en

        )

      )

    )
  into v_result

  from public.equipos e

  left join engrase.vw_equipos_con_imagen_main v
    on v.codigo = e.cod_equipo

  where e.cod_equipo = v_equipo

  limit 1;


  -- Equipo no encontrado.
  if v_result is null then

    return jsonb_build_object(
      'encontrado', false,
      'equipo', null
    );

  end if;


  return v_result;

end;
$$;



-- ============================================================================
-- SEGURIDAD
-- ============================================================================

revoke all
on function public.rpc_reporte_equipo_detalle(text)
from public;

revoke all
on function public.rpc_reporte_equipo_detalle(text)
from anon;

grant execute
on function public.rpc_reporte_equipo_detalle(text)
to authenticated;

grant execute
on function public.rpc_reporte_equipo_detalle(text)
to service_role;



-- ============================================================================
-- RPC 2
-- DETALLE BATCH DE EQUIPOS
--
-- Este RPC no es obligatorio para el click individual, pero evita N+1
-- si posteriormente quieres precargar datos de varios equipos.
--
-- Ejemplo:
--
-- supabase.rpc('rpc_reporte_equipos_detalle_batch', {
--   p_equipos: [
--     '484091',
--     '484095',
--     '484041'
--   ]
-- })
--
-- Puede servir si posteriormente quieres:
--
--   - precargar modelo/marca;
--   - precargar estado;
--   - conocer qué equipos tienen imagen;
--   - preparar cache frontend;
--   - enriquecer varias cards de una sola vez.
--
-- ============================================================================

create or replace function public.rpc_reporte_equipos_detalle_batch(
  p_equipos text[]
)
returns jsonb
language plpgsql
security invoker
set search_path = public, engrase, pg_temp
as $$
declare
  v_result jsonb;
begin

  if p_equipos is null
     or cardinality(p_equipos) = 0 then

    return jsonb_build_object(
      'data',
      '[]'::jsonb
    );

  end if;


  with requested as (

    select distinct

      regexp_replace(
        trim(x),
        '[-\s]+',
        '',
        'g'
      ) as cod_equipo

    from unnest(p_equipos) as x

    where nullif(
      regexp_replace(
        trim(x),
        '[-\s]+',
        '',
        'g'
      ),
      ''
    ) is not null

  ),


  datos as (

    select

      r.cod_equipo as codigo_solicitado,

      e.id,

      e.cod_equipo,

      e.tipo,

      e.modelo,

      e.marca,

      coalesce(e.activo, false) as activo,

      e.fecha_registro,


      -- Datos de engrase
      v.id as engrase_equipo_id,

      v.tipo_equipo_id,

      v.tipo_equipo,

      v.subtipo,

      v.estado,

      v.creado_en as engrase_creado_en,

      v.actualizado_en as engrase_actualizado_en,


      -- Imagen
      coalesce(
        v.tiene_imagen_main,
        false
      ) as tiene_imagen,

      v.imagen_id,

      v.main_storage_path,

      v.imagen_actualizada_en


    from requested r

    left join public.equipos e
      on e.cod_equipo = r.cod_equipo

    left join engrase.vw_equipos_con_imagen_main v
      on v.codigo = e.cod_equipo

  )


  select

    jsonb_build_object(

      'data',

      coalesce(

        jsonb_agg(

          jsonb_build_object(

            'cod_equipo',
            d.codigo_solicitado,

            'encontrado',
            d.id is not null,


            'equipo',

            case
              when d.id is null then null

              else jsonb_build_object(

                'id',
                d.id,

                'cod_equipo',
                d.cod_equipo,

                'tipo',
                d.tipo,

                'modelo',
                d.modelo,

                'marca',
                d.marca,

                'activo',
                d.activo,

                'fecha_registro',
                d.fecha_registro,


                'engrase',

                case
                  when d.engrase_equipo_id is null then null

                  else jsonb_build_object(

                    'equipo_id',
                    d.engrase_equipo_id,

                    'tipo_equipo_id',
                    d.tipo_equipo_id,

                    'tipo_equipo',
                    d.tipo_equipo,

                    'subtipo',
                    d.subtipo,

                    'estado',
                    d.estado,

                    'creado_en',
                    d.engrase_creado_en,

                    'actualizado_en',
                    d.engrase_actualizado_en

                  )

                end,


                'imagen',

                jsonb_build_object(

                  'tiene_imagen',
                  d.tiene_imagen,

                  'imagen_id',
                  d.imagen_id,

                  'storage_path',
                  d.main_storage_path,

                  'actualizada_en',
                  d.imagen_actualizada_en

                )

              )

            end

          )

          order by d.codigo_solicitado

        ),

        '[]'::jsonb

      )

    )

  into v_result

  from datos d;


  return v_result;

end;
$$;



-- ============================================================================
-- SEGURIDAD RPC BATCH
-- ============================================================================

revoke all
on function public.rpc_reporte_equipos_detalle_batch(text[])
from public;

revoke all
on function public.rpc_reporte_equipos_detalle_batch(text[])
from anon;

grant execute
on function public.rpc_reporte_equipos_detalle_batch(text[])
to authenticated;

grant execute
on function public.rpc_reporte_equipos_detalle_batch(text[])
to service_role;