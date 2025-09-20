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
          </div>

          <Tree
            :value="nodes"
            selectionMode="single"
            :filter="true"
            filterMode="lenient"
            v-model:selectionKeys="selectedKeys"
            :expandedKeys="expandedKeys"
            :expandOnClick="false"
            @update:selectionKeys="onSelectionUpdate"
            @node-expand="onNodeExpand"
          >
            <template #default="slotProps">
              <span :style="{ fontWeight: slotProps.node.children ? 'bold' : 'normal' }">
                {{ slotProps.node.label }}
              </span>
            </template>
          </Tree>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '../stores';

const route = useRoute();
const router = useRouter();
const course = useCourseStore();

const slug = computed(() => route.params.slug as string);
const title = computed(() =>
  slug.value ? slug.value.charAt(0).toUpperCase() + slug.value.slice(1) : ''
);
const nodes = computed(() => course.nodes);

const selectedKeys = ref<Record<string, boolean>>({});
const expandedKeys = ref<Record<string, boolean>>({});

function goHome() {
  router.push('/');
}

function onSelectionUpdate(keys: Record<string, boolean>) {
  selectedKeys.value = keys;
  const key = Object.keys(keys).find((k) => keys[k]);
  if (key) {
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
    if (s) await course.loadTree(s);
    // if we navigated with exercise in query, reflect it into selection
    const q = (route.query.exercise as string) || '';
    if (q) selectedKeys.value = { [q]: true };
  },
  { immediate: true }
);

onMounted(async () => {
  if (slug.value) await course.loadTree(slug.value);
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
