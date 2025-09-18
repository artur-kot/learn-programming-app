import { defineStore } from 'pinia';
import type { CourseTreeNode } from '~/ipc/contracts.js';

export const useCourseStore = defineStore('course', {
  state: () => ({
    nodes: [] as CourseTreeNode[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async loadTree(slug: string) {
      this.loading = true;
      this.error = null;
      try {
        const nodes = await window.electronAPI.gitListTree({ slug });
        this.nodes = nodes;
      } catch (e: any) {
        this.nodes = [];
        this.error = e?.message ?? String(e);
      } finally {
        this.loading = false;
      }
    },
    clear() {
      this.nodes = [];
      this.error = null;
    },
  },
});
