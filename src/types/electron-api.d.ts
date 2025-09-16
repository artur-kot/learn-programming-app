export {};

import type { BaseBridge } from '../ipc/bridge.ts';
import type { ThemePreference } from '../ipc/contracts.ts';

declare global {
  interface Window {
    electronAPI: BaseBridge & {
      // Convenience helpers used in the app today
      getThemePreference: () => Promise<ThemePreference>;
      setThemePreference: (theme: ThemePreference) => Promise<ThemePreference>;
    };
  }
}
