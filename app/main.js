const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let isKiosk = process.argv.includes('--kiosk');

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    backgroundColor: '#2d8bc9',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Hide cursor for TV kiosk use
  if (isKiosk) {
    mainWindow.webContents.insertCSS('* { cursor: none !important; }');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Quit shortcut (Ctrl+Q) — useful during development
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

// ──────────────────────────────────────────────
// IPC: Load cartoon config
// ──────────────────────────────────────────────
ipcMain.handle('load-cartoons', async () => {
  const configPath = path.join(__dirname, '..', 'config', 'cartoons.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load cartoons.json:', err.message);
    return [];
  }
});

// ──────────────────────────────────────────────
// IPC: List episodes in a cartoon folder
// ──────────────────────────────────────────────
ipcMain.handle('list-episodes', async (_event, folderPath) => {
  try {
    const resolved = path.resolve(folderPath);
    const files = fs.readdirSync(resolved);
    const videoExts = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v'];
    return files
      .filter(f => videoExts.includes(path.extname(f).toLowerCase()))
      .map(f => path.join(resolved, f));
  } catch (err) {
    console.error('Failed to list episodes:', err.message);
    return [];
  }
});

// ──────────────────────────────────────────────
// IPC: Play a video file with mpv
// ──────────────────────────────────────────────
ipcMain.handle('play-video', async (_event, filePath) => {
  return new Promise((resolve) => {
    // Hide the Electron window while mpv plays
    if (mainWindow) mainWindow.hide();

    const mpv = spawn('mpv', [
      '--fullscreen',
      '--no-terminal',
      '--really-quiet',
      '--input-default-bindings',
      '--input-vo-keyboard=yes',
      filePath
    ], { stdio: 'ignore' });

    mpv.on('close', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
      resolve();
    });

    mpv.on('error', (err) => {
      console.error('mpv error:', err.message);
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
      resolve();
    });
  });
});
