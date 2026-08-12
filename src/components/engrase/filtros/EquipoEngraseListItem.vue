<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import EquipoEngraseThumbnail from "./EquipoEngraseThumbnail.vue";
import type { EquipoEngraseListItem } from "@/stores/dbequipos/engrase/filtrosEngrase.types";

const props = defineProps<{
  equipo: EquipoEngraseListItem;
  selected: boolean;
}>();
const emit = defineEmits<{
  select: [number];
  imageVisible: [number];
}>();
const card = useTemplateRef<HTMLButtonElement>("card");
let observer: IntersectionObserver | null = null;

function necesitaImagen(): boolean {
  return Boolean(
    props.equipo.tiene_imagen_main &&
      props.equipo.main_storage_path &&
      !props.equipo.imageUrl,
  );
}

function observar(): void {
  if (!card.value || !necesitaImagen()) return;
  if (typeof IntersectionObserver === "undefined") {
    emit("imageVisible", props.equipo.id);
    return;
  }
  observer?.disconnect();
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      emit("imageVisible", props.equipo.id);
      observer?.disconnect();
      observer = null;
    },
    { threshold: 0.01 },
  );
  observer.observe(card.value);
}

onMounted(observar);
watch(
  () => [props.equipo.main_storage_path, props.equipo.imageUrl] as const,
  ([path, imageUrl], [previousPath, previousImageUrl]) => {
    if (
      path &&
      !imageUrl &&
      (path !== previousPath || imageUrl !== previousImageUrl)
    ) {
      observar();
    }
  },
);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <button
    ref="card"
    type="button"
    class="flex w-full items-center gap-2 rounded-md border bg-white p-2 text-left transition hover:border-main/40"
    :class="selected ? 'border-main bg-main/5' : 'border-gray-200'"
    :aria-pressed="selected"
    @click="emit('select', equipo.id)"
  >
    <EquipoEngraseThumbnail :src="equipo.imageUrl" :alt="equipo.codigo" />
    <span class="min-w-0 flex-1 text-xs text-gray-600">
      <strong class="block font-mono text-sm text-main">
        {{ equipo.codigo }}
      </strong>
      <span class="block truncate">{{ equipo.tipo_equipo }}</span>
      <small class="block break-words whitespace-normal text-xs leading-4 text-gray-500">
        Modelo: {{ equipo.subtipo || "Sin modelo" }}
      </small>
    </span>
  </button>
</template>
