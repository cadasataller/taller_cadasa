<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { X } from "lucide-vue-next";
import FiltroForm from "./FiltroForm.vue";
import FiltroRelatedTypes from "./FiltroRelatedTypes.vue";
import FiltroEquipmentTypes from "./FiltroEquipmentTypes.vue";
import FiltroImpactSummary from "./FiltroImpactSummary.vue";
import type { CatalogoFiltroEditorMode, CatalogoFiltroFieldErrors, CatalogoFiltroGuardarInput, CatalogoFiltroItem } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
const props = defineProps<{ open: boolean; mode: CatalogoFiltroEditorMode; item: CatalogoFiltroItem | null; draft: CatalogoFiltroGuardarInput | null; hasChanges: boolean; canSubmit: boolean; canSave: boolean; saving: boolean; fieldErrors: CatalogoFiltroFieldErrors; saveError?: string | null }>();
const emit = defineEmits<{ updateDraft: [draft: CatalogoFiltroGuardarInput]; requestClose: []; cancel: []; submit: []; blurCode: [] }>();
const panelRef = useTemplateRef<HTMLElement>("panel");
const isDesktop = shallowRef(false);
const title = computed(() => props.mode === "crear" ? "Nuevo filtro" : "Detalles");
const action = computed(() => props.mode === "crear" ? "Crear filtro" : "Guardar cambios");
let media: MediaQueryList | null = null; let previousOverflow = "";
function viewport(event?: MediaQueryListEvent): void { isDesktop.value = event?.matches ?? media?.matches ?? false; document.body.style.overflow = props.open && !isDesktop.value ? "hidden" : previousOverflow; }
function keydown(event: KeyboardEvent): void {
  if (!props.open) return;
  if (event.key === "Escape") { if (!props.saving) { event.preventDefault(); emit("requestClose"); } return; }
  if (event.key !== "Tab" || isDesktop.value || !panelRef.value) return;
  const controls = Array.from(panelRef.value.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'));
  const first = controls[0]; const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
onMounted(() => { previousOverflow = document.body.style.overflow; media = window.matchMedia?.("(min-width:1024px)") ?? null; media?.addEventListener("change", viewport); viewport(); window.addEventListener("keydown",keydown); });
onBeforeUnmount(() => { document.body.style.overflow = previousOverflow; media?.removeEventListener("change",viewport); window.removeEventListener("keydown",keydown); });
watch(() => props.open, async (open) => { viewport(); if (open) { await nextTick(); panelRef.value?.querySelector<HTMLElement>("h2")?.focus(); } });
watch(() => props.fieldErrors.codigo, async (error) => { if (error) { await nextTick(); panelRef.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); } });
</script>

<template>
  <Teleport to="body"><div class="fixed inset-0 z-50" :class="open ? 'pointer-events-auto lg:pointer-events-none' : 'pointer-events-none'" @click.self="!saving && emit('requestClose')"><Transition name="filtro-scrim"><div v-if="open" class="absolute inset-0 bg-main-dark/50 lg:hidden" /></Transition><Transition name="filtro-panel"><aside v-if="open" ref="panel" class="pointer-events-auto absolute inset-0 flex min-w-0 flex-col border-l border-gray-200 bg-white shadow-[-12px_0_30px_-18px_rgba(15,23,42,.38)] sm:left-auto sm:right-0 sm:w-[min(420px,100vw)] lg:bottom-0 lg:left-auto lg:right-0 lg:top-[7.4rem] lg:w-[clamp(340px,30vw,420px)]" :role="isDesktop ? undefined : 'dialog'" :aria-modal="isDesktop ? undefined : 'true'" aria-labelledby="filtro-drawer-title" :aria-busy="saving">
    <header class="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4 py-2"><h2 id="filtro-drawer-title" tabindex="-1" class="text-base font-bold text-main">{{ title }}</h2><button type="button" class="grid min-h-11 min-w-11 place-items-center rounded-md text-gray-600 md:min-h-9 md:min-w-9" :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100'" :disabled="saving" aria-label="Cerrar detalles" @click="emit('requestClose')"><X class="h-4 w-4" /></button></header>
    <div v-if="draft" class="flex-1 space-y-6 overflow-y-auto p-4 pb-24"><div v-if="saveError" class="rounded-md border border-danger/30 bg-danger-bg p-3 text-xs text-danger" role="alert">{{ saveError }}</div><FiltroForm :draft="draft" :errors="fieldErrors" :disabled="saving || !canSave" @update-draft="emit('updateDraft',$event)" @blur-code="emit('blurCode')" /><template v-if="mode === 'editar' && item"><hr class="border-gray-200" /><FiltroRelatedTypes :items="item.tiposFiltro" /><FiltroEquipmentTypes :items="item.impacto.tiposEquipo" /><FiltroImpactSummary :impacto="item.impacto" /></template><p v-else class="rounded-md bg-gray-50 p-3 text-xs text-gray-500">Las asociaciones se agregan desde la edición del equipo.</p></div>
    <footer class="sticky bottom-0 z-10 mt-auto grid gap-2 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]" :class="canSave ? 'grid-cols-2' : 'grid-cols-1'"><button type="button" class="min-h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold md:min-h-9 md:text-xs" :class="saving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'" :disabled="saving" @click="emit('cancel')">{{ canSave ? 'Cancelar' : 'Cerrar' }}</button><button v-if="canSave" type="button" class="inline-flex min-h-11 items-center justify-center rounded-md bg-main px-3 text-sm font-semibold text-white md:min-h-9 md:text-xs" :class="saving ? 'cursor-wait opacity-70' : canSubmit ? 'cursor-pointer hover:bg-main-light' : 'cursor-not-allowed opacity-50'" :disabled="!canSubmit || saving" @click="emit('submit')"><span v-if="saving" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />{{ saving ? 'Guardando…' : action }}</button></footer>
  </aside></Transition></div></Teleport>
</template>
<style scoped>.filtro-panel-enter-active,.filtro-panel-leave-active{transition:transform 260ms cubic-bezier(.22,1,.36,1),opacity 180ms ease}.filtro-panel-enter-from,.filtro-panel-leave-to{opacity:0;transform:translateX(100%)}.filtro-scrim-enter-active,.filtro-scrim-leave-active{transition:opacity 180ms ease}.filtro-scrim-enter-from,.filtro-scrim-leave-to{opacity:0}@media(prefers-reduced-motion:reduce){.filtro-panel-enter-active,.filtro-panel-leave-active,.filtro-scrim-enter-active,.filtro-scrim-leave-active{transition-duration:.01ms}}</style>
