// Supabase client has been removed in favor of Firebase.
// This file remains as a shim to avoid import errors if any legacy imports persist.
// Remove any imports of this file when feasible.

// eslint-disable-next-line no-console
console.warn('[supabase] Supabase client is deprecated and replaced by Firebase.');

export const supabase: any = null;
export async function getCurrentUser() {
  return null;
}
export default supabase;
