import { defineStore } from 'pinia';
import { supabase } from '../lib/supabaseClient.js';
import { AuthError, User } from '@supabase/supabase-js';

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
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        this.user = data.user || null;
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch user';
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
    async signInWithPassword(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.user = data.user || null;
        return data;
      } catch (err: any) {
        this.error = err.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async signOut() {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        this.user = null;
      } catch (err: any) {
        this.error = err.message || 'Logout failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    listenToAuthChanges() {
      supabase.auth.onAuthStateChange((_event: string, session) => {
        this.user = session?.user || null;
      });
    },
    async updateProfile(metadata: { display_name?: string }) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.updateUser({ data: metadata });
        if (error) throw error;
        this.user = data.user || this.user; // keep existing if null
        return data.user;
      } catch (err: any) {
        this.error = err.message || 'Update failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
