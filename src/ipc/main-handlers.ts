import { ipcMain, WebContents } from 'electron';
import type { IpcEvents, IpcInvoke, IpcSend } from './contracts.js';

// Strongly typed register helpers
export function registerInvokeHandlers(impl: {
  [K in keyof IpcInvoke]?: (
    ...args: IpcInvoke[K] extends { args: infer A extends any[] } ? A : []
  ) =>
    | Promise<IpcInvoke[K] extends { result: infer R } ? R : void>
    | (IpcInvoke[K] extends { result: infer R } ? R : void);
}) {
  for (const key in impl) {
    const handler = impl[key as keyof IpcInvoke] as any;
    if (handler) ipcMain.handle(key, (_event, ...args) => Promise.resolve(handler(...args)));
  }
}

export function registerSendHandlers(impl: {
  [K in keyof IpcSend]?: (
    ...args: IpcSend[K] extends { args: infer A extends any[] } ? A : []
  ) => void;
}) {
  for (const key in impl) {
    // ipcMain.on is only needed if you wish to handle fire-and-forget from renderer
    const handler = impl[key as keyof IpcSend] as any;
    if (handler) ipcMain.on(key, (_event, ...args) => handler(...args));
  }
}

export function createEmitter(target: WebContents) {
  return {
    emit<K extends keyof IpcEvents>(
      channel: K,
      ...args: IpcEvents[K] extends { args: infer A extends any[] } ? A : []
    ) {
      target.send(channel as string, ...(args as any[]));
    },
  } as const;
}
