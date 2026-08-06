<script setup lang="ts">
import { computed, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import {
  Wind,
  Fuel,
  Gauge,
  Droplet,
  Cog,
  Filter,
  Fan,
  Snowflake,
  Sprout,
  Wheat,
  SquarePen,
} from "lucide-vue-next";
import { useFeatureAccessStore } from "@/stores/db_mantenimiento/app_feature_access/featureAccess.store";
import type {
  EquipoEngraseListItem,
  EquipoFiltroDetalle,
  FiltroEquivalenciaRow,
} from "@/stores/dbequipos/engrase/filtrosEngrase.types";
const props = defineProps<{
  equipo: EquipoEngraseListItem | null;
  filtros: EquipoFiltroDetalle[];
  equivalencias: Record<number, FiltroEquivalenciaRow[]>;
  codigoBuscado: string | null;
  selectedFiltroId: number | null;
  loading: boolean;
  error: string | null;
}>();
const emit = defineEmits<{ selectFiltro: [number]; retry: []; backToEquipos: []; editarEquipo: [string] }>();
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
function esCultivo(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "cultivo";
}
function esZafra(nombre: string) {
  return nombre.trim().toLocaleLowerCase() === "zafra";
}
function normalizarNombreTipoFiltro(nombre: string) {
  return nombre
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}
function obtenerIconoTipoFiltro(nombre: string) {
  const nombreNormalizado = normalizarNombreTipoFiltro(nombre);

  if (
    nombreNormalizado.includes("aire acondicionado") ||
    nombreNormalizado.includes("cabina")
  )
    return { icono: Fan, grupo: "climatizacion", nombreGrupo: "Cabina y climatización" };
  if (
    nombreNormalizado.includes("coolant") ||
    nombreNormalizado.includes("refrigerante") ||
    nombreNormalizado.includes("refrigeracion")
  )
    return { icono: Snowflake, grupo: "refrigeracion", nombreGrupo: "Refrigeración" };
  if (nombreNormalizado.includes("hidraulic") || nombreNormalizado.includes("hidraul"))
    return { icono: Gauge, grupo: "hidraulico", nombreGrupo: "Sistema hidráulico" };
  if (
    nombreNormalizado.includes("diesel") ||
    nombreNormalizado.includes("gasolina") ||
    nombreNormalizado.includes("combustible")
  )
    return { icono: Fuel, grupo: "combustible", nombreGrupo: "Combustible" };
  if (nombreNormalizado.includes("aceite"))
    return { icono: Droplet, grupo: "lubricacion", nombreGrupo: "Lubricación del motor" };
  if (
    nombreNormalizado.includes("transmision") ||
    nombreNormalizado.includes("diferencial")
  )
    return { icono: Cog, grupo: "transmision", nombreGrupo: "Transmisión y tren motriz" };
  if (nombreNormalizado.includes("aire"))
    return { icono: Wind, grupo: "admision_aire", nombreGrupo: "Admisión de aire" };

  return { icono: Filter, grupo: "elemento", nombreGrupo: "Elemento / otros" };
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
        <div>
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
        <b
          class="rounded px-1.5 py-1 text-[10px] font-semibold uppercase"
          :class="
            equipo.estado === 'activo'
              ? 'bg-success-bg text-success'
              : 'bg-danger-bg text-danger'
          "
          >{{ equipo.estado }}</b
        >
      </header>
      <div class="my-3 flex flex-wrap items-center gap-2 text-xs">
        <p class="whitespace-nowrap text-gray-500">
          Total filtros: <b class="text-main">{{ filtros.length }}</b>
        </p>
        <button
          type="button"
          class="cursor-pointer rounded-md border border-gray-200 px-2 py-1 font-medium text-gray-600 transition hover:border-main/40 hover:text-main"
          :aria-expanded="opcionesDeListadoAbiertas"
          aria-controls="opciones-de-listado"
          @click="opcionesDeListadoAbiertas = !opcionesDeListadoAbiertas"
        >
          Mostrar por
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
