import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteTsConfigPaths(),
    vue()
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
