import { describe, expect, it } from "vitest";
import router from "./index";

const requiredFeatures = [
  "module_engrase",
  "ver_filtros_engrase",
  "editar_filtros_engrase",
];

describe("rutas del catálogo de engrase", () => {
  it.each([
    ["/engrase/filtros/catalogo/tipos-filtro", "CatalogoEngraseTiposFiltro"],
    ["/engrase/filtros/catalogo/filtros", "CatalogoEngraseFiltros"],
    ["/engrase/filtros/catalogo/aceites", "CatalogoEngraseAceites"],
    ["/engrase/filtros/catalogo/sistemas", "CatalogoEngraseSistemas"],
  ])("resuelve %s con permisos de edición", (path, routeName) => {
    const resolved = router.resolve(path);

    expect(resolved.name).toBe(routeName);
    expect(resolved.meta.requiredFeatures).toEqual(requiredFeatures);
    expect(resolved.matched[1]?.path).toBe("/engrase/filtros/catalogo");
    expect(resolved.matched[2]?.name).toBe(routeName);
  });

  it("reserva la ruta base para la redirección determinista", () => {
    const baseRoute = router.getRoutes().find((route) => route.name === "CatalogoEngrase");

    expect(baseRoute?.path).toBe("/engrase/filtros/catalogo");
    expect(baseRoute?.redirect).toEqual({ name: "CatalogoEngraseTiposFiltro" });
    expect(baseRoute?.meta.requiredFeatures).toEqual(requiredFeatures);
    expect(baseRoute?.children).toHaveLength(4);
  });
});
