import { IpcInvoke } from '../contracts.js';

export type IpcHandlers = {
  [K in keyof IpcInvoke]?: (
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
