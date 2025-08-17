// Declarations for Vite Electron environment variables injected at build time.
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Public Vite environment variables (exposed to renderer)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite public env variables (must start with VITE_)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite-style public env vars (must be prefixed with VITE_ to be exposed to the renderer bundle)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string; // NEVER put service_role key here
  // add more public vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

