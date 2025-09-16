<template>
  <section class="flex flex-col gap-8">
    <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Appearance Settings</h1>

    <div class="flex flex-col w-full gap-4">
      <div class="text-base font-semibold leading-tight text-surface-900 dark:text-surface-0">
        Theme
      </div>
      <div class="flex flex-col rounded-lg">
        <!-- System -->
        <div
          class="relative flex items-center gap-4 p-4 rounded-t-lg cursor-pointer bg-surface-0 dark:bg-surface-900"
          :class="rowClass('system', true)"
          @click="choose('system')"
        >
          <RadioButton v-model="localPref" name="theme" value="system" />
          <div class="flex flex-col flex-1 gap-1">
            <div class="font-medium leading-tight text-surface-900 dark:text-surface-0">System</div>
            <span class="text-sm leading-tight text-surface-500 dark:text-surface-400"
              >Match your OS setting</span
            >
          </div>
        </div>
        <!-- Light -->
        <div
          class="relative flex items-center gap-4 p-4 -mt-px cursor-pointer bg-surface-0 dark:bg-surface-900"
          :class="rowClass('light')"
          @click="choose('light')"
        >
          <RadioButton v-model="localPref" name="theme" value="light" />
          <div class="flex flex-col flex-1 gap-1">
            <div class="font-medium leading-tight text-surface-900 dark:text-surface-0">Light</div>
            <span class="text-sm leading-tight text-surface-500 dark:text-surface-400"
              >Always use light mode</span
            >
          </div>
        </div>
        <!-- Dark -->
        <div
          class="relative flex items-center gap-4 p-4 -mt-px rounded-b-lg cursor-pointer bg-surface-0 dark:bg-surface-900"
          :class="rowClass('dark', false, true)"
          @click="choose('dark')"
        >
          <RadioButton v-model="localPref" name="theme" value="dark" />
          <div class="flex flex-col flex-1 gap-1">
            <div class="font-medium leading-tight text-surface-900 dark:text-surface-0">Dark</div>
            <span class="text-sm leading-tight text-surface-500 dark:text-surface-400"
              >Always use dark mode</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import RadioButton from 'primevue/radiobutton';
import { ref, watch } from 'vue';
import { ThemePreference } from '~/ipc/contracts';
import { useAppearanceStore } from '~/renderer/stores';

const appearance = useAppearanceStore();
// Local copy to keep UI fast while persisting
const localPref = ref<ThemePreference>(appearance.themePreference);

watch(
  () => appearance.themePreference,
  (val) => {
    if (val !== localPref.value) localPref.value = val;
  }
);

function choose(pref: ThemePreference) {
  if (localPref.value === pref) return;
  localPref.value = pref;
  appearance.setPreference(pref);
}

function rowClass(pref: ThemePreference, first = false, last = false) {
  const selected = localPref.value === pref;
  return {
    'before:absolute before:inset-0 before:pointer-events-none before:border before:border-b-0 before:border-surface-200 dark:before:border-surface-700':
      !selected && !last,
    'before:absolute before:inset-0 before:pointer-events-none before:border before:border-surface-200 dark:before:border-surface-700':
      !selected && last,
    'before:absolute before:inset-0 before:pointer-events-none before:border-[1.5px] before:border-primary z-10':
      selected,
    'before:rounded-t-lg': first,
    'before:rounded-b-lg': last,
  };
}

// Ensure store loaded (idempotent)
if (!appearance.themePreference) {
  appearance.load();
}
</script>
