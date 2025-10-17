<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import type { CourseWithProgress } from "$lib/types";
  import { AVAILABLE_COURSES } from "$lib/types";

  let courses = $state<CourseWithProgress[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      courses = await invoke<CourseWithProgress[]>("get_all_courses");
    } catch (e) {
      console.error("Failed to load courses:", e);
      error = String(e);
    } finally {
      loading = false;
    }
  });

  async function cloneCourse(slug: string, name: string, repoUrl: string) {
    try {
      loading = true;
      error = null;
      await invoke("clone_course", { slug, name, repoUrl });
      courses = await invoke<CourseWithProgress[]>("get_all_courses");
    } catch (e) {
      console.error("Failed to clone course:", e);
      error = String(e);
    } finally {
      loading = false;
    }
  }

  function getCourseStatus(slug: string) {
    return courses.find((c) => c.course.slug === slug);
  }
</script>

<div class="min-h-screen bg-background">
  <header class="border-b">
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-3xl font-bold">Learn Programming</h1>
      <p class="text-muted-foreground mt-2">
        Interactive programming courses to boost your skills
      </p>
    </div>
  </header>

  <main class="container mx-auto px-4 py-8">
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <div class="text-muted-foreground">Loading courses...</div>
      </div>
    {:else if error}
      <div class="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
        Error: {error}
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each AVAILABLE_COURSES as availableCourse}
          {@const courseStatus = getCourseStatus(availableCourse.slug)}
          <div class="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 class="text-2xl font-semibold mb-2">{availableCourse.name}</h2>
            <p class="text-muted-foreground mb-4">{availableCourse.description}</p>

            {#if courseStatus}
              <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{Math.round(courseStatus.progress_percentage)}%</span>
                </div>
                <div class="w-full bg-secondary rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all"
                    style="width: {courseStatus.progress_percentage}%"
                  ></div>
                </div>
                <div class="text-sm text-muted-foreground mt-2">
                  {courseStatus.completed_exercises} / {courseStatus.total_exercises} exercises completed
                </div>
              </div>
              <a
                href="/course/{availableCourse.slug}"
                class="inline-block w-full text-center bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Continue Learning
              </a>
            {:else}
              <button
                onclick={() =>
                  cloneCourse(
                    availableCourse.slug,
                    availableCourse.name,
                    availableCourse.repo_url
                  )}
                class="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              >
                Start Course
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </main>
</div>
