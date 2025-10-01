import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteTsConfigPaths(),
    tailwindcss(),
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  build: {
    lib: {
      entry: 'index.html',
      name: 'main',
      formats: ['es'],
    },
    sourcemap: true,
  },
});
