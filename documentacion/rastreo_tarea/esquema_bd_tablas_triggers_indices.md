# Inventario del esquema — tablas, índices y triggers

> Proyecto `rastreo_tareas`. Estado post-Fase 5 V2. Esquemas `public` y `app_privado`; se excluyen esquemas internos de Supabase.

- Tablas: **48**
- Índices: **145**
- Triggers de usuario: **77**

## `public.acompanantes_tarea`
- RLS: sí
- Columnas: `id` uuid, `tarea_id` uuid, `nombre` character varying(180), `creado_por` uuid, `creado_en` timestamp with time zone, `actualizado_por` uuid, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid
- Índices: `acompanantes_tarea_nombre_activo_uk`, `acompanantes_tarea_pkey`
- Triggers: `acompanantes_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `acompanantes_auditoria_trg` → `app_privado.registrar_auditoria()`, `acompanantes_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`

## `public.areas`
- RLS: sí
- Columnas: `id` uuid, `codigo` character varying(50), `nombre` character varying(120), `descripcion` text, `activa` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid
- Índices: `areas_codigo_key`, `areas_pkey`
- Triggers: `areas_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `areas_auditoria_trg` → `app_privado.registrar_auditoria()`, `areas_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`

## `public.asignaciones_usuario_area`
- RLS: sí
- Columnas: `id` uuid, `usuario_id` uuid, `area_id` uuid, `tipo_asignacion` character varying(20), `vigente_desde` timestamp with time zone, `vigente_hasta` timestamp with time zone, `asignado_por` uuid, `finalizado_por` uuid, `creado_en` timestamp with time zone
- Índices: `asignaciones_usuario_area_pkey`, `asignaciones_usuario_area_vigente_uk`
- Triggers: `asignaciones_area_auditoria_trg` → `app_privado.registrar_auditoria()`

## `public.auditoria_eventos`
- RLS: sí
- Columnas: `id` bigint, `esquema_nombre` character varying(80), `tabla_nombre` character varying(120), `registro_id` text, `accion` character varying(10), `usuario_id` uuid, `ocurrido_en` timestamp with time zone, `valores_anteriores` jsonb, `valores_nuevos` jsonb, `contexto` jsonb
- Índices: `auditoria_eventos_pkey`, `auditoria_eventos_tabla_registro_ix`, `auditoria_eventos_usuario_ix`
- Triggers: —

## `public.configuracion_mapa_area`
- RLS: sí
- Columnas: `area_id` uuid, `lugar_resguardo_centro_id` uuid, `zoom` numeric(5,2)
- Índices: `configuracion_mapa_area_pkey`, `configuracion_mapa_area_resguardo_ix`
- Triggers: —

## `public.configuracion_mapa_usuario_area`
- RLS: sí
- Columnas: `usuario_id` uuid, `area_id` uuid, `lugar_resguardo_centro_id` uuid, `zoom` numeric(5,2)
- Índices: `configuracion_mapa_usuario_area_area_ix`, `configuracion_mapa_usuario_area_pkey`, `configuracion_mapa_usuario_area_resguardo_ix`
- Triggers: —

## `public.configuraciones_sistema`
- RLS: sí
- Columnas: `clave` character varying(120), `valor` jsonb, `descripcion` text, `actualizado_por` uuid, `actualizado_en` timestamp with time zone
- Índices: `configuraciones_sistema_pkey`
- Triggers: `configuraciones_auditoria_trg` → `app_privado.registrar_auditoria()`

## `public.consumos_google_maps`
- RLS: sí
- Columnas: `id` bigint, `servicio_google_maps_id` smallint, `usuario_id` uuid, `fecha_operativa` date, `ocurrido_en` timestamp with time zone, `unidades` integer, `exitoso` boolean, `modulo_origen` character varying(80), `solicitud_id` uuid, `codigo_resultado` character varying(80), `creado_en` timestamp with time zone
- Índices: `consumos_google_maps_ocurrido_ix`, `consumos_google_maps_pkey`, `consumos_google_maps_servicio_fecha_ix`, `consumos_google_maps_solicitud_uk`
- Triggers: —

