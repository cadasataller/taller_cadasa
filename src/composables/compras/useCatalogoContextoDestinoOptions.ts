import { computed, ref, shallowRef, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import { catalogoContextoDestinoService } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.service';
import type { CatalogoContextoDestinoOption } from '@/stores/db_compras/catalogo_contexto_destino/catalogoContextoDestino.types';
import type { SolicitudCompraTipoSolicitud } from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

export const useCatalogoContextoDestinoOptions = (
  tipoSolicitud: MaybeRefOrGetter<SolicitudCompraTipoSolicitud | null>
) => {
  const options = ref<CatalogoContextoDestinoOption[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  let requestId = 0;

  const loadOptions = async (
    nextTipoSolicitud: SolicitudCompraTipoSolicitud | null
  ): Promise<void> => {
    if (!nextTipoSolicitud) {
      options.value = [];
      error.value = null;
      return;
    }

    const currentRequestId = ++requestId;
    loading.value = true;
    error.value = null;

    try {
      const loadedOptions = await catalogoContextoDestinoService.obtenerOpciones(nextTipoSolicitud);

      if (currentRequestId !== requestId) {
        return;
      }

      options.value = loadedOptions;
    } catch (loadError) {
      if (currentRequestId !== requestId) {
        return;
      }

      options.value = [];
      error.value = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron obtener los destinos';
    } finally {
      if (currentRequestId === requestId) {
        loading.value = false;
      }
    }
  };

  watch(
    () => toValue(tipoSolicitud),
    (nextTipoSolicitud) => {
      void loadOptions(nextTipoSolicitud);
    },
    { immediate: true }
  );

  return {
    options: computed(() => options.value),
    loading,
    error,
    loadOptions,
  };
};
