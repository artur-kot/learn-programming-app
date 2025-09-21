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
        slug: string; // local directory name under courses/, e.g., 'javascript'
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

  // Course file/exercise operations (operate on a working copy of the exercise)
  'course:list-files': {
    args: [
      {
        slug: string;
        exercisePath: string; // e.g. '1_hello_world'
      },
    ];
    result: { files: string[] };
  };
  'course:read-file': {
    args: [
      {
        slug: string;
        exercisePath: string;
        file: string; // relative to exercisePath
      },
    ];
    result: { content: string };
  };
  'course:write-file': {
    args: [
      {
        slug: string;
        exercisePath: string;
        file: string;
        content: string;
      },
    ];
    result: { ok: true };
  };
  'course:read-markdown': {
    args: [
      {
        slug: string;
        exercisePath: string;
      },
    ];
    result: { markdown: string; baseDir: string };
  };
  'course:run': {
    args: [
      {
        slug: string;
        exercisePath: string;
        id?: string;
      },
    ];
    result: { id: string };
  };
  'course:test': {
    args: [
      {
        slug: string;
        exercisePath: string;
        id?: string;
      },
    ];
    result: { id: string };
  };
  'course:is-completed': {
    args: [
      {
        slug: string;
        exercisePath: string;
      },
    ];
    result: { completed: boolean };
  };
  // Manage working copy
  'course:reset': {
    args: [
      {
        slug: string;
        exercisePath: string;
      },
    ];
    result: { ok: true };
  };
  'course:apply-solution': {
    args: [
      {
        slug: string;
        exercisePath: string;
      },
    ];
    result: { ok: true };
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
  // Streaming for run & test
  'course:run-log': {
    args: [
      {
        id: string;
        slug: string;
        exercisePath: string;
        stream: 'stdout' | 'stderr';
        chunk: string;
      },
    ];
  };
  'course:test-log': {
    args: [
      {
        id: string;
        slug: string;
        exercisePath: string;
        stream: 'stdout' | 'stderr';
        chunk: string;
      },
    ];
  };
  'course:run-done': {
    args: [
      {
        id: string;
        slug: string;
        exercisePath: string;
        success: boolean;
        code: number;
        error?: string;
      },
    ];
  };
  'course:test-done': {
    args: [
      {
        id: string;
        slug: string;
        exercisePath: string;
        success: boolean;
        code: number;
        error?: string;
      },
    ];
  };
}
