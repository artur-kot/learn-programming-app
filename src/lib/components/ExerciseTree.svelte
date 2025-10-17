<script lang="ts">
  import type { Exercise } from "$lib/types";

  interface Props {
    exercises: Exercise[];
    selectedExercise: Exercise | null;
    onSelect: (exercise: Exercise) => void;
  }

  let { exercises, selectedExercise, onSelect }: Props = $props();

  // Group exercises by chapter (first part of path before exercise name)
  let chapters = $derived(() => {
    const grouped = new Map<string, Exercise[]>();

    for (const exercise of exercises) {
      // Extract chapter name from path (e.g., "1_basics")
      const pathParts = exercise.path.split(/[\/\\]/);
      const chapterName = pathParts[pathParts.length - 2] || "Exercises";

      if (!grouped.has(chapterName)) {
        grouped.set(chapterName, []);
      }
      grouped.get(chapterName)!.push(exercise);
    }

    return Array.from(grouped.entries());
  });

  let expandedChapters = $state<Set<string>>(new Set());

  function toggleChapter(chapterName: string) {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterName)) {
      newExpanded.delete(chapterName);
    } else {
      newExpanded.add(chapterName);
    }
    expandedChapters = newExpanded;
  }

  function formatExerciseName(name: string): string {
    // Remove number prefix and replace underscores with spaces
    return name.replace(/^\d+_/, "").replace(/_/g, " ");
  }

  function formatChapterName(name: string): string {
    return name.replace(/^\d+_/, "").replace(/_/g, " ");
  }
</script>

<div class="p-4">
  <h2 class="text-lg font-semibold mb-4">Exercises</h2>

  <div class="space-y-2">
    {#each chapters() as [chapterName, chapterExercises]}
      <div>
        <button
          onclick={() => toggleChapter(chapterName)}
          class="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent text-left"
        >
          <span class="font-medium capitalize">{formatChapterName(chapterName)}</span>
          <span class="text-xs">{expandedChapters.has(chapterName) ? "▼" : "▶"}</span>
        </button>

        {#if expandedChapters.has(chapterName)}
          <div class="ml-4 mt-1 space-y-1">
            {#each chapterExercises as exercise}
              <button
                onclick={() => onSelect(exercise)}
                class="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors"
                class:bg-primary={selectedExercise?.id === exercise.id}
                class:text-primary-foreground={selectedExercise?.id === exercise.id}
                class:hover:bg-accent={selectedExercise?.id !== exercise.id}
              >
                <span class="flex-shrink-0">
                  {#if exercise.completed}
                    <span class="text-green-500">✓</span>
                  {:else}
                    <span class="text-muted-foreground">○</span>
                  {/if}
                </span>
                <span class="capitalize truncate">{formatExerciseName(exercise.name)}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
