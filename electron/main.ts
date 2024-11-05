import { app, BrowserWindow, ipcMain, session } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import mime from 'mime-types'; // MIME tipi doğrulaması için eklendi
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

let mainWindow: BrowserWindow;

// Desteklenen MIME türleri
const supportedMimeTypes = [
  'application/zip',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain'
];

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  ipcMain.handle('download-file', async (event, url) => {
    const mimeType = mime.lookup(url);
    if (!supportedMimeTypes.includes(mimeType || "")) {
      mainWindow.webContents.send('download-error', 'Bu dosya türü indirilemez.');
      return;
    }

    const downloadSession = session.defaultSession;
    const downloadId = uuidv4();

    downloadSession.on('will-download', (event, item) => {
      const savePath = path.join(app.getPath('downloads'), item.getFilename());
      item.setSavePath(savePath);

      // İlerleme bilgilerini her indirme için `downloadId` ile gönderiyoruz
      item.on('updated', () => {
        mainWindow.webContents.send('download-progress', {
          downloadId,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes()
        });
      });

      // Duraklat, devam ettir ve iptal işlemleri için `downloadId` kullanarak işleyiciler
      ipcMain.on(`pause-download-${downloadId}`, () => {
        if (!item.isPaused()) {
          item.pause();
          mainWindow.webContents.send('download-status', { downloadId, message: 'İndirme duraklatıldı.' });
        }
      });

      ipcMain.on(`resume-download-${downloadId}`, () => {
        if (item.isPaused()) {
          item.resume();
          mainWindow.webContents.send('download-status', { downloadId, message: 'İndirme devam ediyor.' });
        }
      });

      ipcMain.on(`cancel-download-${downloadId}`, () => {
        item.cancel();
        mainWindow.webContents.send('download-status', { downloadId, message: 'İndirme iptal edildi.' });
      });

      item.once('done', (event, state) => {
        if (state === 'completed') {
          mainWindow.webContents.send('download-complete', { downloadId, savePath });
        } else {
          mainWindow.webContents.send('download-cancelled', downloadId);
        }
      });
    });

    mainWindow.webContents.downloadURL(url);
    mainWindow.webContents.send('download-start', downloadId);
  });
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
