import { createClient } from '@supabase/supabase-js';

// Public (anon) credentials only. Service role keys must NEVER be shipped to the renderer.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL is not defined');
}
if (!anonKey) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_ANON_KEY is not defined');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export default supabase;
