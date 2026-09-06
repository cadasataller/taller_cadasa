import { describe, expect, it } from "vitest";
import {
  formatCompactDate,
  formatCompactPanamaDateTime,
} from "./formatCompactPanamaDate";

describe("formatCompactPanamaDate", () => {
  it("formatea una fecha de filtro con el mes abreviado", () => {
    expect(formatCompactDate(new Date(2026, 7, 5))).toBe("05 agos 26");
  });

  it("formatea un timestamp en la zona horaria de Panamá", () => {
    expect(formatCompactPanamaDateTime("2026-09-05T19:35:20Z")).toBe(
      "05 sep 26 14:35",
    );
  });
});
