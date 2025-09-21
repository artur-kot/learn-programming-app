<template>
  <div class="flex flex-col items-stretch h-full">
    <div v-if="hasCourse === false && !busy" class="flex items-center justify-center flex-1">
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

    <div v-else-if="!exercisePath" class="flex items-center justify-center flex-1">
      <div class="text-surface-600 dark:text-surface-300">
        Select an exercise from the left to begin.
      </div>
    </div>

    <div v-else class="flex items-center justify-center flex-1">
      <div class="text-surface-600 dark:text-surface-300">Opening exercise editor…</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '~/renderer/stores';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const course = useCourseStore();

const slug = ref<string>(route.params.slug as string);
const exercisePath = computed(() => (route.query.exercise as string) || '');
const hasCourse = ref<boolean | null>(null);
const busy = ref(false);

const DEFAULT_BRANCH = 'main';

async function checkExists() {
  try {
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
      toast.add({
        severity: 'info',
        summary: 'Updates available',
        detail: `${slug.value} is behind by ${res.behindBy} commits.`,
        life: 6000,
      });
    }
  } catch {}
}

async function download() {
  busy.value = true;
  try {
    await window.electronAPI.gitClone({ slug: slug.value, branch: DEFAULT_BRANCH });
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

// Redirect to Exercise route when exercise is chosen
watch(
  () => exercisePath.value,
  (v) => {
    if (v) {
      router.replace({ name: 'exercise', params: { slug: slug.value }, query: { exercise: v } });
    }
  }
);

onMounted(async () => {
  await checkExists();
  if (hasCourse.value) await checkForUpdates();
  if (exercisePath.value) {
    router.replace({
      name: 'exercise',
      params: { slug: slug.value },
      query: { exercise: exercisePath.value },
    });
  }
});
</script>
