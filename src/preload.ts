// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { exposeBridge } from './ipc/bridge.js';
import type { ThemePreference } from './ipc/contracts.js';

exposeBridge({
  getThemePreference: (): Promise<ThemePreference> => window.electronAPI.invoke('theme:get'),
  setThemePreference: (theme: ThemePreference): Promise<ThemePreference> =>
    window.electronAPI.invoke('theme:set', theme),
});
