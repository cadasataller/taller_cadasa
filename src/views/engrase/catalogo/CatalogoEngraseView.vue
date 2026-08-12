<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import CatalogoEngraseNavigation from "@/components/engrase/catalogo/CatalogoEngraseNavigation.vue";
import CatalogoEngraseSectionShell from "@/components/engrase/catalogo/CatalogoEngraseSectionShell.vue";
import CatalogoTiposFiltroSection from "./CatalogoTiposFiltroSection.vue";
import CatalogoFiltrosSection from "./CatalogoFiltrosSection.vue";
import CatalogoAceitesSection from "./CatalogoAceitesSection.vue";
import CatalogoSistemasSection from "./CatalogoSistemasSection.vue";
import type {
  CatalogoEngraseNavigationItem,
  CatalogoEngraseRouteName,
  CatalogoEngraseSection,
} from "@/stores/dbequipos/engrase/catalogo/catalogoEngrase.types";

const route = useRoute();
const router = useRouter();

const sections = [
  {
    id: "tipos-filtro",
    label: "Tipos de filtro",
    routeName: "CatalogoEngraseTiposFiltro",
  },
  { id: "filtros", label: "Filtros", routeName: "CatalogoEngraseFiltros" },
  { id: "aceites", label: "Aceites", routeName: "CatalogoEngraseAceites" },
  { id: "sistemas", label: "Sistemas", routeName: "CatalogoEngraseSistemas" },
] as const satisfies readonly CatalogoEngraseNavigationItem[];

const sectionByRouteName = Object.fromEntries(
  sections.map((section) => [section.routeName, section.id]),
) as Record<CatalogoEngraseRouteName, CatalogoEngraseSection>;

const activeSection = computed<CatalogoEngraseSection>(
  () =>
    sectionByRouteName[route.name as CatalogoEngraseRouteName] ??
    "tipos-filtro",
);

const activeSectionLabel = computed(
  () =>
    sections.find((section) => section.id === activeSection.value)?.label ??
    "Tipos de filtro",
);

function selectSection(sectionId: CatalogoEngraseSection): void {
  const section = sections.find((item) => item.id === sectionId);
  if (section && section.id !== activeSection.value) {
    void router.push({ name: section.routeName });
  }
}

</script>

<template>
  <main
    class="flex min-h-full min-w-0 flex-col gap-2 bg-second p-2 pb-20 text-gray-700 sm:gap-2.5 sm:p-3 md:pb-4 lg:p-4"
    :class="
      ['tipos-filtro', 'filtros', 'aceites', 'sistemas'].includes(activeSection)
        ? 'lg:h-full lg:overflow-hidden'
        : ''
    "
  >
    <CatalogoEngraseNavigation
      class="lg:shrink-0"
      :items="sections"
      :active-section="activeSection"
      @select-section="selectSection"
    />
    <CatalogoTiposFiltroSection
      v-if="activeSection === 'tipos-filtro'"
      class="lg:min-h-0 lg:overflow-hidden"
    />
    <CatalogoFiltrosSection
      v-else-if="activeSection === 'filtros'"
      class="lg:min-h-0 lg:overflow-hidden"
    />
    <CatalogoAceitesSection
      v-else-if="activeSection === 'aceites'"
      class="lg:min-h-0 lg:overflow-hidden"
    />
    <CatalogoSistemasSection
      v-else-if="activeSection === 'sistemas'"
      class="lg:min-h-0 lg:overflow-hidden"
    />
    <CatalogoEngraseSectionShell v-else :title="activeSectionLabel" />
  </main>
</template>
