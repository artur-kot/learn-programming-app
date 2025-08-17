import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemePreference = 'system' | 'light' | 'dark';

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(effective: 'light' | 'dark') {
  const root = document.documentElement;
  if (effective === 'dark') root.classList.add('app-dark');
  else root.classList.remove('app-dark');
}

export const useAppearanceStore = defineStore('appearance', () => {
  const themePreference = ref<ThemePreference>('system');
  const effectiveTheme = computed<'light' | 'dark'>(() => {
    if (themePreference.value === 'system') {
      return systemPrefersDark() ? 'dark' : 'light';
    }
    return themePreference.value;
  });

  async function load() {
    try {
      const pref = await window.electronAPI?.getThemePreference?.();
      if (pref) themePreference.value = pref;
    } catch {
      // ignore
    } finally {
      applyTheme(effectiveTheme.value);
    }
  }

  async function setPreference(pref: ThemePreference) {
    themePreference.value = pref;
    applyTheme(effectiveTheme.value);
    try { await window.electronAPI?.setThemePreference?.(pref); } catch { /* ignore */ }
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (themePreference.value === 'system') applyTheme(effectiveTheme.value);
    });
  }

  watch(effectiveTheme, (val) => applyTheme(val));

  return { themePreference, effectiveTheme, load, setPreference };
});
