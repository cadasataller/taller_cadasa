<script setup lang="ts">
import { Activity, ClipboardList, Image, Layers, CheckCircle2, Clock3 } from "lucide-vue-next";
import { computed } from "vue";
import type { CrearEquipoDraft } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

const props = defineProps<{ draft: CrearEquipoDraft }>();

const configurationLabel = computed(() => {
  const { etapas } = props.draft.datos;
  const { filtros, aceites } = props.draft;
  return `${etapas.length} ${etapas.length === 1 ? "etapa" : "etapas"} · ${filtros.length} ${filtros.length === 1 ? "filtro" : "filtros"} · ${aceites.length} ${aceites.length === 1 ? "aceite" : "aceites"}`;
});

const isActive = computed(() => props.draft.datos.estado === "activo");
</script>

<template>
  <section class="mt-3 overflow-hidden rounded-xl border border-main/10 bg-gradient-to-br from-main/5 via-white to-second text-xs">
    <h3 class="sr-only">Resumen de creación</h3>
    <div class="grid divide-y divide-second-deep sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-[1.2fr_1.45fr_.82fr_1.1fr]">
      <div class="flex min-w-0 items-center gap-2.5 p-2.5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-main/10 text-main">
          <ClipboardList class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs text-gray-600">Equipo</p>
          <p class="truncate font-mono text-base font-bold leading-5 text-gray-900">{{ draft.datos.codigo || "Sin código" }}</p>
          <p class="truncate text-xs text-gray-700">{{ draft.datos.tipoEquipo?.nombre || "Sin tipo" }} · {{ draft.datos.subtipo || "Sin modelo" }}</p>
        </div>
      </div>

      <div class="flex min-w-0 items-center gap-2.5 p-2.5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-main/10 text-main">
          <Layers class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs text-gray-600">Configuración</p>
          <p class="text-sm font-semibold leading-4 text-gray-900">{{ configurationLabel }}</p>
        </div>
      </div>

      <div class="flex min-w-0 items-center gap-2.5 p-2.5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-main/10 text-main">
          <Activity class="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p class="text-xs text-gray-600">Estado</p>
          <span class="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold" :class="isActive ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'">
            <CheckCircle2 v-if="isActive" class="h-3.5 w-3.5" aria-hidden="true" />
            {{ isActive ? "Activo" : "Descartado" }}
          </span>
        </div>
      </div>

      <div class="flex min-w-0 items-center gap-2.5 p-2.5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-dashed border-warning/60 bg-warning-bg text-warning">
          <Image class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs text-gray-600">Imagen</p>
          <span class="mt-1 inline-flex items-center gap-1 rounded-md bg-warning-bg px-2 py-1 text-xs font-semibold text-warning">
            <Clock3 class="h-3.5 w-3.5" aria-hidden="true" /> Pendiente
          </span>
          <p class="mt-0.5 text-xs leading-4 text-gray-600">Se podrá agregar en el siguiente paso.</p>
        </div>
      </div>
    </div>
  </section>
</template>
