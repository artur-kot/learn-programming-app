<template>
  <div class="relative flex h-screen bg-surface-50 dark:bg-surface-950">
    <!-- Explorer Sidebar -->
    <aside
      class="w-[350px] pl-[30px] dark:bg-surface-950 h-screen hidden lg:block shrink-0 absolute lg:static top-0 z-10 select-none lg:py-8 shadow-lg lg:shadow-none"
    >
      <!-- Header with back -->
      <div class="flex items-center gap-2 px-3 py-2">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          rounded
          aria-label="Back to Course"
          class="self-start"
          @click="goBackToCourse"
        />
        <h3 class="text-base font-medium truncate text-surface-900 dark:text-surface-100">
          {{ normalizedExerciseLabel || 'Exercise' }}
        </h3>
      </div>

      <!-- VS Code-like Explorer -->
      <div class="px-2">
        <div
          class="px-3 py-2 text-xs font-semibold tracking-wider text-surface-500 dark:text-surface-400"
        >
          FILE EXPLORER
        </div>
        <div class="mx-1 overflow-y-auto rounded-md">
          <ul>
            <li
              v-for="f in files"
              :key="f"
              class="flex items-center gap-2 px-3 py-1.5 text-sm rounded cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800"
              :class="{
                'bg-surface-100 dark:bg-surface-800': isSelected(f),
              }"
              @click="openFile(f)"
              :title="f"
            >
              <i
                :class="fileIconClass(f)"
                class="w-4 text-xs text-surface-600 dark:text-surface-300"
              ></i>
              <span class="flex-1 truncate text-surface-800 dark:text-surface-200">{{
                basename(f)
              }}</span>
              <i
                v-if="editor.dirtyFiles.has(f)"
                class="pi pi-circle-fill text-[8px] text-yellow-500"
              ></i>
            </li>
          </ul>
        </div>
      </div>
    </aside>

    <!-- Content (match CourseLayout spacing and container) -->
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
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EXT_ICON_MAP } from '~/renderer/constants/fileIcons.js';
import { useEditorStore } from '~/renderer/stores';

const route = useRoute();
const router = useRouter();
const editor = useEditorStore();

const slug = computed(() => route.params.slug as string);
const exercisePath = computed(() => (route.query.exercise as string) || '');
const selectedFile = computed(() => (route.query.file as string) || '');

const files = ref<string[]>([]);

function basename(p: string) {
  const parts = p.split('/');
  return parts[parts.length - 1] || p;
}

function normalizeExerciseName(name: string) {
  // remove leading numeric prefixes like `1_`, `2_1_` etc
  let s = name.replace(/^(\d+_)+/, '').replace(/^\d+/, '');
  // replace separators with spaces
  s = s.replace(/[-_]+/g, ' ').trim();
  // capitalize each word
  s = s
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
  return s;
}

const exerciseLabel = computed(() => basename(exercisePath.value || ''));
const normalizedExerciseLabel = computed(() => normalizeExerciseName(exerciseLabel.value));

function fileIconClass(f: string) {
  const name = basename(f);
  const lastDot = name.lastIndexOf('.');
  const ext = lastDot >= 0 ? name.slice(lastDot + 1).toLowerCase() : '';

  const parts = name.toLowerCase().split('.');
  if (parts.length > 2) {
    const lastTwo = parts.slice(-2).join('.');
    if ((EXT_ICON_MAP as any)[lastTwo]) return (EXT_ICON_MAP as any)[lastTwo];
  }
  if ((EXT_ICON_MAP as any)[ext]) return (EXT_ICON_MAP as any)[ext];
  return 'pi pi-file';
}

function isSelected(f: string) {
  return selectedFile.value === f;
}

function openFile(f: string) {
  router.push({
    name: 'exercise',
    params: { slug: slug.value },
    query: { exercise: exercisePath.value, file: f },
  });
}

async function loadFiles() {
  if (!slug.value || !exercisePath.value) return;
  try {
    const { files: list } = await window.electronAPI.courseListFiles({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    files.value = list;
    // pick first file if none selected
    if (!selectedFile.value && list.length) {
      openFile(list[0]!);
    }
  } catch {
    files.value = [];
  }
}

function goBackToCourse() {
  // go back without exercise param to unselect in CourseLayout
  router.push({ name: 'course', params: { slug: slug.value } });
}

watch(
  () => exercisePath.value,
  () => loadFiles(),
  { immediate: true }
);
</script>

<style scoped></style>
