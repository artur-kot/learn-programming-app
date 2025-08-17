<template>
  <div class="flex flex-col">
    <div class="flex flex-col flex-auto">
      <div class="flex-auto rounded-t-3xl bg-surface-0 dark:bg-surface-900">
        <div class="flex flex-col w-full gap-2 pb-8">
          <h2 class="mt-0 text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">Settings</h2>
          <p class="mt-0 leading-tight text-surface-500 dark:text-surface-300">Manage your settings</p>
        </div>
        <Divider />
        <div class="grid grid-cols-12 gap-4 py-6 lg:py-8">
          <div class="col-span-12 lg:col-span-2">
            <ul class="flex-col justify-start hidden p-0 m-0 list-none lg:flex">
              <li class="border-l-2 border-primary -ml-[2px]">
                <a class="flex items-center px-4 py-3 font-medium cursor-pointer text-primary">
                  <i class="pi pi-user mr-2 text-base! leading-normal!" />
                  <span>Profile</span>
                </a>
              </li>
              <li
                class="border-l-2 border-surface-200 dark:border-surface-700 -ml-[2px] hover:border-primary hover:text-primary transition-colors">
                <a
                  class="flex items-center px-4 py-3 font-medium cursor-pointer text-surface-700 dark:text-surface-200">
                  <i class="pi pi-cog mr-2 text-base! leading-normal!" />
                  <span>Account</span>
                </a>
              </li>
              <li
                class="border-l-2 border-surface-200 dark:border-surface-700 -ml-[2px] hover:border-primary hover:text-primary transition-colors">
                <a
                  class="flex items-center px-4 py-3 font-medium cursor-pointer text-surface-700 dark:text-surface-200">
                  <i class="pi pi-palette mr-2 text-base! leading-normal!" />
                  <span>Appearance</span>
                </a>
              </li>
              <li
                class="border-l-2 border-surface-200 dark:border-surface-700 -ml-[2px] hover:border-primary hover:text-primary transition-colors">
                <a
                  class="flex items-center px-4 py-3 font-medium cursor-pointer text-surface-700 dark:text-surface-200">
                  <i class="pi pi-sun mr-2 text-base! leading-normal!" />
                  <span>Accessibility</span>
                </a>
              </li>
              <li
                class="border-l-2 border-surface-200 dark:border-surface-700 -ml-[2px] hover:border-primary hover:text-primary transition-colors">
                <a
                  class="flex items-center px-4 py-3 font-medium cursor-pointer text-surface-700 dark:text-surface-200">
                  <i class="pi pi-bell mr-2 text-base! leading-normal!" />
                  <span>Notifications</span>
                </a>
              </li>
            </ul>

            <div class="lg:hidden">
              <div class="overflow-x-auto border-b border-surface-200 dark:border-surface-700">
                <ul class="flex flex-row justify-start p-0 m-0 list-none whitespace-nowrap">
                  <li v-for="(item, i) in items" :key="i" class="relative px-4 py-3 transition-colors" :class="{
                    'text-primary': i === 0,
                    'text-surface-700 dark:text-surface-200 hover:text-primary hover:bottom-line-primary': i !== 0
                  }">
                    <a class="flex items-center font-medium cursor-pointer">
                      <i :class="[item.icon, 'mr-2', 'text-base!', 'leading-normal!']" />
                      <span>{{ item.label }}</span>
                    </a>
                    <div class="absolute bottom-0 left-0 right-0 h-[2px] transition-colors" :class="{
                      'bg-primary': i === 0,
                      'bg-surface-200 dark:bg-surface-700': i !== 0
                    }" />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            class="flex-auto col-span-12 p-8 lg:col-span-10 xl:col-span-10 bg-surface-0 dark:bg-surface-900 rounded-2xl">
            <div class="flex flex-col gap-8">
              <div class="text-lg font-semibold leading-tight text-surface-900 dark:text-surface-0">Profile</div>

              <div class="flex flex-col-reverse gap-12 md:flex-row">
                <div class="flex flex-col flex-auto gap-6">
                  <div class="flex flex-col gap-2">
                    <label for="name" class="text-surface-900 dark:text-surface-0">Name</label>
                    <InputText id="name" type="text" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="bio" class="text-surface-900 dark:text-surface-0">Bio</label>
                    <Textarea id="bio" type="text" rows="5" :auto-resize="true" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="website" class="text-surface-900 dark:text-surface-0">URL</label>
                    <InputGroup>
                      <InputGroupAddon>www</InputGroupAddon>
                      <InputText id="website" type="text" class="w-full" />
                    </InputGroup>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label for="company" class="text-surface-900 dark:text-surface-0">Company</label>
                    <InputText id="company" type="text" class="w-full" />
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-surface-900 dark:text-surface-0">Avatar</label>
                  <div class="flex flex-col gap-4 lg:items-center">
                    <img
                      src="https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/formlayout/form-avatar.jpg"
                      class="w-24 h-24 rounded-lg" />

                    <FileUpload mode="basic" name="avatar" url="./upload.php" accept="image/*" custom-upload auto
                      class="p-button-outlined p-button-secondary" :max-file-size="1000000" choose-label="Upload"
                      choose-icon="pi pi-upload" :pt="{
                        root: {
                          class: 'flex! justify-start! lg:justify-center!'
                        }
                      }" />
                  </div>
                </div>
              </div>

              <div>
                <Button label="Update Profile" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue';

const items = ref([
  {
    label: 'Profile',
    icon: 'pi pi-user'
  },
  {
    label: 'Account',
    icon: 'pi pi-cog'
  },
  {
    label: 'Appearance',
    icon: 'pi pi-palette'
  },
  {
    label: 'Accessibility',
    icon: 'pi pi-sun'
  },
  {
    label: 'Notifications',
    icon: 'pi pi-bell'
  }
]);

const selectedNav = ref('Dashboard');
</script>
