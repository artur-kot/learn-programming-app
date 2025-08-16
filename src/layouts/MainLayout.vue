<template>
  <div class="relative flex h-screen lg:static bg-surface-50 dark:bg-surface-950">
    <div id="app-sidebar-13"
      class="w-[310px] pl-[30px] bg-surface-50 dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none">
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-start px-4 py-4">
          <div class="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 33 32" fill="none">
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M7.59219 2.87829C6.44766 3.67858 5.4127 4.62478 4.51426 5.68992C8.1857 5.34906 12.8501 5.90564 18.2655 8.61335C24.0484 11.5047 28.705 11.6025 31.9458 10.9773C31.6517 10.087 31.2815 9.23135 30.843 8.41791C27.1332 8.80919 22.3772 8.29127 16.8345 5.51998C13.3148 3.76014 10.2122 3.03521 7.59219 2.87829ZM28.6759 5.33332C25.7462 2.06 21.4887 0 16.75 0C15.3584 0 14.0081 0.177686 12.7209 0.511584C14.4643 0.987269 16.3163 1.68319 18.2655 2.65781C22.3236 4.68682 25.8271 5.34013 28.6759 5.33332ZM32.6387 14.1025C28.7235 14.8756 23.317 14.7168 16.8345 11.4755C10.774 8.44527 5.95035 8.48343 2.69712 9.20639C2.5292 9.24367 2.36523 9.28287 2.20522 9.32367C1.7793 10.25 1.43931 11.2241 1.19536 12.2356C1.45591 12.166 1.72514 12.0998 2.00293 12.0381C5.94966 11.161 11.5261 11.1991 18.2655 14.5689C24.3261 17.5991 29.1497 17.561 32.4029 16.838C32.5144 16.8133 32.6242 16.7877 32.7322 16.7613C32.7441 16.509 32.75 16.2552 32.75 16C32.75 15.358 32.7122 14.7248 32.6387 14.1025ZM32.2098 20.1378C28.3326 20.8157 23.0836 20.5555 16.8345 17.431C10.774 14.4008 5.95035 14.439 2.69712 15.1619C1.975 15.3223 1.32539 15.5178 0.752344 15.7241C0.750782 15.8158 0.75 15.9078 0.75 16C0.75 24.8366 7.91344 32 16.75 32C24.1557 32 30.3862 26.9687 32.2098 20.1378Z"
                class="fill-surface-900 dark:fill-surface-0" />
            </svg>
            <span class="text-lg font-semibold leading-tight text-surface-900 dark:text-surface-0">Trimzales</span>
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
                    <span class="text-base font-medium leading-tight">Dashboard</span>
                  </a>
                </li>
                <li>
                  <a
                    class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                    <i
                      class="pi pi-bookmark text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                    <span class="text-base font-medium leading-tight">Bookmarks</span>
                    <Badge value="8" severity="contrast"
                      class="ml-auto h-5! min-w-5! text-xs! font-bold! leading-tight! rounded-xl!" />
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
              <a
                class="flex items-center gap-2 p-3 transition-colors duration-150 border border-transparent rounded-lg cursor-pointer text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 hover:border hover:border-surface-200 dark:hover:border-surface-700 group">
                <i
                  class="pi pi-cog text-base! leading-none! text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                <span class="text-base font-medium leading-tight">Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex flex-col flex-auto min-h-screen bg-surface-50 dark:bg-surface-950 p-7 md:p-8">
      <div
        class="flex flex-col flex-auto p-8 border shadow-md bg-surface-0 dark:bg-surface-900 rounded-xl border-surface-200 dark:border-surface-700">
        <div class="flex items-center justify-between w-full gap-2 mb-8 md:gap-8">
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
