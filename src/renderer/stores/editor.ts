import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    dirtyFiles: new Set<string>() as Set<string>,
  }),
  actions: {
    markDirty(file: string, isDirty: boolean) {
      const next = new Set(this.dirtyFiles);
      if (isDirty) next.add(file);
      else next.delete(file);
      this.dirtyFiles = next;
    },
    clearDirty() {
      this.dirtyFiles = new Set();
    },
  },
});
