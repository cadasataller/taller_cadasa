import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import EquipoEngraseListItem from "./EquipoEngraseListItem.vue";

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0];
let observerCallback: ObserverCallback | null = null;
const observe = vi.fn();
const disconnect = vi.fn();

class IntersectionObserverMock {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = observe;
  disconnect = disconnect;
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "0px";
  thresholds = [0.01];
}

const equipo = {
  id: 123,
  codigo: "422017",
  tipo_equipo_id: 5,
  tipo_equipo: "Combinadas",
  subtipo: "Cosechadora",
  estado: "activo" as const,
  main_storage_path: "equipos/422017/main_thumb/imagen.webp",
  tiene_imagen_main: true,
  imagen_actualizada_en: "2026-08-10T15:33:50.316Z",
  etapas: [],
};

describe("EquipoEngraseListItem", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    observerCallback = null;
    observe.mockClear();
    disconnect.mockClear();
  });

  it("solicita la imagen solamente al entrar en el área visible", async () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    const wrapper = mount(EquipoEngraseListItem, {
      props: { equipo, selected: false },
    });

    expect(observe).toHaveBeenCalledOnce();
    expect(wrapper.emitted("imageVisible")).toBeUndefined();
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted("imageVisible")).toEqual([[123]]);
    expect(disconnect).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("no observa ni solicita cuando no existe una imagen asociada", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    const wrapper = mount(EquipoEngraseListItem, {
      props: {
        equipo: {
          ...equipo,
          main_storage_path: null,
          tiene_imagen_main: false,
        },
        selected: false,
      },
    });

    expect(observe).not.toHaveBeenCalled();
    expect(wrapper.emitted("imageVisible")).toBeUndefined();
    wrapper.unmount();
  });
});
