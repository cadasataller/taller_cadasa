<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import type {
  CatalogoEngraseNavigationItem,
  CatalogoEngraseSection,
} from "@/stores/dbequipos/engrase/catalogo/catalogoEngrase.types";

defineProps<{
  items: readonly CatalogoEngraseNavigationItem[];
  activeSection: CatalogoEngraseSection;
}>();

const emit = defineEmits<{
  selectSection: [section: CatalogoEngraseSection];
}>();

function handleMobileSelection(event: Event): void {
  const target = event.target as HTMLSelectElement;
  emit("selectSection", target.value as CatalogoEngraseSection);
}
</script>

<template>
  <nav
    class="rounded-lg border border-gray-200 bg-white shadow-sm"
    aria-label="Secciones del catálogo de engrase"
  >
    <div class="p-3 sm:hidden">
      <label
        for="catalogo-engrase-section"
        class="mb-1.5 block text-xs font-semibold text-main"
      >
        Sección del catálogo
      </label>
      <div class="relative">
        <select
          id="catalogo-engrase-section"
          :value="activeSection"
          class="min-h-11 w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white px-3 pr-10 text-sm font-semibold text-gray-700 outline-none transition-colors duration-150 hover:border-main/60 focus:border-main focus:ring-2 focus:ring-main/15"
          @change="handleMobileSelection"
        >
          <option v-for="item in items" :key="item.id" :value="item.id">
            {{ item.label }}
          </option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-main"
          aria-hidden="true"
        />
      </div>
    </div>

    <div class="hidden min-w-0 grid-cols-4 border-b border-gray-100 px-2 sm:grid">
      <RouterLink
        v-for="item in items"
        :key="item.id"
        :to="{ name: item.routeName }"
        class="relative flex min-h-10 cursor-pointer items-center justify-center rounded-t-md px-2 text-center text-xs font-semibold text-gray-600 transition-colors duration-150 hover:bg-main/5 hover:text-main focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-main"
        :class="activeSection === item.id ? 'bg-main/5 text-main' : ''"
        :aria-current="activeSection === item.id ? 'page' : undefined"
      >
        {{ item.label }}
        <span
          v-if="activeSection === item.id"
          class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-main"
          aria-hidden="true"
        />
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  select,
  a {
    transition-duration: 0.01ms;
  }
}
</style>
