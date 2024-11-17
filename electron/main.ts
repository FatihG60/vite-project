import { app, BrowserWindow, ipcMain, session } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // İndirme işlemleri
  ipcMain.handle('download-file', async (event, url) => {
    const downloadSession = session.defaultSession;
    const downloadId = uuidv4();

    downloadSession.on('will-download', (event, item) => {
      const savePath = path.join(app.getPath('downloads'), item.getFilename());
      item.setSavePath(savePath);

      // İlerleme bilgisi gönder
      item.on('updated', () => {
        win?.webContents.send('download-progress', {
          downloadId,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      });

      // Duraklat, devam ettir ve iptal et
      ipcMain.on(`pause-download-${downloadId}`, () => {
        if (!item.isPaused()) {
          item.pause();
          win?.webContents.send('download-status', {
            downloadId,
            message: 'İndirme duraklatıldı.',
          });
        }
      });

      ipcMain.on(`resume-download-${downloadId}`, () => {
        if (item.isPaused()) {
          item.resume();
          win?.webContents.send('download-status', {
            downloadId,
            message: 'İndirme devam ediyor.',
          });
        }
      });

      ipcMain.on(`cancel-download-${downloadId}`, () => {
        item.cancel();
        win?.webContents.send('download-status', {
          downloadId,
          message: 'İndirme iptal edildi.',
        });
      });

      // İndirme tamamlanma veya iptal durumu
      item.once('done', (event, state) => {
        if (state === 'completed') {
          win?.webContents.send('download-complete', { downloadId, savePath });
        } else {
          win?.webContents.send('download-cancelled', downloadId);
        }
      });
    });

    win?.webContents.downloadURL(url);
    win?.webContents.send('download-start', downloadId);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
