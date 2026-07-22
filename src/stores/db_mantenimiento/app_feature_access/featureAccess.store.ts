import { defineStore } from 'pinia';
import { featureAccessService } from './featureAccess.service';
import type { FeatureAccessState, FuncionalidadPermitida } from './featureAccess.types';

let pendingFeatureAccessRequest: Promise<FuncionalidadPermitida[]> | null = null;

export const useFeatureAccessStore = defineStore('featureAccess', {
  state: (): FeatureAccessState => ({
    funcionalidadesPermitidas: [],
    isLoading: false,
    isLoaded: false,
    error: null
  }),

  getters: {
    tieneFuncionalidad: (state) => (funcionalidad: FuncionalidadPermitida): boolean => {
      return state.funcionalidadesPermitidas.includes(funcionalidad);
    }
  },

  actions: {
    async cargarFuncionalidadesPermitidas(force = false): Promise<FuncionalidadPermitida[]> {
      if (this.isLoaded && !force) {
        return this.funcionalidadesPermitidas;
      }

      if (pendingFeatureAccessRequest && !force) {
        return pendingFeatureAccessRequest;
      }

      this.isLoading = true;
      this.error = null;

      pendingFeatureAccessRequest = featureAccessService
        .obtenerFuncionalidadesPermitidas()
        .then((funcionalidades) => {
          this.funcionalidadesPermitidas = funcionalidades;
          this.isLoaded = true;
          return funcionalidades;
        })
        .catch((error) => {
          const message = error instanceof Error
            ? error.message
            : 'No se pudieron obtener las funcionalidades permitidas';

          this.error = message;
          throw error;
        })
        .finally(() => {
          this.isLoading = false;
          pendingFeatureAccessRequest = null;
        });

      return pendingFeatureAccessRequest;
    },

    reset(): void {
      this.funcionalidadesPermitidas = [];
      this.isLoading = false;
      this.isLoaded = false;
      this.error = null;
      pendingFeatureAccessRequest = null;
    }
  }
});
