import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    viteTsConfigPaths(),
  ],
  build: {
    lib: {
      entry: 'src/renderer.tsx',
      name: 'main',
      formats: ['es'],
    },
    sourcemap: true,
  },
});
