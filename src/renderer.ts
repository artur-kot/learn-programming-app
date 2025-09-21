import { createApp } from 'vue';
import App from './renderer/App.vue';
import './renderer/styles.css';
import router from './renderer/routes.js';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';
import { definePreset } from '@primeuix/themes';
import i18n from './renderer/i18n.js';
import pinia from './renderer/stores/index.js';
import { useAppearanceStore } from './renderer/stores/appearance.js';

const app = createApp(App);
app.use(router);
app.use(i18n);
app.use(pinia);

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{noir.50}',
      100: '{noir.100}',
      200: '{noir.200}',
      300: '{noir.300}',
      400: '{noir.400}',
      500: '{noir.500}',
      600: '{noir.600}',
      700: '{noir.700}',
      800: '{noir.800}',
      900: '{noir.900}',
      950: '{noir.950}',
    },
  },
});

// @ts-ignore -- PrimeVue types are not compatible
app.use(PrimeVue, {
  theme: {
    preset: AppPreset,
    options: {
      primary: 'sky',
      darkModeSelector: '.app-dark',
    },
  },
});

// @ts-ignore
app.use(ToastService);

app.mount('#app');

const appearance = useAppearanceStore();
await appearance.load();
