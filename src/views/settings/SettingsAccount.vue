<template>
  <div class="flex flex-col gap-8">
    <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-0">Account Settings</h1>

    <!-- Account Info Form -->
    <form @submit.prevent="onSaveProfile"
      class="flex flex-col gap-6 p-6 border rounded-xl border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40">
      <div class="flex flex-col gap-1">
        <h2 class="m-0 text-lg font-medium text-surface-900 dark:text-surface-0">Account Information</h2>
        <p class="mt-1 mb-0 text-sm leading-relaxed text-surface-500 dark:text-surface-300">View and edit basic account
          details.</p>
      </div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-surface-700 dark:text-surface-200">Email</label>
          <InputText v-model="email" disabled class="w-full rounded-md shadow-sm opacity-90" />
        </div>
        <div class="flex flex-col gap-2">
          <label for="displayName" class="text-sm font-medium text-surface-700 dark:text-surface-200">First Name</label>
          <InputText id="displayName" v-model="displayName" class="w-full rounded-md shadow-sm"
            placeholder="Enter First Name" />
        </div>
      </div>
      <div class="flex items-center gap-4">
        <Button type="submit" label="Save" :disabled="saveDisabled" :loading="saving"
          icon="pi pi-save text-base! leading-none!" />
        <span v-if="saveMessage"
          :class="['text-sm', saveError ? 'text-red-500' : 'text-green-600 dark:text-green-400']">{{ saveMessage
          }}</span>
      </div>
    </form>

    <!-- Logout Section -->
    <div
      class="flex flex-col gap-4 p-6 border rounded-xl border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/40">
      <div>
        <h2 class="m-0 text-lg font-medium text-surface-900 dark:text-surface-0">Logout</h2>
        <p class="mt-1 mb-0 text-sm leading-relaxed text-surface-500 dark:text-surface-300">Sign out of your account on
          this device.</p>
      </div>
      <div class="flex items-center gap-4">
        <Button label="Logout" icon="pi pi-sign-out text-base! leading-none!" severity="danger"
          :loading="auth.loading || signingOut" @click="onLogout" />
        <span v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const errorMessage = ref('');
const signingOut = ref(false);

// Profile form state
const email = ref('');
const displayName = ref('');
const originalDisplayName = ref('');
const saving = ref(false);
const saveMessage = ref('');
const saveError = ref(false);

// Initialize when user changes
watch(() => auth.user, (u) => {
  email.value = u?.email || '';
  const metaDisplay = (u?.user_metadata as any)?.display_name || '';
  displayName.value = metaDisplay;
  originalDisplayName.value = metaDisplay;
}, { immediate: true });

const saveDisabled = computed(() => saving.value || displayName.value.trim() === originalDisplayName.value.trim());

const onSaveProfile = async () => {
  if (saveDisabled.value) return;
  saveMessage.value = '';
  saveError.value = false;
  saving.value = true;
  try {
    await auth.updateProfile({ display_name: displayName.value.trim() });
    originalDisplayName.value = displayName.value.trim();
    saveMessage.value = 'Saved';
  } catch (e) {
    saveError.value = true;
    saveMessage.value = auth.error || 'Save failed';
  } finally {
    saving.value = false;
    // Clear message after a delay
    setTimeout(() => { saveMessage.value = ''; }, 3000);
  }
};

const onLogout = async () => {
  if (signingOut.value) return;
  errorMessage.value = '';
  signingOut.value = true;
  try {
    await auth.signOut();
    router.replace({ name: 'login' });
  } catch (e) {
    errorMessage.value = auth.error || 'Logout failed';
  } finally {
    signingOut.value = false;
  }
};
</script>
