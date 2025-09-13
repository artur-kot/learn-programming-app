// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getThemePreference: (): Promise<'system' | 'light' | 'dark'> => ipcRenderer.invoke('theme:get'),
  setThemePreference: (theme: 'system' | 'light' | 'dark'): Promise<'system' | 'light' | 'dark'> =>
    ipcRenderer.invoke('theme:set', theme),
});
