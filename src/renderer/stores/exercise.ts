import { defineStore } from 'pinia';

export const useExerciseSessionStore = defineStore('exerciseSession', {
  state: () => ({
    selectedFile: '' as string,
    files: [] as string[],
  }),
  actions: {
    setSelectedFile(file: string) {
      this.selectedFile = file;
    },
    setFiles(files: string[]) {
      this.files = files;
    },
    reset() {
      this.selectedFile = '';
      this.files = [];
    },
  },
});
