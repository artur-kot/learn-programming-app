import { AppConfig } from '~/electron-store.js';

export type CourseTreeNode = {
  key: string; // unique key (e.g., relative path)
  label: string; // human readable title
  path: string; // relative path from course root
  children?: CourseTreeNode[];
};

// Request/response style IPC channels (ipcRenderer.invoke / ipcMain.handle)
export interface IpcInvoke {
  'theme:get': { args: []; result: AppConfig['themePreference'] };
  'theme:set': { args: [AppConfig['themePreference']]; result: AppConfig['themePreference'] };
  // Git course handlers
  'git-course:clone': {
    args: [
      {
        slug: string; // local directory name under courses/, e.g. 'javascript'
        branch?: string; // defaults to 'main'
        id?: string; // optional correlation id
      },
    ];
    result: { path: string; id: string };
  };
  'git-course:is-update-available': {
    args: [
      {
        slug: string; // local directory name under courses/
        branch?: string; // defaults to 'main'
        id?: string; // optional correlation id
      },
    ];
    result: { id: string; updateAvailable: boolean; aheadBy: number; behindBy: number };
  };
  'git-course:pull': {
    args: [
      {
        slug: string; // local directory name under courses/
        branch?: string; // defaults to 'main'
        id?: string; // optional correlation id
      },
    ];
    result: { id: string; updated: boolean; output: string };
  };
  // List filtered course folder tree for sidebar
  'git-course:list-tree': {
    args: [
      {
        slug: string; // course slug under courses/
      },
    ];
    result: CourseTreeNode[];
  };
}

// Fire-and-forget messages from renderer to main (ipcRenderer.send / ipcMain.on)
export interface IpcSend {
  // Add entries like:
  // 'log:message': { args: [level: 'info' | 'warn' | 'error', message: string] };
}

export interface IpcEvents {
  'theme:changed': { args: [AppConfig['themePreference']] };
  'git-course:progress': {
    args: [
      {
        id: string;
        slug: string;
        op: 'clone' | 'check' | 'pull';
        step: string;
        percent?: number;
        message?: string;
      },
    ];
  };
  'git-course:log': {
    args: [
      {
        id: string;
        slug: string;
        op: 'clone' | 'check' | 'pull';
        stream: 'stdout' | 'stderr';
        chunk: string;
      },
    ];
  };
  'git-course:done': {
    args: [
      {
        id: string;
        slug: string;
        op: 'clone' | 'check' | 'pull';
        success: boolean;
        error?: string;
      },
    ];
  };
}
