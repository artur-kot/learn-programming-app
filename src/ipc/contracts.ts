import { AppConfig } from '~/electron-store.js';

// Request/response style IPC channels (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvoke {
  'theme:get': { args: []; result: AppConfig['themePreference'] };
  'theme:set': { args: [AppConfig['themePreference']]; result: AppConfig['themePreference'] };
}

// Fire-and-forget messages from renderer to main (ipcRenderer.send / ipcMain.on)
export interface IpcSend {
  // Add entries like:
  // 'log:message': { args: [level: 'info' | 'warn' | 'error', message: string] };
}

// Events emitted from main to renderer (webContents.send / ipcRenderer.on)
export interface IpcEvents {
  'theme:changed': { args: [AppConfig['themePreference']] };
}
