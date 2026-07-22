import { computed, ref, shallowRef, toValue, watchEffect } from 'vue';
import type { MaybeRefOrGetter } from 'vue';

import { useUserStore } from '@/stores/userStore';
import { catalogoServicioContextoService } from '@/stores/db_compras/catalogo_servicio_contexto/catalogoServicioContexto.service';
import type { CatalogoServicioContextoOption } from '@/stores/db_compras/catalogo_servicio_contexto/catalogoServicioContexto.types';

const AUTHORIZED_ROLES = new Set(['gerencia', 'secretaria']);
const AUTHORIZED_AREAS = new Set(['ALL']);

const normalizeAccessValue = (value: string | null | undefined): string => value
  ?.trim()
  .toLowerCase() ?? '';

export const useCatalogoServicioContextoOptions = (
  enabled: MaybeRefOrGetter<boolean>
) => {
  const userStore = useUserStore();
  const options = ref<CatalogoServicioContextoOption[]>([]);
  const loading = shallowRef(false);
  const error = shallowRef<string | null>(null);
  const hasLoaded = shallowRef(false);

  const isAuthorized = computed(() => {
    const role = normalizeAccessValue(userStore.role);
    const area = (userStore.area ?? '').trim().toUpperCase();

    return AUTHORIZED_ROLES.has(role) || AUTHORIZED_AREAS.has(area);
  });

  const loadOptions = async (): Promise<void> => {
    if (loading.value || hasLoaded.value || !isAuthorized.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      options.value = await catalogoServicioContextoService.obtenerOpcionesActivas();
      hasLoaded.value = true;
    } catch (loadError) {
      error.value = loadError instanceof Error
        ? loadError.message
        : 'No se pudieron obtener los contextos de servicio';
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => {
    if (!toValue(enabled)) {
      return;
    }

    void loadOptions();
  });

  return {
    options,
    loading,
    error,
    isAuthorized,
    loadOptions,
  };
};
