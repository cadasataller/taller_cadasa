<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LogIn, Lock, User, Loader2, Eye, EyeOff } from "lucide-vue-next";
import BaseButton from "@/components/BaseButton.vue";
import BaseInput from "@/components/BaseInput.vue";
import {
  supabase,
  supabaseRatings,
  supabaseCompras,
  supabaseEquipos,
  supabaseRastreoTareas,
} from "@/lib/supabase";

const router = useRouter();
const email = ref("");
const password = ref("");
const error = ref("");
const isLoading = ref(false);
const showPassword = ref(false);

const appendDomain = () => {
  if (email.value && !email.value.includes("@")) {
    email.value = `${email.value.trim()}@cadasa.com`;
  }
};

const login = async () => {
  error.value = "";
  if (email.value && password.value) {
    isLoading.value = true;
    try {
      const emailTrimmed = email.value.trim();

      // Intentar login en todas las BD con las mismas credenciales
      const p1 = supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: password.value,
      });
      const p2 = supabaseRatings.auth.signInWithPassword({
        email: emailTrimmed,
        password: password.value,
      });
      const p3 = supabaseCompras.auth.signInWithPassword({
        email: emailTrimmed,
        password: password.value,
      });
      const p4 = supabaseEquipos.auth.signInWithPassword({
        email: emailTrimmed,
        password: password.value,
      });
      const p5 = supabaseRastreoTareas.auth.signInWithPassword({
        email: emailTrimmed,
        password: password.value,
      });

      const [res1, res2, res3, res4, res5] = await Promise.all([
        p1,
        p2,
        p3,
        p4,
        p5,
      ]);

      // Si falla en cualquiera, se muestra error
      if (res1.error || res2.error || res3.error || res4.error || res5.error) {
        const errorDbNames = [];
        if (res1.error) errorDbNames.push("Auth/Mantenimiento");
        if (res2.error) errorDbNames.push("Calificaciones");
        if (res3.error) errorDbNames.push("Compras");
        if (res4.error) errorDbNames.push("Equipos");
        if (res5.error) errorDbNames.push("Rastreo de tareas");

        error.value = `Credenciales inválidas o error de conexión en las bases de datos: ${errorDbNames.join(", ")}`;
        console.error("Auth DB Error:", res1.error);
        console.error("Ratings DB Error:", res2.error);
        console.error("Compras DB Error:", res3.error);
        console.error("Equipos DB Error:", res4.error);
        console.error("Rastreo tareas DB Error:", res5.error);
      } else if (
        res1.data.session &&
        res2.data.session &&
        res3.data.session &&
        res4.data.session &&
        res5.data.session
      ) {
        router.push("/");
      }
    } catch (err) {
      error.value = "Error de sistema. Intente de nuevo.";
    } finally {
      isLoading.value = false;
    }
  } else {
    error.value = "Por favor, ingrese sus credenciales completas";
  }
};
</script>

<template>
  <div class="min-h-screen bg-second flex items-center justify-center p-6">
    <div
      class="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
    >
      <div class="bg-main p-10 text-center relative overflow-hidden">
        <div class="relative z-10">
          <h1 class="font-display text-4xl text-accent tracking-widest">
            CADASA
          </h1>
          <p class="text-xs text-second-deep tracking-[0.3em] uppercase mt-2">
            Acceso al Sistema
          </p>
        </div>
        <!-- Decorative SVG -->
        <div class="absolute -right-10 -bottom-10 opacity-10 rotate-12">
          <LogIn class="w-32 h-32 text-white" />
        </div>
      </div>

      <div class="p-8 space-y-6">
        <BaseInput
          v-model="email"
          label="Usuario / Email"
          placeholder="nombre o nombre@cadasa.com"
          :icon="User"
          @blur="appendDomain"
          @keyup.enter="login"
        />
        <BaseInput
          v-model="password"
          label="Contraseña"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          :icon="Lock"
          @keyup.enter="login"
        >
          <template #suffix>
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <component
                :is="showPassword ? EyeOff : Eye"
                class="w-4 h-4 text-gray-400"
              />
            </button>
          </template>
        </BaseInput>

        <div
          v-if="error"
          class="text-[11px] font-medium text-danger text-center bg-danger-bg p-2 rounded-lg"
        >
          {{ error }}
        </div>

        <BaseButton
          variant="primary"
          class="w-full py-3 mt-4"
          @click="login"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Entrar al Sistema</span>
          <span v-else class="flex items-center justify-center gap-2">
            <Loader2 class="w-4 h-4 animate-spin" /> Verificando...
          </span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
