import { app, BrowserWindow, dialog, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import url from 'node:url';
import http from 'node:http';
import { spawn, exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';

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
  // mainWindow.webContents.openDevTools();
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

// Track active downloads for cancellation
const activeDownloads = new Map<
  string,
  { req: http.ClientRequest; abortController: AbortController }
>();

// Track active streaming requests for cancellation
const activeStreams = new Map<
  string,
  { req: http.ClientRequest; abortController: AbortController }
>();

// Ollama API handlers
ipcMain.handle('stream-ollama-response', async (event, { prompt, model = 'qwen2.5-coder:14b' }) => {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();
    const streamId = `${model}-${Date.now()}`; // Create unique stream ID

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
      signal: abortController.signal,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        activeStreams.delete(streamId);
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
        activeStreams.delete(streamId);
        resolve(undefined);
      });

      res.on('error', (error) => {
        console.error('Response error:', error);
        event.sender.send('ollama-stream-chunk', {
          chunk: `Error: ${error.message}`,
          done: true,
        });
        activeStreams.delete(streamId);
        reject(error);
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      event.sender.send('ollama-stream-chunk', {
        chunk: `Error: ${error.message}`,
        done: true,
      });
      activeStreams.delete(streamId);
      reject(error);
    });

    // Store the request for potential cancellation
    activeStreams.set(streamId, { req, abortController });

    req.write(postData);
    req.end();
  });
});

// Stop streaming handler
ipcMain.handle('stop-ollama-stream', async (event) => {
  try {
    // Cancel all active streams
    let cancelledCount = 0;

    for (const [streamId, stream] of activeStreams.entries()) {
      try {
        stream.abortController.abort();
        stream.req.destroy();
        cancelledCount++;

        // Send cancellation signal to renderer
        event.sender.send('ollama-stream-chunk', {
          chunk: '',
          done: true,
          cancelled: true,
        });
      } catch (error) {
        console.error(`Error cancelling stream ${streamId}:`, error);
      }
    }

    // Clear all streams from the map
    activeStreams.clear();

    return {
      success: true,
      cancelledCount,
      message:
        cancelledCount > 0
          ? `Cancelled ${cancelledCount} active stream(s)`
          : 'No active streams to cancel',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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

// Download/Pull Ollama model
ipcMain.handle('download-ollama-model', async (event, { modelName }) => {
  return new Promise((resolve, reject) => {
    const abortController = new AbortController();

    const postData = JSON.stringify({
      name: modelName,
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/pull',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      signal: abortController.signal,
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        activeDownloads.delete(modelName);
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
              // Send progress updates to renderer
              event.sender.send('ollama-download-progress', {
                modelName,
                status: data.status,
                completed: data.completed,
                total: data.total,
                done: false,
              });
            } catch (parseError) {
              console.error('Error parsing Ollama download response:', parseError);
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
              event.sender.send('ollama-download-progress', {
                modelName,
                status: data.status,
                completed: data.completed,
                total: data.total,
                done: false,
              });
            } catch (parseError) {
              console.error('Error parsing final download buffer:', parseError);
            }
          }
        }

        // Send completion signal
        event.sender.send('ollama-download-progress', {
          modelName,
          status: 'Download completed',
          done: true,
        });

        activeDownloads.delete(modelName);
        resolve({ success: true });
      });

      req.on('error', (error) => {
        console.error('Download request error:', error);
        event.sender.send('ollama-download-progress', {
          modelName,
          status: `Error: ${error.message}`,
          done: true,
          error: true,
        });
        activeDownloads.delete(modelName);
        reject(error);
      });
    });

    // Store the request for potential cancellation
    activeDownloads.set(modelName, { req, abortController });

    req.write(postData);
    req.end();
  });
});

