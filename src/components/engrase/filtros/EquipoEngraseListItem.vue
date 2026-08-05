<script setup lang="ts">
import EquipoEngraseThumbnail from './EquipoEngraseThumbnail.vue'
import type { EquipoEngraseListItem } from '@/stores/dbequipos/engrase/filtrosEngrase.types'
defineProps<{ equipo: EquipoEngraseListItem; selected: boolean }>()
defineEmits<{ select: [number] }>()
</script><template><button type="button" class="flex w-full items-center gap-2 rounded-md border bg-white p-2 text-left transition hover:border-main/40" :class="selected?'border-main bg-main/5':'border-gray-200'" :aria-pressed="selected" @click="$emit('select',equipo.id)"><EquipoEngraseThumbnail :src="equipo.imageUrl" :alt="equipo.codigo"/><span class="min-w-0 flex-1 text-xs text-gray-600"><strong class="block font-mono text-sm text-main">{{equipo.codigo}}</strong><span class="block truncate">{{equipo.tipo_equipo}}</span><small class="block truncate text-xs text-gray-500">Modelo: {{equipo.subtipo||'Sin modelo'}}</small></span><b class="rounded px-1.5 py-1 text-[10px] uppercase" :class="equipo.estado==='activo'?'bg-success-bg text-success':'bg-danger-bg text-danger'">{{equipo.estado}}</b></button></template>