## `public.estado_detencion_tracker`
- RLS: sí
- Columnas: `source_id` bigint, `movement_status` character varying(40), `inicio_en` timestamp with time zone, `punto_ancla` geography(Point,4326), `tarea_contexto_id` uuid, `zona_generada_id` uuid, `tarea_duda_id` uuid, `actualizado_en` timestamp with time zone
- Índices: `estado_detencion_tracker_pkey`, `estado_detencion_tracker_tarea_contexto_ix`, `estado_detencion_tracker_tarea_duda_ix`, `estado_detencion_tracker_zona_generada_ix`
- Triggers: —

## `public.estados_operativos_tarea`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(50), `nombre` character varying(100), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `estados_operativos_tarea_codigo_key`, `estados_operativos_tarea_pkey`
- Triggers: `estados_operativos_tarea_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`

## `public.estados_tarea`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(40), `nombre` character varying(80), `es_final` boolean, `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `estados_tarea_codigo_key`, `estados_tarea_pkey`
- Triggers: `estados_tarea_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`

## `public.estancias_lugar_tracker`
- RLS: sí
- Columnas: `id` uuid, `source_id` bigint, `lugar_resguardo_id` uuid, `entrada_en` timestamp with time zone, `salida_en` timestamp with time zone, `duracion_segundos` integer, `estado` character varying(20), `cierre_candidato_en` timestamp with time zone, `cierre_terminal_confirmado_en` timestamp with time zone
- Índices: `estancias_lugar_tracker_abierta_source_ix`, `estancias_lugar_tracker_lugar_entrada_ix`, `estancias_lugar_tracker_pkey`, `estancias_lugar_tracker_source_entrada_ix`
- Triggers: —

## `public.eventos_procesamiento_tracker`
- RLS: sí
- Columnas: `id` bigint, `clave_evento` text, `source_id` bigint, `tracker_id_snapshot` bigint, `tracker_label_snapshot` text, `capturada_en` timestamp with time zone, `recibida_en` timestamp with time zone, `procesada_en` timestamp with time zone, `origen_procesamiento` character varying(30), `resultado` character varying(20), `codigo_resultado` character varying(80), `tarea_ids_evaluadas` uuid[], `tarea_id_resultado` uuid, `visita_tarea_tracker_id` uuid, `recorrido_tracker_id` uuid, `detalle_error` text, `datos` jsonb, `creado_en` timestamp with time zone
- Índices: `eventos_procesamiento_tracker_captura_brin`, `eventos_procesamiento_tracker_pkey`, `eventos_procesamiento_tracker_source_captura_ix`
- Triggers: `eventos_procesamiento_tracker_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`

## `public.eventos_tarea`
- RLS: sí
- Columnas: `id` bigint, `tarea_id` uuid, `tipo_evento_tarea_id` smallint, `ocurrido_en` timestamp with time zone, `origen` character varying(30), `actor_usuario_id` uuid, `datos` jsonb, `creado_en` timestamp with time zone, `anulado_en` timestamp with time zone, `motivo_anulacion` text, `visita_tarea_tracker_id` uuid
- Índices: `eventos_tarea_pkey`, `eventos_tarea_tarea_fecha_ix`
- Triggers: —

