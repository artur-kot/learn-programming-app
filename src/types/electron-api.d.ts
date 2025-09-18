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
        repoUrl: string;
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
    };
  }
}
