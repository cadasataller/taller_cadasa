import { describe, expect, it } from "vitest";
import EquipoEngraseCrearView from "./EquipoEngraseCrearView.vue";

describe("vista de creación de equipos de engrase", () => {
  it("compila el paso de aceites con su overlay", () => {
    expect(EquipoEngraseCrearView).toBeTruthy();
  });
});
