<template>
  <div class="flex flex-col">
    <div class="flex flex-col flex-auto">
      <div class="flex-auto rounded-t-3xl bg-surface-0 dark:bg-surface-900">
        <div class="flex flex-col w-full gap-2 pb-8">
          <h2 class="mt-0 text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">
            Settings
          </h2>
          <p class="mt-0 leading-tight text-surface-500 dark:text-surface-300">
            Manage your settings
          </p>
        </div>
        <Divider />
        <div class="grid grid-cols-12 gap-4 py-6 lg:py-8">
          <div class="col-span-12 lg:col-span-2">
            <!-- Desktop vertical nav -->
            <ul class="flex-col justify-start hidden p-0 m-0 list-none lg:flex">
              <li
                v-for="item in navItems"
                :key="item.name"
                :class="[
                  '-ml-[2px] border-l-2 transition-colors',
                  activeName === item.name
                    ? 'border-primary'
                    : 'border-surface-200 dark:border-surface-700 hover:border-primary',
                ]"
              >
                <RouterLink
                  :to="{ name: item.name }"
                  :class="[
                    'flex items-center px-4 py-3 font-medium cursor-pointer',
                    activeName === item.name
                      ? 'text-primary'
                      : 'text-surface-700 dark:text-surface-200 hover:text-primary',
                  ]"
                >
                  <i :class="[item.icon, 'mr-2', 'text-base!', 'leading-normal!']" />
                  <span>{{ item.label }}</span>
                </RouterLink>
              </li>
            </ul>

            <!-- Mobile horizontal nav -->
            <div class="lg:hidden">
              <div class="overflow-x-auto border-b border-surface-200 dark:border-surface-700">
                <ul class="flex flex-row justify-start p-0 m-0 list-none whitespace-nowrap">
                  <li
                    v-for="item in navItems"
                    :key="item.name"
                    class="relative px-4 py-3 transition-colors"
                    :class="
                      activeName === item.name
                        ? 'text-primary'
                        : 'text-surface-700 dark:text-surface-200 hover:text-primary'
                    "
                  >
                    <RouterLink
                      :to="{ name: item.name }"
                      class="flex items-center font-medium cursor-pointer"
                    >
                      <i :class="[item.icon, 'mr-2', 'text-base!', 'leading-normal!']" />
                      <span>{{ item.label }}</span>
                    </RouterLink>
                    <div
                      class="absolute bottom-0 left-0 right-0 h-[2px] transition-colors"
                      :class="
                        activeName === item.name
                          ? 'bg-primary'
                          : 'bg-surface-200 dark:bg-surface-700'
                      "
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            class="flex-auto col-span-12 px-5 2xl:px-0 lg:col-span-10 xl:col-span-10 bg-surface-0 dark:bg-surface-900 rounded-2xl"
          >
            <router-view />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const navItems = [
  { label: 'Account', icon: 'pi pi-user', name: 'settings-account' },
  { label: 'Appearance', icon: 'pi pi-palette', name: 'settings-appearance' },
];

const route = useRoute();
const activeName = computed(() => route.name);
</script>
