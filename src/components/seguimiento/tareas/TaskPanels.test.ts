import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TaskCard from "./TaskCard.vue";
import TaskDetailPanel from "./TaskDetailPanel.vue";
import TaskListPanel from "./TaskListPanel.vue";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const task = (
  overrides: Partial<TareaSeguimientoListItem> = {},
): TareaSeguimientoListItem => ({
  id: "task-1",
  type: "finca",
  status: "pendiente",
  areaId: "area-1",
  assignedUserId: null,
  locationId: null,
  scheduledDate: "2026-08-29",
  instructions: "Revisar lote norte",
  priorityId: null,
  estimatedMinutes: 30,
  trackerId: null,
  sourceId: null,
  trackerLabel: null,
  routePoint: null,
  routeOrder: null,
  ...overrides,
});

describe("paneles de seguimiento de tareas", () => {
  it("diferencia una duda y comunica la selección de la card", async () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({ type: "duda", status: "duda_detectada" }),
        selected: false,
      },
    });
    expect(wrapper.text()).toContain("Duda automática");
    expect(wrapper.text()).toContain("Detectada automáticamente");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["task-1"]]);
  });

  it("distingue vacío estructural de resultados filtrados y permite limpiar", async () => {
    const wrapper = mount(TaskListPanel, {
      props: {
        tasks: [],
        selectedTaskId: null,
        loading: false,
        error: null,
        search: "",
        hasActiveFilters: true,
      },
    });
    expect(wrapper.text()).toContain("No hay coincidencias");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("clearFilters")).toHaveLength(1);
    await wrapper.setProps({ hasActiveFilters: false });
    expect(wrapper.text()).toContain("No hay tareas para este contexto");
  });

  it("ofrece recuperación independiente cuando falla el detalle", async () => {
    const wrapper = mount(TaskDetailPanel, {
      props: {
        task: task(),
        loading: false,
        error: "No se pudo cargar el detalle.",
      },
    });
    expect(wrapper.text()).toContain("No se pudo cargar el detalle.");
    await wrapper.findAll("button").at(-1)!.trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });
});
