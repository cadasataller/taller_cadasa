<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { SlidersHorizontal, X } from "lucide-vue-next";
import type { CatalogoFiltroCompras, CatalogoFiltroEstado, CatalogoTipoFiltroRelacionado } from "@/stores/dbequipos/engrase/catalogo/filtrosCatalogo.types";
defineProps<{ open: boolean; tipoFiltroId: number | null; compras: CatalogoFiltroCompras; estado: CatalogoFiltroEstado; tiposFiltro: readonly CatalogoTipoFiltroRelacionado[]; resultCount: number }>();
const emit = defineEmits<{ close: []; reset: []; updateTipoFiltro: [value: number | null]; updateCompras: [value: CatalogoFiltroCompras]; updateEstado: [value: CatalogoFiltroEstado] }>();
const sheetRef = useTemplateRef<HTMLElement>("sheet");
let previousOverflow = "";
let previousFocus: HTMLElement | null = null;
function keydown(event: KeyboardEvent): void {
  if (event.key === "Escape") { event.preventDefault(); emit("close"); return; }
  if (event.key !== "Tab" || !sheetRef.value) return;
  const controls = Array.from(sheetRef.value.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled])'));
  const first = controls[0]; const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}
onMounted(() => { previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null; previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; window.addEventListener("keydown", keydown); requestAnimationFrame(() => sheetRef.value?.focus()); });
onBeforeUnmount(() => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); previousFocus?.focus(); });
</script>

<template>
  <Teleport to="body"><div v-if="open" class="fixed inset-0 z-[70] bg-main-dark/50 lg:hidden" @click.self="emit('close')"><section ref="sheet" role="dialog" aria-modal="true" aria-labelledby="filters-sheet-title" tabindex="-1" class="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-white outline-none">
    <header class="sticky top-0 flex min-h-14 items-center justify-between border-b border-gray-200 bg-white px-4"><h2 id="filters-sheet-title" class="flex items-center gap-2 text-base font-bold text-main"><SlidersHorizontal class="h-4 w-4" />Filtrar filtros</h2><button type="button" class="grid min-h-11 min-w-11 cursor-pointer place-items-center rounded-md hover:bg-gray-100" aria-label="Cerrar filtros" @click="emit('close')"><X class="h-4 w-4" /></button></header>
    <div class="space-y-5 p-4">
      <label class="block text-sm font-semibold text-gray-800">Tipo de filtro relacionado<select :value="tipoFiltroId ?? ''" class="mt-1.5 min-h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-base font-normal" @change="emit('updateTipoFiltro', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"><option value="">Todos los tipos</option><option v-for="item in tiposFiltro" :key="item.id" :value="item.id">{{ item.nombre }}</option></select></label>
      <label class="block text-sm font-semibold text-gray-800">Estado en lista de compras<select :value="compras" class="mt-1.5 min-h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-base font-normal" @change="emit('updateCompras', ($event.target as HTMLSelectElement).value as CatalogoFiltroCompras)"><option value="todos">Todos</option><option value="en-compras">En compras</option><option value="fuera-compras">Fuera de compras</option></select></label>
      <label class="block text-sm font-semibold text-gray-800">Estado<select :value="estado" class="mt-1.5 min-h-11 w-full cursor-pointer rounded-md border border-gray-300 bg-white px-3 text-base font-normal" @change="emit('updateEstado', ($event.target as HTMLSelectElement).value as CatalogoFiltroEstado)"><option value="activos">Activos</option><option value="desactivados">Desactivados</option><option value="todos">Todos</option></select></label>
    </div>
    <footer class="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"><button type="button" class="min-h-11 cursor-pointer rounded-md border border-gray-300 text-sm font-semibold" @click="emit('reset')">Restablecer</button><button type="button" class="min-h-11 cursor-pointer rounded-md bg-main text-sm font-semibold text-white" @click="emit('close')">Ver {{ new Intl.NumberFormat('es').format(resultCount) }} resultados</button></footer>
  </section></div></Teleport>
</template>
