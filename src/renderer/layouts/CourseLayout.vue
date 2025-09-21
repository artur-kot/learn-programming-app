<template>
  <div class="relative flex h-screen lg:static bg-surface-50 dark:bg-surface-950">
    <aside
      id="course-sidebar"
      class="w-[350px] pl-[30px] dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none"
    >
      <div class="flex flex-col h-full">
        <div class="flex flex-col flex-1 gap-4 p-2 overflow-y-auto">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-arrow-left"
              severity="secondary"
              text
              rounded
              aria-label="Back to Home"
              class="self-start"
              @click="goHome"
            />
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {{ title }}
            </h2>
            <div class="ml-auto">
              <Button
                v-if="updateAvailable"
                size="small"
                :label="syncing ? 'Syncing…' : 'Sync'"
                icon="pi pi-refresh"
                :loading="syncing"
                severity="help"
                @click="syncRepo"
              />
            </div>
          </div>

          <!-- Custom Exercise Tree -->
          <ExerciseTree
            :nodes="nodes"
            :selectionKeys="selectedKeys"
            :expandedKeys="expandedKeys"
            @update:selectionKeys="onSelectionUpdate"
            @node-expand="onNodeExpand"
          />
        </div>
      </div>
    </aside>

    <!-- Content -->
    <div class="flex flex-col flex-auto h-screen bg-surface-50 dark:bg-surface-950 p-7 md:p-8">
      <div
        class="flex flex-col flex-auto p-4 overflow-auto border shadow-md bg-surface-0 dark:bg-surface-900 rounded-xl border-surface-200 dark:border-surface-700"
      >
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '../stores';
import { useToast } from 'primevue/usetoast';
import ExerciseTree from '../components/ExerciseTree.vue';

const route = useRoute();
const router = useRouter();
const course = useCourseStore();
const toast = useToast();

const slug = computed(() => route.params.slug as string);
const title = computed(() =>
  slug.value ? slug.value.charAt(0).toUpperCase() + slug.value.slice(1) : ''
);
const nodes = computed(() => course.nodes);

const selectedKeys = ref<Record<string, boolean>>({});
const expandedKeys = ref<Record<string, boolean>>({});
const lastSelectedKey = ref<string>('');

const updateAvailable = ref(false);
const syncing = ref(false);
const DEFAULT_BRANCH = 'main';

function goHome() {
  router.push('/');
}

async function checkUpdates() {
  if (!slug.value) return;
  try {
    const res = await window.electronAPI.gitCheckUpdates({
      slug: slug.value,
      branch: DEFAULT_BRANCH,
    });
    updateAvailable.value = !!res.updateAvailable;
  } catch {
    updateAvailable.value = false;
  }
}

async function syncRepo() {
  if (!slug.value) return;
  try {
    syncing.value = true;
    await window.electronAPI.gitPull({ slug: slug.value, branch: DEFAULT_BRANCH });
    await course.loadTree(slug.value);
    toast.add({
      severity: 'success',
      summary: 'Synchronized',
      detail: 'Course updated from repo',
      life: 3000,
    });
    // refresh app to ensure content reflects updates
    window.location.reload();
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Sync failed',
      detail: e?.message ?? String(e),
      life: 5000,
    });
  } finally {
    syncing.value = false;
  }
}

function onSelectionUpdate(keys: Record<string, boolean>) {
  // Prevent clearing selection once something was selected at least once
  const key = Object.keys(keys).find((k) => keys[k]);
  if (!key && lastSelectedKey.value) {
    // restore previous
    nextTick(() => {
      selectedKeys.value = { [lastSelectedKey.value]: true };
    });
    return;
  }

  selectedKeys.value = keys;
  if (key) {
    lastSelectedKey.value = key;
    course.setExercise(key);
    router.push({ name: 'course', params: { slug: slug.value }, query: { exercise: key } });
  }
}

function onNodeExpand(e: any) {
  if (e?.node?.key) expandedKeys.value[e.node.key] = true;
}

watch(
  () => slug.value,
  async (s) => {
    if (s) {
      await course.loadTree(s);
      await checkUpdates();
    }
    // if we navigated with exercise in query, reflect it into selection
    const q = (route.query.exercise as string) || '';
    if (q) {
      selectedKeys.value = { [q]: true };
      lastSelectedKey.value = q;
    } else {
      selectedKeys.value = {};
      lastSelectedKey.value = '';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (slug.value) await course.loadTree(slug.value);
  await checkUpdates();
});
</script>

<style scoped>
/* Subtle rounded border for selected tree item */
:deep(#course-sidebar .p-tree .p-treenode-content) {
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.35rem 0.5rem; /* increase hit area */
  cursor: pointer;
}

:deep(#course-sidebar .p-tree .p-treenode-content:hover) {
  background: color-mix(in oklab, var(--p-surface-200), transparent 70%);
}

:deep(#course-sidebar .p-tree .p-treenode-content.p-highlight) {
  outline: 1px solid var(--p-content-border-color, rgba(0, 0, 0, 0.12));
  outline-offset: 2px;
}
</style>
