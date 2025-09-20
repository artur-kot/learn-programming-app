import { AppConfig } from './electron-store.js';
import { exposeBridge, createBridge } from './ipc/bridge.js';

const bridge = createBridge();

exposeBridge({
  getThemePreference: (): Promise<AppConfig['themePreference']> => bridge.invoke('theme:get'),
  setThemePreference: (
    theme: AppConfig['themePreference']
  ): Promise<AppConfig['themePreference']> => bridge.invoke('theme:set', theme),
  // Git course helpers
  gitClone: (payload: { slug: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:clone', payload),
  gitCheckUpdates: (payload: { slug: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:is-update-available', payload),
  gitPull: (payload: { slug: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:pull', payload),
  gitListTree: (payload: { slug: string }) => bridge.invoke('git-course:list-tree', payload),
  // Course helpers
  courseListFiles: (payload: { slug: string; exercisePath: string }) =>
    bridge.invoke('course:list-files', payload),
  courseReadFile: (payload: { slug: string; exercisePath: string; file: string }) =>
    bridge.invoke('course:read-file', payload),
  courseWriteFile: (payload: {
    slug: string;
    exercisePath: string;
    file: string;
    content: string;
  }) => bridge.invoke('course:write-file', payload),
  courseReadMarkdown: (payload: { slug: string; exercisePath: string }) =>
    bridge.invoke('course:read-markdown', payload),
  courseRun: (payload: { slug: string; exercisePath: string; id?: string }) =>
    bridge.invoke('course:run', payload),
  courseTest: (payload: { slug: string; exercisePath: string; id?: string }) =>
    bridge.invoke('course:test', payload),
  courseReset: (payload: { slug: string; exercisePath: string }) =>
    bridge.invoke('course:reset', payload),
  courseApplySolution: (payload: { slug: string; exercisePath: string }) =>
    bridge.invoke('course:apply-solution', payload),
});
