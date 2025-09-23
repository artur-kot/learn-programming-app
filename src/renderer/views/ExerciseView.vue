<template>
  <div class="flex flex-col h-screen min-h-0 gap-3">
    <!-- Top bar with actions only -->
    <div class="flex items-center justify-between gap-3">
      <!-- Left: Save split button -->
      <div class="flex items-center min-w-0 gap-2">
        <SplitButton
          size="small"
          label="Save"
          icon="pi pi-save"
          :model="saveMenuItems"
          :disabled="dirtyCount === 0"
          severity="secondary"
          @click="save"
        />
      </div>

      <!-- Right: actions -->
      <div class="flex items-center gap-2">
        <i
          v-if="completed"
          class="text-green-500 pi pi-check-circle"
          :title="'Exercise completed'"
        />
        <Button
          size="small"
          text
          rounded
          icon="pi pi-ellipsis-v"
          aria-label="More"
          @click="toggleMoreMenu"
        />
        <Menu ref="moreMenu" :model="moreMenuItems" :popup="true" />
        <Button size="small" label="Run" icon="pi pi-play" severity="contrast" @click="run" />
        <Button
          v-if="!justCompleted"
          size="small"
          label="Check"
          icon="pi pi-check"
          severity="success"
          @click="test"
        />
        <Button
          v-else-if="hasNextExercise"
          size="small"
          label="Next"
          icon="pi pi-arrow-right"
          iconPos="right"
          severity="info"
          @click="goNext"
        />
      </div>
    </div>

    <!-- Editor + Description -->
    <div class="grid flex-1 min-w-0 min-h-0 grid-cols-12 gap-3">
      <div class="min-w-0 min-h-0 col-span-7 2xl:col-span-8">
        <div
          class="h-full overflow-hidden border rounded-lg border-surface-200 dark:border-surface-700"
        >
          <CodeEditor
            v-if="selectedFile"
            class="h-full"
            :value="editorValue"
            :language="languageFor(selectedFile)"
            :options="{ automaticLayout: true, fontSize: 14, minimap: { enabled: false } }"
            @change="onEditorChange"
          />
          <div
            v-else
            class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
          >
            Select a file from Explorer to start editing
          </div>
        </div>
      </div>
      <div class="min-w-0 min-h-0 col-span-5 2xl:col-span-4">
        <div
          class="h-full p-4 overflow-auto border rounded-lg bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700"
        >
          <div v-if="markdownHtml" v-html="markdownHtml" class="markdown max-w-none"></div>
          <div v-else class="text-surface-500 dark:text-surface-400">No description provided.</div>
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

    <!-- Confirm Apply Solution Modal -->
    <Dialog
      v-model:visible="confirmSolutionVisible"
      modal
      header="Apply solution?"
      :style="{ width: '28rem' }"
    >
      <div class="text-surface-700 dark:text-surface-200">
        This will replace your current files with the official solution for this exercise. Continue?
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="confirmSolutionVisible = false" />
          <Button label="Apply" severity="warn" @click="doApplySolution" />
        </div>
      </template>
    </Dialog>

    <!-- Confirm Export with Unsaved Changes Modal -->
    <Dialog
      v-model:visible="confirmExportVisible"
      modal
      header="Unsaved changes"
      :style="{ width: '28rem' }"
    >
      <div class="text-surface-700 dark:text-surface-200">
        You have unsaved changes. Save all files before exporting.
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="OK" text @click="cancelExport" />
          <Button label="Save All & Continue" severity="primary" @click="confirmExport" />
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
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCourseStore, useEditorStore } from '~/renderer/stores';
import { useExerciseSessionStore } from '~/renderer/stores';
import { useToast } from 'primevue/usetoast';
import { marked } from 'marked';
import CodeEditor from '~/renderer/components/CodeEditor.vue';
import type { CourseTreeNode } from '~/ipc/contracts.js';

const route = useRoute();
const toast = useToast();
const course = useCourseStore();
const editor = useEditorStore();
const session = useExerciseSessionStore();

const slug = ref<string>(route.params.slug as string);
const exercisePath = computed(() => course.currentExercise || '');

const files = computed(() => session.files);
const selectedFile = computed(() => session.selectedFile || '');
const currentFile = ref('');
const dirtyCount = computed(() => editor.dirtyFiles.size);

const editorValue = ref('');
const originalContent = ref<string>('');
const terminal = ref<{ type: 'stdout' | 'stderr'; text: string }[]>([]);
const markdownHtml = ref<string>('');
const markdownBaseDir = ref<string>('');
const confirmResetVisible = ref(false);
const confirmSolutionVisible = ref(false);
const confirmExportVisible = ref(false);
const completed = ref(false);
let pendingExport = false;
// Tracks completion in this session to control Check/Next button swap
const justCompleted = ref(false);

// Per-file buffers to support Save All
const fileBuffers = ref(new Map<string, { value: string; original: string }>());

