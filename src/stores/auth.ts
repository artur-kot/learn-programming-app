import { defineStore } from 'pinia';
import { auth } from '../lib/firebaseClient.js';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';

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
        this.user = auth.currentUser;
      } catch (err: any) {
        this.error = err?.message || 'Failed to fetch user';
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
    async signInWithPassword(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        this.user = cred.user || null;
        return cred;
      } catch (err: any) {
        this.error = err?.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async signOut() {
      this.loading = true;
      this.error = null;
      try {
        await fbSignOut(auth);
        this.user = null;
      } catch (err: any) {
        this.error = err?.message || 'Logout failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    listenToAuthChanges() {
      onAuthStateChanged(auth, (user: User | null) => {
        this.user = user || null;
      });
    },
    async updateProfile(displayName: string) {
      this.loading = true;
      this.error = null;
      try {
        if (!auth.currentUser) throw new Error('No user');
        await fbUpdateProfile(auth.currentUser, { displayName });
        this.user = auth.currentUser;
        return this.user;
      } catch (err: any) {
        this.error = err?.message || 'Update failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
