<script setup lang="ts">
import { ChevronDown, Info, X } from "lucide-vue-next";
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import TipoFiltroChangeSummary from "./TipoFiltroChangeSummary.vue";
import { formatoEquipos } from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.helpers";
import type {
  CatalogoTipoFiltroGuardarInput,
  CatalogoTipoFiltroItem,
} from "@/stores/dbequipos/engrase/catalogo/tiposFiltroCatalogo.types";

const props = defineProps<{
  original: CatalogoTipoFiltroItem;
  draft: CatalogoTipoFiltroGuardarInput;
  saving: boolean;
}>();

const emit = defineEmits<{ cancel: []; confirm: [] }>();
const dialogRef = useTemplateRef<HTMLElement>("dialog");
let previousOverflow = "";
let previousFocus: HTMLElement | null = null;

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape" && !props.saving) {
    event.preventDefault();
    emit("cancel");
    return;
  }
  if (event.key !== "Tab" || !dialogRef.value) return;
  const focusables = Array.from(dialogRef.value.querySelectorAll<HTMLElement>("button:not([disabled]), summary"));
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
}

onMounted(() => {
  previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeydown);
  requestAnimationFrame(() => dialogRef.value?.querySelector<HTMLButtonElement>("[data-cancel]")?.focus());
});
onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow;
  window.removeEventListener("keydown", onKeydown);
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[70] grid place-items-center bg-main-dark/55 p-4" @click.self="!saving && emit('cancel')">
      <section ref="dialog" class="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-update-title" :aria-busy="saving">
        <header class="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 id="confirm-update-title" class="text-lg font-bold text-main">Confirmar actualización</h2>
          </div>
          <button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-md text-gray-500 md:min-h-9 md:min-w-9" :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100'" :disabled="saving" aria-label="Cerrar confirmación" @click="emit('cancel')"><X class="h-4 w-4" /></button>
        </header>
        <div class="space-y-4 overflow-y-auto p-4">
          <div class="flex gap-3 rounded-md border border-main/25 bg-main/5 p-3 text-sm text-main">
            <Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Esta actualización se reflejará en <strong>{{ formatoEquipos(original.impacto.totalEquipos) }}</strong>.</p>
          </div>
          <TipoFiltroChangeSummary :original="original" :draft="draft" />
          <details class="group overflow-hidden rounded-md border border-gray-200 bg-white">
            <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-semibold text-gray-800 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-main [&::-webkit-details-marker]:hidden">
              <span>Resumen de equipos</span>
              <span class="inline-flex items-center gap-2 text-main"><span class="tabular-nums">{{ formatoEquipos(original.impacto.totalEquipos) }}</span><ChevronDown class="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></span>
            </summary>
            <div class="border-t border-gray-200 p-3">
              <p v-if="!original.impacto.tiposEquipo.length" class="text-xs text-gray-500">Sin equipos asociados.</p>
              <ul v-else class="overflow-hidden rounded-md border border-gray-200">
                <li v-for="tipo in original.impacto.tiposEquipo" :key="tipo.id" class="flex items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-xs last:border-b-0"><span>{{ tipo.nombre }}</span><strong class="tabular-nums">{{ new Intl.NumberFormat('es').format(tipo.cantidadEquipos) }}</strong></li>
              </ul>
              <p class="mt-3 flex justify-between gap-3 border-t border-gray-200 pt-2 text-xs font-semibold"><span>Total asignaciones</span><span class="tabular-nums">{{ new Intl.NumberFormat('es').format(original.impacto.totalAsignaciones) }}</span></p>
            </div>
          </details>
          <div class="flex gap-3 rounded-md border border-main/25 bg-main/5 p-3 text-xs leading-5 text-main"><Info class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>Solo se actualizarán los datos del catálogo.<br />Las asociaciones con equipos no se modificarán.</p></div>
        </div>
        <footer class="grid gap-2 border-t border-gray-200 p-4 sm:grid-cols-2">
          <button data-cancel type="button" class="min-h-11 rounded-md border border-gray-300 text-sm font-semibold text-gray-700" :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'" :disabled="saving" @click="emit('cancel')">Cancelar</button>
          <button type="button" class="inline-flex min-h-11 items-center justify-center rounded-md bg-main px-3 text-sm font-semibold text-white" :class="saving ? 'cursor-wait opacity-70' : 'cursor-pointer hover:bg-main-light'" :disabled="saving" @click="emit('confirm')"><span v-if="saving" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />{{ saving ? 'Guardando…' : 'Confirmar y guardar' }}</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