## `public.grupos_tracker_area`
- RLS: sí
- Columnas: `group_id` bigint, `area_id` uuid, `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone
- Índices: `grupos_tracker_area_area_id_idx`, `grupos_tracker_area_pkey`
- Triggers: `grupos_tracker_area_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`

## `public.historial_estados_tarea`
- RLS: sí
- Columnas: `id` bigint, `tarea_id` uuid, `estado_anterior_id` smallint, `estado_nuevo_id` smallint, `cambiado_por` uuid, `cambiado_en` timestamp with time zone, `motivo` text
- Índices: `historial_estados_tarea_pkey`, `historial_estados_tarea_tarea_ix`
- Triggers: —

## `public.historial_paradas_ruta_planificada`
- RLS: sí
- Columnas: `id` uuid, `historial_ruta_planificada_id` uuid, `tarea_id` uuid, `numero_orden` integer, `nivel_prioridad_snapshot` smallint, `nombre_prioridad_snapshot` character varying(60), `indicaciones_snapshot` text, `punto_enrutado_snapshot` geography(Point,4326)
- Índices: `historial_paradas_punto_enrutado_gix`, `historial_paradas_ruta_orden_uk`, `historial_paradas_ruta_planificada_pkey`
- Triggers: —

## `public.historial_rutas_planificadas`
- RLS: sí
- Columnas: `id` uuid, `ruta_planificada_id` uuid, `numero_version` integer, `usuario_id` uuid, `area_id` uuid, `fecha_programada` date, `origen` geography(Point,4326), `proveedor` character varying(40), `polilinea_codificada_cache` text, `cache_calculada_en` timestamp with time zone, `cache_expira_en` timestamp with time zone, `motivo_cambio_ruta_id` smallint, `cambiado_por` uuid, `archivada_en` timestamp with time zone, `tracker_id` bigint, `tracker_label_snapshot` text, `source_id` bigint, `recorrido_tracker_id` uuid, `origen_tipo` character varying(30), `origen_capturada_en` timestamp with time zone
- Índices: `historial_rutas_planificadas_pkey`, `historial_rutas_version_uk`
- Triggers: —

## `public.limites_google_maps`
- RLS: sí
- Columnas: `id` uuid, `servicio_google_maps_id` smallint, `entorno` character varying(20), `periodo` character varying(20), `limite_unidades` integer, `porcentaje_advertencia` numeric(5,2), `porcentaje_bloqueo` numeric(5,2), `vigente_desde` date, `vigente_hasta` date, `activo` boolean, `creado_por` uuid, `creado_en` timestamp with time zone, `actualizado_por` uuid, `actualizado_en` timestamp with time zone
- Índices: `limites_google_maps_busqueda_ix`, `limites_google_maps_pkey`
- Triggers: `limites_google_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `limites_google_auditoria_trg` → `app_privado.registrar_auditoria()`

## `public.lugares_resguardo_tracker`
- RLS: sí
- Columnas: `id` uuid, `ubicacion_id` uuid, `punto_enrutado` geography(Point,4326), `activo` boolean
- Índices: `lugares_resguardo_tracker_pkey`, `lugares_resguardo_tracker_punto_gix`, `lugares_resguardo_tracker_ubicacion_ix`
- Triggers: —

