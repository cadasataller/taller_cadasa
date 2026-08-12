import { describe, expect, it } from "vitest";
import router from "./index";

const requiredFeatures = [
  "module_engrase",
  "ver_catalogo_engrase",
];

describe("rutas del catálogo de engrase", () => {
  it.each([
    ["/engrase/catalogo/tipos-filtro", "CatalogoEngraseTiposFiltro"],
    ["/engrase/catalogo/filtros", "CatalogoEngraseFiltros"],
    ["/engrase/catalogo/aceites", "CatalogoEngraseAceites"],
    ["/engrase/catalogo/sistemas", "CatalogoEngraseSistemas"],
  ])("resuelve %s con permisos de edición", (path, routeName) => {
    const resolved = router.resolve(path);

    expect(resolved.name).toBe(routeName);
    expect(resolved.meta.requiredFeatures).toEqual(requiredFeatures);
    expect(resolved.matched[1]?.path).toBe("/engrase/catalogo");
    expect(resolved.matched[2]?.name).toBe(routeName);
  });

  it("reserva la ruta base para la redirección determinista", () => {
    const baseRoute = router.getRoutes().find((route) => route.name === "CatalogoEngrase");

    expect(baseRoute?.path).toBe("/engrase/catalogo");
    expect(baseRoute?.redirect).toEqual({ name: "CatalogoEngraseTiposFiltro" });
    expect(baseRoute?.meta.requiredFeatures).toEqual(requiredFeatures);
    expect(baseRoute?.meta.layout).toBeUndefined();
    expect(baseRoute?.children).toHaveLength(4);
  });

  it("redirige la ruta anterior a la nueva pestaña de Catálogo", () => {
    const legacyRoute = router.getRoutes().find(
      (route) => route.name === "CatalogoEngraseLegacy",
    );

    expect(legacyRoute?.path).toBe("/engrase/filtros/catalogo");
    expect(legacyRoute?.redirect).toEqual({ name: "CatalogoEngraseTiposFiltro" });
    expect(legacyRoute?.children).toHaveLength(4);
    expect(legacyRoute?.children.map((route) => route.redirect)).toEqual([
      { name: "CatalogoEngraseTiposFiltro" },
      { name: "CatalogoEngraseFiltros" },
      { name: "CatalogoEngraseAceites" },
      { name: "CatalogoEngraseSistemas" },
    ]);
  });
});
