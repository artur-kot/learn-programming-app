import { AppConfig } from './electron-store.js';
import { exposeBridge, createBridge } from './ipc/bridge.js';

const bridge = createBridge();

exposeBridge({
  getThemePreference: (): Promise<AppConfig['themePreference']> => bridge.invoke('theme:get'),
  setThemePreference: (
    theme: AppConfig['themePreference']
  ): Promise<AppConfig['themePreference']> => bridge.invoke('theme:set', theme),
  // Git course helpers
  gitClone: (payload: { slug: string; repoUrl: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:clone', payload),
  gitCheckUpdates: (payload: { slug: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:is-update-available', payload),
  gitPull: (payload: { slug: string; branch?: string; id?: string }) =>
    bridge.invoke('git-course:pull', payload),
  gitListTree: (payload: { slug: string }) => bridge.invoke('git-course:list-tree', payload),
});