## `public.motivos_cambio_ruta`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(50), `nombre` character varying(100), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `motivos_cambio_ruta_codigo_key`, `motivos_cambio_ruta_pkey`
- Triggers: `motivos_cambio_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `motivos_cambio_ruta_auditoria_trg` → `app_privado.registrar_auditoria()`

## `public.observaciones_tarea`
- RLS: sí
- Columnas: `id` uuid, `cliente_id` uuid, `tarea_id` uuid, `usuario_id` uuid, `tipo_observacion_id` smallint, `observacion_origen_id` uuid, `descripcion` text, `estado_operativo_tarea_id` smallint, `ubicacion` geography(Point,4326), `precision_metros` numeric, `ubicacion_capturada_en` timestamp with time zone, `capturada_en` timestamp with time zone, `recibida_en` timestamp with time zone, `creado_en` timestamp with time zone
- Índices: `observaciones_tarea_cliente_usuario_uk`, `observaciones_tarea_origen_ix`, `observaciones_tarea_pkey`, `observaciones_tarea_tarea_fecha_ix`, `observaciones_tarea_ubicacion_gix`, `observaciones_tarea_usuario_fecha_ix`
- Triggers: `observaciones_broadcast_supervision_trg` → `app_privado.broadcast_observacion_supervision()`, `observaciones_tarea_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`

## `public.paradas_ruta_planificada`
- RLS: sí
- Columnas: `id` uuid, `ruta_planificada_id` uuid, `tarea_id` uuid, `numero_orden` integer, `nivel_prioridad_snapshot` smallint, `nombre_prioridad_snapshot` character varying(60), `indicaciones_snapshot` text, `creada_en` timestamp with time zone, `punto_enrutado_snapshot` geography(Point,4326)
- Índices: `paradas_ruta_orden_uk`, `paradas_ruta_planificada_pkey`, `paradas_ruta_planificada_ruta_ix`, `paradas_ruta_punto_enrutado_gix`, `paradas_ruta_tarea_uk`
- Triggers: `paradas_ruta_auditoria_trg` → `app_privado.registrar_auditoria()`, `paradas_ruta_validar_v2_trg` → `public.validar_parada_ruta_v2()`

## `public.permisos`
- RLS: sí
- Columnas: `id` bigint, `codigo` character varying(120), `nombre` character varying(150), `modulo` character varying(80), `descripcion` text, activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `permisos_codigo_key`, `permisos_pkey`
- Triggers: `permisos_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`

## `public.prioridades`
- RLS: sí
- Columnas: `id` smallint, `nombre` character varying(60), `nivel` smallint, `activa` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `prioridades_nivel_key`, `prioridades_nombre_key`, `prioridades_pkey`
- Triggers: `prioridades_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`

## `public.recorrido_tareas_tracker`
- RLS: sí
- Columnas: `id` uuid, `recorrido_tracker_id` uuid, `tarea_id` uuid, `estado` character varying(20), `vinculada_en` timestamp with time zone, `entrada_geocerca_en` timestamp with time zone, `salida_geocerca_en` timestamp with time zone, `version_reprocesamiento` integer, `anulado_en` timestamp with time zone, `motivo_anulacion` text, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `recorrido_tareas_tracker_pkey`, `recorrido_tareas_tracker_tarea_ix`, `recorrido_tareas_tracker_uk`
- Triggers: `recorrido_tareas_tracker_actualizado_trg` → `app_privado.establecer_actualizado_en()`, `recorrido_tareas_tracker_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`

## `public.recorridos_tracker`
- RLS: sí
- Columnas: `id` uuid, `source_id` bigint, `tracker_id_snapshot` bigint, `tracker_label_snapshot` text, `fecha_operativa` date, `estado` character varying(20), `clave_evento_salida` text, `clave_evento_regreso` text, `origen_procesamiento` character varying(30), `version_reprocesamiento` integer, `motivo_incompleto` text, `anulado_en` timestamp with time zone, `motivo_anulacion` text, `reemplazada_por_id` uuid, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `lugar_resguardo_salida_id` uuid, `salida_resguardo_en` timestamp with time zone, `lugar_resguardo_cierre_id` uuid, `entrada_resguardo_en` timestamp with time zone
- Índices: `recorridos_tracker_abierto_source_uk`, `recorridos_tracker_pkey`, `recorridos_tracker_resguardo_cierre_ix`, `recorridos_tracker_resguardo_salida_ix`, `recorridos_tracker_source_fecha_resguardo_ix`
- Triggers: `recorridos_tracker_actualizado_trg` → `app_privado.establecer_actualizado_en()`, `recorridos_tracker_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`, `recorridos_tracker_validar_v2_trg` → `public.validar_recorrido_tracker_v2()`

## `public.red_vial_enrutable`
- RLS: sí
- Columnas: `id` uuid, `ubicacion_id` uuid, `geom` geometry(MultiLineString,4326), `creado_en` timestamp with time zone
- Índices: `red_vial_enrutable_geom_gix`, `red_vial_enrutable_pkey`, `red_vial_enrutable_ubicacion_ix`
- Triggers: —

## `public.roles`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(50), `nombre` character varying(100), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `roles_codigo_key`, `roles_pkey`
- Triggers: `roles_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`


## `public.roles_permisos`
- RLS: sí
- Columnas: `rol_id` smallint, `permiso_id` bigint, `asignado_por` uuid, `asignado_en` timestamp with time zone
- Índices: `roles_permisos_pkey`
- Triggers: `roles_permisos_auditoria_trg` → `app_privado.registrar_auditoria()`


## `public.rutas_planificadas`
- RLS: sí
- Columnas: `id` uuid, `usuario_id` uuid, `area_id` uuid, `fecha_programada` date, `version_actual` integer, `estado_calculo` character varying(20), `origen` geography(Point,4326), `proveedor` character varying(40), `polilinea_codificada_cache` text, `cache_calculada_en` timestamp with time zone, `cache_expira_en` timestamp with time zone, `motivo_ultima_actualizacion_id` smallint, `solicitada_por` uuid, `creada_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid, `tracker_id` bigint, `tracker_label_snapshot` text, `source_id` bigint, `recorrido_tracker_id` uuid, `origen_tipo` character varying(30), `origen_capturada_en` timestamp with time zone
- Índices: `rutas_planificadas_area_fecha_ix`, `rutas_planificadas_pkey`, `rutas_planificadas_source_fecha_ix`, `rutas_planificadas_usuario_fecha_tracker_source_uk`
- Triggers: `rutas_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `rutas_auditoria_trg` → `app_privado.registrar_auditoria()`, `rutas_broadcast_trabajador_trg` → `app_privado.broadcast_cambio_ruta_trabajador()`, `rutas_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`, `rutas_planificadas_archivar_trg` → `public.archivar_version_ruta()`, `rutas_planificadas_estado_operativo_trg` → `app_privado.sincronizar_ruta_calculada()`, `rutas_planificadas_validar_v2_trg` → `public.validar_ruta_planificada_v2()`


## `public.servicios_google_maps`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(60), `nombre` character varying(120), `unidad_medicion` character varying(40), `descripcion` text, `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `servicios_google_maps_codigo_key`, `servicios_google_maps_pkey`
- Triggers: `servicios_google_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`


