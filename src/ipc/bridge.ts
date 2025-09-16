import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IpcEvents, IpcInvoke, IpcSend } from './contracts.js';

export type Args<T> = T extends { args: infer A extends any[] } ? A : [];
export type Result<T> = T extends { result: infer R } ? R : void;

export type InvokeAPI = {
  invoke<K extends keyof IpcInvoke>(
    channel: K,
    ...args: Args<IpcInvoke[K]>
  ): Promise<Result<IpcInvoke[K]>>;
};

export type SendAPI = {
  send<K extends keyof IpcSend>(channel: K, ...args: Args<IpcSend[K]>): void;
};

export type EventAPI = {
  on<K extends keyof IpcEvents>(
    channel: K,
    listener: (...args: Args<IpcEvents[K]>) => void
  ): () => void;
};

export type BaseBridge = InvokeAPI & SendAPI & EventAPI;

export function createBridge(): BaseBridge {
  return {
    invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
    on: (channel: string, listener: (...args: unknown[]) => void) => {
      const handler = (_e: IpcRendererEvent, ...argsInner: unknown[]) => listener(...argsInner);
      ipcRenderer.on(channel, handler);
      return () => ipcRenderer.removeListener(channel, handler);
    },
  } as BaseBridge;
}

export function exposeBridge(extras?: Record<string, unknown>) {
  const api: BaseBridge & Record<string, unknown> = Object.assign(createBridge(), extras);
  contextBridge.exposeInMainWorld('electronAPI', api);
}
