Entonces simplifícalo para que devuelva solo el código y el tipo de equipo.

```sql
create or replace function public.rpc_equipos_tipos_por_codigos(
  p_equipos text[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, auth, public, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'USUARIO_NO_AUTENTICADO';
  end if;

  with solicitados as (
    select distinct
      regexp_replace(
        trim(coalesce(x, '')),
        '[-[:space:]]+',
        '',
        'g'
      ) as equipo_numero
    from unnest(coalesce(p_equipos, array[]::text[])) as x
    where nullif(
      regexp_replace(trim(coalesce(x, '')), '[-[:space:]]+', '', 'g'),
      ''
    ) is not null
  ),

  equipos_normalizados as (
    select
      regexp_replace(
        trim(coalesce(e.cod_equipo, '')),
        '[-[:space:]]+',
        '',
        'g'
      ) as equipo_numero,
      e.tipo
    from public.equipos e
  )

  select jsonb_build_object(
    'data',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'equipo_numero', s.equipo_numero,
            'tipo', e.tipo
          )
          order by s.equipo_numero
        )
        from solicitados s
        left join equipos_normalizados e
          on e.equipo_numero = s.equipo_numero
      ),
      '[]'::jsonb
    )
  )
  into v_result;

  return v_result;
end;
$function$;


revoke all
on function public.rpc_equipos_tipos_por_codigos(text[])
from public;

revoke all
on function public.rpc_equipos_tipos_por_codigos(text[])
from anon;

grant execute
on function public.rpc_equipos_tipos_por_codigos(text[])
to authenticated;

grant execute
on function public.rpc_equipos_tipos_por_codigos(text[])
to service_role;
```

Payload:

```json
{
  "p_equipos": [
    "484041",
    "484091",
    "484095",
    "484102"
  ]
}
```

Retorno:

```json
{
  "data": [
    {
      "equipo_numero": "484041",
      "tipo": "TRACTOR"
    },
    {
      "equipo_numero": "484091",
      "tipo": "TRACTOR"
    },
    {
      "equipo_numero": "484095",
      "tipo": "TRACTOR"
    },
    {
      "equipo_numero": "484102",
      "tipo": "TRACTOR"
    }
  ]
}
```

Con eso ya tienes exactamente lo necesario para hacer el `merge` con `rendimiento_equipos` y agrupar por `tipo`.
