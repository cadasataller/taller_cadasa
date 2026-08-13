import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import EquipoCatalogSelect from "./EquipoCatalogSelect.vue";

describe("EquipoCatalogSelect", () => {
  it("abre hacia abajo y desplaza el control dentro del bottom sheet", async () => {
    const matchMediaOriginal = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    const scrollContainer = document.createElement("div");
    scrollContainer.dataset.equipoOverlayScroll = "";
    scrollContainer.scrollTop = 12;
    scrollContainer.getBoundingClientRect = () =>
      ({ top: 90 } as DOMRect);
    document.body.appendChild(scrollContainer);
    const wrapper = mount(EquipoCatalogSelect, {
      attachTo: scrollContainer,
      props: {
        options: [
          {
            key: "1",
            label: "Motor",
            $isDisabled: false,
            pendingCreation: false,
          },
        ],
        modelValue: null,
        placeholder: "Seleccione una opción",
      },
    });
    wrapper.get(".multiselect").element.getBoundingClientRect = () =>
      ({ top: 240 } as DOMRect);

    await wrapper.get("input").trigger("focus");
    await flushPromises();

    expect(
      wrapper.findComponent({ name: "vue-multiselect" }).props("openDirection"),
    ).toBe("below");
    expect(scrollContainer.scrollTop).toBe(154);

    wrapper.unmount();
    scrollContainer.remove();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMediaOriginal,
    });
  });
});
