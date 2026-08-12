import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import router from './router';
import App from './App.vue';
import 'primeicons/primeicons.css';
import '@vuepic/vue-datepicker/dist/main.css';
import 'vue-multiselect/dist/vue-multiselect.css';
import './index.css';

const app = createApp(App);
app.use(createPinia());
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
    },
  },
});
app.use(ConfirmationService);
app.use(ToastService);
app.use(router);
app.mount('#root');
