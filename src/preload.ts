// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Ollama API methods
  streamOllamaResponse: (prompt: string, model: string = 'qwen2.5-coder:14b') =>
    ipcRenderer.invoke('stream-ollama-response', { prompt, model }),

  // Stop streaming
  stopOllamaStream: () => ipcRenderer.invoke('stop-ollama-stream'),

  // Test Ollama connection
  testOllamaConnection: () => ipcRenderer.invoke('test-ollama-connection'),

  // Check if Ollama is installed
  checkOllamaInstalled: () => ipcRenderer.invoke('check-ollama-installed'),

  // Install Ollama
  installOllama: () => ipcRenderer.invoke('install-ollama'),

  // Start Ollama server
  startOllamaServer: () => ipcRenderer.invoke('start-ollama-server'),

  // Download/Pull Ollama model
  downloadOllamaModel: (modelName: string) =>
    ipcRenderer.invoke('download-ollama-model', { modelName }),

  // Cancel Ollama model download
  cancelOllamaDownload: (modelName: string) =>
    ipcRenderer.invoke('cancel-ollama-download', { modelName }),

  // Listen for streaming responses
  onOllamaStream: (callback: (data: { chunk: string; done: boolean }) => void) => {
    ipcRenderer.on('ollama-stream-chunk', (_event, data) => callback(data));
  },

  // Listen for download progress
  onOllamaDownloadProgress: (
    callback: (data: {
      modelName: string;
      status: string;
      completed?: number;
      total?: number;
      done: boolean;
      error?: boolean;
    }) => void
  ) => {
    ipcRenderer.on('ollama-download-progress', (_event, data) => callback(data));
  },

  // Remove listeners
  removeOllamaStreamListener: () => {
    ipcRenderer.removeAllListeners('ollama-stream-chunk');
  },

  removeOllamaDownloadListener: () => {
    ipcRenderer.removeAllListeners('ollama-download-progress');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      streamOllamaResponse: (prompt: string, model?: string) => Promise<void>;
      stopOllamaStream: () => Promise<{ success: boolean }>;
      testOllamaConnection: () => Promise<{
        success: boolean;
        models?: Array<{ value: string; label: string; size?: number; modified_at?: string }>;
        error?: string;
      }>;
      checkOllamaInstalled: () => Promise<{ installed: boolean; error?: string }>;
      installOllama: () => Promise<{ success: boolean; error?: string }>;
      startOllamaServer: () => Promise<{
        success: boolean;
        alreadyRunning?: boolean;
        error?: string;
      }>;
      downloadOllamaModel: (modelName: string) => Promise<void>;
      cancelOllamaDownload: (modelName: string) => Promise<{ success: boolean; error?: string }>;
      onOllamaStream: (callback: (data: { chunk: string; done: boolean }) => void) => void;
      onOllamaDownloadProgress: (
        callback: (data: {
          modelName: string;
          status: string;
          completed?: number;
          total?: number;
          done: boolean;
          error?: boolean;
        }) => void
      ) => void;
      removeOllamaStreamListener: () => void;
      removeOllamaDownloadListener: () => void;
    };
  }
}
