<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";
import { storeToRefs } from "pinia";
import {
  Sprout,
  Wheat,
  SquarePen,
  ImageOff,
  LoaderCircle,
} from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import { obtenerIconoTipoFiltro } from "@/utils/filtrosEngraseIconos";
import type {
  EquipoEngraseListItem,
  EquipoAceiteDetalle,
  EquipoFiltroDetalle,
  FiltroEquivalenciaRow,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  equipo: EquipoEngraseListItem | null;
  filtros: EquipoFiltroDetalle[];
  aceites: EquipoAceiteDetalle[];
  equivalencias: Record<number, FiltroEquivalenciaRow[]>;
  codigoBuscado: string | null;
  selectedFiltroId: number | null;
  loading: boolean;
  error: string | null;
  loadingCambioEstado: boolean;
  errorCambioEstado: string | null;
}>();
const emit = defineEmits<{
  selectFiltro: [number];
  retry: [];
  backToEquipos: [];
  editarEquipo: [string];
  cambiarEstado: [codigo: string, estado: "activo" | "descartado"];
}>();
const featureAccessStore = useFeatureAccessStore();
const { isLoaded: isFeatureAccessLoaded } = storeToRefs(featureAccessStore);
const canEditFiltrosEngrase = computed(() =>
  isFeatureAccessLoaded.value &&
  featureAccessStore.tieneFuncionalidad("editar_filtros_engrase"),
);
function coincideConBusqueda(filtro: EquipoFiltroDetalle) {
  const codigo = props.codigoBuscado;
  return Boolean(
    codigo &&
    (filtro.filtro.codigo === codigo ||
      (props.equivalencias[filtro.filtro_id] ?? []).some(
        (x) => x.codigo_equivalente === codigo,
      )),
  );
}
const filtrosOrdenados = computed(() =>
  !props.codigoBuscado
    ? props.filtros
    : [...props.filtros].sort(
        (a, b) =>
          Number(coincideConBusqueda(b)) - Number(coincideConBusqueda(a)),
      ),
);
const grupoSeleccionado = shallowRef<string | null>(null);
const soloConEquivalencias = shallowRef(false);
const soloEnCompras = shallowRef(false);
const opcionesDeListadoAbiertas = shallowRef(false);
const imagenPrincipalFallida = shallowRef(false);
watch(
  () => props.equipo?.imageUrl,
  () => {
    imagenPrincipalFallida.value = false;
  },
);
const cantidadFiltrosDeListadoActivos = computed(
  () =>
    Number(grupoSeleccionado.value !== null) +
    Number(soloConEquivalencias.value) +
    Number(soloEnCompras.value),
);
const hayFiltrosDeListadoActivos = computed(
  () => cantidadFiltrosDeListadoActivos.value > 0,
);
function esCultivo(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "cultivo";
}
function esZafra(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "zafra";
}
const gruposDeFiltros = computed(() => {
  const grupos = new Map<
    string,
    ReturnType<typeof obtenerIconoTipoFiltro> & { cantidad: number }
  >();

  props.filtros.forEach((filtro) => {
    const clasificacion = obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre);
    const grupoExistente = grupos.get(clasificacion.grupo);

    grupos.set(clasificacion.grupo, {
      ...clasificacion,
      cantidad: (grupoExistente?.cantidad ?? 0) + 1,
    });
  });

  return [...grupos.values()];
});
const filtrosVisibles = computed(() =>
  filtrosOrdenados.value.filter(
    (filtro) =>
      (!grupoSeleccionado.value ||
        obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).grupo ===
          grupoSeleccionado.value) &&
      (!soloConEquivalencias.value ||
        (props.equivalencias[filtro.filtro_id] ?? []).length > 0) &&
      (!soloEnCompras.value || filtro.filtro.esta_en_lista_compras),
  ),
);
function alternarGrupo(grupo: string) {
  grupoSeleccionado.value =
    grupoSeleccionado.value === grupo ? null : grupo;
}
function alternarEstado(): void {
  if (!props.equipo || props.loadingCambioEstado) return;
  emit(
    "cambiarEstado",
    props.equipo.codigo,
    props.equipo.estado === "activo" ? "descartado" : "activo",
  );
}
</script>
<template>
  <section
    class="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
  >
    <button
      type="button"
      class="mb-2 cursor-pointer text-xs font-semibold text-main md:hidden"
      @click="$emit('backToEquipos')"
    >
      ← Equipos
    </button>
    <template v-if="equipo">
      <header class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <div class="grid aspect-square w-20 shrink-0 place-items-center overflow-hidden rounded-md bg-second-dark text-gray-400 sm:w-24">
            <img
              v-if="equipo.imageUrl && !imagenPrincipalFallida"
              class="h-full w-full object-cover"
              :src="equipo.imageUrl"
              :alt="`Imagen del equipo ${equipo.codigo}`"
              @error="imagenPrincipalFallida = true"
            />
            <ImageOff v-else class="h-5 w-5" :aria-label="`Sin imagen: ${equipo.codigo}`" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-main">
              {{ equipo.tipo_equipo }}
            </p>
            <h2 class="font-mono text-lg font-semibold text-main">
              {{ equipo.codigo }}
            </h2>
            <p class="flex flex-wrap items-center gap-x-1 text-xs text-gray-500">
              Modelo: {{ equipo.subtipo || "Sin modelo" }} ·
              <template v-if="equipo.etapas.length"
                ><span
                  v-for="etapa in equipo.etapas"
                  :key="etapa.id"
                  class="inline-flex items-center gap-0.5"
                  ><Sprout
                    v-if="esCultivo(etapa.nombre)"
                    class="h-3 w-3 text-main"
                  /><Wheat
                    v-else-if="esZafra(etapa.nombre)"
                    class="h-3 w-3 text-accent"
                  />{{ etapa.nombre }}</span
                ></template
              ><template v-else>Sin etapa</template>
            </p>
          </div>
        </div>
        <div
          v-if="canEditFiltrosEngrase"
          class="flex shrink-0 flex-col items-end gap-1"
        >
          <span
            class="text-[10px] font-bold uppercase"
            :class="equipo.estado === 'activo' ? 'text-main' : 'text-danger'"
          >
            {{ equipo.estado }}
          </span>
          <button
            type="button"
            role="switch"
            class="relative h-5 w-10 rounded-full p-0.5 shadow-inner transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-main disabled:cursor-wait disabled:opacity-70"
            :class="equipo.estado === 'activo' ? 'bg-main' : 'bg-danger'"
            :aria-checked="equipo.estado === 'activo'"
            :aria-label="`Cambiar estado del equipo; actualmente ${equipo.estado}`"
            :disabled="loadingCambioEstado"
            @click="alternarEstado"
          >
            <span
              class="grid h-4 w-4 place-items-center rounded-full bg-white shadow-md transition-transform duration-200"
              :class="equipo.estado === 'activo' ? 'translate-x-5' : 'translate-x-0'"
              aria-hidden="true"
            >
              <LoaderCircle v-if="loadingCambioEstado" class="h-2.5 w-2.5 animate-spin text-gray-500" />
            </span>
          </button>
        </div>
        <b
          v-else
          class="rounded px-1.5 py-1 text-[10px] font-semibold uppercase"
          :class="equipo.estado === 'activo' ? 'bg-main/10 text-main' : 'bg-danger-bg text-danger'"
          >{{ equipo.estado }}</b
        >
      </header>
      <div v-if="aceites.length" class="mb-3 mt-3 flex flex-wrap gap-2">
        <span
          v-for="aceite in aceites"
          :key="`${aceite.sistema}-${aceite.aceite}`"
          class="rounded-md bg-main-light/15 px-2.5 py-1 text-xs font-medium text-main"
        >
          {{ aceite.sistema }} · {{ aceite.aceite }}
        </span>
      </div>
      <p v-if="errorCambioEstado" class="mt-3 text-xs text-danger" role="alert">
        {{ errorCambioEstado }}
      </p>
      <div class="my-3 flex flex-wrap items-center gap-2 text-xs">
        <p class="whitespace-nowrap text-gray-500">
          Total filtros: <b class="text-main">{{ filtros.length }}</b>
        </p>
        <button
          type="button"
          class="cursor-pointer inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium transition"
          :class="
            hayFiltrosDeListadoActivos
              ? 'border-second-deep bg-second text-main hover:bg-second-dark'
              : 'border-gray-200 text-gray-600 hover:border-main/40 hover:text-main'
          "
          :aria-expanded="opcionesDeListadoAbiertas"
          aria-controls="opciones-de-listado"
          :title="
            hayFiltrosDeListadoActivos
              ? `${cantidadFiltrosDeListadoActivos} filtro(s) aplicado(s)`
              : 'Mostrar filtros de listado'
          "
          @click="opcionesDeListadoAbiertas = !opcionesDeListadoAbiertas"
        >
          Mostrar por
          <span
            v-if="hayFiltrosDeListadoActivos && !opcionesDeListadoAbiertas"
            class="h-1.5 w-1.5 rounded-full bg-second-deep"
            aria-hidden="true"
          />
          <span
            v-if="hayFiltrosDeListadoActivos && !opcionesDeListadoAbiertas"
            class="sr-only"
          >
            {{ cantidadFiltrosDeListadoActivos }} filtro(s) aplicado(s)
          </span>
        </button>
        <button
          v-if="canEditFiltrosEngrase"
          type="button"
          class="cursor-pointer rounded-md border border-gray-200 p-1 text-main transition hover:border-main/40 hover:bg-main/10"
          aria-label="Editar filtros del equipo"
          @click="emit('editarEquipo', equipo.codigo)"
        >
          <SquarePen class="h-4 w-4" />
        </button>
      </div>
      <div
        id="opciones-de-listado"
        v-show="opcionesDeListadoAbiertas"
        class="mb-3"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          class="cursor-pointer flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 transition"
          :class="
            soloConEquivalencias
              ? 'border-main bg-main/10 text-main'
              : 'border-gray-200 text-gray-600 hover:border-main/40'
          "
          :aria-pressed="soloConEquivalencias"
          @click="soloConEquivalencias = !soloConEquivalencias"
        >
          Con equivalencias
          <span class="font-semibold">{{ filtros.filter((x) => (equivalencias[x.filtro_id] ?? []).length).length }}</span>
        </button>
        <button
          type="button"
          class="cursor-pointer flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 transition"
          :class="
            soloEnCompras
              ? 'border-main bg-main/10 text-main'
              : 'border-gray-200 text-gray-600 hover:border-main/40'
          "
          :aria-pressed="soloEnCompras"
          @click="soloEnCompras = !soloEnCompras"
        >
          En compras
          <span class="font-semibold">{{ filtros.filter((x) => x.filtro.esta_en_lista_compras).length }}</span>
        </button>
        </div>
        <div aria-hidden="true" class="my-3 border-t border-gray-200" />
        <div
          v-if="gruposDeFiltros.length"
          class="flex flex-wrap gap-2"
          aria-label="Filtrar filtros por grupo"
        >
          <button
            v-for="grupo in gruposDeFiltros"
            :key="grupo.grupo"
            type="button"
            class="cursor-pointer flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs transition"
            :class="
              grupoSeleccionado === grupo.grupo
                ? 'border-main bg-main/10 text-main'
                : 'border-gray-200 text-gray-600 hover:border-main/40'
            "
            :aria-pressed="grupoSeleccionado === grupo.grupo"
            @click="alternarGrupo(grupo.grupo)"
          >
            <component :is="grupo.icono" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{{ grupo.nombreGrupo }}</span>
            <span class="font-semibold">{{ grupo.cantidad }}</span>
          </button>
        </div>
      </div>
      <p v-if="loading" class="p-4 text-center text-xs text-gray-500">
        Cargando filtros…
      </p>
      <p v-else-if="error" class="p-4 text-center text-xs text-danger">
        {{ error }}
        <button class="cursor-pointer font-semibold underline" @click="$emit('retry')">
          Reintentar
        </button>
      </p>
      <p
        v-else-if="!filtros.length"
        class="p-4 text-center text-xs text-gray-500"
      >
        Este equipo no tiene filtros asignados.
      </p>
      <div v-else class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="filtro in filtrosVisibles"
          :key="filtro.id"
          class="cursor-pointer rounded-md border p-2 text-left text-xs transition hover:border-main/40"
          :class="
            selectedFiltroId === filtro.id
              ? 'border-main bg-main/5'
              : 'border-gray-200'
          "
          :aria-selected="selectedFiltroId === filtro.id"
          @click="$emit('selectFiltro', filtro.id)"
        >
          <strong class="flex items-center gap-1.5 text-sm text-main">
            <component
              :is="obtenerIconoTipoFiltro(filtro.tipoFiltro.nombre).icono"
              class="h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {{ filtro.tipoFiltro.nombre }}
          </strong>
          <dl class="mt-2 grid grid-cols-2 gap-y-1 text-gray-500">
            <dt>Código original</dt>
            <dd class="text-right font-mono">
              <span
                class="inline-block rounded px-1 font-bold text-main"
                :class="{ 'codigo-buscado': coincideConBusqueda(filtro) }"
                >{{ filtro.filtro.codigo }}</span
              >
            </dd>
            <dt>Cantidad</dt>
            <dd class="text-right">x{{ filtro.cantidad }}</dd>
            <dt>Equivalencias</dt>
            <dd class="text-right">
              {{ (equivalencias[filtro.filtro_id] ?? []).length }}
            </dd>
            <dt>En compras</dt>
            <dd class="text-right">
              {{ filtro.filtro.esta_en_lista_compras ? "Sí" : "No" }}
            </dd>
          </dl>
        </button>
      </div>
    </template>
    <p v-else class="p-4 text-center text-xs text-gray-500">
      Seleccione un equipo para ver sus filtros.
    </p>
  </section>
</template>

<style scoped>
@keyframes codigo-buscado-parpadeo {
  0%,
  100% {
    box-shadow: 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 8px var(--color-main);
  }
}

.codigo-buscado {
  animation: codigo-buscado-parpadeo 1.8s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .codigo-buscado {
    animation: none;
  }
}
</style>
