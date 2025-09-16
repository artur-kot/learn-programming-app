<template>
  <div
    id="app-sidebar-13"
    class="w-[310px] pl-[30px] bg-surface-50 dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none"
  >
    <div class="flex flex-col h-full">
      <div class="flex flex-col flex-1 gap-4 p-2 overflow-y-auto">
        <ul class="flex flex-col gap-1 p-0 m-0 list-none">
          <li class="flex flex-col gap-1">
            <MainLayoutLink label="JavaScript" to="/courses/javascript" icon="pi pi-code" />
            <MainLayoutLink label="Settings" to="/settings" icon="pi pi-code" />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MainLayoutLink from './MainLayoutLink.vue';
</script>
