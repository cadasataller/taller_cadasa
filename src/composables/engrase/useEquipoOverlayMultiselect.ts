import { nextTick, useTemplateRef } from "vue";

type MultiselectPositionHandle = {
  $el: HTMLElement;
  adjustPosition: () => void;
};

export function useEquipoOverlayMultiselect() {
  const multiselect =
    useTemplateRef<MultiselectPositionHandle>("multiselect");

  async function acomodarOpcionesEnOverlay(): Promise<void> {
    if (
      typeof window.matchMedia !== "function" ||
      !window.matchMedia("(max-width: 639px)").matches
    )
      return;

    await nextTick();
    const control = multiselect.value?.$el;
    const scrollContainer = control?.closest<HTMLElement>(
      "[data-equipo-overlay-scroll]",
    );
    if (!control || !scrollContainer) return;

    const controlRect = control.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();
    scrollContainer.scrollTop = Math.max(
      0,
      scrollContainer.scrollTop + controlRect.top - containerRect.top - 8,
    );

    await nextTick();
    multiselect.value?.adjustPosition();
  }

  return { multiselect, acomodarOpcionesEnOverlay };
}
