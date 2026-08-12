import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";

export const CATALOGO_ENGRASE_FEATURES = {
  view: "ver_catalogo_engrase",
  edit: "editar_items_catalogo_engrase",
  create: "agregar_items_catalogo_engrase",
} as const;

export function useCatalogoEngrasePermissions() {
  const featureAccessStore = useFeatureAccessStore();
  const { isLoaded } = storeToRefs(featureAccessStore);

  const canViewCatalog = computed(
    () => isLoaded.value
      && featureAccessStore.tieneFuncionalidad(CATALOGO_ENGRASE_FEATURES.view),
  );
  const canEditCatalogItems = computed(
    () => isLoaded.value
      && featureAccessStore.tieneFuncionalidad(CATALOGO_ENGRASE_FEATURES.edit),
  );
  const canCreateCatalogItems = computed(
    () => isLoaded.value
      && featureAccessStore.tieneFuncionalidad(CATALOGO_ENGRASE_FEATURES.create),
  );

  return {
    canViewCatalog,
    canEditCatalogItems,
    canCreateCatalogItems,
  };
}
