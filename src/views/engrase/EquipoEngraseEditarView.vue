<script setup lang="ts">
import { AlertTriangle, RefreshCw } from "lucide-vue-next";
import { computed, shallowRef } from "vue";
import EquipoEdicionShell from "@/components/engrase/edicion/EquipoEdicionShell.vue";
import EquipoDatosForm from "@/components/engrase/edicion/datos/EquipoDatosForm.vue";
import EquipoFiltrosSection from "@/components/engrase/edicion/filtros/EquipoFiltrosSection.vue";
import EquipoFiltroOverlay from "@/components/engrase/edicion/filtros/EquipoFiltroOverlay.vue";
import EquipoAceitesSection from "@/components/engrase/edicion/aceites/EquipoAceitesSection.vue";
import EquipoAceiteOverlay from "@/components/engrase/edicion/aceites/EquipoAceiteOverlay.vue";
import EquipoImagenTrigger from "@/components/engrase/edicion/imagen/EquipoImagenTrigger.vue";
import EquipoImagenOverlay from "@/components/engrase/edicion/imagen/EquipoImagenOverlay.vue";
import type { CatalogoAceiteDraftReference, EquipoAceiteFormMode, FiltroExistenteDraftReference, FiltroNuevoDraftReference, ResultadoFiltroEncontrado, TipoFiltroDraftReference } from "@/stores/dbequipos/engrase/edicion/equipoEngraseEdicion.types";
import { useEquipoEngraseEditor } from "@/composables/engrase/useEquipoEngraseEditor";
import { useEquipoImagenManager } from "@/composables/engrase/useEquipoImagenManager";
const editor = useEquipoEngraseEditor();
const imagenManager = useEquipoImagenManager();
const filtroOverlay = shallowRef<"add" | "edit" | null>(null);
const filtroEditadoId = shallowRef<string | null>(null);
const errorAgregarFiltro = shallowRef<string | null>(null);
const aceiteOverlay = shallowRef<EquipoAceiteFormMode | null>(null);
const errorAceite = shallowRef<string | null>(null);
const imagenOverlay = shallowRef(false);
const erroresPorSeccion = (seccion: "datos" | "etapas" | "filtros" | "aceites") => computed(() => editor.validationErrors.value.filter((error) => error.seccion === seccion));
const erroresDatos = erroresPorSeccion("datos");
const erroresEtapas = erroresPorSeccion("etapas");
const erroresFiltros = erroresPorSeccion("filtros");
const erroresAceites = erroresPorSeccion("aceites");
const mensajeGuardado = computed(() => editor.saveError.value?.mensaje ?? editor.successMessage.value);
const tipoMensajeGuardado = computed<"error" | "success" | "partial" | null>(() => {
  if (editor.saveError.value) return "error";
  if (!editor.successMessage.value) return null;
  return editor.imagenSyncState.value.kind === "move_pending" ? "partial" : "success";
});
const filtroEditado = computed(() => editor.draft.value?.filtros.find((filtro) => filtro.draftId === filtroEditadoId.value));
const tiposOcupados = computed(() => editor.draft.value?.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion" && filtro.draftId !== filtroEditadoId.value).map((filtro) => filtro.tipoFiltro.id) ?? []);
const filtrosOcupadosId = computed(() => editor.draft.value?.filtros.flatMap((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion" && filtro.filtroReferencia.estado === "existente" ? [filtro.filtroReferencia.id] : []) ?? []);
const filtrosOcupadosCodigo = computed(() => editor.draft.value?.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion").map((filtro) => filtro.filtroReferencia.codigo) ?? []);
const sugerenciasBorrador = computed(() => editor.draft.value?.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion").map((filtro) => ({ id: filtro.filtroReferencia.estado === "existente" ? filtro.filtroReferencia.id : null, codigo: filtro.filtroReferencia.codigo, estaEnListaCompras: filtro.filtroReferencia.estaEnListaCompras })) ?? []);
const nombresTiposActivos = computed(() => editor.draft.value?.filtros.filter((filtro) => filtro.estadoOperacion !== "pendiente_eliminacion").map((filtro) => filtro.tipoFiltroReferencia.nombre) ?? []);
const filtrosPendientesClave = computed(() => editor.draft.value?.filtros.filter((filtro) => filtro.estadoOperacion === "pendiente_eliminacion").map((filtro) => `${filtro.filtro.id}:${filtro.tipoFiltro.id}`) ?? []);
function cerrarFiltroOverlay(): void { filtroOverlay.value = null; filtroEditadoId.value = null; errorAgregarFiltro.value = null; }
function abrirAgregarFiltro(): void { errorAgregarFiltro.value = null; filtroOverlay.value = "add"; }
function agregarFiltroDesdeOverlay(resultado: ResultadoFiltroEncontrado, cantidad: number, tipoId: number): void {
  const tipo = editor.auxiliares.value?.tiposFiltro.find((item) => item.id === tipoId);
  if (!tipo) return;
  const agregado = editor.agregarFiltroExistente({ filtro: resultado.filtro, tipoFiltro: { id: tipo.id, nombre: tipo.nombre }, cantidad });
  if (agregado) cerrarFiltroOverlay();
  else errorAgregarFiltro.value = "Este filtro ya está asignado al equipo."
}
function agregarFiltroTemporalDesdeOverlay(filtro: FiltroNuevoDraftReference | FiltroExistenteDraftReference, tipoFiltro: TipoFiltroDraftReference, cantidad: number): void {
  if (editor.agregarFiltroTemporal({ filtro, tipoFiltro, cantidad })) cerrarFiltroOverlay();
  else errorAgregarFiltro.value = "Ya existe una asignación activa para este tipo de filtro."
}
const aceiteEditado = computed(() => {
  const modo = aceiteOverlay.value;
  return modo?.kind === "edit" ? editor.draft.value?.aceites.find((aceite) => aceite.draftId === modo.draftId) : undefined;
});
function conflictoSistemaAceite(sistema: CatalogoAceiteDraftReference): boolean {
  const modo = aceiteOverlay.value;
  return editor.draft.value?.aceites.some((aceite) => aceite.estadoOperacion !== "pendiente_eliminacion" && aceite.draftId !== (modo?.kind === "edit" ? modo.draftId : undefined) && (sistema.estado === "existente" ? aceite.sistemaReferencia.estado === "existente" && aceite.sistemaReferencia.id === sistema.id : aceite.sistemaReferencia.estado === "nuevo" && aceite.sistemaReferencia.tempId === sistema.tempId)) ?? false;
}
function confirmarAceite(sistema: CatalogoAceiteDraftReference, aceite: CatalogoAceiteDraftReference): void {
  const modo = aceiteOverlay.value;
  if (!modo) return;
  const aplicado = modo.kind === "add" ? editor.agregarAceite({ sistema, aceite }) : editor.actualizarAceite({ draftId: modo.draftId, sistema, aceite });
  if (aplicado) { aceiteOverlay.value = null; errorAceite.value = null; } else errorAceite.value = "Este equipo ya tiene un aceite asociado a ese sistema.";
}
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
      :message="mensajeGuardado"
      :message-kind="tipoMensajeGuardado"
      :validation-count="editor.validationErrors.value.length"
      :move-pending="editor.imagenSyncState.value.kind === 'move_pending'"
      @back="editor.volver"
      @cancel="editor.volver"
      @save="editor.guardar(imagenManager.moverDespuesDeCambioCodigo)"
      @retry-image="imagenManager.reintentarMovimiento"
    >
      <template #datos>
        <div v-if="editor.validationErrors.value.length > 1" class="rounded-md border border-danger bg-danger-bg p-3 text-xs text-danger" role="alert" tabindex="-1" data-validation-section="general">
          <p class="font-bold">Hay {{ editor.validationErrors.value.length }} errores por corregir:</p>
          <ul class="mt-1 list-disc space-y-1 pl-4"><li v-for="error in editor.validationErrors.value" :key="`${error.codigo}-${error.mensaje}`">{{ error.mensaje }}</li></ul>
        </div>
        <EquipoImagenTrigger :src="imagenManager.urlActual.value" :tiene-imagen="imagenManager.tieneImagen.value" :disabled="imagenManager.bloqueado.value" @open="imagenOverlay = true" />
        <div data-validation-section="datos" tabindex="-1">
          <p v-for="error in [...erroresDatos, ...erroresEtapas]" :key="`${error.codigo}-${error.mensaje}`" class="mb-2 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger" role="alert">{{ error.mensaje }}</p>
          <EquipoDatosForm
          v-if="editor.auxiliares.value"
          :draft="editor.draft.value"
          :auxiliares="editor.auxiliares.value"
          :is-duplicate-tipo-equipo="editor.esTipoEquipoDuplicado"
          @update-codigo="editor.actualizarCodigo"
          @select-tipo-equipo="editor.seleccionarTipoEquipo"
          @update-subtipo="editor.actualizarSubtipo"
          @update-estado="editor.actualizarEstado"
          @add-etapa="editor.agregarEtapa"
          @remove-etapa="editor.quitarEtapa"
          @create-tipo-equipo="editor.crearYSeleccionarTipoEquipo"
        /></div>
      </template>
      <template #filtros>
        <div data-validation-section="filtros" tabindex="-1">
          <p v-for="error in erroresFiltros" :key="`${error.codigo}-${error.mensaje}`" class="mb-2 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger" role="alert">{{ error.mensaje }}</p>
          <EquipoFiltrosSection
          :filtros="editor.draft.value.filtros"
          :active-count="editor.activeFiltersCount.value"
          @add="abrirAgregarFiltro"
          @edit="(draftId) => { filtroEditadoId = draftId; filtroOverlay = 'edit' }"
          @remove="editor.marcarFiltroParaEliminar"
          @undo="editor.deshacerEliminacionFiltro"
        /></div>
      </template>
      <template #aceites>
        <div data-validation-section="aceites" tabindex="-1">
          <p v-for="error in erroresAceites" :key="`${error.codigo}-${error.mensaje}`" class="mb-2 rounded-md bg-danger-bg px-3 py-2 text-xs text-danger" role="alert">{{ error.mensaje }}</p>
          <EquipoAceitesSection :aceites="editor.draft.value.aceites" :active-count="editor.activeOilsCount.value" @add="aceiteOverlay = { kind: 'add' }" @edit="(draftId) => aceiteOverlay = { kind: 'edit', draftId }" @remove="editor.marcarAceiteParaEliminar" @undo="editor.deshacerEliminacionAceite" />
        </div>
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
        <EquipoFiltroOverlay
          v-if="filtroOverlay && editor.auxiliares.value"
          :mode="filtroOverlay"
          :filtro="filtroEditado"
          :tipos="editor.auxiliares.value.tiposFiltro"
          :occupied-type-ids="tiposOcupados"
          :occupied-filter-ids="filtrosOcupadosId"
          :occupied-filter-codes="filtrosOcupadosCodigo"
          :draft-suggestions="sugerenciasBorrador"
          :active-type-names="nombresTiposActivos"
          :pending-filter-type-keys="filtrosPendientesClave"
          :search="editor.buscarFiltroOriginalParaAsignar"
          :add-error="errorAgregarFiltro"
          @close="cerrarFiltroOverlay"
          @add="agregarFiltroDesdeOverlay"
          @add-temporal="agregarFiltroTemporalDesdeOverlay"
          @edit="(tipoFiltroId, cantidad) => { if (filtroEditadoId) editor.actualizarAsignacionFiltro({ draftId: filtroEditadoId, tipoFiltroId, cantidad }); cerrarFiltroOverlay() }"
        />
        <EquipoAceiteOverlay v-if="aceiteOverlay && editor.auxiliares.value" :mode="aceiteOverlay" :aceite="aceiteEditado" :sistemas="editor.auxiliares.value.sistemasAceite" :aceites="editor.auxiliares.value.aceites" :has-system-conflict="conflictoSistemaAceite" @close="aceiteOverlay = null" @confirm="confirmarAceite" />
        <EquipoImagenOverlay v-if="imagenOverlay" :codigo-equipo="editor.draft.value.equipo.codigo" :actual-url="imagenManager.urlActual.value" :preview-url="imagenManager.preparada.value?.previewUrl ?? null" :tiene-imagen="imagenManager.tieneImagen.value" :sync-state="imagenManager.imagenSyncState.value" :bloqueado="imagenManager.bloqueado.value" @close="imagenOverlay = false" @select="imagenManager.seleccionarArchivo" @save="imagenManager.guardar(editor.draft.value.equipo.codigo, $event)" @remove="imagenManager.eliminar(editor.draft.value.equipo.codigo)" @retry-cleanup="imagenManager.reintentarLimpieza" @retry-move="imagenManager.reintentarMovimiento" @clear-preview="imagenManager.limpiarPreview" />
      </template
      >
    </EquipoEdicionShell>
  </div>
</template>
