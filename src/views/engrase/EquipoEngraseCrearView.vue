<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue";
import { AlertTriangle, CheckCircle2, Filter, Minus, Plus, Search, X } from "lucide-vue-next";
import VueMultiselect from "vue-multiselect";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import EquipoCreacionShell from "@/components/engrase/creacion/EquipoCreacionShell.vue";
import EquipoCreacionLoadingState from "@/components/engrase/creacion/EquipoCreacionLoadingState.vue";
import EquipoCreacionErrorState from "@/components/engrase/creacion/EquipoCreacionErrorState.vue";
import EquipoCreacionExitDialog from "@/components/engrase/creacion/EquipoCreacionExitDialog.vue";
import EquipoCreacionDatosStep from "@/components/engrase/creacion/datos/EquipoCreacionDatosStep.vue";
import EquipoCreacionFiltrosStep from "@/components/engrase/creacion/filtros/EquipoCreacionFiltrosStep.vue";
import EquipoCreacionAceitesStep from "@/components/engrase/creacion/aceites/EquipoCreacionAceitesStep.vue";
import EquipoCreacionAceiteOverlay from "@/components/engrase/creacion/aceites/EquipoCreacionAceiteOverlay.vue";
import EquipoCreacionRevisionStep from "@/components/engrase/creacion/revision/EquipoCreacionRevisionStep.vue";
import EquipoCreacionImagenStep from "@/components/engrase/creacion/imagen/EquipoCreacionImagenStep.vue";
import { useEquipoEngraseCreacionWizard } from "@/composables/engrase/useEquipoEngraseCreacionWizard";
import { useCrearEquipoImagen } from "@/composables/engrase/useCrearEquipoImagen";
import { useEquipoOverlayMultiselect } from "@/composables/engrase/useEquipoOverlayMultiselect";
import { useEquipoEngraseCreacionStore } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.store";
import type { CatalogoDraftReference } from "@/stores/dbequipos/engrase/creacion/equipoEngraseCreacion.types";

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
  filtroEditor,
  aceiteEditor,
  isReady,
  errorInicial,
  isCreating,
  canGoNext,
  canSubmitCreation,
  isInteractionLocked,
} = storeToRefs(store);
const imagen = useCrearEquipoImagen();
const { multiselect, acomodarOpcionesEnOverlay } = useEquipoOverlayMultiselect();
const filtroOverlay = shallowRef<"search" | "create" | "edit" | null>(null);
const filtroEditadoId = shallowRef<string | null>(null);
const filtroCodigo = shallowRef("");
const filtroCantidad = shallowRef(1);
const filtroTipo = shallowRef<number | null>(null);
const filtroEnCompras = shallowRef(true);
const erroresPaso = computed(() =>
  validationErrors.value
    .filter((error) => error.paso === pasoActual.value)
    .map((error) => error.mensaje),
);
const puedeAvanzar = computed(() =>
  pasoActual.value === 4 ? canSubmitCreation.value : canGoNext.value,
);
type OpcionTipoFiltro = { id: number; nombre: string; $isDisabled: boolean };
const opcionesTipoFiltro = computed<OpcionTipoFiltro[]>(() =>
  (auxiliares.value?.tiposFiltro ?? []).map((tipo) => ({
    id: tipo.id,
    nombre: tipo.nombre,
    $isDisabled: draft.value.filtros.some(
      (filtro) =>
        filtro.draftId !== filtroEditadoId.value &&
        filtro.tipoFiltro.estado === "existente" &&
        filtro.tipoFiltro.id === tipo.id,
    ),
  })),
);
const tipoFiltroSeleccionado = computed<OpcionTipoFiltro | null>({
  get: () => opcionesTipoFiltro.value.find((tipo) => tipo.id === filtroTipo.value) ?? null,
  set: (tipo) => { filtroTipo.value = tipo?.id ?? null; },
});
function cerrarFiltroOverlay(): void {
  filtroOverlay.value = null;
  filtroEditadoId.value = null;
  store.cerrarOverlay();
}
function abrirAgregarFiltro(): void {
  filtroCodigo.value = "";
  filtroTipo.value = null;
  filtroCantidad.value = 1;
  filtroEditadoId.value = null;
  filtroEnCompras.value = true;
  if (store.abrirAgregarFiltro()) filtroOverlay.value = "search";
}
function abrirEditarFiltro(draftId: string): void {
  const filtro = draft.value.filtros.find((item) => item.draftId === draftId);
  if (!filtro) return;
  filtroCodigo.value = filtro.filtro.codigo;
  filtroTipo.value = filtro.tipoFiltro.estado === "existente" ? filtro.tipoFiltro.id : null;
  filtroCantidad.value = filtro.cantidad;
  filtroEditadoId.value = draftId;
  if (store.abrirEditarFiltro(draftId)) filtroOverlay.value = "edit";
}
function crearFiltroNuevo(): void {
  const resultado = filtroEditor.value.kind === "search" ? filtroEditor.value.result : null;
  if (!resultado || resultado.encontrado || !resultado.puedeCrearse) return;
  filtroCodigo.value = resultado.codigoBuscado;
  filtroTipo.value = null;
  filtroCantidad.value = 1;
  filtroEnCompras.value = true;
  filtroOverlay.value = "create";
}
function confirmarFiltro(): void {
  if (filtroOverlay.value === "edit") {
    const actual = draft.value.filtros.find((item) => item.draftId === filtroEditadoId.value);
    if (!actual) return;
    const tipo = auxiliares.value?.tiposFiltro.find((item) => item.id === filtroTipo.value);
    const tipoFiltro = tipo
      ? { estado: "existente" as const, id: tipo.id, tempId: null, nombre: tipo.nombre }
      : actual.tipoFiltro;
    if (store.actualizarFiltro({ draftId: actual.draftId, tipoFiltro, cantidad: filtroCantidad.value }).ok) cerrarFiltroOverlay();
    return;
  }
  if (filtroOverlay.value === "search") {
    const resultado = filtroEditor.value.kind === "search" ? filtroEditor.value.result : null;
    const tipo = auxiliares.value?.tiposFiltro.find((item) => item.id === filtroTipo.value);
    if (!resultado?.encontrado || !tipo) return;
    if (store.agregarFiltroExistente({
      filtro: {
        estado: "existente",
        id: resultado.filtro.id,
        tempId: null,
        codigo: resultado.filtro.codigo,
        estaEnListaCompras: resultado.filtro.estaEnListaCompras,
      },
      tipoFiltro: { estado: "existente", id: tipo.id, tempId: null, nombre: tipo.nombre },
      cantidad: filtroCantidad.value,
    }).ok) cerrarFiltroOverlay();
    return;
  }
  const tipo = auxiliares.value?.tiposFiltro.find(
    (item) => item.id === filtroTipo.value,
  );
  if (!tipo || !filtroCodigo.value.trim()) return;
  const filtro = store.crearFiltroTemporal(filtroCodigo.value, filtroEnCompras.value);
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
    cerrarFiltroOverlay();
}
function buscarFiltro(): void {
  filtroTipo.value = null;
  filtroCantidad.value = 1;
  void store.buscarFiltroOriginal(filtroCodigo.value);
}
function usarSugerencia(codigo: string): void {
  filtroCodigo.value = codigo;
  buscarFiltro();
}
function onFiltroKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") cerrarFiltroOverlay();
}
onMounted(() => window.addEventListener("keydown", onFiltroKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onFiltroKeydown));
const aceiteEditado = computed(() =>
  aceiteEditor.value.kind === "edit"
    ? draft.value.aceites.find((aceite) => aceite.draftId === aceiteEditor.value.draftId)
    : undefined,
);
const referenciasSistemaAceite = computed(() => [
  ...(auxiliares.value?.sistemasAceite ?? []).map((sistema) => ({ estado: "existente" as const, id: sistema.id, tempId: null, nombre: sistema.nombre })),
  ...store.obtenerSistemasTemporales(),
]);
const referenciasAceite = computed(() => [
  ...(auxiliares.value?.aceites ?? []).map((aceite) => ({ estado: "existente" as const, id: aceite.id, tempId: null, nombre: aceite.nombre })),
  ...store.obtenerAceitesTemporales(),
]);
function abrirAgregarAceite(): void { store.abrirAgregarAceite(); }
function abrirEditarAceite(draftId: string): void { store.abrirEditarAceite(draftId); }
function cerrarEditorAceite(): void { store.descartarEditorAceite(); }
function confirmarAceite(sistema: CatalogoDraftReference, aceite: CatalogoDraftReference): void {
  if (aceiteEditor.value.kind === "add") store.agregarAceite({ sistema, aceite });
  else if (aceiteEditor.value.kind === "edit") store.actualizarAceite({ draftId: aceiteEditor.value.draftId, sistema, aceite });
}
function sistemaAceiteOcupado(sistema: CatalogoDraftReference): boolean {
  return store.estaSistemaOcupado(sistema, aceiteEditor.value.kind === "edit" ? aceiteEditor.value.draftId : undefined);
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
  <div class="h-full">
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
        :is-duplicate-tipo-equipo="store.esTipoEquipoDuplicado"
        @codigo="store.actualizarCodigo"
        @validate="store.validarCodigoActual"
        @tipo="store.seleccionarTipoEquipo"
        @create-tipo="store.crearYSeleccionarTipoEquipo"
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
        @add="abrirAgregarFiltro"
        @edit="abrirEditarFiltro"
        @remove="store.quitarFiltro"
      />
      <EquipoCreacionAceitesStep
        v-else-if="pasoActual === 3"
        :aceites="draft.aceites"
        :disabled="isInteractionLocked"
        :errors="erroresPaso"
        @add="abrirAgregarAceite"
        @edit="abrirEditarAceite"
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
    <Teleport to="body">
    <div
      v-if="filtroOverlay"
      class="fixed inset-0 z-50 bg-main-dark/40"
      @click.self="cerrarFiltroOverlay"
    >
      <aside
        class="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg bg-white shadow-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[30rem] sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crear-filtro-title"
      >
        <header class="flex items-start justify-between gap-3 border-b border-second-deep p-4">
          <div class="flex min-w-0 items-center gap-2">
            <Filter class="h-5 w-5 shrink-0 text-main" aria-hidden="true" />
            <div>
              <h2 id="crear-filtro-title" class="text-base font-bold text-gray-900">{{ filtroOverlay === "edit" ? "Editar filtro" : filtroOverlay === "create" ? "Crear filtro nuevo" : "Agregar filtro" }}</h2>
              <p class="text-xs text-gray-600">{{ filtroOverlay === "edit" ? "Modifique el tipo y la cantidad de la asignación." : filtroOverlay === "create" ? "Defina el código, disponibilidad en compras, tipo y cantidad." : "Busque un filtro existente por código original." }}</p>
            </div>
          </div>
          <button type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-md text-gray-700 hover:bg-second" aria-label="Cerrar" @click="cerrarFiltroOverlay"><X class="h-4 w-4" /></button>
        </header>
        <form class="flex-1 overflow-y-auto p-4" data-equipo-overlay-scroll @submit.prevent="filtroOverlay === 'search' ? buscarFiltro() : confirmarFiltro()">
          <div class="grid gap-4">
            <div class="grid gap-1.5">
              <label for="crear-filtro-codigo" class="text-xs font-semibold text-gray-700">Código original</label>
              <div class="flex gap-2"><input id="crear-filtro-codigo" v-model="filtroCodigo" :disabled="filtroOverlay === 'edit'" class="min-h-11 min-w-0 flex-1 rounded-md border border-second-deep px-3 text-base outline-none focus:border-main focus:ring-2 focus:ring-accent/30 sm:min-h-9 sm:text-sm disabled:bg-second disabled:text-gray-600" placeholder="Ej. LFP3191" /><button v-if="filtroOverlay === 'search'" type="submit" :disabled="filtroEditor.kind === 'search' && filtroEditor.loading" class="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><Search class="h-4 w-4" />Buscar</button></div>
              <p v-if="filtroOverlay === 'edit'" class="text-xs text-gray-600">El código original no cambia al editar una asignación.</p>
            </div>
            <p v-if="filtroOverlay === 'search' && filtroEditor.kind === 'search' && filtroEditor.error" class="text-xs text-danger" role="alert">{{ filtroEditor.error }}</p>
            <template v-if="filtroOverlay === 'search' && filtroEditor.kind === 'search' && filtroEditor.result?.encontrado">
              <section class="grid gap-3"><header class="flex items-start justify-between gap-3"><div><p class="font-mono text-base font-bold text-main">{{ filtroEditor.result.filtro.codigo }}</p><p class="text-xs text-gray-600">Filtro existente encontrado</p></div><span class="inline-flex items-center gap-1 rounded bg-success-bg px-2 py-1 text-xs font-semibold text-success"><CheckCircle2 class="h-3.5 w-3.5" />{{ filtroEditor.result.filtro.estaEnListaCompras ? "EN LISTA DE COMPRAS" : "FUERA DE LISTA" }}</span></header><div class="grid gap-1.5"><label for="crear-filtro-tipo" class="text-xs font-semibold text-gray-700">Tipo de filtro</label><VueMultiselect ref="multiselect" id="crear-filtro-tipo" v-model="tipoFiltroSeleccionado" :options="opcionesTipoFiltro" track-by="id" label="nombre" :searchable="true" :allow-empty="true" :use-teleport="true" teleport-target="body" content-wrapper-class="equipo-filtro-options-layer" open-direction="below" placeholder="Seleccione el tipo" select-label="Seleccionar" selected-label="Seleccionado" deselect-label="Quitar" no-options="No hay tipos disponibles" no-result="Sin resultados" @open="acomodarOpcionesEnOverlay" /><p class="text-xs text-gray-600">Las opciones deshabilitadas ya están asignadas a este equipo.</p></div><div class="grid gap-1"><span class="text-xs font-semibold text-gray-700">Cantidad</span><div class="flex items-center"><button type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-l-md border border-second-deep text-main hover:bg-second" aria-label="Disminuir cantidad" @click="filtroCantidad = Math.max(1, filtroCantidad - 1)"><Minus class="h-3.5 w-3.5" /></button><input v-model.number="filtroCantidad" min="1" step="1" type="number" class="min-h-10 w-16 border-y border-second-deep text-center text-sm" /><button type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-r-md border border-second-deep text-main hover:bg-second" aria-label="Aumentar cantidad" @click="filtroCantidad += 1"><Plus class="h-3.5 w-3.5" /></button></div></div><button type="button" :disabled="!filtroTipo || filtroCantidad < 1" class="inline-flex min-h-10 items-center justify-center rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" @click="confirmarFiltro">Agregar al equipo</button></section>
            </template>
            <template v-else-if="filtroOverlay === 'search' && filtroEditor.kind === 'search' && filtroEditor.result && !filtroEditor.result.encontrado">
              <section class="grid gap-2 rounded-md border border-warning/30 bg-warning-bg p-3"><AlertTriangle class="h-4 w-4 text-warning" /><div><p class="text-sm font-semibold text-gray-900">No encontramos una coincidencia exacta para {{ filtroEditor.result.codigoBuscado || filtroCodigo }}</p><p class="text-xs text-gray-600">Seleccione una sugerencia o cree un filtro nuevo.</p></div><div v-if="filtroEditor.result.sugerencias.length" class="grid gap-1"><p class="text-xs font-semibold text-gray-700">Códigos sugeridos</p><button v-for="sugerencia in filtroEditor.result.sugerencias" :key="sugerencia.id" type="button" class="flex min-h-10 cursor-pointer items-center justify-between rounded-md border border-warning/30 bg-white px-3 text-left text-sm hover:border-main" @click="usarSugerencia(sugerencia.codigo)"><span class="font-mono font-semibold text-main">{{ sugerencia.codigo }}</span><span class="text-xs text-gray-600">{{ sugerencia.estaEnListaCompras ? "En lista de compras" : "Fuera de lista" }}</span></button></div><button v-if="filtroEditor.result.puedeCrearse" type="button" class="min-h-9 w-fit cursor-pointer rounded-md border border-warning/30 px-3 text-xs font-semibold text-warning" @click="crearFiltroNuevo">Crear filtro nuevo</button></section>
            </template>
            <template v-else-if="filtroOverlay === 'create' || filtroOverlay === 'edit'"><div class="grid gap-1.5"><label for="crear-filtro-tipo" class="text-xs font-semibold text-gray-700">Tipo de filtro</label><VueMultiselect ref="multiselect" id="crear-filtro-tipo" v-model="tipoFiltroSeleccionado" :options="opcionesTipoFiltro" track-by="id" label="nombre" :searchable="true" :allow-empty="true" :use-teleport="true" teleport-target="body" content-wrapper-class="equipo-filtro-options-layer" open-direction="below" placeholder="Seleccione el tipo" select-label="Seleccionar" selected-label="Seleccionado" deselect-label="Quitar" no-options="No hay tipos disponibles" no-result="Sin resultados" @open="acomodarOpcionesEnOverlay" /><p v-if="filtroOverlay === 'edit' && filtroTipo === null" class="text-xs text-warning">Tipo temporal pendiente de creación.</p><p class="text-xs text-gray-600">Las opciones deshabilitadas ya están asignadas a este equipo.</p></div><label v-if="filtroOverlay === 'create'" class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-second-deep px-3 text-sm"><input v-model="filtroEnCompras" type="checkbox" class="h-4 w-4 accent-main" />En lista de compras</label><div class="grid gap-1"><span class="text-xs font-semibold text-gray-700">Cantidad</span><div class="flex items-center"><button type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-l-md border border-second-deep text-main hover:bg-second" aria-label="Disminuir cantidad" @click="filtroCantidad = Math.max(1, filtroCantidad - 1)"><Minus class="h-3.5 w-3.5" /></button><input v-model.number="filtroCantidad" min="1" step="1" type="number" class="min-h-10 w-16 border-y border-second-deep text-center text-sm" /><button type="button" class="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-r-md border border-second-deep text-main hover:bg-second" aria-label="Aumentar cantidad" @click="filtroCantidad += 1"><Plus class="h-3.5 w-3.5" /></button></div></div><button type="submit" :disabled="!(filtroTipo || filtroOverlay === 'edit') || !filtroCodigo.trim() || filtroCantidad < 1" class="inline-flex min-h-10 items-center justify-center rounded-md bg-main px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{{ filtroOverlay === "create" ? "Agregar al equipo" : "Guardar cambios" }}</button></template>
          </div>
        </form>
      </aside>
    </div>
    </Teleport>
    <EquipoCreacionAceiteOverlay
      v-if="aceiteEditor.kind !== 'closed' && auxiliares"
      :mode="aceiteEditor"
      :asociacion="aceiteEditado"
      :sistemas="referenciasSistemaAceite"
      :aceites="referenciasAceite"
      :crear-sistema="store.crearSistemaTemporal"
      :crear-aceite="store.crearAceiteTemporal"
      :has-system-conflict="sistemaAceiteOcupado"
      :error="aceiteEditor.error"
      @close="cerrarEditorAceite"
      @confirm="confirmarAceite"
    />
  </div>
</template>
