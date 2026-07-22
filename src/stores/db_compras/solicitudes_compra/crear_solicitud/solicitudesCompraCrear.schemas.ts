import { z } from 'zod';

import type { SolicitudCompraTipoSolicitud } from './solicitudesCompraCrear.types';

const tipoSolicitudSchema = z.enum(['zafra', 'cultivo', 'otros', 'servicio']);
const PRODUCTO_REQUIRED_MESSAGE = 'Debe agregar al menos un producto para continuar.';
const SERVICIO_REQUIRED_MESSAGE = 'Debe agregar al menos un servicio para continuar.';
const STEP2_EXCLUSIVITY_MESSAGE = 'No puede mezclar productos y servicios en una misma solicitud.';

const fechaEntregaSchema = z.string()
  .min(1, 'La fecha de entrega es obligatoria.')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: 'La fecha de entrega no es válida.',
  });

const destinoSchema = z.object({
  id: z.number(),
  tipoOrigen: z.enum(['equipo', 'area_operativa', 'instalacion_taller', 'grupo_equipo', 'otros']),
  codigo: z.string().min(1),
  label: z.string().min(1),
  modelo: z.string().nullable(),
  marca: z.string().nullable(),
  tipo: z.string().nullable(),
});

const productoExistenteSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('existente'),
  codProducto: z.string().min(1, 'El código del producto es obligatorio.'),
  nombre: z.string().min(1),
  unidadCodigo: z.string().min(1),
  unidadLabel: z.string().min(1),
});

const productoTemporalSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('temporal'),
  temporal: z.literal(true),
  nombre: z.string()
    .trim()
    .min(1, 'El nombre del producto temporal es obligatorio.')
    .max(56, 'El nombre del producto temporal no puede superar los 56 caracteres.'),
  descripcion: z.string().trim().optional().nullable(),
  unidadCodigo: z.string().trim().min(1, 'La unidad del producto temporal es obligatoria.'),
  unidadLabel: z.string().min(1),
});

export const productoSolicitudSchema = z.union([
  productoExistenteSchema,
  productoTemporalSchema,
]);

const destinosArraySchema = z.array(destinoSchema)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    let tipoOrigenDetectado: string | null = null;

    items.forEach((item, index) => {
      const uniqueKey = `${item.tipoOrigen}:${item.codigo}`;

      if (seen.has(uniqueKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'codigo'],
          message: 'No se permiten destinos duplicados.',
        });
        return;
      }

      seen.add(uniqueKey);

      if (!tipoOrigenDetectado) {
        tipoOrigenDetectado = item.tipoOrigen;
        return;
      }

      if (tipoOrigenDetectado !== item.tipoOrigen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'tipoOrigen'],
          message: 'No se pueden mezclar tipos de destino en una misma solicitud.',
        });
      }
    });
  });

export const servicioSolicitudSchema = z.object({
  localId: z.string().min(1),
  cantidad: z.number()
    .finite('La cantidad del servicio debe ser un numero valido.')
    .refine((value) => value >= 0, 'La cantidad del servicio no puede ser negativa.')
    .transform((value) => (value === 0 ? 1 : value)),
  descripcion: z.string()
    .trim()
    .min(5, 'La descripcion del servicio debe tener al menos 5 caracteres.'),
  unidadCodigo: z.string().trim().min(1, 'La unidad del servicio es obligatoria.'),
  unidadLabel: z.string().min(1),
});

export const stepDatosBaseSchema = z.object({
  tipoSolicitud: tipoSolicitudSchema,
  fechaEntrega: fechaEntregaSchema,
  destinos: destinosArraySchema,
}).superRefine((value, ctx) => {
  if (value.destinos.length > 0) {
    return;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path: ['destinos'],
    message: 'Debe seleccionar al menos un destino.',
  });
});

export const stepProductosSchema = z.object({
  tipoSolicitud: tipoSolicitudSchema,
  productos: z.array(productoSolicitudSchema),
  servicios: z.array(servicioSolicitudSchema),
}).superRefine((value, ctx) => {
  if (value.tipoSolicitud === 'servicio') {
    if (value.productos.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productos'],
        message: STEP2_EXCLUSIVITY_MESSAGE,
      });
    }

  if (value.servicios.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['servicios'],
        message: SERVICIO_REQUIRED_MESSAGE,
      });
    }

    return;
  }

  if (value.servicios.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['servicios'],
      message: STEP2_EXCLUSIVITY_MESSAGE,
    });
  }

  if (value.productos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['productos'],
      message: PRODUCTO_REQUIRED_MESSAGE,
    });
  }
});

export const stepObservacionesSchema = z.object({
  observacion: z.string()
    .trim()
    .min(1, 'La observación es obligatoria.'),
  solicitarUrgente: z.boolean(),
  motivoUrgencia: z.string(),
}).superRefine((value, ctx) => {
  if (value.solicitarUrgente && value.motivoUrgencia.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['motivoUrgencia'],
      message: 'Debe indicar el motivo de urgencia para continuar.',
    });
  }
});

const baseCreateSchema = z.object({
  tipoSolicitud: tipoSolicitudSchema,
  fechaEntrega: fechaEntregaSchema,
  destinos: destinosArraySchema,
  productos: z.array(productoSolicitudSchema),
  servicios: z.array(servicioSolicitudSchema),
  observacion: z.string()
    .trim()
    .min(1, 'La observación es obligatoria.'),
  solicitarUrgente: z.boolean(),
  motivoUrgencia: z.string(),
}).superRefine((value, ctx) => {
  if (value.destinos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['destinos'],
      message: 'Debe seleccionar al menos un destino.',
    });
  }

  const stepProductosResult = stepProductosSchema.safeParse({
    tipoSolicitud: value.tipoSolicitud,
    productos: value.productos,
    servicios: value.servicios,
  });

  if (!stepProductosResult.success) {
    stepProductosResult.error.issues.forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    });
  }
});

export const createSolicitudSendSchema = baseCreateSchema.superRefine((value, ctx) => {
  if (value.tipoSolicitud === 'servicio') {
    if (value.servicios.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['servicios'],
        message: SERVICIO_REQUIRED_MESSAGE,
      });
    }
  } else if (value.productos.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['productos'],
      message: 'Debe agregar al menos un producto para enviar la solicitud.',
    });
  }

  if (value.solicitarUrgente && value.motivoUrgencia.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['motivoUrgencia'],
      message: 'Debe indicar el motivo de urgencia al enviar la solicitud.',
    });
  }
});

export const sanitizeCollectionsForTipoSolicitud = <TProductos, TServicios>(value: {
  tipoSolicitud: SolicitudCompraTipoSolicitud;
  productos: TProductos[];
  servicios: TServicios[];
}): {
  productos: TProductos[];
  servicios: TServicios[];
} => (
  value.tipoSolicitud === 'servicio'
    ? {
      productos: [],
      servicios: value.servicios,
    }
    : {
      productos: value.productos,
      servicios: [],
    }
);
