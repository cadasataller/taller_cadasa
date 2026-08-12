<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { X } from "lucide-vue-next";
import TipoFiltroEquipmentTypes from "./TipoFiltroEquipmentTypes.vue";
import TipoFiltroForm from "./TipoFiltroForm.vue";
import TipoFiltroImpactSummary from "./TipoFiltroImpactSummary.vue";
import type {
  CatalogoTipoFiltroEditorMode,
  CatalogoTipoFiltroFieldErrors,
  CatalogoTipoFiltroGuardarInput,
  CatalogoTipoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{
  open: boolean;
  mode: CatalogoTipoFiltroEditorMode;
  item: CatalogoTipoFiltroItem | null;
  draft: CatalogoTipoFiltroGuardarInput | null;
  hasChanges: boolean;
  canSubmit: boolean;
  saving: boolean;
  fieldErrors: CatalogoTipoFiltroFieldErrors;
  saveError?: string | null;
}>();

const emit = defineEmits<{
  updateDraft: [draft: CatalogoTipoFiltroGuardarInput];
  requestClose: [];
  cancel: [];
  submit: [];
  blurName: [];
}>();

const panelRef = useTemplateRef<HTMLElement>("panel");
const isDesktop = shallowRef(false);
const title = computed(() => props.mode === "crear" ? "Nuevo tipo de filtro" : "Detalles");
const actionLabel = computed(() => props.mode === "crear" ? "Crear tipo de filtro" : "Guardar cambios");
let previousOverflow = "";
let desktopMedia: MediaQueryList | null = null;
let mounted = false;

function syncBodyOverflow(): void {
  if (!mounted) return;
  document.body.style.overflow = props.open && !isDesktop.value ? "hidden" : previousOverflow;
}

function syncViewport(event?: MediaQueryListEvent): void {
  isDesktop.value = event?.matches ?? desktopMedia?.matches ?? false;
  syncBodyOverflow();
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    emit("requestClose");
    return;
  }
  if (event.key !== "Tab" || !panelRef.value || isDesktop.value) return;
  const focusables = Array.from(panelRef.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ));
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

onMounted(() => {
  mounted = true;
  previousOverflow = document.body.style.overflow;
  if (typeof window.matchMedia === "function") {
    desktopMedia = window.matchMedia("(min-width: 1024px)");
    desktopMedia.addEventListener("change", syncViewport);
    syncViewport();
  } else {
    isDesktop.value = window.innerWidth >= 1024;
    syncBodyOverflow();
  }
  window.addEventListener("keydown", onKeydown);
  if (props.open) {
    requestAnimationFrame(() => panelRef.value?.querySelector<HTMLElement>("h2")?.focus());
  }
});

onBeforeUnmount(() => {
  mounted = false;
  document.body.style.overflow = previousOverflow;
  desktopMedia?.removeEventListener("change", syncViewport);
  window.removeEventListener("keydown", onKeydown);
});

watch(
  () => props.open,
  async (open) => {
    syncBodyOverflow();
    if (!open) return;
    await nextTick();
    requestAnimationFrame(() => panelRef.value?.querySelector<HTMLElement>("h2")?.focus());
  },
);

watch(
  () => props.fieldErrors.nombre,
  async (error) => {
    if (!error) return;
    await nextTick();
    panelRef.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50"
      :class="open ? 'pointer-events-auto lg:pointer-events-none' : 'pointer-events-none'"
      @click.self="emit('requestClose')"
    >
      <Transition name="tipo-filtro-scrim">
        <div v-if="open" class="absolute inset-0 bg-main-dark/50 lg:hidden" aria-hidden="true" />
      </Transition>
      <Transition name="tipo-filtro-panel">
        <aside
          v-if="open"
          ref="panel"
          class="pointer-events-auto absolute inset-0 flex min-w-0 flex-col border-l border-gray-200 bg-white shadow-[-12px_0_30px_-18px_rgba(15,23,42,0.38)] sm:left-auto sm:right-0 sm:w-[min(400px,100vw)] lg:top-[7.4rem] lg:right-0 lg:bottom-0 lg:left-auto lg:w-[clamp(320px,28vw,400px)]"
          :role="isDesktop ? undefined : 'dialog'"
          :aria-modal="isDesktop ? undefined : 'true'"
          aria-labelledby="tipo-filtro-drawer-title"
          :aria-busy="saving"
        >
          <header class="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
            <h2 id="tipo-filtro-drawer-title" tabindex="-1" class="text-base font-bold text-main">{{ title }}</h2>
            <button
              type="button"
              class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-main md:min-h-9 md:min-w-9"
              :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
              :disabled="saving"
              aria-label="Cerrar detalles"
              @click="emit('requestClose')"
            ><X class="h-4 w-4" aria-hidden="true" /></button>
          </header>

          <div v-if="draft" class="flex-1 space-y-6 overflow-y-auto p-4 pb-24">
            <div v-if="saveError" class="rounded-md border border-danger/30 bg-danger-bg p-3 text-xs text-danger" role="alert">{{ saveError }}</div>
            <TipoFiltroForm :draft="draft" :errors="fieldErrors" :disabled="saving" @update-draft="emit('updateDraft', $event)" @blur-name="emit('blurName')" />
            <template v-if="mode === 'editar' && item">
              <hr class="border-gray-200" />
              <TipoFiltroEquipmentTypes :items="item.impacto.tiposEquipo" />
              <TipoFiltroImpactSummary :impacto="item.impacto" />
            </template>
            <p v-else class="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Todavía no está asociado a equipos.</p>
          </div>

          <footer class="sticky bottom-0 z-10 mt-auto grid grid-cols-2 gap-2 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              class="min-h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 md:min-h-9 md:text-xs"
              :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'"
              :disabled="saving"
              @click="emit('cancel')"
            >Cancelar</button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center rounded-md bg-main px-3 text-sm font-semibold text-white md:min-h-9 md:text-xs"
              :class="saving ? 'cursor-wait opacity-70' : canSubmit ? 'cursor-pointer hover:bg-main-light' : 'cursor-not-allowed opacity-50'"
              :disabled="!canSubmit || saving"
              @click="emit('submit')"
            >
              <span v-if="saving" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />
              {{ saving ? 'Guardando…' : actionLabel }}
            </button>
          </footer>
        </aside>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.tipo-filtro-panel-enter-active,
.tipo-filtro-panel-leave-active {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease;
  will-change: transform, opacity;
}

.tipo-filtro-panel-enter-from,
.tipo-filtro-panel-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.tipo-filtro-scrim-enter-active,
.tipo-filtro-scrim-leave-active {
  transition: opacity 200ms ease;
}

.tipo-filtro-scrim-enter-from,
.tipo-filtro-scrim-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tipo-filtro-panel-enter-active,
  .tipo-filtro-panel-leave-active,
  .tipo-filtro-scrim-enter-active,
  .tipo-filtro-scrim-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