## `public.solicitudes_recalculo_ruta`
- RLS: sí
- Columnas: `id` uuid, `usuario_id` uuid, `area_id` uuid, `fecha_programada` date, `tarea_id` uuid, `motivo_cambio_ruta_id` smallint, `estado` character varying(20), `solicitada_por` uuid, `solicitada_en` timestamp with time zone, `procesada_en` timestamp with time zone, `detalle_error` text, `tracker_id` bigint, `tracker_label_snapshot` text, `source_id` bigint
- Índices: `solicitudes_recalculo_pendientes_ix`, `solicitudes_recalculo_ruta_pkey`, `solicitudes_recalculo_tracker_pendiente_ix`, `solicitudes_recalculo_usuario_fecha_ix`
- Triggers: —


## `public.tarea_zonas`
- RLS: sí
- Columnas: `tarea_id` uuid, `zona_id` uuid, `rol` character varying(30)
- Índices: `tarea_zonas_pkey`, `tarea_zonas_tarea_ix`, `tarea_zonas_zona_ix`
- Triggers: `tarea_zonas_recalcular_ubicacion_v2_trg` → `public.recalcular_ubicacion_tarea_por_zonas_v2()`, `tarea_zonas_validar_control_v2_trg` → `public.validar_control_zona_tarea_v2()`


## `public.tareas`
- RLS: sí
- Columnas: `id` uuid, `area_id` uuid, `usuario_asignado_id` uuid, `ubicacion_id` uuid, `fecha_programada` date, `indicaciones` text, `prioridad_id` smallint, `tiempo_estimado_minutos` integer, `estado_tarea_id` smallint, `cancelada_en` timestamp with time zone, `cancelada_por` uuid, `motivo_cancelacion` text, `creado_por` uuid, `creado_en` timestamp with time zone, `actualizado_por` uuid, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid, `version` integer, `estado_operativo_tarea_id` smallint, `tracker_id` bigint, `tracker_label_snapshot` text, `source_id` bigint, `tracker_asignado_en` timestamp with time zone, `tracker_asignado_por` uuid, `tipo_tarea_id` smallint, `punto_enrutado` geography(Point,4326), `linea_control` geometry(MultiLineString,4326), `orden_ruta` integer
- Índices: `tareas_area_fecha_ix`, `tareas_estado_ix`, `tareas_estado_operativo_ix`, `tareas_linea_control_gix`, `tareas_pkey`, `tareas_prioridad_ix`, `tareas_punto_enrutado_gix`, `tareas_source_fecha_ix`, `tareas_source_fecha_orden_ruta_ix`, `tareas_source_fecha_orden_ruta_uk`, `tareas_tipo_tarea_ix`, `tareas_tracker_fecha_ix`, `tareas_ubicacion_ix`, `tareas_usuario_fecha_ix`
- Triggers: `tareas_01_validar_asignacion_tracker_trg` → `public.validar_asignacion_tracker_tarea()`, `tareas_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `tareas_auditoria_trg` → `app_privado.registrar_auditoria()`, `tareas_broadcast_permanencia_tracker_trg` → `app_privado.broadcast_resumen_permanencia_tracker()`, `tareas_broadcast_trabajador_trg` → `public.broadcast_cambio_tarea_v2()`, `tareas_encolar_ruta_trg` → `public.encolar_recalculo_ruta_v2()`, `tareas_evento_asignacion_tracker_trg` → `public.registrar_cambio_asignacion_tracker()`, `tareas_eventos_administrativos_trg` → `app_privado.registrar_eventos_administrativos_tarea()`, `tareas_historial_estado_trg` → `app_privado.registrar_historial_estado_tarea()`, `tareas_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`, `tareas_normalizar_estado_administrativo_trg` → `app_privado.normalizar_estado_administrativo_tarea()`, `tareas_proteger_geometria_v2_trg` → `public.proteger_geometria_tarea_v2()`, `tareas_recalcular_ubicacion_zona_v2_trg` → `public.recalcular_ubicacion_tarea_por_zonas_v2()`, `tareas_reprogramacion_encolar_ruta_trg` → `public.encolar_recalculo_por_reprogramacion_v2()`, `tareas_validar_control_zona_v2_trg` → `public.validar_control_zona_tarea_v2()`, `tareas_validar_orden_ruta_v2_trg` → `public.validar_orden_ruta_v2()`, `tareas_validar_trg` → `public.validar_tarea()`, `tareas_vincular_recorrido_tracker_trg` → `public.vincular_tarea_recorrido_tracker()`


## `public.tipos_evento_tarea`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(60), `nombre` character varying(120), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `tipos_evento_tarea_codigo_key`, `tipos_evento_tarea_pkey`
- Triggers: `tipos_evento_tarea_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`


## `public.tipos_observacion_tarea`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(40), `nombre` character varying(100), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `tipos_observacion_tarea_codigo_key`, `tipos_observacion_tarea_pkey`
- Triggers: —


## `public.tipos_tarea`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(40), `nombre` character varying(100), `activo` boolean
- Índices: `tipos_tarea_codigo_key`, `tipos_tarea_pkey`
- Triggers: —


## `public.tipos_trabajador`
- RLS: sí
- Columnas: `id` smallint, `codigo` character varying(40), `nombre` character varying(80), `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `tipos_trabajador_codigo_key`, `tipos_trabajador_pkey`
- Triggers: `tipos_trabajador_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`


