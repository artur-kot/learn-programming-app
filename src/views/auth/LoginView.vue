<template>
  <div
    class="flex justify-center h-screen px-12 py-20 bg-no-repeat bg-cover md:px-12 lg:px-20"
    style="
      background:
        linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%),
        linear-gradient(0deg, var(--p-primary-500) 0%, var(--p-primary-500) 100%),
        url('https://fqjltiegiezfetthbags.supabase.co/storage/v1/object/public/block.images/blocks/signin/signin-feature.jpg')
          lightgray 50% / cover no-repeat;
      background-blend-mode: normal, overlay, normal;
    "
  >
    <div class="flex flex-wrap my-auto">
      <div
        class="flex-col hidden w-full gap-10 p-16 md:flex md:w-6/12 bg-white/80 dark:bg-surface-950/70 backdrop-blur-sm rounded-l-2xl"
      >
        <div class="flex items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-14 w-14"
            width="33"
            height="32"
            viewBox="0 0 33 32"
            fill="none"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M7.09219 2.87829C5.94766 3.67858 4.9127 4.62478 4.01426 5.68992C7.6857 5.34906 12.3501 5.90564 17.7655 8.61335C23.5484 11.5047 28.205 11.6025 31.4458 10.9773C31.1517 10.087 30.7815 9.23135 30.343 8.41791C26.6332 8.80919 21.8772 8.29127 16.3345 5.51998C12.8148 3.76014 9.71221 3.03521 7.09219 2.87829ZM28.1759 5.33332C25.2462 2.06 20.9887 0 16.25 0C14.8584 0 13.5081 0.177686 12.2209 0.511584C13.9643 0.987269 15.8163 1.68319 17.7655 2.65781C21.8236 4.68682 25.3271 5.34013 28.1759 5.33332ZM32.1387 14.1025C28.2235 14.8756 22.817 14.7168 16.3345 11.4755C10.274 8.44527 5.45035 8.48343 2.19712 9.20639C2.0292 9.24367 1.86523 9.28287 1.70522 9.32367C1.2793 10.25 0.939308 11.2241 0.695362 12.2356C0.955909 12.166 1.22514 12.0998 1.50293 12.0381C5.44966 11.161 11.0261 11.1991 17.7655 14.5689C23.8261 17.5991 28.6497 17.561 31.9029 16.838C32.0144 16.8133 32.1242 16.7877 32.2322 16.7613C32.2441 16.509 32.25 16.2552 32.25 16C32.25 15.358 32.2122 14.7248 32.1387 14.1025ZM31.7098 20.1378C27.8326 20.8157 22.5836 20.5555 16.3345 17.431C10.274 14.4008 5.45035 14.439 2.19712 15.1619C1.475 15.3223 0.825392 15.5178 0.252344 15.7241C0.250782 15.8158 0.25 15.9078 0.25 16C0.25 24.8366 7.41344 32 16.25 32C23.6557 32 29.8862 26.9687 31.7098 20.1378Z"
              class="fill-surface-900 dark:fill-surface-0"
            />
          </svg>
        </div>
        <div class="flex flex-col gap-2">
          <div class="text-2xl font-semibold leading-tight text-surface-900 dark:text-surface-0">
            Welcome to Bastion
          </div>
          <div class="leading-normal text-surface-900/60 dark:text-surface-0/60">
            Quis vel eros donec ac odio tempor orci dapibus. In hac habitasse platea dictumst
            quisque.
          </div>
        </div>
        <div class="flex flex-col gap-6">
          <div class="flex gap-4">
            <div
              class="flex items-center justify-center rounded-lg h-9 w-9 bg-surface-50 dark:bg-surface-900"
            >
              <i
                class="pi pi-inbox text-base! leading-none! text-surface-900 dark:text-surface-50"
              />
            </div>
            <div class="flex flex-col flex-1 gap-2">
              <div class="font-medium text-surface-900 dark:text-surface-0">Unlimited Inbox</div>
              <div class="leading-normal text-surface-900/60 dark:text-surface-0/60">
                Tincidunt nunc pulvinar sapien et. Vitae purus faucibus ornare suspendisse sed nisi
                lacus sed viverra.
              </div>
            </div>
          </div>
          <div class="flex gap-4">
            <div
              class="flex items-center justify-center rounded-lg h-9 w-9 bg-surface-50 dark:bg-surface-900"
            >
              <i
                class="pi pi-shield text-base! leading-none! text-surface-900 dark:text-surface-50"
              />
            </div>
            <div class="flex flex-col flex-1 gap-2">
              <div class="font-medium text-surface-900 dark:text-surface-0">
                Enterprise Grade Data Security
              </div>
              <div class="leading-normal text-surface-900/60 dark:text-surface-0/60">
                Scelerisque purus semper eget duis at tellus at urna. Sed risus pretium quam
                vulputate.
              </div>
            </div>
          </div>
          <div class="flex gap-4">
            <div
              class="flex items-center justify-center rounded-lg h-9 w-9 bg-surface-50 dark:bg-surface-900"
            >
              <i
                class="pi pi-globe text-base! leading-none! text-surface-900 dark:text-surface-50"
              />
            </div>
            <div class="flex flex-col flex-1 gap-2">
              <div class="font-medium text-surface-900 dark:text-surface-0">Cloud Backups</div>
              <div class="leading-normal text-surface-900/60 dark:text-surface-0/60">
                Egestas sed tempus urna et. Auctor elit sed vulputate mi sit amet mauris commodo.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex flex-col w-full gap-12 px-8 py-16 md:w-6/12 md:px-12 lg:px-24 bg-surface-0 dark:bg-surface-900 rounded-2xl md:rounded-l-none"
      >
        <div class="text-2xl font-medium leading-tight text-surface-900 dark:text-surface-0">
          Login
        </div>
        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label for="email3" class="font-medium text-surface-900 dark:text-surface-0"
              >Email Address</label
            >
            <InputText
              id="email3"
              v-model="email"
              type="text"
              class="w-full rounded-md shadow-sm"
              autocomplete="email"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="password3" class="font-medium text-surface-900 dark:text-surface-0"
              >Password</label
            >
            <InputText
              id="password3"
              v-model="password"
              type="password"
              class="w-full rounded-md shadow-sm"
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            />
          </div>
          <div
            class="flex flex-col items-start justify-between w-full gap-2 sm:flex-row md:flex-col lg:flex-row sm:items-center md:items-start lg:items-center"
          >
            <div class="flex items-center gap-2">
              <Checkbox id="rememberme2" v-model="checked2" :binary="true" />
              <label for="rememberme2" class="text-surface-900 dark:text-surface-0"
                >Remember me</label
              >
            </div>
            <a
              class="font-medium cursor-pointer text-surface-500 dark:text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
              >Forgot your password?</a
            >
          </div>
          <div v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-col gap-6">
          <Button label="Login" class="w-full" :disabled="auth.loading" @click="onSubmit" />
          <Divider align="center">
            <span class="text-surface-500 dark:text-surface-400">or</span>
          </Divider>
          <Button
            label="Sign In with GitHub"
            icon="pi pi-github text-base! leading-none!"
            severity="secondary"
            class="w-full"
          />
        </div>
        <div class="text-center">
          <span class="text-surface-600 dark:text-surface-300">Don't have an account? </span>
          <span class="font-medium cursor-pointer text-primary hover:text-primary-emphasis"
            >Sign up</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Divider from 'primevue/divider';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useRouter, useRoute } from 'vue-router';

const checked2 = ref(true);
const email = ref('');
const password = ref('');
const errorMessage = ref('');
const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const onSubmit = async () => {
  errorMessage.value = '';
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter email and password';
    return;
  }
  try {
    await auth.signInWithPassword(email.value, password.value);
    const redirect = route.query.redirect ? String(route.query.redirect) : '/';
    router.replace(redirect);
  } catch (e) {
    errorMessage.value = auth.error || 'Login failed';
  }
};
</script>
