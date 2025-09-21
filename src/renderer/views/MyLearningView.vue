<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-end justify-between">
      <div>
        <h2 class="m-0 text-2xl font-semibold text-surface-900 dark:text-surface-0">My Learning</h2>
        <p class="mt-1 mb-0 text-surface-600 dark:text-surface-300">Recently opened</p>
      </div>
    </div>

    <div v-if="items.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <RouterLink
        v-for="c in items"
        :key="c.slug"
        :to="{ name: 'course', params: { slug: c.slug } }"
        class="no-underline"
      >
        <div
          class="flex items-center justify-between p-5 transition-colors border cursor-pointer rounded-xl bg-surface-0 dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-primary-400"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
            >
              <i :class="courseIcon(c.slug)" class="text-xl" />
            </div>
            <div class="flex flex-col">
              <div class="text-lg font-medium text-surface-900 dark:text-surface-100">
                {{ courseName(c.slug) }}
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400">
                Last opened: {{ formatDate(c.ts) }}
              </div>
            </div>
          </div>
          <Button size="small" label="Open" icon="pi pi-arrow-right" severity="contrast" />
        </div>
      </RouterLink>
    </div>

    <div v-else class="flex items-center justify-center py-16">
      <div class="text-surface-600 dark:text-surface-300">
        No recent courses. Open a course from the sidebar to get started.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// Storage key used by CourseView.vue when a course is opened
const STORAGE_KEY = 'lp_recent_courses_v1';

interface RecentCourseEntry {
  slug: string;
  ts: number; // epoch ms
}

const items = ref<RecentCourseEntry[]>([]);

function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: RecentCourseEntry[] = raw ? JSON.parse(raw) : [];
    // Sort desc by time and take top 8
    list.sort((a, b) => (b?.ts || 0) - (a?.ts || 0));
    items.value = list.slice(0, 8);
  } catch {
    items.value = [];
  }
}

function titleCaseSlug(slug: string) {
  return slug
    .split(/[-_]/g)
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : s))
    .join(' ');
}

function courseName(slug: string) {
  // Known friendly names
  const map: Record<string, string> = {
    javascript: 'JavaScript',
  };
  return map[slug] || titleCaseSlug(slug);
}

function courseIcon(slug: string) {
  const map: Record<string, string> = {
    javascript: 'devicon-javascript-plain',
  };
  return map[slug] || 'pi pi-book';
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '' + ts;
  }
}

onMounted(() => loadRecent());
</script>