## `public.trabajadores`
- RLS: sí
- Columnas: `usuario_id` uuid, `tipo_trabajador_id` smallint, `activo` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `trabajadores_pkey`
- Triggers: `trabajadores_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `trabajadores_auditoria_trg` → `app_privado.registrar_auditoria()`, `trabajadores_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`


## `public.ubicaciones`
- RLS: sí
- Columnas: `id` uuid, `area_id` uuid, `nombre` character varying(160), `origen_creacion` character varying(30), `activa` boolean, `creado_por` uuid, `creado_en` timestamp with time zone, `actualizado_por` uuid, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid, `limite` geometry(MultiPolygon,4326)
- Índices: `ubicaciones_area_ix`, `ubicaciones_limite_gix`, `ubicaciones_nombre_area_activa_uk`, `ubicaciones_pkey`
- Triggers: `ubicaciones_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `ubicaciones_auditoria_trg` → `app_privado.registrar_auditoria()`, `ubicaciones_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`, `ubicaciones_validar_modelo_v2_trg` → `public.validar_ubicacion_modelo_v2()`


## `public.ubicaciones_actuales_tracker`
- RLS: sí
- Columnas: `source_id` bigint, `tracker_id` bigint, `tracker_label_snapshot` text, `posicion` geography(Point,4326), `precision_metros` numeric, `capturada_en` timestamp with time zone, `recibida_en` timestamp with time zone, `tarea_actual_id` uuid, `tarea_candidata_id` uuid, `estado_geocerca_tarea` character varying(20), `estado_candidato_tarea` character varying(20), `conteo_candidato_tarea` integer, `primera_lectura_candidata_tarea_en` timestamp with time zone, `ultima_distancia_tarea_metros` numeric, `ultimo_evento_clave` text, `ultimo_resultado` text, `actualizado_en` timestamp with time zone, `movement_status` character varying(40), `movement_status_update` timestamp with time zone, `velocidad` numeric, `ignition` boolean, `ignition_update` timestamp with time zone, `connection_status` character varying(40), `estado_navixy_actualizado_en` timestamp with time zone
- Índices: `ubicaciones_actuales_tracker_capturada_ix`, `ubicaciones_actuales_tracker_pkey`, `ubicaciones_actuales_tracker_posicion_gix`
- Triggers: `ubicaciones_actuales_tracker_actualizado_trg` → `app_privado.establecer_actualizado_en()`, `ubicaciones_actuales_tracker_broadcast_trg` → `app_privado.broadcast_ubicacion_tracker()`


