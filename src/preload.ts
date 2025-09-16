import { AppConfig } from './electron-store.js';
import { exposeBridge } from './ipc/bridge.js';

exposeBridge({
  getThemePreference: (): Promise<AppConfig['themePreference']> =>
    window.electronAPI.invoke('theme:get'),
  setThemePreference: (
    theme: AppConfig['themePreference']
  ): Promise<AppConfig['themePreference']> => window.electronAPI.invoke('theme:set', theme),
});
