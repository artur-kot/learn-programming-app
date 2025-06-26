import { app, BrowserWindow, dialog, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import url from 'node:url';
import http from 'node:http';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';

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
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model,
      prompt,
      stream: true,
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP error! status: ${res.statusCode}`));
        return;
      }

      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                event.sender.send('ollama-stream-chunk', {
                  chunk: data.response,
                  done: false,
                });
              }
            } catch (parseError) {
              console.error('Error parsing Ollama response:', parseError);
            }
          }
        }
      });

      res.on('end', () => {
        // Process any remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n').filter((line) => line.trim());
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                event.sender.send('ollama-stream-chunk', {
                  chunk: data.response,
                  done: false,
                });
              }
            } catch (parseError) {
              console.error('Error parsing final buffer:', parseError);
            }
          }
        }
        event.sender.send('ollama-stream-chunk', { chunk: '', done: true });
        resolve(undefined);
      });

      res.on('error', (error) => {
        console.error('Response error:', error);
        event.sender.send('ollama-stream-chunk', {
          chunk: `Error: ${error.message}`,
          done: true,
        });
        reject(error);
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      event.sender.send('ollama-stream-chunk', {
        chunk: `Error: ${error.message}`,
        done: true,
      });
      reject(error);
    });

    req.write(postData);
    req.end();
  });
});

// Stop streaming handler
ipcMain.handle('stop-ollama-stream', async () => {
  // This will be handled by the client-side by setting streaming state to false
  return { success: true };
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

// Check if Ollama is installed
ipcMain.handle('check-ollama-installed', async () => {
  try {
    const execAsync = promisify(exec);

    // Check if ollama command exists
    if (process.platform === 'win32') {
      // On Windows, check if ollama.exe exists in PATH
      try {
        await execAsync('where ollama');
        return { installed: true };
      } catch {
        return { installed: false };
      }
    } else {
      // On Unix-like systems, check if ollama command exists
      try {
        await execAsync('which ollama');
        return { installed: true };
      } catch {
        return { installed: false };
      }
    }
  } catch (error) {
    return { installed: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Install Ollama
ipcMain.handle('install-ollama', async () => {
  try {
    const execAsync = promisify(exec);

    if (process.platform === 'win32') {
      // On Windows, download and install Ollama
      const installScript = `
        Write-Host "Installing Ollama..."
        Invoke-WebRequest -Uri "https://ollama.ai/download/ollama-windows-amd64.exe" -OutFile "$env:TEMP\\ollama-installer.exe"
        Start-Process -FilePath "$env:TEMP\\ollama-installer.exe" -ArgumentList "/S" -Wait
        Write-Host "Ollama installation completed"
      `;

      await execAsync(`powershell -Command "${installScript}"`);
      return { success: true };
    } else if (process.platform === 'darwin') {
      // On macOS, use curl to install
      await execAsync('curl -fsSL https://ollama.ai/install.sh | sh');
      return { success: true };
    } else {
      // On Linux, use curl to install
      await execAsync('curl -fsSL https://ollama.ai/install.sh | sh');
      return { success: true };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Start Ollama server
ipcMain.handle('start-ollama-server', async () => {
  try {
    // Check if Ollama is already running
    const isRunning = await checkOllamaServer();
    if (isRunning) {
      return { success: true, alreadyRunning: true };
    }

    // Start Ollama server
    const ollamaProcess = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
    });

    // Wait a bit for the server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if server started successfully
    const serverStarted = await checkOllamaServer();

    if (serverStarted) {
      return { success: true, alreadyRunning: false };
    } else {
      return { success: false, error: 'Failed to start Ollama server' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Helper function to check if Ollama server is running
async function checkOllamaServer(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
