import { AppConfig } from './electron-store.js';
import { exposeBridge, createBridge } from './ipc/bridge.js';

const bridge = createBridge();

exposeBridge({
  getThemePreference: (): Promise<AppConfig['themePreference']> => bridge.invoke('theme:get'),
  setThemePreference: (
    theme: AppConfig['themePreference']
  ): Promise<AppConfig['themePreference']> => bridge.invoke('theme:set', theme),
});
