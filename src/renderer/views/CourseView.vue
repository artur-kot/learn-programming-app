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

    <div v-else class="flex flex-col h-full gap-3">
      <!-- Top bar with file tabs and actions -->
      <div class="flex items-center justify-between gap-3">
        <!-- Left: Save split button + file tabs -->
        <div class="flex items-center gap-2 min-w-0">
          <SplitButton
            size="small"
            label="Save"
            icon="pi pi-save"
            :model="saveMenuItems"
            :disabled="dirtyFiles.size === 0"
            @click="save"
          />

          <div class="flex items-center gap-2 overflow-x-auto">
            <div
              v-for="f in files"
              :key="f"
              class="px-3 py-2 rounded-md cursor-pointer whitespace-nowrap"
              :class="
                selectedFile === f
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200'
              "
              @click="selectFile(f)"
            >
              {{ f }}
              <i
                v-if="dirtyFiles.has(f)"
                class="ml-2 text-xs pi pi-circle-fill"
                :title="'Unsaved changes'"
              />
            </div>
          </div>
        </div>

        <!-- Right: actions -->
        <div class="flex items-center gap-2">
          <Button size="small" label="Run" icon="pi pi-play" @click="run" />

          <!-- More (Solution, Reset) -->
          <Button
            size="small"
            text
            rounded
            icon="pi pi-ellipsis-v"
            aria-label="More"
            @click="toggleMoreMenu"
          />
          <Menu ref="moreMenu" :model="moreMenuItems" :popup="true" />

          <!-- Check (renamed Test) - far right, green -->
          <Button size="small" label="Check" icon="pi pi-check" severity="success" @click="test" />
        </div>
      </div>

      <!-- Editor + Description -->
      <div class="grid flex-1 min-h-0 grid-cols-12 gap-3">
        <div class="min-h-0 col-span-12 xl:col-span-7 2xl:col-span-8">
          <div
            class="h-full overflow-hidden border rounded-lg border-surface-200 dark:border-surface-700"
          >
            <MonacoEditor
              v-if="selectedFile"
              class="h-full"
              :value="editorValue"
              :language="languageFor(selectedFile)"
              theme="vs-dark"
              :options="{ automaticLayout: true, fontSize: 14, minimap: { enabled: false } }"
              @change="onEditorChange"
            />
            <div
              v-else
              class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
            >
              Select a file to start editing
            </div>
          </div>
        </div>
        <div class="col-span-12 xl:col-span-5 2xl:col-span-4">
          <div
            class="h-full p-4 overflow-auto border rounded-lg bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
          >
            <div class="mb-2 text-sm text-surface-500 dark:text-surface-400">Description</div>
            <div
              v-if="markdownHtml"
              v-html="markdownHtml"
              class="prose prose-invert max-w-none"
            ></div>
            <div v-else class="text-surface-500 dark:text-surface-400">
              No description provided.
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Reset Modal -->
      <Dialog
        v-model:visible="confirmResetVisible"
        modal
        header="Reset exercise?"
        :style="{ width: '28rem' }"
      >
        <div class="text-surface-700 dark:text-surface-200">
          This will discard all your changes in this exercise and restore initial files. Continue?
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <Button label="Cancel" text @click="confirmResetVisible = false" />
            <Button label="Reset" severity="danger" @click="doReset" />
          </div>
        </template>
      </Dialog>

      <!-- Terminal Emulator -->
      <div
        class="border rounded-lg bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
      >
        <div
          class="flex items-center justify-between px-3 py-2 border-b border-surface-200 dark:border-surface-700"
        >
          <div class="font-medium text-surface-700 dark:text-surface-200">Terminal</div>
          <div class="flex items-center gap-2">
            <Button size="small" icon="pi pi-trash" text rounded @click="clearTerminal" />
          </div>
        </div>
        <div class="h-40 p-3 overflow-auto font-mono text-sm">
          <pre
            class="m-0 whitespace-pre-wrap"
          ><span v-for="(line, idx) in terminal" :key="idx" :class="line.type === 'stderr' ? 'text-red-500' : 'text-surface-800 dark:text-surface-200'">{{ line.text }}</span></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore } from '~/renderer/stores';
import { useToast } from 'primevue/usetoast';
import { marked } from 'marked';
import MonacoEditor from '@guolao/vue-monaco-editor';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const course = useCourseStore();

