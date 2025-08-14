import { defineConfig } from 'vite';

import viteTsConfigPaths from 'vite-tsconfig-paths';
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'


// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteTsConfigPaths(),
    tailwindcss(),
    vue(),
  ],
  build: {
    lib: {
      entry: 'src/renderer.ts',
      name: 'main',
      formats: ['es'],
    },
    sourcemap: true,
  },
});
