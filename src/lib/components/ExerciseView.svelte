<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import type { Exercise, CommandResult } from "$lib/types";
  import MonacoEditor from "$lib/components/MonacoEditor.svelte";

  interface Props {
    exercise: Exercise;
    slug: string;
    onComplete: () => void;
  }

  let { exercise, slug, onComplete }: Props = $props();

  let currentFile = $state<string>(exercise.files[0] || "");
  let fileContents = $state<Map<string, string>>(new Map());
  let isInitializing = $state(false);
  let isTesting = $state(false);
  let testResult = $state<CommandResult | null>(null);
  let saveTimeout: number | null = null;

  $effect(() => {
    // Reload when exercise changes
    loadExerciseFiles();
    currentFile = exercise.files[0] || "";
    testResult = null;
  });

  async function loadExerciseFiles() {
    fileContents.clear();
    for (const fileName of exercise.files) {
      try {
        const content = await invoke<string>("read_exercise_file", {
          exercisePath: exercise.path,
          fileName,
        });
        fileContents.set(fileName, content);
      } catch (e) {
        console.error(`Failed to load file ${fileName}:`, e);
      }
    }
    fileContents = new Map(fileContents);
  }

  async function handleCodeChange(content: string) {
    fileContents.set(currentFile, content);
    fileContents = new Map(fileContents);

    // Auto-save with debounce
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(async () => {
      try {
        await invoke("write_exercise_file", {
          exercisePath: exercise.path,
          fileName: currentFile,
          content,
        });
        console.log(`Saved ${currentFile}`);
      } catch (e) {
        console.error("Failed to save file:", e);
      }
    }, 1000) as unknown as number;
  }

  async function initializeExercise() {
    if (!exercise.meta.initCmd) return;

    try {
      isInitializing = true;
      testResult = null;
      const result = await invoke<CommandResult>("init_exercise", {
        exercisePath: exercise.path,
        initCmd: exercise.meta.initCmd,
      });
      testResult = result;
    } catch (e) {
      console.error("Failed to initialize exercise:", e);
    } finally {
      isInitializing = false;
    }
  }

  async function runTests() {
    if (!exercise.meta.testCmd) return;

    try {
      isTesting = true;
      testResult = null;
      const result = await invoke<CommandResult>("test_exercise", {
        exercisePath: exercise.path,
        testCmd: exercise.meta.testCmd,
      });
      testResult = result;

      // If tests pass, mark as completed
      if (result.success) {
        await invoke("mark_exercise_completed", {
          courseSlug: slug,
          exerciseId: exercise.id,
          exercisePath: exercise.path,
        });
        onComplete();
      }
    } catch (e) {
      console.error("Failed to run tests:", e);
    } finally {
      isTesting = false;
    }
  }

  onMount(() => {
    // Auto-initialize if command exists
    if (exercise.meta.initCmd && exercise.files.length > 0) {
      initializeExercise();
    }
  });

  onDestroy(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
  });

  function getFileLanguage(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const langMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      rs: "rust",
      go: "go",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
    };
    return langMap[ext] || "plaintext";
  }
</script>

<div class="h-full flex flex-col">
  <!-- Exercise Header -->
  <div class="border-b p-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-2xl font-bold capitalize">
        {exercise.name.replace(/^\d+_/, "").replace(/_/g, " ")}
      </h2>
      {#if exercise.completed}
        <span class="text-green-500 text-sm">✓ Completed</span>
      {/if}
    </div>

    <!-- File Tabs -->
    <div class="flex gap-2 overflow-x-auto">
      {#each exercise.files as fileName}
        <button
          onclick={() => (currentFile = fileName)}
          class="px-3 py-1 rounded-t-md text-sm transition-colors whitespace-nowrap {currentFile === fileName ? 'bg-accent' : 'hover:bg-accent/50'}"
        >
          {fileName}
        </button>
      {/each}
    </div>
  </div>

  <!-- Main Content - 2 columns -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left: Description -->
    <div class="w-1/3 border-r p-4 overflow-y-auto">
      <div class="prose prose-sm max-w-none">
        <div class="text-foreground">
          {@html exercise.description}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 space-y-2">
        {#if exercise.meta.initCmd}
          <button
            onclick={initializeExercise}
            disabled={isInitializing}
            class="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {isInitializing ? "Initializing..." : "Initialize Exercise"}
          </button>
        {/if}

        {#if exercise.meta.testCmd}
          <button
            onclick={runTests}
            disabled={isTesting}
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isTesting ? "Running Tests..." : "Check Solution"}
          </button>
        {/if}
      </div>

      <!-- Test Results -->
      {#if testResult}
        <div class="mt-4">
          <div
            class="p-3 rounded-md {testResult.success ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}"
          >
            <div class="font-semibold mb-2">
              {testResult.success ? "✓ Tests Passed!" : "✗ Tests Failed"}
            </div>
            {#if testResult.stdout}
              <pre class="text-xs whitespace-pre-wrap">{testResult.stdout}</pre>
            {/if}
            {#if testResult.stderr}
              <pre class="text-xs whitespace-pre-wrap text-red-600 dark:text-red-400">{testResult.stderr}</pre>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Right: Code Editor -->
    <div class="flex-1 flex flex-col overflow-hidden">
      {#if currentFile && fileContents.has(currentFile)}
        <MonacoEditor
          value={fileContents.get(currentFile) || ""}
          language={getFileLanguage(currentFile)}
          onChange={handleCodeChange}
        />
      {:else}
        <div class="flex-1 flex items-center justify-center text-muted-foreground">
          Select a file to edit
        </div>
      {/if}
    </div>
  </div>
</div>
