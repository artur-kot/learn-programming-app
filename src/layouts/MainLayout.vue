<template>
  <div class="relative flex h-screen lg:static bg-surface-50 dark:bg-surface-950">
    <div id="app-sidebar-13"
      class="w-[310px] pl-[30px] bg-surface-50 dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-start px-4 py-4">
          <div class="mx-auto">
            <img src="../assets/learnfrontend-logo.svg" class="h-[70px] mx-auto w-[200px]" />
          </div>
        </div>
        <div class="flex flex-col flex-1 gap-4 p-2 overflow-y-auto">
          <ul class="flex flex-col gap-1 p-0 m-0 list-none">
            <li>
              <div v-styleclass="{
                selector: '@next',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-slidedown',
                leaveToClass: 'hidden',
                leaveActiveClass: 'animate-slideup'
              }"
                class="flex items-center gap-4 p-3 transition-colors duration-150 border border-transparent rounded-md cursor-pointer text-surface-900 dark:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 hover:border hover:border-surface-200 dark:hover:border-surface-700">
                <span class="text-base font-semibold leading-tight">Home</span>
                <i class="pi pi-chevron-down text-sm! leading-none! text-surface-500 dark:text-surface-400 ml-auto" />
              </div>
              <ul class="flex flex-col gap-1 p-0 m-0 overflow-hidden list-none">
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-home text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">My Learning</span>
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-book text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">Courses</span>
                    <!-- <Badge value="8" severity="contrast"
                      class="ml-auto h-5! min-w-5! text-xs! font-bold! leading-tight! rounded-xl!" /> -->
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-users text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">Team</span>
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-comment text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">Messages</span>
                    <Badge value="2" severity="secondary"
                      class="ml-auto h-5! min-w-5! text-xs! font-bold! leading-tight! rounded-xl!" />
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-calendar text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">Calendar</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>

          <div class="h-px bg-surface-200 dark:bg-surface-700" />

          <ul class="flex flex-col gap-1 p-0 m-0 list-none">
            <li>
              <div v-styleclass="{
                selector: '@next',
                enterFromClass: 'hidden',
                enterActiveClass: 'animate-slidedown',
                leaveToClass: 'hidden',
                leaveActiveClass: 'animate-slideup'
              }"
                class="flex items-center gap-4 p-3 transition-colors duration-150 border border-transparent rounded-md cursor-pointer text-surface-900 dark:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 hover:border hover:border-surface-200 dark:hover:border-surface-700">
                <span class="text-base font-semibold leading-tight">Your Networks</span>
                <i class="pi pi-chevron-down text-sm! leading-none! text-surface-500 dark:text-surface-400 ml-auto" />
              </div>
              <ul class="flex flex-col gap-1 p-0 m-0 overflow-hidden list-none">
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <span
                      class="flex items-center justify-center p-1 border rounded-md bg-violet-100 dark:bg-violet-900 border-violet-200 dark:border-violet-800">
                      <i class="pi pi-sparkles text-xs! leading-none! text-violet-600 dark:text-violet-300" />
                    </span>
                    <span class="text-base font-medium leading-tight">Front-End Developers</span>
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-100 dark:hover:border-surface-700 group">
                    <span
                      class="flex items-center justify-center p-1 border rounded-md bg-amber-100 dark:bg-amber-900 border-amber-200 dark:border-amber-800">
                      <i class="pi pi-wrench text-xs! leading-none! text-amber-600 dark:text-amber-300" />
                    </span>
                    <span class="text-base font-medium leading-tight">Back-End Developers</span>
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <span
                      class="flex items-center justify-center p-1 border rounded-md bg-lime-100 dark:bg-lime-900 border-lime-200 dark:border-lime-800">
                      <i class="pi pi-palette text-xs! leading-none! text-lime-600 dark:text-lime-300" />
                    </span>
                    <span class="text-base font-medium leading-tight">UI/UX Designers</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div class="p-2">
          <ul class="flex flex-col gap-1 p-0 m-0 list-none">
            <li>
              <a
                class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                <i
                  class="pi pi-question-circle text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                <span class="text-base font-medium leading-tight">Help</span>
              </a>
            </li>
            <li>
              <RouterLink to="/settings"
                class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                <i
                  class="pi pi-cog text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                <span class="text-base font-medium leading-tight">Settings</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex flex-col flex-auto h-screen bg-surface-50 dark:bg-surface-950 p-7 md:p-8">
      <div
        class="flex flex-col flex-auto p-8 border shadow-md 2xl:p-12 p-overflow-auto bg-surface-0 dark:bg-surface-900 rounded-xl border-surface-200 dark:border-surface-700">
        <div class="flex items-center justify-between w-full gap-2">
          <div class="flex items-center gap-4 md:gap-8">
            <a v-styleclass="{
              selector: '#app-sidebar-13',
              enterFromClass: 'hidden',
              enterActiveClass: 'animate-fadeinleft',
              leaveToClass: 'hidden',
              leaveActiveClass: 'animate-fadeoutleft',
              hideOnOutsideClick: true
            }" class="block cursor-pointer lg:hidden text-surface-700 dark:text-surface-100">
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
import Badge from 'primevue/badge';
</script>
