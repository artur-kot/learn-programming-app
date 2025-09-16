import { exposeBridge } from './ipc/bridge.js';
import type { ThemePreference } from './ipc/contracts.js';

exposeBridge({
  getThemePreference: (): Promise<ThemePreference> => window.electronAPI.invoke('theme:get'),
  setThemePreference: (theme: ThemePreference): Promise<ThemePreference> =>
    window.electronAPI.invoke('theme:set', theme),
});
