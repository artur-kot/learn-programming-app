<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import type { Exercise, CommandResult } from "$lib/types";
  import MonacoEditor from "$lib/components/MonacoEditor.svelte";
  import Markdown from "$lib/components/Markdown.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tabs from "$lib/components/ui/tabs";

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
    // Update the map without triggering reactivity
    fileContents.set(currentFile, content);

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
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold capitalize">
        {exercise.name.replace(/^\d+_/, "").replace(/_/g, " ")}
      </h2>
      {#if exercise.completed}
        <Badge variant="default" class="bg-green-600 hover:bg-green-700">✓ Completed</Badge>
      {/if}
    </div>

    <!-- File Tabs -->
    <Tabs.Root value={currentFile} onValueChange={(v) => v && (currentFile = v)}>
      <Tabs.List class="w-full justify-start">
        {#each exercise.files as fileName}
          <Tabs.Trigger value={fileName}>{fileName}</Tabs.Trigger>
        {/each}
      </Tabs.List>
    </Tabs.Root>
  </div>

  <!-- Main Content - 2 columns -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left: Description -->
    <div class="w-1/3 border-r p-4 overflow-y-auto">
      <Markdown content={exercise.description} />

      <!-- Action Buttons -->
      <div class="mt-6 space-y-3">
        {#if isInitializing}
          <div class="w-full px-4 py-2 bg-muted text-muted-foreground rounded-md text-center text-sm">
            Initializing exercise...
          </div>
        {/if}

        {#if exercise.meta.testCmd}
          <Button
            onclick={runTests}
            disabled={isTesting}
            class="w-full"
            size="lg"
          >
            {isTesting ? "Running Tests..." : "Check Solution"}
          </Button>
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
        {#key `${exercise.id}-${currentFile}`}
          <MonacoEditor
            value={fileContents.get(currentFile) || ""}
            language={getFileLanguage(currentFile)}
            onChange={handleCodeChange}
          />
        {/key}
      {:else}
        <div class="flex-1 flex items-center justify-center text-muted-foreground">
          Select a file to edit
        </div>
      {/if}
    </div>
  </div>
</div>
