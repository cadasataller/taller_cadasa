<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import EquipoCreacionShell from "@/components/engrase/creacion/EquipoCreacionShell.vue";
import EquipoCreacionLoadingState from "@/components/engrase/creacion/EquipoCreacionLoadingState.vue";
import EquipoCreacionErrorState from "@/components/engrase/creacion/EquipoCreacionErrorState.vue";
import EquipoCreacionExitDialog from "@/components/engrase/creacion/EquipoCreacionExitDialog.vue";
import EquipoCreacionDatosStep from "@/components/engrase/creacion/datos/EquipoCreacionDatosStep.vue";
import EquipoCreacionFiltrosStep from "@/components/engrase/creacion/filtros/EquipoCreacionFiltrosStep.vue";
import EquipoCreacionAceitesStep from "@/components/engrase/creacion/aceites/EquipoCreacionAceitesStep.vue";
import EquipoCreacionRevisionStep from "@/components/engrase/creacion/revision/EquipoCreacionRevisionStep.vue";
import EquipoCreacionImagenStep from "@/components/engrase/creacion/imagen/EquipoCreacionImagenStep.vue";
import { useEquipoEngraseCreacionWizard } from "@/composables/engrase/useEquipoEngraseCreacionWizard";
import { useCrearEquipoImagen } from "@/composables/engrase/useCrearEquipoImagen";
import { useEquipoEngraseCreacionStore } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store";

