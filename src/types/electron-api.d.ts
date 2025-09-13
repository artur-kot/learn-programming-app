export {};

declare global {
  interface Window {
    electronAPI?: {
      onNavigate: (callback: (path: string) => void) => void;
      getThemePreference: () => Promise<'system' | 'light' | 'dark'>;
      setThemePreference: (
        theme: 'system' | 'light' | 'dark'
      ) => Promise<'system' | 'light' | 'dark'>;
    };
  }
}
