import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import {
  CATALOGO_ENGRASE_FEATURES,
  useCatalogoEngrasePermissions,
} from "./useCatalogoEngrasePermissions";

describe("permisos del Catálogo de engrase", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("separa consulta, edición y creación", () => {
    const featureAccess = useFeatureAccessStore();
    featureAccess.isLoaded = true;
    featureAccess.funcionalidadesPermitidas = [
      CATALOGO_ENGRASE_FEATURES.view,
      CATALOGO_ENGRASE_FEATURES.create,
    ];

    const permissions = useCatalogoEngrasePermissions();

    expect(permissions.canViewCatalog.value).toBe(true);
    expect(permissions.canCreateCatalogItems.value).toBe(true);
    expect(permissions.canEditCatalogItems.value).toBe(false);
  });

  it("no concede permisos mientras la configuración no está cargada", () => {
    const featureAccess = useFeatureAccessStore();
    featureAccess.funcionalidadesPermitidas = Object.values(
      CATALOGO_ENGRASE_FEATURES,
    );

    const permissions = useCatalogoEngrasePermissions();

    expect(permissions.canViewCatalog.value).toBe(false);
    expect(permissions.canCreateCatalogItems.value).toBe(false);
    expect(permissions.canEditCatalogItems.value).toBe(false);
  });
});
