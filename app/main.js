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
    backgroundColor: '#e6efec',
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
  const postersDir = path.join(__dirname, '..', 'assets', 'posters');
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cartoons = JSON.parse(raw);

    // Scan the posters folder once (mirrors how list-episodes scans video folders)
    let posterFiles = [];
    try { posterFiles = fs.readdirSync(postersDir); } catch (_) {}

    return cartoons.map(cartoon => {
      // Derive slug from the cartoon's folder name (e.g. "spongebob-squarepants")
      const slug = path.basename(cartoon.folder);

      // Look for <slug>.<ext> in the posters directory — auto-discovery
      const match = posterFiles.find(f =>
        path.basename(f, path.extname(f)) === slug &&
        imageExts.includes(path.extname(f).toLowerCase())
      );

      if (match) {
        // Absolute path so Electron's file:// protocol can load it
        cartoon.poster = path.join(postersDir, match);
      } else if (cartoon.poster) {
        // Fall back to the config value, resolved to absolute
        cartoon.poster = path.resolve(path.dirname(configPath), cartoon.poster);
      }

      return cartoon;
    });
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
    const resolved = path.isAbsolute(folderPath)
      ? folderPath
      : path.join(__dirname, '..', folderPath);
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