const moreMenu = ref();
const moreMenuItems = computed(() => [
  { label: 'Solution', icon: 'pi pi-lightbulb', command: () => askApplySolution() },
  { label: 'Reset', icon: 'pi pi-undo', command: () => askReset() },
  { separator: true },
  { label: 'Export', icon: 'pi pi-upload', command: () => onExportClicked() },
]);

const saveMenuItems = computed(() => [
  {
    label: 'Save All',
    icon: 'pi pi-copy',
    command: () => saveAll(),
    disabled: dirtyCount.value === 0,
  },
]);

// Navigation to next exercise when completed
const leafExercises = computed(() => {
  const out: CourseTreeNode[] = [];
  function collect(nodes: CourseTreeNode[] | undefined) {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.children && n.children.length > 0) collect(n.children);
      else out.push(n);
    }
  }
  collect(course.nodes as unknown as CourseTreeNode[]);
  return out;
});

const currentExerciseIndex = computed(() =>
  leafExercises.value.findIndex(
    (n) => n.path === exercisePath.value || n.key === exercisePath.value
  )
);
const nextExercisePath = computed(() => {
  const i = currentExerciseIndex.value;
  if (i >= 0 && i < leafExercises.value.length - 1) return leafExercises.value[i + 1].path;
  return '';
});
const hasNextExercise = computed(() => !!nextExercisePath.value);

function goNext() {
  if (!hasNextExercise.value) return;
  course.setExercise(nextExercisePath.value);
}

function languageFor(f: string) {
  if (f.endsWith('.ts')) return 'typescript';
  if (f.endsWith('.js')) return 'javascript';
  if (f.endsWith('.json')) return 'json';
  if (f.endsWith('.md')) return 'markdown';
  if (f.endsWith('.css')) return 'css';
  if (f.endsWith('.html')) return 'html';
  return 'plaintext';
}

function addTerminal(type: 'stdout' | 'stderr', text: string) {
  terminal.value.push({ type, text });
}
function clearTerminal() {
  terminal.value = [];
}

function markDirty(file: string, isDirty: boolean) {
  editor.markDirty(file, isDirty);
}

