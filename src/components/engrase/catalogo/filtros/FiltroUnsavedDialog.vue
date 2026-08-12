<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { AlertTriangle } from "lucide-vue-next";
const emit = defineEmits<{ cancel: []; discard: [] }>();
const dialogRef = useTemplateRef<HTMLElement>("dialog"); let previousFocus: HTMLElement | null = null;
function keydown(event: KeyboardEvent): void {
  if (event.key === "Escape") { event.preventDefault(); emit("cancel"); return; }
  if (event.key !== "Tab" || !dialogRef.value) return;
  const controls = Array.from(dialogRef.value.querySelectorAll<HTMLElement>("button"));
  const first = controls[0]; const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
onMounted(() => { previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null; window.addEventListener("keydown",keydown); requestAnimationFrame(() => dialogRef.value?.querySelector<HTMLElement>("button")?.focus()); });
onBeforeUnmount(() => { window.removeEventListener("keydown",keydown); previousFocus?.focus(); });
</script>
<template><Teleport to="body"><div class="fixed inset-0 z-[85] grid place-items-center bg-main-dark/55 p-4" @click.self="emit('cancel')"><section ref="dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-filter-title" class="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"><AlertTriangle class="h-6 w-6 text-amber-600" /><h2 id="unsaved-filter-title" class="mt-3 text-base font-bold text-gray-900">¿Descartar cambios?</h2><p class="mt-2 text-sm text-gray-600">Los cambios del filtro no se han guardado.</p><div class="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" class="min-h-11 cursor-pointer rounded-md border border-gray-300 text-sm font-semibold" @click="emit('cancel')">Seguir editando</button><button type="button" class="min-h-11 cursor-pointer rounded-md bg-danger px-3 text-sm font-semibold text-white" @click="emit('discard')">Descartar cambios</button></div></section></div></Teleport></template>
