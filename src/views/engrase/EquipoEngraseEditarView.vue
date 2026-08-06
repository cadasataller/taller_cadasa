<script setup lang="ts">
import { AlertTriangle, RefreshCw } from "lucide-vue-next";
import EquipoEdicionShell from "@/components/engrase/edicion/EquipoEdicionShell.vue";
import EquipoDatosForm from "@/components/engrase/edicion/datos/EquipoDatosForm.vue";
import EquipoTipoNuevoOverlay from "@/components/engrase/edicion/datos/EquipoTipoNuevoOverlay.vue";
import { useEquipoEngraseEditor } from "@/composables/engrase/useEquipoEngraseEditor";
const editor = useEquipoEngraseEditor();
</script>
<template>
  <div class="h-full overflow-auto bg-second">
    <div
      v-if="editor.loading.value"
      class="grid min-h-full place-items-center p-3"
      role="status"
    >
      <p
        class="rounded-md bg-white px-4 py-3 text-xs font-semibold text-gray-700 shadow-sm"
      >
        Cargando editor…
      </p>
    </div>
    <div
      v-else-if="editor.loadError.value"
      class="grid min-h-full place-items-center p-3"
      role="alert"
    >
      <section
        class="w-full max-w-md rounded-lg border border-danger/30 bg-white p-4 shadow-sm"
      >
        <AlertTriangle class="h-5 w-5 text-danger" aria-hidden="true" />
        <h1 class="mt-2 text-base font-bold text-gray-900">
          No se pudo abrir el equipo
        </h1>
        <p class="mt-1 text-xs leading-5 text-gray-600">
          {{ editor.loadError.value.mensaje }}
        </p>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            class="min-h-11 cursor-pointer rounded-md border border-gray-300 px-3 text-xs font-semibold"
            @click="editor.volver"
          >
            Volver a equipos</button
          ><button
            type="button"
            class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md bg-main px-3 text-xs font-semibold text-white"
            @click="editor.reintentar"
          >
            <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" />Reintentar
          </button>
        </div>
      </section>
    </div>
    <EquipoEdicionShell
      v-else-if="editor.draft.value"
      :draft="editor.draft.value"
      :stages-count="editor.activeStagesCount.value"
      :filters-count="editor.activeFiltersCount.value"
      :oils-count="editor.activeOilsCount.value"
      :can-save="editor.canSave.value"
      :saving="editor.saving.value"
      @back="editor.volver"
      @cancel="editor.volver"
    >
      <template #datos>
        <EquipoDatosForm
          v-if="editor.auxiliares.value"
          :draft="editor.draft.value"
          :auxiliares="editor.auxiliares.value"
          @update-codigo="editor.actualizarCodigo"
          @select-tipo-equipo="editor.seleccionarTipoEquipo"
          @update-subtipo="editor.actualizarSubtipo"
          @update-estado="editor.actualizarEstado"
          @add-etapa="editor.agregarEtapa"
          @remove-etapa="editor.quitarEtapa"
          @open-new-type="editor.abrirNuevoTipoEquipo"
        />
      </template>
      <template #overlay
        ><div
          v-if="editor.activeOverlay.value === 'confirmar_salida'"
          class="fixed inset-0 z-50 grid place-items-center bg-main-dark/40 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discard-title"
        >
          <section class="w-full max-w-sm rounded-lg bg-white p-4 shadow-2xl">
            <AlertTriangle class="h-5 w-5 text-warning" aria-hidden="true" />
            <h2 id="discard-title" class="mt-2 text-sm font-bold text-gray-900">
              Descartar cambios sin guardar
            </h2>
            <p class="mt-1 text-xs leading-5 text-gray-600">
              Tus cambios locales se perderán.
            </p>
            <div
              class="mt-4 flex flex-col-reverse gap-1.5 sm:flex-row sm:justify-end"
            >
              <button
                type="button"
                class="min-h-11 cursor-pointer rounded-md border border-gray-300 px-3 text-xs font-semibold"
                @click="editor.continuarEditando"
              >
                Seguir editando</button
              ><button
                type="button"
                class="min-h-11 cursor-pointer rounded-md bg-danger px-3 text-xs font-semibold text-white"
                @click="editor.descartarYVolver"
              >
                Descartar cambios
              </button>
            </div>
          </section>
        </div>
        <EquipoTipoNuevoOverlay
          v-if="editor.activeOverlay.value === 'nuevo_tipo_equipo'"
          :duplicate="editor.esTipoEquipoDuplicado"
          @close="editor.continuarEditando"
          @create-and-select="editor.crearYSeleccionarTipoEquipo($event) && editor.continuarEditando()"
        />
      </template
      >
    </EquipoEdicionShell>
  </div>
</template>
