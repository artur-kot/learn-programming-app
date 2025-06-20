import { app, BrowserWindow, dialog, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import url from 'node:url';
import fetch from 'node-fetch';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('learnfrontend', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('learnfrontend');
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
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

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// Check for single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
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

// Ollama API handlers
ipcMain.handle('stream-ollama-response', async (event, { prompt, model = 'qwen2.5-coder:14b' }) => {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // For node-fetch v3, we need to handle the response differently
    const responseText = await response.text();
    const lines = responseText.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (data.response) {
          event.sender.send('ollama-stream-chunk', {
            chunk: data.response,
            done: false,
          });
        }
        if (data.done) {
          event.sender.send('ollama-stream-chunk', { chunk: '', done: true });
          break;
        }
      } catch (parseError) {
        console.error('Error parsing Ollama response:', parseError);
      }
    }
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    event.sender.send('ollama-stream-chunk', {
      chunk: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      done: true,
    });
  }
});

// Test Ollama connection
ipcMain.handle('test-ollama-connection', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = (await response.json()) as {
        models?: Array<{ name: string; size?: number; modified_at?: string }>;
      };
      const models = data.models || [];
      return {
        success: true,
        models: models.map((model) => ({
          value: model.name,
          label: model.name,
          size: model.size,
          modified_at: model.modified_at,
        })),
      };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
