<template>
  <RouterLink :to="to" :aria-current="isActive ? 'page' : undefined"
    :class="[baseLinkClasses, isActive ? activeClasses : inactiveClasses]">
    <!-- Icon area -->
    <slot name="icon" v-if="$slots.icon" />
    <template v-else>
      <!-- If an icon string is provided, treat it as full class list for an <i>. -->
      <i v-if="icon" :class="[
        icon,
        'text-base! leading-none! group-hover:text-surface-900 dark:group-hover:text-surface-50',
        isActive ? activeIconClasses : inactiveIconClasses,
      ]" />
    </template>
    <!-- Label -->
    <span class="text-base font-medium leading-tight">
      <slot name="label">{{ label }}</slot>
    </span>
    <!-- Additional trailing content (badges, counters, etc.) -->
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, useSlots } from 'vue';

interface Props {
  to: string;
  label: string;
  /**
   * Icon class string (e.g. 'pi pi-cog', 'ri-home-line', 'fas fa-user').
   * Entire value is applied to the <i> element. If omitted, no icon is rendered unless slot provided.
  * To override completely, provide a named slot 'icon'.
  * Mutually exclusive with providing the 'icon' slot; using both will throw an error in dev.
   */
  icon?: string;
  /** When true, path must match exactly to be active (no prefix matching). */
  exact?: boolean;
}

const props = defineProps<Props>();
const slots = useSlots();

// Dev-time guard to prevent ambiguous double icon usage
if (process.env.NODE_ENV !== 'production') {
  if (props.icon && slots.icon) {
    throw new Error('[MainLayoutLink] Provide either the "icon" prop or the <template #icon> slot, not both.');
  }
}

const route = useRoute();

// Centralized styling logic (mirrors existing styles in MainLayout.vue)
const baseLinkClasses =
  'group flex items-center gap-2 p-3 transition-colors duration-150 rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50';
const inactiveClasses =
  'border border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700';
const activeClasses =
  'border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50';
const inactiveIconClasses = 'text-surface-500 dark:text-surface-400';
const activeIconClasses = 'text-surface-900 dark:text-surface-50';

const isActive = computed(() => {
  if (props.exact) {
    return route.path === props.to;
  }
  if (props.to === '/') {
    return route.path === '/';
  }
  return route.path === props.to || route.path.startsWith(props.to + '/');
});
</script>