async function refreshCompletedFlag() {
  if (!exercisePath.value) {
    completed.value = false;
    return;
  }
  try {
    const { completed: c } = await window.electronAPI.courseIsCompleted({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    completed.value = !!c;
  } catch {
    completed.value = false;
  }
}

async function loadFiles() {
  if (!exercisePath.value) return;
  try {
    const { files: list } = await window.electronAPI.courseListFiles({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    session.setFiles(list);
    if (!selectedFile.value || !list.includes(selectedFile.value)) {
      if (list.length) selectFile(list[0]!);
    } else {
      await loadFileContent(selectedFile.value);
    }
    await loadMarkdown();
    await refreshCompletedFlag();
  } catch {
    session.setFiles([]);
  }
}

async function loadFileContent(f: string) {
  if (!f || f === currentFile.value) return;
  const buf = fileBuffers.value.get(f);
  if (buf) {
    session.setSelectedFile(f);
    editorValue.value = buf.value;
    originalContent.value = buf.original;
    currentFile.value = f;
    return;
  }
  const { content } = await window.electronAPI.courseReadFile({
    slug: slug.value,
    exercisePath: exercisePath.value,
    file: f,
  });
  session.setSelectedFile(f);
  editorValue.value = content;
  originalContent.value = content;
  fileBuffers.value.set(f, { value: content, original: content });
  currentFile.value = f;
}

async function loadMarkdown() {
  const { markdown, baseDir } = await window.electronAPI.courseReadMarkdown({
    slug: slug.value,
    exercisePath: exercisePath.value,
  });
  markdownBaseDir.value = baseDir || '';
  const base = markdownBaseDir.value ? `file://${markdownBaseDir.value.replace(/\\/g, '/')}/` : '';
  const html = await (marked as any).parse(markdown || '', { baseUrl: base } as any);
  markdownHtml.value = typeof html === 'string' ? html : '';
}

function selectFile(f: string) {
  loadFileContent(f);
}

function onEditorChange(val?: string) {
  const value = val ?? '';
  editorValue.value = value;
  if (selectedFile.value) {
    const buf = fileBuffers.value.get(selectedFile.value);
    if (buf) {
      buf.value = value;
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
}

async function saveAll() {
  if (dirtyCount.value === 0) return;
  const writes: Promise<any>[] = [];
  for (const f of editor.dirtyFiles) {
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
  for (const f of Array.from(editor.dirtyFiles)) {
    const buf = fileBuffers.value.get(f);
    if (buf) buf.original = buf.value;
  }
  editor.clearDirty();
}

async function run() {
  clearTerminal();
  // Ensure no stale background process keeps running
  try {
    await window.electronAPI.courseTerminate({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
  } catch {}
  await window.electronAPI.courseRun({ slug: slug.value, exercisePath: exercisePath.value });
}
async function test() {
  clearTerminal();
  // Ensure no stale background process keeps running
  try {
    await window.electronAPI.courseTerminate({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
  } catch {}
  await window.electronAPI.courseTest({ slug: slug.value, exercisePath: exercisePath.value });
}

function askReset() {
  confirmResetVisible.value = true;
}
async function doReset() {
  confirmResetVisible.value = false;
  try {
    await window.electronAPI.courseReset({ slug: slug.value, exercisePath: exercisePath.value });
    // Reset session/editor state so next load re-reads files from disk
    session.setFiles([]);
    session.setSelectedFile('');
    editor.clearDirty();
    fileBuffers.value.clear();
    editorValue.value = '';
    originalContent.value = '';
    currentFile.value = '';
    await loadFiles();
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
    // Reset session/editor state so next load re-reads files from disk
    session.setFiles([]);
    session.setSelectedFile('');
    editor.clearDirty();
    fileBuffers.value.clear();
    editorValue.value = '';
    originalContent.value = '';
    currentFile.value = '';
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

function askApplySolution() {
  confirmSolutionVisible.value = true;
}
async function doApplySolution() {
  confirmSolutionVisible.value = false;
  await applySolution();
}

function onExportClicked() {
  if (dirtyCount.value > 0) {
    pendingExport = true;
    confirmExportVisible.value = true;
  } else {
    doExport();
  }
}
async function confirmExport() {
  confirmExportVisible.value = false;
  if (pendingExport) {
    await saveAll();
    await doExport();
    pendingExport = false;
  }
}
function cancelExport() {
  pendingExport = false;
  confirmExportVisible.value = false;
}

async function doExport() {
  try {
    const res = await window.electronAPI.courseExportWorkspace({
      slug: slug.value,
      exercisePath: exercisePath.value,
    });
    if (!res.canceled && res.exportedTo) {
      toast.add({ severity: 'success', summary: 'Exported', detail: `Saved to ${res.exportedTo}` });
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Export failed', detail: e?.message ?? String(e) });
  }
}

function toggleMoreMenu(event: MouseEvent) {
  (moreMenu.value as any)?.toggle(event);
}

// Keep track of IPC unsubscribers to avoid duplicate listeners on remount
const ipcOffHandlers: Array<() => void> = [];

// Respond when exercise changes
watch(
  () => exercisePath.value,
  async (newVal, oldVal) => {
    // Terminate any processes from the previous exercise before switching
    if (oldVal) {
      try {
        await window.electronAPI.courseTerminate({ slug: slug.value, exercisePath: oldVal });
      } catch {}
    }
    editor.clearDirty();
    fileBuffers.value.clear();
    editorValue.value = '';
    originalContent.value = '';
    currentFile.value = '';
    justCompleted.value = false;
    await loadFiles();
    await refreshCompletedFlag();
  }
);

// React to file param changes
watch(
  () => selectedFile.value,
  async (f) => {
    if (f) await loadFileContent(f);
  }
);

// Wire IPC log streams
onMounted(async () => {
  await loadFiles();
  await refreshCompletedFlag();

  const offRunLog = window.electronAPI.on?.('course:run-log' as any, (...args: any[]) => {
    const payload = args[0];
    addTerminal(payload.stream, payload.chunk);
  });
  if (typeof offRunLog === 'function') ipcOffHandlers.push(offRunLog);

  const offTestLog = window.electronAPI.on?.('course:test-log' as any, (...args: any[]) => {
    const payload = args[0];
    addTerminal(payload.stream, payload.chunk);
  });
  if (typeof offTestLog === 'function') ipcOffHandlers.push(offTestLog);

  const offRunDone = window.electronAPI.on?.('course:run-done' as any, (...args: any[]) => {
    const payload = args[0];
    if (payload?.code === 0) {
      toast.add({ severity: 'success', summary: 'Run finished', life: 2000 });
    } else {
      toast.add({ severity: 'warn', summary: 'Run exited with errors', life: 3000 });
    }
  });
  if (typeof offRunDone === 'function') ipcOffHandlers.push(offRunDone);

  const offTestDone = window.electronAPI.on?.('course:test-done' as any, async (...args: any[]) => {
    const payload = args[0];
    if (payload?.code === 0) {
      toast.add({ severity: 'success', summary: 'All tests passed', life: 2500 });
      justCompleted.value = true;
      await refreshCompletedFlag();
    } else {
      toast.add({ severity: 'error', summary: 'Tests failed', life: 3500 });
    }
  });
  if (typeof offTestDone === 'function') ipcOffHandlers.push(offTestDone);
});

onUnmounted(async () => {
  // Remove event listeners to prevent duplicated logs/toasts on remount
  try {
    for (const off of ipcOffHandlers) {
      try {
        off();
      } catch {}
    }
  } finally {
    ipcOffHandlers.length = 0;
  }
  // Terminate any lingering run/test processes for this exercise on leave
  try {
    if (exercisePath.value) {
      await window.electronAPI.courseTerminate({
        slug: slug.value,
        exercisePath: exercisePath.value,
      });
    }
  } catch {}
});

watch(
  () => exercisePath.value,
  () => {
    clearTerminal();
  }
);
</script>
