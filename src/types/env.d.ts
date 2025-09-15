// Declarations for Vite Electron environment variables injected at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Public Vite environment variables (exposed to renderer)
interface ImportMetaEnv {
  // Firebase removed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
