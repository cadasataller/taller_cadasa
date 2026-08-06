<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from "vue";
import { X } from "lucide-vue-next";
import EquipoTipoNuevoForm from "./EquipoTipoNuevoForm.vue";
const props = defineProps<{ duplicate: (nombre: string) => boolean }>();
const emit = defineEmits<{ close: []; createAndSelect: [string] }>();
const dirty = shallowRef(false);
function cerrar(): void {
  if (
    !dirty.value ||
    window.confirm("Se perderá el nombre escrito. ¿Continuar?")
  )
    emit("close");
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") cerrar();
}
onMounted(() => {
  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
});
</script>
<template>
  <Teleport to="body"
    ><div class="fixed inset-0 z-50 bg-main-dark/40" @click.self="cerrar">
      <aside
        class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-lg bg-white p-4 shadow-xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[26rem] lg:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-tipo-title"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-main">Catálogo temporal</p>
            <h2 id="nuevo-tipo-title" class="text-base font-bold text-gray-900">
              Nuevo tipo de equipo
            </h2>
          </div>
          <button
            type="button"
            class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Cerrar"
            @click="cerrar"
          >
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <EquipoTipoNuevoForm
          :duplicate="duplicate"
          @cancel="cerrar"
          @create-and-select="emit('createAndSelect', $event)"
        />
      </aside></div
  ></Teleport>
</template>
