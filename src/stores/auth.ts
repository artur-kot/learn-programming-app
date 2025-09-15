import { defineStore } from 'pinia';
// Firebase removed: using simple in-memory auth placeholder.

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state: AuthState): boolean => !!state.user,
  },
  actions: {
    async fetchUser() {
      // In a real replacement, load from local persisted storage.
      this.user = this.user || null;
    },
    async signInWithPassword(email: string, _password: string) {
      this.loading = true;
      this.error = null;
      try {
        // Placeholder: accept any credentials.
        this.user = { id: 'local-user', email, displayName: email.split('@')[0] };
        return this.user;
      } catch (err: any) {
        this.error = err?.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async signOut() {
      this.user = null;
    },
    listenToAuthChanges() {
      // No realtime auth backend.
    },
    async updateProfile(displayName: string) {
      if (!this.user) throw new Error('No user');
      this.user = { ...this.user, displayName };
      return this.user;
    },
  },
});
