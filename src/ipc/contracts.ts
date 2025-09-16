export type ThemePreference = 'system' | 'light' | 'dark';

// Request/response style IPC channels (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvoke {
  'theme:get': { args: []; result: ThemePreference };
  'theme:set': { args: [ThemePreference]; result: ThemePreference };
}

// Fire-and-forget messages from renderer to main (ipcRenderer.send / ipcMain.on)
export interface IpcSend {
  // Add entries like:
  // 'log:message': { args: [level: 'info' | 'warn' | 'error', message: string] };
}

// Events emitted from main to renderer (webContents.send / ipcRenderer.on)
export interface IpcEvents {
  'theme:changed': { args: [ThemePreference] };
}
