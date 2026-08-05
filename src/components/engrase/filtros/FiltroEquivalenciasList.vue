<script setup lang="ts">
import type { FiltroEquivalenciaRow } from '@/stores/dbequipos/engrase/filtrosEngrase.types'
defineProps<{ equivalencias: FiltroEquivalenciaRow[] }>()
</script><template><ul v-if="equivalencias.length" class="equivalences"><li v-for="item in equivalencias" :key="item.id">{{item.codigo_equivalente}}</li></ul><p v-else class="empty">Sin equivalencias activas</p></template><style scoped>.equivalences{display:grid;gap:.45rem;margin:0;padding:0;list-style:none}.equivalences li{padding:.55rem .65rem;border-radius:.45rem;background:#f5f8fc;color:#172554;font-size:.78rem;font-weight:700}.empty{color:#64748b;font-size:.8rem}</style>