// Cancel Ollama model download
ipcMain.handle('cancel-ollama-download', async (event, { modelName }) => {
  try {
    const download = activeDownloads.get(modelName);
    if (download) {
      download.abortController.abort();
      download.req.destroy();
      activeDownloads.delete(modelName);

      // Send cancellation signal to renderer
      event.sender.send('ollama-download-progress', {
        modelName,
        status: 'Download cancelled',
        done: true,
        error: true,
      });

      return { success: true };
    } else {
      return { success: false, error: 'Download not found' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Delete Ollama model
ipcMain.handle('delete-ollama-model', async (event, { modelName }) => {
  try {
    const postData = JSON.stringify({
      name: modelName,
    });

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/delete',
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        console.error('Delete request error:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get system information for model recommendations
ipcMain.handle('get-system-info', async () => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const platform = os.platform();
    const arch = os.arch();

    // Calculate memory in GB
    const totalMemoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
    const freeMemoryGB = Math.round(freeMemory / (1024 * 1024 * 1024));

    // Get CPU info
    const cpuCount = cpus.length;
    const cpuModel = cpus[0]?.model || 'Unknown';

    // Check if we're on Apple Silicon (M1/M2/M3)
    const isAppleSilicon = platform === 'darwin' && arch === 'arm64';

    // Get detailed GPU information
    let gpuInfo = {
      hasDedicatedGPU: false,
      gpuModel: 'Integrated Graphics',
      gpuVendor: 'Unknown',
      gpuMemory: null as number | null,
    };

    if (platform === 'win32') {
      try {
        // Get GPU information using PowerShell
        const { stdout } = await promisify(exec)(
          'powershell -Command "Get-WmiObject -Class Win32_VideoController | Select-Object Name, AdapterRAM, VideoProcessor | ConvertTo-Json"'
        );
        const gpuData = JSON.parse(stdout);

        if (Array.isArray(gpuData)) {
          // Find the most powerful GPU (usually the first one or the one with most memory)
          const dedicatedGPU =
            gpuData.find(
              (gpu: any) =>
                gpu.Name &&
                (gpu.Name.toLowerCase().includes('nvidia') ||
                  gpu.Name.toLowerCase().includes('amd') ||
                  gpu.Name.toLowerCase().includes('radeon') ||
                  gpu.Name.toLowerCase().includes('rtx') ||
                  gpu.Name.toLowerCase().includes('gtx') ||
                  gpu.Name.toLowerCase().includes('rx'))
            ) || gpuData[0];

          if (dedicatedGPU) {
            gpuInfo.hasDedicatedGPU =
              dedicatedGPU.Name.toLowerCase().includes('nvidia') ||
              dedicatedGPU.Name.toLowerCase().includes('amd') ||
              dedicatedGPU.Name.toLowerCase().includes('radeon');
            gpuInfo.gpuModel = dedicatedGPU.Name || 'Unknown GPU';
            gpuInfo.gpuVendor = dedicatedGPU.Name?.toLowerCase().includes('nvidia')
              ? 'NVIDIA'
              : dedicatedGPU.Name?.toLowerCase().includes('amd')
                ? 'AMD'
                : dedicatedGPU.Name?.toLowerCase().includes('intel')
                  ? 'Intel'
                  : 'Unknown';

            // Convert memory from bytes to GB if available
            if (dedicatedGPU.AdapterRAM) {
              gpuInfo.gpuMemory = Math.round(dedicatedGPU.AdapterRAM / (1024 * 1024 * 1024));
            }
          }
        }
      } catch (error) {
        console.error('Failed to get GPU info on Windows:', error);
        // Fallback to basic detection
        try {
          const { stdout } = await promisify(exec)('wmic path win32_VideoController get name');
          const hasDedicated =
            stdout.toLowerCase().includes('nvidia') ||
            stdout.toLowerCase().includes('amd') ||
            stdout.toLowerCase().includes('radeon');
          gpuInfo.hasDedicatedGPU = hasDedicated;
          gpuInfo.gpuModel = hasDedicated ? 'Dedicated GPU' : 'Integrated Graphics';
        } catch {
          gpuInfo.hasDedicatedGPU = false;
          gpuInfo.gpuModel = 'Integrated Graphics';
        }
      }
    } else if (platform === 'darwin') {
      // On macOS, get detailed GPU info
      try {
        const { stdout } = await promisify(exec)('system_profiler SPDisplaysDataType -json');
        const displayData = JSON.parse(stdout);

        if (displayData.SPDisplaysDataType && displayData.SPDisplaysDataType.length > 0) {
          const gpu = displayData.SPDisplaysDataType[0];
          gpuInfo.gpuModel = gpu.sppci_model || gpu.sppci_name || 'Unknown GPU';

          if (isAppleSilicon) {
            gpuInfo.hasDedicatedGPU = true;
            gpuInfo.gpuVendor = 'Apple';
            gpuInfo.gpuModel = 'Apple Silicon GPU';
          } else if (gpu.sppci_model) {
            gpuInfo.hasDedicatedGPU = !gpu.sppci_model.toLowerCase().includes('intel');
            gpuInfo.gpuVendor = gpu.sppci_model.toLowerCase().includes('amd')
              ? 'AMD'
              : gpu.sppci_model.toLowerCase().includes('nvidia')
                ? 'NVIDIA'
                : gpu.sppci_model.toLowerCase().includes('intel')
                  ? 'Intel'
                  : 'Unknown';
          }
        }
      } catch (error) {
        console.error('Failed to get GPU info on macOS:', error);
        gpuInfo.hasDedicatedGPU = isAppleSilicon;
        gpuInfo.gpuModel = isAppleSilicon ? 'Apple Silicon GPU' : 'Integrated Graphics';
        gpuInfo.gpuVendor = isAppleSilicon ? 'Apple' : 'Unknown';
      }
    } else {
      // On Linux, try to detect GPU
      try {
        const { stdout } = await promisify(exec)('lspci | grep -i vga');
        const lines = stdout.split('\n').filter((line) => line.trim());

        if (lines.length > 0) {
          const gpuLine = lines[0];
          gpuInfo.hasDedicatedGPU =
            gpuLine.toLowerCase().includes('nvidia') ||
            gpuLine.toLowerCase().includes('amd') ||
            gpuLine.toLowerCase().includes('radeon');

          // Extract GPU model from lspci output
          const modelMatch = gpuLine.match(/\[([^\]]+)\]/);
          if (modelMatch) {
            gpuInfo.gpuModel = modelMatch[1];
          } else {
            gpuInfo.gpuModel = gpuInfo.hasDedicatedGPU ? 'Dedicated GPU' : 'Integrated Graphics';
          }

          gpuInfo.gpuVendor = gpuLine.toLowerCase().includes('nvidia')
            ? 'NVIDIA'
            : gpuLine.toLowerCase().includes('amd')
              ? 'AMD'
              : gpuLine.toLowerCase().includes('intel')
                ? 'Intel'
                : 'Unknown';
        }
      } catch (error) {
        console.error('Failed to get GPU info on Linux:', error);
        gpuInfo.hasDedicatedGPU = false;
        gpuInfo.gpuModel = 'Integrated Graphics';
        gpuInfo.gpuVendor = 'Unknown';
      }
    }

    return {
      success: true,
      systemInfo: {
        platform,
        arch,
        cpuCount,
        cpuModel,
        totalMemoryGB,
        freeMemoryGB,
        isAppleSilicon,
        hasDedicatedGPU: gpuInfo.hasDedicatedGPU,
        gpuModel: gpuInfo.gpuModel,
        gpuVendor: gpuInfo.gpuVendor,
        gpuMemory: gpuInfo.gpuMemory,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get model information from Ollama library
ipcMain.handle('get-ollama-models-info', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/library');
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        models: data.models || [],
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
