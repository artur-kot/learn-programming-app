import { defineConfig } from 'vite';
import viteTsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [viteTsConfigPaths()],
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'main',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['better-sqlite3', 'bindings'],
    },
  },
});