## `public.usuarios`
- RLS: sí
- Columnas: `id` uuid, `correo_electronico` citext, `nombre_completo` character varying(180), `activo` boolean, `creado_por` uuid, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `eliminado_en` timestamp with time zone, `eliminado_por` uuid
- Índices: `usuarios_correo_electronico_key`, `usuarios_pkey`
- Triggers: `usuarios_actualizado_en_trg` → `app_privado.establecer_actualizado_en()`, `usuarios_auditoria_trg` → `app_privado.registrar_auditoria()`, `usuarios_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`


## `public.usuarios_permisos`
- RLS: sí
- Columnas: `id` uuid, `usuario_id` uuid, `permiso_id` bigint, `efecto` character varying(10), `asignado_por` uuid, `asignado_en` timestamp with time zone, `revocado_por` uuid, `revocado_en` timestamp with time zone
- Índices: `usuarios_permisos_activo_uk`, `usuarios_permisos_pkey`
- Triggers: `usuarios_permisos_auditoria_trg` → `app_privado.registrar_auditoria()`


## `public.usuarios_roles`
- RLS: sí
- Columnas: `id` uuid, `usuario_id` uuid, `rol_id` smallint, `asignado_por` uuid, `asignado_en` timestamp with time zone, `revocado_por` uuid, `revocado_en` timestamp with time zone
- Índices: `usuarios_roles_activo_uk`, `usuarios_roles_pkey`
- Triggers: `usuarios_roles_auditoria_trg` → `app_privado.registrar_auditoria()`


## `public.visitas_tarea_tracker`
- RLS: sí
- Columnas: `id` uuid, `tarea_id` uuid, `recorrido_tracker_id` uuid, `source_id` bigint, `tracker_id_snapshot` bigint, `tracker_label_snapshot` text, `usuario_id_snapshot` uuid, `numero_visita` integer, `entrada_en` timestamp with time zone, `salida_en` timestamp with time zone, `duracion_segundos` integer, `estado` character varying(20), `distancia_entrada_metros` numeric, `distancia_salida_metros` numeric, `clave_evento_entrada` text, `clave_evento_salida` text, `origen_procesamiento` character varying(30), `version_reprocesamiento` integer, `motivo_incompleto` text, `anulado_en` timestamp with time zone, `motivo_anulacion` text, `reemplazada_por_id` uuid, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone, `metodo_cierre` character varying(40)
- Índices: `visitas_tarea_tracker_abierta_source_uk`, `visitas_tarea_tracker_abierta_tarea_uk`, `visitas_tarea_tracker_pkey`, `visitas_tarea_tracker_source_entrada_ix`, `visitas_tarea_tracker_tarea_entrada_ix`, `visitas_tarea_tracker_tarea_numero_uk`
- Triggers: `visitas_tarea_tracker_actualizado_trg` → `app_privado.establecer_actualizado_en()`, `visitas_tarea_tracker_no_delete_trg` → `app_privado.impedir_eliminacion_fisica()`


## `public.visitas_zona_tarea_tracker`
- RLS: sí
- Columnas: `id` uuid, `tarea_id` uuid, `zona_id` uuid, `source_id` bigint, `tracker_id_snapshot` bigint, `usuario_id_snapshot` uuid, `numero_visita` integer, `entrada_en` timestamp with time zone, `salida_en` timestamp with time zone, `duracion_segundos` integer, `estado` character varying(20), `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `visitas_zona_tarea_tracker_pkey`, `visitas_zona_tarea_tracker_source_entrada_ix`, `visitas_zona_tarea_tracker_tarea_zona_entrada_ix`, `visitas_zona_tarea_tracker_tarea_zona_numero_ix`, `visitas_zona_tarea_tracker_usuario_ix`, `visitas_zona_tarea_tracker_zona_ix`
- Triggers: —


## `public.zonas_operativas`
- RLS: sí
- Columnas: `id` uuid, `nombre` character varying(150), `geom` geometry(MultiPolygon,4326), `tipo_zona` character varying(40), `origen` character varying(40), `activa` boolean, `creado_en` timestamp with time zone, `actualizado_en` timestamp with time zone
- Índices: `zonas_operativas_geom_gix`, `zonas_operativas_pkey`
- Triggers: `zonas_operativas_proteger_geometria_v2_trg` → `public.proteger_geometria_zona_v2()`, `zonas_operativas_recalcular_ubicacion_v2_trg` → `public.recalcular_ubicacion_tarea_por_zonas_v2()`

