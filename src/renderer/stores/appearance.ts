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
    // Apply immediately based on current (likely 'system') to prevent FOUC
    applyTheme(effectiveTheme.value);

    // Then read saved preference from main and re-apply if needed
    const pref = await window.electronAPI.getThemePreference();
    console.log({ pref });
    if (pref) themePreference.value = pref;
    applyTheme(effectiveTheme.value);
  }

  async function setPreference(pref: ThemePreference) {
    themePreference.value = pref;
    applyTheme(effectiveTheme.value);
    await window.electronAPI.setThemePreference(pref);
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (themePreference.value === 'system') applyTheme(effectiveTheme.value);
    });
  }

  // Keep in sync with changes broadcast by main (e.g., other windows)
  if (window.electronAPI?.on) {
    window.electronAPI.on('theme:changed', (pref: ThemePreference) => {
      themePreference.value = pref;
      applyTheme(effectiveTheme.value);
    });
  }

  watch(effectiveTheme, (val) => applyTheme(val));

  return { themePreference, effectiveTheme, load, setPreference };
});
