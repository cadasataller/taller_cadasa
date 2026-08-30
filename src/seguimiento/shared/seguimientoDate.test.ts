import { describe, expect, it } from "vitest";
import { formatSeguimientoDate } from "./seguimientoDate";

describe("formatSeguimientoDate", () => {
  it("usa día y mes abreviados en español", () => {
    expect(formatSeguimientoDate(new Date(2026, 7, 30))).toBe("dom, 30 ago 26");
  });
});
