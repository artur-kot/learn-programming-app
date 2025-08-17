// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	// existing placeholders (extend carefully to avoid breaking changes)
	onNavigate: (callback: (path: string) => void) => {
		// Future navigation events could be wired here
	},
	getThemePreference: (): Promise<'light' | 'dark' | 'system'> => ipcRenderer.invoke('theme:get'),
	setThemePreference: (theme: 'light' | 'dark' | 'system') => ipcRenderer.invoke('theme:set', theme),
});
