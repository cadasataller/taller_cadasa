<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import BaseInput from '@/components/BaseInput.vue';
import BaseButton from '@/components/BaseButton.vue';
import { User, Briefcase, MapPin, Loader2 } from 'lucide-vue-next';

const router = useRouter();

const isLoading = ref(true);
const isSaving = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const profile = ref({
  nombre: '',
  role: '',
  area: ''
});

const userEmail = ref('');
const profileId = ref<number | null>(null);

const loadProfile = async () => {
  isLoading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    userEmail.value = user.email || '';
    
    const { data, error } = await supabase
      .from('PROFILE')
      .select('id, nombre, role, area')
      .eq('email', user.email)
      .maybeSingle();
      
    if (data) {
      profile.value.nombre = data.nombre || '';
      profile.value.role = data.role || '';
      profile.value.area = data.area || '';
      profileId.value = data.id;
    }
  } catch (error) {
    console.error('Error cargando perfil:', error);
  } finally {
    isLoading.value = false;
  }
};

const saveProfile = async () => {
  isSaving.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión activa');
    
    if (profileId.value) {
      // Actualizar registro existente
      const { error } = await supabase
        .from('PROFILE')
        .update({ 
          nombre: profile.value.nombre,
          role: profile.value.role,
          area: profile.value.area
        })
        .eq('id', profileId.value);
        
      if (error) throw error;
    } else {
      // Insertar nuevo registro
      const { data, error } = await supabase
        .from('PROFILE')
        .insert({
          email: userEmail.value,
          nombre: profile.value.nombre,
          role: profile.value.role,
          area: profile.value.area
        })
        .select('id')
        .single();
        
      if (error) throw error;
      if (data) profileId.value = data.id;
    }
    
    successMsg.value = 'Perfil actualizado exitosamente. Actualice la página para ver los cambios en el menú.';
  } catch (err: any) {
    console.error('Save error:', err);
    errorMsg.value = err.message || 'Error guardando perfil en la base de datos externa.';
  } finally {
    isSaving.value = false;
  }
};

const cancelEdit = () => {
  router.push('/');
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="p-4 md:p-8 space-y-8 pb-32 md:pb-8 mt-14 md:mt-0">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl text-gray-900 tracking-tight">Mi Perfil</h1>
        <p class="text-sm text-gray-400">Configure su información personal y rol de acceso.</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-main" />
    </div>

    <div v-else class="max-w-2xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div class="p-6 md:p-8 space-y-6">
        
        <div class="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div class="w-20 h-20 rounded-full bg-accent-light flex items-center justify-center font-display text-3xl text-main border-4 border-white shadow-sm">
            {{ profile.nombre ? profile.nombre.substring(0,2).toUpperCase() : userEmail.substring(0,2).toUpperCase() }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">{{ profile.nombre || 'Sin Nombre' }}</h2>
            <p class="text-sm text-gray-500">{{ userEmail }}</p>
          </div>
        </div>

        <div class="space-y-5 py-4">
          <BaseInput
            v-model="profile.nombre"
            label="Nombre Completo"
            placeholder="Ej. Juan Pérez"
            :icon="User"
          />
          <BaseInput
            v-model="profile.role"
            label="Rol del Sistema"
            placeholder="Ej. Admin, Supervisor, Auditor..."
            :icon="Briefcase"
          />
          <BaseInput
            v-model="profile.area"
            label="Área Operativa"
            placeholder="Ej. Cosecha Mecanizada, Mantenimiento..."
            :icon="MapPin"
          />
        </div>

        <div v-if="successMsg" class="p-4 bg-success-bg border border-success/30 rounded-lg text-success text-sm font-medium">
          {{ successMsg }}
        </div>
        <div v-if="errorMsg" class="p-4 bg-danger-bg border border-danger/30 rounded-lg text-danger text-sm font-medium">
          {{ errorMsg }}
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <BaseButton variant="tertiary" @click="cancelEdit" :disabled="isSaving">
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" @click="saveProfile" :disabled="isSaving">
            <span v-if="!isSaving">Guardar Cambios</span>
            <span v-else class="flex items-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" /> Guardando...
            </span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
