<script setup lang="ts">
import { BarChart3, Construction, UsersRound } from "lucide-vue-next";
import type {
  EquipmentListItem,
  ReportTab,
} from "@/stores/dashboard/reporte-equipos/reporteEquipos.types";

defineProps<{
  activeTab: ReportTab;
  selectedEquipment: EquipmentListItem | null;
}>();

const tabCopy: Record<
  ReportTab,
  { title: string; text: string; icon: typeof BarChart3 }
> = {
  resumen: {
    title: "Resumen del equipo",
    text: "La fase 2 incorporará métricas, clasificación, paradas, implementos e historial.",
    icon: BarChart3,
  },
  paradas: {
    title: "Análisis de paradas",
    text: "La fase 3 incorporará KPIs, motivos y el detalle de paradas.",
    icon: Construction,
  },
  operadores: {
    title: "Uso por operadores",
    text: "La fase 4 incorporará participación, detalle de operador e historial.",
    icon: UsersRound,
  },
};
</script>

<template>
  <section
    id="equipment-report-center"
    class="grid min-h-0 place-items-center overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-sm"
  >
    <div class="max-w-sm px-6 py-10 text-center">
      <component
        :is="tabCopy[activeTab].icon"
        class="mx-auto size-7 text-main"
        aria-hidden="true"
      />
      <p
        class="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-accent"
      >
        {{
          selectedEquipment ? selectedEquipment.code : "Sin equipo seleccionado"
        }}
      </p>
      <h2 class="mt-1 text-base font-bold text-gray-800">
        {{ tabCopy[activeTab].title }}
      </h2>
      <p class="mt-2 text-xs leading-5 text-gray-500">
        {{ tabCopy[activeTab].text }}
      </p>
    </div>
  </section>
</template>
