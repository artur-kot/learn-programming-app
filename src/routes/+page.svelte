<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import type { CourseWithProgress } from "$lib/types";
  import { AVAILABLE_COURSES } from "$lib/types";
  import * as Card from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Progress } from "$lib/components/ui/progress";

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
          <Card.Root class="hover:shadow-lg transition-shadow">
            <Card.Header>
              <Card.Title>{availableCourse.name}</Card.Title>
              <Card.Description>{availableCourse.description}</Card.Description>
            </Card.Header>
            <Card.Content>
              {#if courseStatus}
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span>Progress</span>
                    <span class="font-medium">{Math.round(courseStatus.progress_percentage)}%</span>
                  </div>
                  <Progress value={courseStatus.progress_percentage} class="h-2" />
                  <div class="text-sm text-muted-foreground">
                    {courseStatus.completed_exercises} / {courseStatus.total_exercises} exercises completed
                  </div>
                </div>
              {/if}
            </Card.Content>
            <Card.Footer>
              {#if courseStatus}
                <Button href="/course/{availableCourse.slug}" class="w-full">
                  Continue Learning
                </Button>
              {:else}
                <Button
                  variant="secondary"
                  class="w-full"
                  onclick={() =>
                    cloneCourse(
                      availableCourse.slug,
                      availableCourse.name,
                      availableCourse.repo_url
                    )}
                >
                  Start Course
                </Button>
              {/if}
            </Card.Footer>
          </Card.Root>
        {/each}
      </div>
    {/if}
  </main>
</div>
