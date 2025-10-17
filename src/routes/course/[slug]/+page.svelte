<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import type { CourseStructure, Exercise } from "$lib/types";
  import ExerciseTree from "$lib/components/ExerciseTree.svelte";
  import ExerciseView from "$lib/components/ExerciseView.svelte";

  let slug = $derived($page.params.slug ?? "");
  let courseStructure = $state<CourseStructure | null>(null);
  let selectedExercise = $state<Exercise | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let isTreeCollapsed = $state(false);

  onMount(async () => {
    if (slug) {
      await loadCourse();
    }
  });

  async function loadCourse() {
    if (!slug) return;

    try {
      loading = true;
      error = null;
      courseStructure = await invoke<CourseStructure>("get_course_structure", { slug });
    } catch (e) {
      console.error("Failed to load course:", e);
      error = String(e);
    } finally {
      loading = false;
    }
  }

  function handleExerciseSelect(exercise: Exercise) {
    selectedExercise = exercise;
  }

  async function handleExerciseComplete() {
    await loadCourse();
  }
</script>

<div class="h-screen flex flex-col bg-background">
  <!-- Header -->
  <header class="border-b px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/" class="text-sm text-muted-foreground hover:text-foreground">
        ← Back to Courses
      </a>
      <h1 class="text-xl font-semibold">
        {slug.charAt(0).toUpperCase() + slug.slice(1)} Course
      </h1>
    </div>
  </header>

  {#if loading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-muted-foreground">Loading course...</div>
    </div>
  {:else if error}
    <div class="flex-1 flex items-center justify-center">
      <div class="bg-destructive/10 text-destructive px-4 py-3 rounded-lg max-w-md">
        Error: {error}
      </div>
    </div>
  {:else if courseStructure}
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar - Exercise Tree -->
      <div
        class="border-r transition-all overflow-y-auto"
        class:w-64={!isTreeCollapsed}
        class:w-0={isTreeCollapsed}
      >
        {#if !isTreeCollapsed}
          <ExerciseTree
            exercises={courseStructure.exercises}
            {selectedExercise}
            onSelect={handleExerciseSelect}
          />
        {/if}
      </div>

      <!-- Toggle Button -->
      <button
        onclick={() => (isTreeCollapsed = !isTreeCollapsed)}
        class="absolute left-0 top-1/2 -translate-y-1/2 bg-background border rounded-r-md p-2 hover:bg-accent z-10"
        style="left: {isTreeCollapsed ? '0' : '16rem'}"
      >
        {isTreeCollapsed ? "→" : "←"}
      </button>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-hidden">
        {#if selectedExercise}
          <ExerciseView
            exercise={selectedExercise}
            {slug}
            onComplete={handleExerciseComplete}
          />
        {:else}
          <div class="p-8 overflow-y-auto h-full">
            <div class="prose max-w-none">
              <h2 class="text-2xl font-bold mb-4">Course Overview</h2>
              <div class="text-foreground">
                {@html courseStructure.overview}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
