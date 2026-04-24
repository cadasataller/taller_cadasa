<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { Wrench } from 'lucide-vue-next';
import BaseButton from '@/components/BaseButton.vue';

const router = useRouter();
const canViewDashboard = ref(false);

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email) {
    const { data } = await supabase.from('PROFILE').select('area').eq('email', user.email).maybeSingle();
    if (data && data.area?.toUpperCase() !== 'EVALUADOR') {
      canViewDashboard.value = true;
    }
  }
});
</script>

<template>
  <div class="p-8 pb-32 md:pb-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div class="bg-blue-50 p-6 rounded-full mb-6 relative">
      <Wrench class="w-12 h-12 text-info" />
    </div>
    <h1 class="font-display text-3xl text-gray-900 mb-2">Historial de Reparaciones</h1>
    <p class="text-gray-400 max-w-md mb-8">Contenido en desarrollo. Aquí podrá visualizar el histórico de intervenciones mecánicas.</p>
    
    <BaseButton 
      v-if="canViewDashboard" 
      variant="outline" 
      class="border-gray-200 text-gray-600 shadow-sm bg-white hover:bg-gray-50"
      @click="router.push('/dashboard?slide=reparaciones&back=/reparaciones')"
    >
      Ver en Dashboard
    </BaseButton>
  </div>
</template>
