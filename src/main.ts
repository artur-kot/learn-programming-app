import { app, BrowserWindow, dialog, screen, ipcMain } from 'electron';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import url from 'node:url';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('learnp', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('learnp');
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

let mainWindow: BrowserWindow | null = null;

// ---------------- Appearance Config Persistence ----------------
type AppConfig = {
  themePreference?: 'system' | 'light' | 'dark';
};

const getConfigPath = () => {
  return path.join(app.getPath('userData'), 'config.json');
};

async function readConfig(): Promise<AppConfig> {
  const file = getConfigPath();
  try {
    if (!fs.existsSync(file)) {
      return {};
    }
    const raw = await fsp.readFile(file, 'utf-8');
    return JSON.parse(raw) as AppConfig;
  } catch {
    return {};
  }
}

async function writeConfig(patch: Partial<AppConfig>) {
  const current = await readConfig();
  const next = { ...current, ...patch } as AppConfig;
  try {
    await fsp.mkdir(path.dirname(getConfigPath()), { recursive: true });
    await fsp.writeFile(getConfigPath(), JSON.stringify(next, null, 2), 'utf-8');
  } catch (e) {
    // Silently ignore for now; could add logging.
  }
}

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

  // and load the index.html of the app.
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
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // the commandLine is array of strings in which last element is deep link url
    dialog.showErrorBox('Welcome Back', `You arrived from: ${commandLine.pop()}`);
  });

  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(createWindow);
  // Register IPC once app is ready
  app.whenReady().then(() => {
    ipcMain.handle('theme:get', async () => {
      const cfg = await readConfig();
      return cfg.themePreference || 'system';
    });
    ipcMain.handle('theme:set', async (_e, theme: 'system' | 'light' | 'dark') => {
      await writeConfig({ themePreference: theme });
      return theme;
    });
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

app.on('open-url', (event, url) => {
  dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`);
});