const slug = ref<string>(route.params.slug as string);
const exercisePath = computed(() => (route.query.exercise as string) || '');
const hasCourse = ref<boolean | null>(null);
const busy = ref(false);
const updateText = ref('');

const files = ref<string[]>([]);
const selectedFile = ref<string>('');
const editorValue = ref('');
const originalContent = ref<string>('');
const dirtyFiles = ref<Set<string>>(new Set());
const terminal = ref<{ type: 'stdout' | 'stderr'; text: string }[]>([]);
const markdownHtml = ref<string>('');
const confirmResetVisible = ref(false);

// Per-file buffers to support Save All
const fileBuffers = ref(new Map<string, { value: string; original: string }>());

// Menus
const moreMenu = ref();
const moreMenuItems = computed(() => [
  { label: 'Solution', icon: 'pi pi-lightbulb', command: () => applySolution() },
  { label: 'Reset', icon: 'pi pi-undo', command: () => askReset() },
]);
const saveMenuItems = computed(() => [
  {
    label: 'Save All',
    icon: 'pi pi-copy',
    command: () => saveAll(),
    disabled: dirtyFiles.value.size === 0,
  },
]);

const DEFAULT_BRANCH = 'main';

function languageFor(f: string) {
  if (f.endsWith('.ts')) return 'typescript';
  if (f.endsWith('.js')) return 'javascript';
  if (f.endsWith('.json')) return 'json';
  if (f.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

function addTerminal(type: 'stdout' | 'stderr', text: string) {
  terminal.value.push({ type, text });
}
function clearTerminal() {
  terminal.value = [];
}

function markDirty(file: string, isDirty: boolean) {
  const next = new Set(dirtyFiles.value);
  if (isDirty) next.add(file);
  else next.delete(file);
  dirtyFiles.value = next;
}

async function loadFiles() {
  if (!exercisePath.value) return;
  try {
    const { files: list } = await window.electronAPI.courseListFiles({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    files.value = list;
    // auto-select first file or keep current if still exists
    if (!selectedFile.value || !list.includes(selectedFile.value)) {
      if (list.length) selectFile(list[0]!);
      else {
        selectedFile.value = '';
        editorValue.value = '';
        originalContent.value = '';
      }
    } else {
      // refresh current content from disk
      await loadFileContent(selectedFile.value);
    }
    await loadMarkdown();
  } catch (e: any) {
    files.value = [];
    selectedFile.value = '';
  }
}

async function loadFileContent(f: string) {
  // If we already have a buffer (user edited before), restore from buffer
  const buf = fileBuffers.value.get(f);
  if (buf) {
    selectedFile.value = f;
    editorValue.value = buf.value;
    originalContent.value = buf.original;
    return;
  }
  const { content } = await window.electronAPI.courseReadFile({
    slug: slug.value,
    exercisePath: exercisePath.value,
    file: f,
  });
  editorValue.value = content;
  originalContent.value = content;
  fileBuffers.value.set(f, { value: content, original: content });
}

async function loadMarkdown() {
  const { markdown } = await window.electronAPI.courseReadMarkdown({
    slug: slug.value,
    exercisePath: exercisePath.value,
  });
  const html = await (marked.parse(markdown || '') as any);
  markdownHtml.value = typeof html === 'string' ? html : '';
}

function selectFile(f: string) {
  selectedFile.value = f;
  loadFileContent(f);
}

function onEditorChange(val: string) {
  editorValue.value = val;
  if (selectedFile.value) {
    const buf = fileBuffers.value.get(selectedFile.value);
    if (buf) {
      buf.value = val;
      originalContent.value = buf.original;
      markDirty(selectedFile.value, buf.value !== buf.original);
    }
  }
}

async function save() {
  if (!selectedFile.value) return;
  const buf = fileBuffers.value.get(selectedFile.value);
  if (!buf) return;
  await window.electronAPI.courseWriteFile({
    slug: slug.value,
    exercisePath: exercisePath.value,
    file: selectedFile.value,
    content: buf.value,
  });
  buf.original = buf.value;
  originalContent.value = editorValue.value;
  markDirty(selectedFile.value, false);
  toast.add({ severity: 'success', summary: 'Saved', detail: selectedFile.value, life: 2000 });
}

async function saveAll() {
  if (dirtyFiles.value.size === 0) return;
  const writes: Promise<any>[] = [];
  for (const f of dirtyFiles.value) {
    const buf = fileBuffers.value.get(f);
    if (!buf) continue;
    writes.push(
      window.electronAPI.courseWriteFile({
        slug: slug.value,
        exercisePath: exercisePath.value,
        file: f,
        content: buf.value,
      })
    );
  }
  await Promise.all(writes);
  for (const f of Array.from(dirtyFiles.value)) {
    const buf = fileBuffers.value.get(f);
    if (buf) buf.original = buf.value;
  }
  dirtyFiles.value = new Set();
  toast.add({ severity: 'success', summary: 'All changes saved', life: 2000 });
}

async function run() {
  clearTerminal();
  await window.electronAPI.courseRun({
    slug: slug.value,
    exercisePath: exercisePath.value,
  });
  // logs listened globally in onMounted
}

async function test() {
  clearTerminal();
  await window.electronAPI.courseTest({
    slug: slug.value,
    exercisePath: exercisePath.value,
  });
}

function askReset() {
  confirmResetVisible.value = true;
}
async function doReset() {
  confirmResetVisible.value = false;
  try {
    await window.electronAPI.courseReset({ slug: slug.value, exercisePath: exercisePath.value });
    dirtyFiles.value = new Set();
    fileBuffers.value.clear();
    await loadFiles();
    toast.add({ severity: 'success', summary: 'Exercise reset', life: 2000 });
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Reset failed',
      detail: e?.message ?? String(e),
      life: 4000,
    });
  }
}

async function applySolution() {
  try {
    await window.electronAPI.courseApplySolution({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    dirtyFiles.value = new Set();
    fileBuffers.value.clear();
    await loadFiles();
    toast.add({ severity: 'success', summary: 'Solution applied', life: 2000 });
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No solution',
      detail: e?.message ?? String(e),
      life: 4000,
    });
  }
}

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
      updateText.value = `Updates available.`;
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
    await loadFiles();
  } catch (e: any) {
    toast.add({
      life: 7000,
    });
  } finally {
    busy.value = false;
  }
}

