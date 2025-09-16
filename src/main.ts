import { app, BrowserWindow, dialog, screen } from 'electron';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import url from 'node:url';
import { registerInvokeHandlers, createEmitter } from './ipc/register-handlers.js';
import { AppConfig } from './renderer/AppConfig.type.js';
import { ipcHandlers } from './ipc/handlers/index.js';

if (started) {
  app.quit();
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  const screenSize = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    show: false,
    width: screenSize.width,
    height: screenSize.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.once('ready-to-show', () => {
    mainWindow?.setMinimumSize(1200, 800);
    mainWindow?.setMenuBarVisibility(false);
    mainWindow?.maximize();
    mainWindow?.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// Check for single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    createWindow();

    registerInvokeHandlers(mainWindow!, ipcHandlers);
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
