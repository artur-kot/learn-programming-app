# Removal of Authentication and Firebase

Authentication system, login route, and Firebase/Supabase placeholder integrations have been fully removed.

Summary of changes:

- Deleted usage of `useAuthStore` in application bootstrap and router guards.
- Removed login route and navigation guards from `routes.ts`.
- Replaced `SettingsAccount` content with a notice (feature deprecated).
- Removed export of auth store from `src/stores/index.ts`.
- Navigation menu updated to exclude Account settings page.
- Login view remains in repository but is now unused (can be deleted if no longer needed).
- Placeholder firebase and supabase client files remain for now; they can be safely deleted along with `src/stores/auth.ts` and `src/views/auth/LoginView.vue` if you want a cleaner tree.

Next optional cleanup steps:

1. Delete unused files:
   - `src/stores/auth.ts`
   - `src/views/auth/LoginView.vue`
   - `src/lib/firebaseClient.ts`
   - `src/lib/supabaseClient.ts`
2. Search and remove any lingering references (`auth`, `login`) to ensure no dead imports.
3. Remove any related environment variables/documentation.

Let me know if you want me to proceed with deleting the unused files.
