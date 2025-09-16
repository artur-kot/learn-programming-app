import { IpcInvoke } from '../contracts.js';

export type IpcHandlersDef = {
  [K in keyof IpcInvoke]?: (
    mainWindow?: Electron.BrowserWindow,
    ...args: IpcInvoke[K] extends {
      args: infer A extends any[];
    }
      ? A
      : []
  ) =>
    | Promise<
        IpcInvoke[K] extends {
          result: infer R;
        }
          ? R
          : void
      >
    | (IpcInvoke[K] extends {
        result: infer R;
      }
        ? R
        : void);
};
