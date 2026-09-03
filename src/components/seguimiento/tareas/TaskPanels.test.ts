import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import TaskCard from "./TaskCard.vue";
import TaskDetailPanel from "./TaskDetailPanel.vue";
import TaskListPanel from "./TaskListPanel.vue";
import TaskZoneDetailCard from "./TaskDetailSections/TaskZoneDetailCard.vue";
import type { TareaSeguimientoListItem } from "@/stores/seguimiento/tareas/tareasSeguimiento.types";

const task = (
  overrides: Partial<TareaSeguimientoListItem> = {},
): TareaSeguimientoListItem => ({
  id: "task-1",
  type: "finca",
  typeName: "Finca",
  status: "pendiente",
  areaId: "area-1",
  assignedUserId: null,
  assignedUserName: null,
  locationId: null,
  scheduledDate: "2026-08-29",
  instructions: "Revisar lote norte",
  priorityId: null,
  estimatedMinutes: 30,
  trackerId: null,
  sourceId: null,
  trackerLabel: null,
  elapsedSeconds: 0,
  currentVisitSeconds: 0,
  hasOpenVisit: false,
  routePoint: null,
  routeOrder: null,
  ...overrides,
});

describe("paneles de seguimiento de tareas", () => {
  it("diferencia una duda y comunica la selección de la card", async () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({
          type: "duda",
          typeName: "Duda automática",
          status: "duda_detectada",
        }),
        selected: false,
      },
    });
    expect(wrapper.text()).toContain("Duda automática");
    expect(wrapper.text()).toContain("Detectada automáticamente");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["task-1"]]);
  });

  it("muestra el nombre del tipo entregado por el RPC", () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({ type: "zona", typeName: "Zona de mantenimiento" }),
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("Zona de mantenimiento");
  });

  it("muestra el nombre del trabajador asignado", () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: task({
          assignedUserId: "user-1",
          assignedUserName: "Pedro Hurtado",
        }),
        selected: false,
      },
    });

    expect(wrapper.text()).toContain("Pedro Hurtado");
  });

  it("muestra hh:mm y agrega segundos solo mientras la permanencia cuenta", () => {
    const countingCard = mount(TaskCard, {
      props: {
        task: task({ status: "activa", currentVisitSeconds: 59 }),
        selected: false,
        livePermanence: { seconds: 59, startedAt: 0 },
        liveNow: 0,
      },
    });
    expect(countingCard.text()).toContain("00:00:59");
    expect(countingCard.text()).toContain("Contando");

    const elapsedCard = mount(TaskCard, {
      props: {
        task: task({ elapsedSeconds: 3_660 }),
        selected: false,
      },
    });
    expect(elapsedCard.text()).toContain("01:01");
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
    expect(wrapper.text()).toContain("Restablecer filtros");
    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("clearFilters")).toHaveLength(1);
    await wrapper.setProps({ hasActiveFilters: false });
    expect(wrapper.text()).toContain("No hay tareas para este contexto");
  });

  it("ofrece recuperación independiente cuando falla el detalle", async () => {
    const wrapper = mount(TaskDetailPanel, {
      props: {
        task: null,
        loading: false,
        error: "No se pudo cargar el detalle.",
      },
    });
    expect(wrapper.text()).toContain("No se pudo cargar el detalle.");
    await wrapper.findAll("button").at(-1)!.trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("muestra el resumen y despliega el detalle de una zona asociada", async () => {
    const wrapper = mount(TaskZoneDetailCard, {
      props: {
        index: 0,
        zone: {
          id: "zone-1",
          rol: "control",
          tipo_zona: "control",
          origen: "tarea_supervisor",
          tiempo: {
            cantidad_visitas: 1,
            segundos_visitas_cerradas: 600,
            segundos_visita_abierta: 300,
            segundos_totales: 900,
            visita_abierta: true,
            visita_actual_id: "visit-2",
            llegada_actual_en: "2026-08-29T12:20:00Z",
            primera_llegada_en: "2026-08-29T12:00:00Z",
            ultima_salida_en: "2026-08-29T12:10:00Z",
            ultima_actualizacion_tracker_en: "2026-08-29T12:25:00Z",
            segundos_sin_datos: 0,
          },
          visitas: [
            {
              id: "visit-1",
              entrada_en: "2026-08-29T12:00:00Z",
              salida_en: "2026-08-29T12:10:00Z",
            },
          ],
        },
      },
    });

    expect(wrapper.text()).toContain("Zona asociada 1");
    expect(wrapper.text()).toContain("15 min");
    await wrapper.get("details").trigger("toggle");
    expect(wrapper.text()).toContain("Historial de la zona");
    expect(wrapper.text()).toContain("Visita 1");
  });
});
