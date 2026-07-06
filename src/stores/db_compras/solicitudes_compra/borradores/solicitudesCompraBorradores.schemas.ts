import { z } from 'zod';

const tipoSolicitudSchema = z.enum(['zafra', 'cultivo', 'otros', 'servicio']);

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
  productoId: z.string().min(1),
  codProducto: z.string().min(1),
  nombre: z.string().min(1),
  unidadCodigo: z.string().min(1),
  unidadLabel: z.string().min(1),
});

const productoTemporalSchema = z.object({
  localId: z.string().min(1),
  tipo: z.literal('temporal'),
  temporal: z.literal(true),
  nombre: z.string().trim().min(1).max(56),
  descripcion: z.string().trim().optional().nullable(),
  unidadCodigo: z.string().trim().min(1),
  unidadLabel: z.string().min(1),
});

const productoSolicitudSchema = z.union([
  productoExistenteSchema,
  productoTemporalSchema,
]);

const servicioSolicitudSchema = z.object({
  localId: z.string().min(1),
  cantidad: z.number()
    .finite('La cantidad del servicio debe ser un numero valido.')
    .refine((value) => value >= 0, 'La cantidad del servicio no puede ser negativa.'),
  descripcion: z.string().trim().min(5, 'La descripcion del servicio debe tener al menos 5 caracteres.'),
  unidadCodigo: z.string().trim().min(1, 'La unidad del servicio es obligatoria.'),
  unidadLabel: z.string().min(1),
});

const currentStepSchema = z.union([
  z.literal(2),
  z.literal(3),
  z.literal(4),
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

export const solicitudCompraBorradorSchema = z.object({
  currentStep: currentStepSchema,
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

  if (value.solicitarUrgente && value.motivoUrgencia.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['motivoUrgencia'],
      message: 'Debe indicar el motivo de urgencia para guardar el borrador.',
    });
  }
});
