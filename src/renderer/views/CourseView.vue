<template>
  <div class="flex flex-col items-stretch h-full">
    <div v-if="!hasCourse && !busy" class="flex items-center justify-center flex-1">
      <div
        class="flex flex-col items-center gap-4 p-10 rounded-xl bg-surface-0 dark:bg-surface-900"
      >
        <div class="text-lg font-medium text-surface-900 dark:text-surface-0">
          Course not downloaded
        </div>
        <div class="text-surface-600 dark:text-surface-300">
          You need to download this course to get started.
        </div>
        <Button label="Download course" icon="pi pi-download" :loading="busy" @click="download" />
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ slug }}</div>
      <div class="text-sm text-surface-600 dark:text-surface-300" v-if="updateText">
        {{ updateText }}
      </div>
      <!-- Content of a selected lesson would render here -->
      <div class="text-surface-700 dark:text-surface-200">Select a lesson from the sidebar.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCourseStore } from '~/renderer/stores';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const toast = useToast();
const course = useCourseStore();

const slug = ref<string>(route.params.slug as string);
const hasCourse = ref<boolean>(false);
const busy = ref(false);
const updateText = ref('');

const DEFAULT_BRANCH = 'main';

async function checkExists() {
  try {
    // Try listing, if it errors, assume not present
    await course.loadTree(slug.value);
    hasCourse.value = course.nodes.length > 0 || course.error === null;
    return hasCourse.value;
  } catch {
    hasCourse.value = false;
    return false;
  }
}

async function checkForUpdates() {
  try {
    const res = await window.electronAPI.gitCheckUpdates({
      slug: slug.value,
      branch: DEFAULT_BRANCH,
    });
    if (res.updateAvailable) {
      updateText.value = `Updates available (behind by ${res.behindBy}).`;
      toast.add({
        severity: 'info',
        summary: 'Updates available',
        detail: `${slug.value} is behind by ${res.behindBy} commits.`,
        life: 6000,
      });
    } else {
      updateText.value = '';
    }
  } catch (e: any) {
    // ignore if not found
  }
}

async function download() {
  busy.value = true;
  try {
    const repoUrl = `https://github.com/ArturKot95/learn-programming-javascript.git`;
    await window.electronAPI.gitClone({ slug: slug.value, repoUrl, branch: DEFAULT_BRANCH });
    await course.loadTree(slug.value);
    hasCourse.value = true;
    toast.add({
      severity: 'success',
      summary: 'Course downloaded',
      detail: `${slug.value} is ready.`,
      life: 4000,
    });
    await checkForUpdates();
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Download failed',
      detail: e?.message ?? String(e),
      life: 7000,
    });
  } finally {
    busy.value = false;
  }
}

watch(
  () => route.params.slug,
  async (v) => {
    slug.value = String(v || '');
    await checkExists();
    if (hasCourse.value) await checkForUpdates();
  },
  { immediate: true }
);

onMounted(async () => {
  await checkExists();
  if (hasCourse.value) await checkForUpdates();
});
</script>
