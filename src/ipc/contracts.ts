import { AppConfig } from '~/electron-store.js';

// Request/response style IPC channels (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvoke {
  'theme:get': { args: []; result: AppConfig['themePreference'] };
  'theme:set': { args: [AppConfig['themePreference']]; result: AppConfig['themePreference'] };
  // Git course handlers
  'git-course:clone': {
    args: [
      {
        slug: string; // local directory name under courses/, e.g. 'javascript'
        repoUrl: string; // public git repo URL
        branch?: string; // defaults to 'main'
      },
    ];
    result: { path: string };
  };
  'git-course:is-update-available': {
    args: [
      {
        slug: string; // local directory name under courses/
        branch?: string; // defaults to 'main'
      },
    ];
    result: { updateAvailable: boolean; aheadBy: number; behindBy: number };
  };
  'git-course:pull': {
    args: [
      {
        slug: string; // local directory name under courses/
        branch?: string; // defaults to 'main'
      },
    ];
    result: { updated: boolean; output: string };
  };
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
