# Inventario de RPCs y funciones PostgreSQL

> Proyecto: `rastreo_tareas`  
> Estado actual de la base de datos.  
> Esquemas documentados: `public`, `app_privado`. Se excluyen funciones de esquemas internos administrados por Supabase.

## Resumen

- Funciones totales: **99**
- `public`: **65**
- `app_privado`: **34**
- Cada entrada incluye firma, tipo de retorno, lenguaje, modo de seguridad, volatilidad y clasificación.
- Las funciones que retornan `trigger` o `event_trigger` se identifican como funciones de trigger/event-trigger.
- Las demás funciones de `public` se documentan como RPC / función pública potencialmente accesible mediante PostgREST según permisos.
- Las funciones de `app_privado` se documentan como helpers privados.

## `app_privado`

- `app_privado.activar_siguiente_tarea_ruta(p_usuario_id uuid, p_fecha date)` → `void` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.asignar_primer_administrador(p_usuario_id uuid)` → `void` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.broadcast_cambio_ruta_trabajador()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.broadcast_cambio_tarea_trabajador()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.broadcast_observacion_supervision()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.broadcast_resumen_permanencia_tracker()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.broadcast_ubicacion_tracker()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.configuracion_entera(p_clave text, p_valor_predeterminado integer)` → `integer` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.crear_evento_tarea(p_tarea_id uuid, p_codigo_evento text, p_ocurrido_en timestamp with time zone, p_visita_tarea_id uuid, p_muestra_ubicacion_id bigint, p_origen text, p_actor_usuario_id uuid, p_datos jsonb)` → `bigint` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.crear_evento_tarea_v2(p_tarea_id uuid, p_codigo_evento text, p_ocurrido_en timestamp with time zone, p_visita_tarea_tracker_id uuid, p_origen text, p_actor_usuario_id uuid, p_datos jsonb)` → `bigint` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.depurar_cache_google_maps()` → `integer` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.encolar_recalculo_por_reprogramacion()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.encolar_recalculo_ruta()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.enviar_broadcast_resumen_permanencia_tracker(p_tarea_id uuid, p_tipo text, p_visita_id uuid)` → `void` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.establecer_actualizado_en()` → `trigger` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.fecha_actual_panama()` → `date` · `sql` · `SECURITY INVOKER` · `STABLE` · **helper privado**
- `app_privado.impedir_eliminacion_fisica()` → `trigger` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.normalizar_estado_administrativo_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.obtener_resumen_permanencia_tracker_base(p_tarea_id uuid)` → `TABLE(tarea_id uuid, area_id uuid, usuario_id uuid, source_id bigint, tracker_id bigint, tracker_label text, permanencias_detectadas integer, segundos_permanencias_cerradas bigint, segundos_permanencia_actual bigint, segundos_totales bigint, visita_abierta boolean, visita_actual_id uuid, entrada_actual_en timestamp with time zone, primera_entrada_en timestamp with time zone, ultima_salida_en timestamp with time zone, ultima_actualizacion_tracker_en timestamp with time zone, segundos_sin_datos bigint, estado_operativo_codigo text, estado_operativo_nombre text, estado_tarea_codigo text, estado_tarea_nombre text, tarea_actualizado_en timestamp with time zone, calculado_en timestamp with time zone)` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.puede_escuchar_topic_realtime(p_topic text, p_usuario_id uuid)` → `boolean` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.puede_ver_usuario(p_usuario_objetivo_id uuid, p_usuario_solicitante_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.registrar_auditoria()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.registrar_eventos_administrativos_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.registrar_historial_estado_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.sincronizar_estados_operativos_ruta(p_ruta_planificada_id uuid)` → `uuid` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **helper privado**
- `app_privado.sincronizar_ruta_calculada()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.sincronizar_usuario_auth()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.tiene_permiso(p_codigo_permiso text, p_usuario_id uuid)` → `boolean` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.tiene_rol(p_codigo_rol text, p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.usuario_es_trabajador_de_area(p_usuario_id uuid, p_area_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.usuario_esta_activo(p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.usuario_tiene_area(p_area_id uuid, p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **helper privado**
- `app_privado.validar_jornada()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `app_privado.validar_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**

## `public`

- `public.agregar_aclaracion_observacion(p_observacion_origen_id uuid, p_descripcion text, p_cliente_id uuid, p_capturada_en timestamp with time zone, p_latitud double precision, p_longitud double precision, p_precision_metros numeric, p_ubicacion_capturada_en timestamp with time zone)` → `observaciones_tarea` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.archivar_version_ruta()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.asignar_primer_administrador(p_usuario_id uuid)` → `void` · `sql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.broadcast_cambio_tarea_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.configuracion_entera(p_clave text, p_valor_predeterminado integer)` → `integer` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.corregir_geometria_zona_v2(p_zona_id uuid, p_geom geometry, p_motivo text)` → `zonas_operativas` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.corregir_linea_control_tarea_v2(p_tarea_id uuid, p_linea geometry, p_motivo text)` → `tareas` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.crear_evento_tarea(p_tarea_id uuid, p_codigo_evento text, p_ocurrido_en timestamp with time zone, p_visita_tarea_id uuid, p_muestra_ubicacion_id bigint, p_origen text, p_actor_usuario_id uuid, p_datos jsonb)` → `bigint` · `sql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.crear_evento_tarea_v2(p_tarea_id uuid, p_codigo_evento text, p_ocurrido_en timestamp with time zone, p_visita_tarea_tracker_id uuid, p_origen text, p_actor_usuario_id uuid, p_datos jsonb)` → `bigint` · `sql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.depurar_cache_google_maps()` → `integer` · `sql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.eliminar_tarea_logicamente(p_tarea_id uuid)` → `tareas` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.encolar_recalculo_por_reprogramacion_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.encolar_recalculo_ruta_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.fecha_actual_panama()` → `date` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.mis_permisos_efectivos()` → `TABLE(id bigint, codigo character varying, nombre character varying, modulo character varying, descripcion text)` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.obtener_resumen_permanencia_tracker_tarea(p_tarea_id uuid)` → `TABLE(tarea_id uuid, area_id uuid, usuario_id uuid, source_id bigint, tracker_id bigint, tracker_label text, permanencias_detectadas integer, segundos_permanencias_cerradas bigint, segundos_permanencia_actual bigint, segundos_totales bigint, visita_abierta boolean, visita_actual_id uuid, entrada_actual_en timestamp with time zone, primera_entrada_en timestamp with time zone, ultima_salida_en timestamp with time zone, ultima_actualizacion_tracker_en timestamp with time zone, segundos_sin_datos bigint, estado_operativo_codigo text, estado_operativo_nombre text, estado_tarea_codigo text, estado_tarea_nombre text, tarea_actualizado_en timestamp with time zone, calculado_en timestamp with time zone)` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.obtener_resumen_tiempo_tarea(p_tarea_id uuid)` → `TABLE(tarea_id uuid, cantidad_visitas integer, segundos_visitas_cerradas bigint, segundos_visita_abierta bigint, segundos_totales bigint, visita_abierta boolean, llegada_actual_en timestamp with time zone, primera_llegada_en timestamp with time zone, ultima_salida_en timestamp with time zone, segundos_sin_datos bigint)` · `sql` · `SECURITY INVOKER` · `STABLE` · **RPC / función pública**
- `public.obtener_resumen_tiempos_tareas(p_tarea_ids uuid[])` → `TABLE(tarea_id uuid, cantidad_visitas integer, segundos_visitas_cerradas bigint, segundos_visita_abierta bigint, segundos_totales bigint, visita_abierta boolean, llegada_actual_en timestamp with time zone, primera_llegada_en timestamp with time zone, ultima_salida_en timestamp with time zone, segundos_sin_datos bigint)` · `sql` · `SECURITY INVOKER` · `STABLE` · **RPC / función pública**
- `public.obtener_visitas_tracker_tarea(p_tarea_id uuid)` → `TABLE(id uuid, tarea_id uuid, numero_visita integer, entrada_en timestamp with time zone, salida_en timestamp with time zone, duracion_segundos integer, estado text, motivo_incompleto text, anulado_en timestamp with time zone, actualizado_en timestamp with time zone)` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.operacion_v2_activa()` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.proteger_geometria_tarea_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.proteger_geometria_zona_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.puede_ver_usuario(p_usuario_objetivo_id uuid, p_usuario_solicitante_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.punto_dentro_de_ubicacion(p_ubicacion_id uuid, p_latitud double precision, p_longitud double precision)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.recalcular_ubicacion_tarea_por_zonas_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.registrar_cambio_asignacion_tracker()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.registrar_consumo_google_maps(p_codigo_servicio text, p_unidades integer, p_exitoso boolean, p_modulo_origen text, p_solicitud_id uuid, p_codigo_resultado text)` → `bigint` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.registrar_observacion_tarea(p_tarea_id uuid, p_tipo_codigo text, p_descripcion text, p_cliente_id uuid, p_capturada_en timestamp with time zone, p_latitud double precision, p_longitud double precision, p_precision_metros numeric, p_ubicacion_capturada_en timestamp with time zone)` → `observaciones_tarea` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.resolver_configuracion_mapa_v2(p_area_id uuid, p_usuario_id uuid)` → `TABLE(lugar_resguardo_id uuid, latitud double precision, longitud double precision, zoom numeric, origen text)` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.resolver_finca_por_zona_v2(p_area_id uuid, p_geom geometry)` → `TABLE(ubicacion_id uuid, nombre text, porcentaje_dentro numeric, pertenece boolean)` · `plpgsql` · `SECURITY INVOKER` · `STABLE` · **RPC / función pública**
- `public.resolver_origen_ruta_tracker(p_source_id bigint)` → `TABLE(disponible boolean, origen_tipo text, latitud double precision, longitud double precision, capturada_en timestamp with time zone, recorrido_tracker_id uuid, motivo text)` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.resolver_origen_ruta_tracker_v2(p_source_id bigint, p_ruta_planificada_id uuid)` → `TABLE(disponible boolean, origen_tipo text, latitud double precision, longitud double precision, capturada_en timestamp with time zone, recorrido_tracker_id uuid, motivo text)` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.restaurar_tarea(p_tarea_id uuid)` → `tareas` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.rls_auto_enable()` → `event_trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.sb_crear_evento_tarea_tracker(p_tarea_id uuid, p_codigo_evento text, p_ocurrido_en timestamp with time zone, p_visita_tarea_tracker_id uuid, p_datos jsonb)` → `bigint` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **RPC / función pública**
- `public.sb_procesar_evento_tracker(p_evento jsonb)` → `jsonb` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **RPC / función pública**
- `public.sb_procesar_evento_tracker_v2(p_evento jsonb)` → `jsonb` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_abrir_visita_tarea(p_tarea_id uuid, p_source_id bigint, p_tracker_id bigint, p_tracker_label text, p_entrada_en timestamp with time zone, p_clave_evento text)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_buscar_tarea_activable(p_source_id bigint, p_fecha date, p_posicion_anterior geography, p_posicion geography, p_excluir uuid)` → `uuid` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.sb_v2_cerrar_visita_tarea(p_visita_id uuid, p_cierre_en timestamp with time zone, p_clave_evento text, p_metodo text)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_geometria_zona_automatica(p_punto geography)` → `geometry` · `sql` · `SECURITY INVOKER` · `IMMUTABLE` · **RPC / función pública**
- `public.sb_v2_procesar_detencion_tracker(p_source_id bigint, p_tracker_id bigint, p_tracker_label text, p_posicion geography, p_capturada_en timestamp with time zone, p_movement_status text, p_movement_status_update timestamp with time zone, p_en_resguardo_id uuid)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_procesar_resguardo_tracker(p_source_id bigint, p_tracker_id bigint, p_tracker_label text, p_posicion_anterior geography, p_posicion geography, p_capturada_en timestamp with time zone, p_clave_evento text)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_procesar_resguardo_tracker(p_source_id bigint, p_tracker_id bigint, p_tracker_label text, p_posicion_anterior geography, p_posicion geography, p_capturada_en timestamp with time zone, p_clave_evento text, p_movement_status text, p_movement_status_update timestamp with time zone)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_procesar_tarea_tracker(p_source_id bigint, p_tracker_id bigint, p_tracker_label text, p_posicion_anterior geography, p_posicion geography, p_capturada_en timestamp with time zone, p_clave_evento text, p_en_resguardo_id uuid, p_entrada_resguardo_id uuid)` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.sb_v2_resguardo_en_posicion(p_posicion geography)` → `TABLE(lugar_resguardo_id uuid, ubicacion_id uuid, area_id uuid)` · `sql` · `SECURITY INVOKER` · `STABLE` · **RPC / función pública**
- `public.sb_validar_service_role_tracker()` → `void` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **RPC / función pública**
- `public.sb_ws_procesar_eventos_tracker(p_eventos jsonb)` → `jsonb` · `plpgsql` · `SECURITY INVOKER` · `VOLATILE` · **RPC / función pública**
- `public.sincronizar_estados_operativos_ruta(p_ruta_planificada_id uuid)` → `uuid` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **RPC / función pública**
- `public.tiene_permiso(p_codigo_permiso text, p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.tiene_rol(p_codigo_rol text, p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.usuario_es_trabajador_de_area(p_usuario_id uuid, p_area_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.usuario_esta_activo(p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.usuario_tiene_area(p_area_id uuid, p_usuario_id uuid)` → `boolean` · `sql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.validar_asignacion_tracker_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_compuerta_fase5_v2()` → `jsonb` · `plpgsql` · `SECURITY INVOKER` · `STABLE` · **RPC / función pública**
- `public.validar_control_zona_tarea_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_orden_ruta_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_parada_ruta_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_precondiciones_operacion_v2()` → `jsonb` · `plpgsql` · `SECURITY DEFINER` · `STABLE` · **RPC / función pública**
- `public.validar_recorrido_tracker_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_ruta_planificada_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_tarea()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.validar_ubicacion_modelo_v2()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
- `public.vincular_tarea_recorrido_tracker()` → `trigger` · `plpgsql` · `SECURITY DEFINER` · `VOLATILE` · **trigger/event-trigger**