function toggleMoreMenu(event: MouseEvent) {
  (moreMenu.value as any)?.toggle(event);
}

// Hotkeys: Save (Ctrl/Cmd+S), Save All (Ctrl/Cmd+Alt+S)
function onKeydown(e: KeyboardEvent) {
  const key = e.key?.toLowerCase();
  const isCmd = e.metaKey || e.ctrlKey;
  if (isCmd && key === 's' && !e.altKey) {
    e.preventDefault();
    save();
  } else if (isCmd && e.altKey && key === 's') {
    e.preventDefault();
    saveAll();
  }
}

// Respond when exercise changes (clear buffers and reload)
watch(
  () => exercisePath.value,
  async () => {
    dirtyFiles.value = new Set();
    fileBuffers.value.clear();
    selectedFile.value = '';
    editorValue.value = '';
    originalContent.value = '';
    await loadFiles();
  }
);

// Wire IPC log streams
onMounted(async () => {
  window.addEventListener('keydown', onKeydown);

  await checkExists();
  if (hasCourse.value) {
    await checkForUpdates();
    await loadFiles();
  }

  const offRunLog = window.electronAPI.on?.('course:run-log' as any, (...args: any[]) => {
    const payload = args[0];
    addTerminal(payload.stream, payload.chunk);
  });
  const offTestLog = window.electronAPI.on?.('course:test-log' as any, (...args: any[]) => {
    const payload = args[0];
    addTerminal(payload.stream, payload.chunk);
  });
  const offRunDone = window.electronAPI.on?.('course:run-done' as any, (...args: any[]) => {
    const payload = args[0];
    if (payload?.code === 0) {
      toast.add({ severity: 'success', summary: 'Run finished', life: 2000 });
    } else {
      toast.add({ severity: 'warn', summary: 'Run exited with errors', life: 3000 });
    }
  });
  const offTestDone = window.electronAPI.on?.('course:test-done' as any, (...args: any[]) => {
    const payload = args[0];
    if (payload?.code === 0) {
      toast.add({ severity: 'success', summary: 'All tests passed', life: 2500 });
    } else {
      toast.add({ severity: 'error', summary: 'Tests failed', life: 3500 });
    }
  });

  // Note: in this SPA we don't strictly need to clean up, but keep references if needed
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>