const router = useRouter();
const wizard = useEquipoEngraseCreacionWizard();
const store = useEquipoEngraseCreacionStore();
const {
  draft,
  auxiliares,
  pasoActual,
  completedSteps,
  validationErrors,
  activeOverlay,
  isReady,
  errorInicial,
  isCreating,
  canGoNext,
  canSubmitCreation,
  isInteractionLocked,
} = storeToRefs(store);
const imagen = useCrearEquipoImagen();
const editor = shallowRef<"filtro" | "aceite" | null>(null);
const filtroCodigo = shallowRef("");
const filtroCantidad = shallowRef(1);
const filtroTipo = shallowRef<number | null>(null);
const aceiteSistema = shallowRef<number | null>(null);
const aceiteId = shallowRef<number | null>(null);
const erroresPaso = computed(() =>
  validationErrors.value
    .filter((error) => error.paso === pasoActual.value)
    .map((error) => error.mensaje),
);
const puedeAvanzar = computed(() =>
  pasoActual.value === 4 ? canSubmitCreation.value : canGoNext.value,
);
function cerrarEditor(): void {
  editor.value = null;
}
function agregarFiltro(): void {
  const tipo = auxiliares.value?.tiposFiltro.find(
    (item) => item.id === filtroTipo.value,
  );
  if (!tipo || !filtroCodigo.value.trim()) return;
  const filtro = store.crearFiltroTemporal(filtroCodigo.value, false);
  if (!filtro) return;
  if (
    store.agregarFiltroTemporal({
      filtro,
      tipoFiltro: {
        estado: "existente",
        id: tipo.id,
        tempId: null,
        nombre: tipo.nombre,
      },
      cantidad: filtroCantidad.value,
    }).ok
  )
    cerrarEditor();
}
function agregarAceite(): void {
  const sistema = auxiliares.value?.sistemasAceite.find(
    (item) => item.id === aceiteSistema.value,
  );
  const aceite = auxiliares.value?.aceites.find(
    (item) => item.id === aceiteId.value,
  );
  if (!sistema || !aceite) return;
  if (
    store.agregarAceite({
      sistema: {
        estado: "existente",
        id: sistema.id,
        tempId: null,
        nombre: sistema.nombre,
      },
      aceite: {
        estado: "existente",
        id: aceite.id,
        tempId: null,
        nombre: aceite.nombre,
      },
    }).ok
  )
    cerrarEditor();
}
async function crear(): Promise<void> {
  await store.crearEquipo();
}
async function terminar(): Promise<void> {
  const resultado = imagen.finalizarCreacion();
  if (resultado.ok) {
    imagen.resetDespuesDeFinalizar();
    await router.push({ name: "FiltrosEngrase" });
  }
}
async function omitir(): Promise<void> {
  const resultado = imagen.omitirImagen();
  if (resultado.ok) {
    imagen.resetDespuesDeFinalizar();
    await router.push({ name: "FiltrosEngrase" });
  }
}
async function guardarImagen(): Promise<void> {
  await imagen.guardarImagen();
}
</script>
<template>
  <EquipoCreacionLoadingState v-if="!isReady && !errorInicial" />
  <EquipoCreacionErrorState
    v-else-if="errorInicial"
    :message="errorInicial.mensaje"
    @back="wizard.volverAlListado"
    @retry="wizard.reintentarCargaInicial"
  />
  <EquipoCreacionShell
    v-else-if="auxiliares"
    :step="pasoActual"
    :completed="completedSteps"
    :created="Boolean(draft.equipoCreado)"
    :creating="isCreating"
    :can-open="store.puedeAbrirPaso"
    :next-disabled="!puedeAvanzar"
    :image-saving="imagen.isImageProcessing.value"
    :can-save-image="imagen.canSaveImage.value"
    :can-finish="imagen.canFinishWizard.value"
    @back="wizard.volverAlListado"
    @go="store.irAPaso"
    @cancel="wizard.volverAlListado"
    @previous="store.retroceder"
    @next="store.avanzar"
    @create="crear"
    @save-image="guardarImagen"
    @skip="omitir"
    @finish="terminar"
  >
    <div class="pb-5" aria-live="polite">
      <span class="sr-only">Paso {{ pasoActual }} de 5</span>
      <EquipoCreacionDatosStep
        v-if="pasoActual === 1"
        :draft="draft"
        :auxiliares="auxiliares"
        :disabled="isInteractionLocked"
        :can-validate="store.canValidateCode"
        :validating="store.isValidatingCode"
        :errors="erroresPaso"
        @codigo="store.actualizarCodigo"
        @validate="store.validarCodigoActual"
        @tipo="store.seleccionarTipoEquipo"
        @subtipo="store.actualizarSubtipo"
        @estado="store.actualizarEstado"
        @add-etapa="store.agregarEtapa"
        @remove-etapa="store.quitarEtapa"
      />
      <EquipoCreacionFiltrosStep
        v-else-if="pasoActual === 2"
        :filtros="draft.filtros"
        :disabled="isInteractionLocked"
        :errors="erroresPaso"
        @add="editor = 'filtro'"
        @edit="editor = 'filtro'"
        @remove="store.quitarFiltro"
      />
      <EquipoCreacionAceitesStep
        v-else-if="pasoActual === 3"
        :aceites="draft.aceites"
        :disabled="isInteractionLocked"
        :errors="erroresPaso"
        @add="editor = 'aceite'"
        @edit="editor = 'aceite'"
        @remove="store.quitarAceite"
      />
      <EquipoCreacionRevisionStep
        v-else-if="pasoActual === 4"
        :draft="draft"
        :errors="erroresPaso"
        :creating="isCreating"
      />
      <EquipoCreacionImagenStep
        v-else
        :preview-url="imagen.preparedImage.value?.previewUrl ?? null"
        :state="imagen.imageState.value"
        :has-image="imagen.hasRegisteredImage.value"
        :warning="imagen.localWarning.value"
        @select="imagen.seleccionarImagen"
        @retry-cleanup="imagen.reintentarLimpiezaImagen"
      />
    </div>
  </EquipoCreacionShell>
  <EquipoCreacionExitDialog
    v-if="activeOverlay?.kind === 'confirmar_salida'"
    @continue="store.continuarCreando"
    @discard="wizard.confirmarDescarteYVolver"
  />
  <div
    v-if="editor"
    class="fixed inset-0 z-50 grid place-items-end bg-main-dark/40 p-3 sm:place-items-center"
    role="dialog"
    aria-modal="true"
  >
    <section class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
      <h2 class="font-bold">
        {{ editor === "filtro" ? "Agregar filtro" : "Agregar aceite" }}
      </h2>
      <div v-if="editor === 'filtro'" class="mt-3 grid gap-3">
        <input
          v-model="filtroCodigo"
          class="min-h-10 rounded border px-2"
          placeholder="Código de filtro"
        /><select v-model="filtroTipo" class="min-h-10 rounded border px-2">
          <option :value="null">Tipo de filtro…</option>
          <option
            v-for="tipo in auxiliares?.tiposFiltro"
            :key="tipo.id"
            :value="tipo.id"
          >
            {{ tipo.nombre }}
          </option></select
        ><input
          v-model.number="filtroCantidad"
          type="number"
          min="1"
          class="min-h-10 rounded border px-2"
        />
      </div>
      <div v-else class="mt-3 grid gap-3">
        <select v-model="aceiteSistema" class="min-h-10 rounded border px-2">
          <option :value="null">Sistema…</option>
          <option
            v-for="sistema in auxiliares?.sistemasAceite"
            :key="sistema.id"
            :value="sistema.id"
          >
            {{ sistema.nombre }}
          </option></select
        ><select v-model="aceiteId" class="min-h-10 rounded border px-2">
          <option :value="null">Aceite…</option>
          <option
            v-for="aceite in auxiliares?.aceites"
            :key="aceite.id"
            :value="aceite.id"
          >
            {{ aceite.nombre }}
          </option>
        </select>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          class="min-h-10 rounded border px-3 text-xs font-bold"
          @click="cerrarEditor"
        >
          Cancelar</button
        ><button
          class="min-h-10 rounded bg-main px-3 text-xs font-bold text-white"
          @click="editor === 'filtro' ? agregarFiltro() : agregarAceite()"
        >
          Agregar
        </button>
      </div>
    </section>
  </div>
</template>
