export {};

import type { BaseBridge } from '../ipc/bridge.ts';
import type { ThemePreference } from '../ipc/contracts.ts';

declare global {
  interface Window {
    electronAPI: BaseBridge & {
      // Convenience helpers used in the app today
      getThemePreference: () => Promise<ThemePreference>;
      setThemePreference: (theme: ThemePreference) => Promise<ThemePreference>;
      // Git course helpers
      gitClone: (payload: {
        slug: string;
        branch?: string;
        id?: string;
      }) => Promise<{ path: string; id: string }>;
      gitCheckUpdates: (payload: {
        slug: string;
        branch?: string;
        id?: string;
      }) => Promise<{ id: string; updateAvailable: boolean; aheadBy: number; behindBy: number }>;
      gitPull: (payload: {
        slug: string;
        branch?: string;
        id?: string;
      }) => Promise<{ id: string; updated: boolean; output: string }>;
      gitListTree: (payload: {
        slug: string;
      }) => Promise<import('../ipc/contracts.ts').CourseTreeNode[]>;

      // Course file ops
      courseListFiles: (payload: {
        slug: string;
        exercisePath: string;
      }) => Promise<{ files: string[] }>;
      courseReadFile: (payload: {
        slug: string;
        exercisePath: string;
        file: string;
      }) => Promise<{ content: string }>;
      courseWriteFile: (payload: {
        slug: string;
        exercisePath: string;
        file: string;
        content: string;
      }) => Promise<{ ok: true }>;
      courseReadMarkdown: (payload: {
        slug: string;
        exercisePath: string;
      }) => Promise<{ markdown: string; baseDir: string }>;

      // Run/Test
      courseRun: (payload: {
        slug: string;
        exercisePath: string;
        id?: string;
      }) => Promise<{ id: string }>;
      courseTest: (payload: {
        slug: string;
        exercisePath: string;
        id?: string;
      }) => Promise<{ id: string }>;
      courseIsCompleted: (payload: {
        slug: string;
        exercisePath: string;
      }) => Promise<{ completed: boolean }>;

      // Workspace management
      courseReset: (payload: { slug: string; exercisePath: string }) => Promise<{ ok: true }>;
      courseApplySolution: (payload: {
        slug: string;
        exercisePath: string;
      }) => Promise<{ ok: true }>;
      courseExportWorkspace: (payload: {
        slug: string;
        exercisePath: string;
      }) => Promise<{ exportedTo?: string; canceled?: boolean }>;
    };
  }
}
