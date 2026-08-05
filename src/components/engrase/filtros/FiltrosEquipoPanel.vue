<script setup lang="ts">
import { computed } from 'vue'
import type { EquipoEngraseListItem, EquipoFiltroDetalle, FiltroEquivalenciaRow } from '@/stores/dbequipos/engrase/filtrosEngrase.types'
const props=defineProps<{equipo:EquipoEngraseListItem|null;filtros:EquipoFiltroDetalle[];equivalencias:Record<number,FiltroEquivalenciaRow[]>;codigoBuscado:string|null;selectedFiltroId:number|null;loading:boolean;error:string|null}>()
defineEmits<{selectFiltro:[number];retry:[];backToEquipos:[]}>()
function coincideConBusqueda(filtro:EquipoFiltroDetalle){const codigo=props.codigoBuscado;return Boolean(codigo&&(filtro.filtro.codigo===codigo||(props.equivalencias[filtro.filtro_id]??[]).some(x=>x.codigo_equivalente===codigo)))}
const filtrosOrdenados=computed(()=>!props.codigoBuscado?props.filtros:[...props.filtros].sort((a,b)=>Number(coincideConBusqueda(b))-Number(coincideConBusqueda(a))))
</script>
<template>
  <section class="min-h-0 overflow-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <button type="button" class="mb-2 text-xs font-semibold text-main md:hidden" @click="$emit('backToEquipos')">← Equipos</button>
    <template v-if="equipo">
      <header class="flex items-start justify-between gap-3"><div><p class="text-xs font-semibold text-main">{{equipo.tipo_equipo}}</p><h2 class="font-mono text-lg font-semibold text-main">{{equipo.codigo}}</h2><p class="text-xs text-gray-500">Modelo: {{equipo.subtipo||'Sin modelo'}} · {{equipo.etapas.map(x=>x.nombre).join(', ')||'Sin etapa'}}</p></div><b class="rounded px-1.5 py-1 text-[10px] font-semibold uppercase" :class="equipo.estado==='activo'?'bg-success-bg text-success':'bg-danger-bg text-danger'">{{equipo.estado}}</b></header>
      <div class="my-3 grid grid-cols-3 gap-2"><div class="rounded border border-gray-200 p-2"><span class="block text-xs text-gray-500">Total filtros</span><b class="text-sm text-main">{{filtros.length}}</b></div><div class="rounded border border-gray-200 p-2"><span class="block text-xs text-gray-500">Con equivalencias</span><b class="text-sm text-main">{{filtros.filter(x=>(equivalencias[x.filtro_id]??[]).length).length}}</b></div><div class="rounded border border-gray-200 p-2"><span class="block text-xs text-gray-500">En compras</span><b class="text-sm text-main">{{filtros.filter(x=>x.filtro.esta_en_lista_compras).length}}</b></div></div>
      <p v-if="loading" class="p-4 text-center text-xs text-gray-500">Cargando filtros…</p><p v-else-if="error" class="p-4 text-center text-xs text-danger">{{error}} <button class="font-semibold underline" @click="$emit('retry')">Reintentar</button></p><p v-else-if="!filtros.length" class="p-4 text-center text-xs text-gray-500">Este equipo no tiene filtros asignados.</p>
      <div v-else class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3"><button v-for="filtro in filtrosOrdenados" :key="filtro.id" class="rounded-md border p-2 text-left text-xs transition hover:border-main/40" :class="selectedFiltroId===filtro.id?'border-main bg-main/5':'border-gray-200'" :aria-selected="selectedFiltroId===filtro.id" @click="$emit('selectFiltro',filtro.id)"><strong class="block text-sm text-main">{{filtro.tipoFiltro.nombre}}</strong><dl class="mt-2 grid grid-cols-2 gap-y-1 text-gray-500"><dt>Código original</dt><dd class="text-right font-mono"><span class="inline-block rounded px-1 font-bold text-main" :class="{'codigo-buscado':coincideConBusqueda(filtro)}">{{filtro.filtro.codigo}}</span></dd><dt>Cantidad</dt><dd class="text-right">x{{filtro.cantidad}}</dd><dt>Equivalencias</dt><dd class="text-right">{{(equivalencias[filtro.filtro_id]??[]).length}}</dd><dt>En compras</dt><dd class="text-right">{{filtro.filtro.esta_en_lista_compras?'Sí':'No'}}</dd></dl></button></div>
    </template>
    <p v-else class="p-4 text-center text-xs text-gray-500">Seleccione un equipo para ver sus filtros.</p>
  </section>
</template>

<style scoped>
@keyframes codigo-buscado-parpadeo {
  0%, 100% { box-shadow: 0 0 0 transparent; }
  50% { box-shadow: 0 0 8px var(--color-main); }
}

.codigo-buscado { animation: codigo-buscado-parpadeo 1.8s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) { .codigo-buscado { animation: none; } }
</style>
