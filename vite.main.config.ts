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
    // Avoid bundling native/CJS modules that rely on __filename/require (e.g., sqlite3)
    rollupOptions: {
      external: ['sqlite3', 'bindings'],
    },
  },
});
