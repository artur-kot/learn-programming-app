<template>
  <div class="relative flex h-screen lg:static bg-surface-50 dark:bg-surface-950">
    <MainSidebar />

    <div class="flex flex-col flex-auto h-screen bg-surface-50 dark:bg-surface-950 p-7 md:p-8">
      <div
        class="flex flex-col flex-auto p-8 overflow-auto border shadow-md 2xl:p-12 bg-surface-0 dark:bg-surface-900 rounded-xl border-surface-200 dark:border-surface-700"
      >
        <div class="flex items-center justify-between w-full gap-2">
          <div class="flex items-center gap-4 md:gap-8">
            <a
              v-styleclass="{
                selector: '#app-sidebar-13',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-fadeinleft',
                leaveToClass: 'hidden',
                leaveActiveClass: 'animate-fadeoutleft',
                hideOnOutsideClick: true,
              }"
              class="block cursor-pointer lg:hidden text-surface-700 dark:text-surface-100"
            >
              <i class="pi pi-bars text-xl! leading-none!" />
            </a>
          </div>
        </div>
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import MainSidebar from '../components/MainSidebar.vue';
</script>
