import { app, BrowserWindow, ipcMain, session } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { randomFillSync, randomUUID } from "crypto";
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
const native = { randomUUID };
function v4(options, buf, offset) {
  if (native.randomUUID && !buf && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return unsafeStringify(rnds);
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  ipcMain.handle("download-file", async (event, url) => {
    const downloadSession = session.defaultSession;
    const downloadId = v4();
    downloadSession.on("will-download", (event2, item) => {
      const savePath = path.join(app.getPath("downloads"), item.getFilename());
      item.setSavePath(savePath);
      item.on("updated", () => {
        win == null ? void 0 : win.webContents.send("download-progress", {
          downloadId,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes()
        });
      });
      ipcMain.on(`pause-download-${downloadId}`, () => {
        if (!item.isPaused()) {
          item.pause();
          win == null ? void 0 : win.webContents.send("download-status", {
            downloadId,
            message: "İndirme duraklatıldı."
          });
        }
      });
      ipcMain.on(`resume-download-${downloadId}`, () => {
        if (item.isPaused()) {
          item.resume();
          win == null ? void 0 : win.webContents.send("download-status", {
            downloadId,
            message: "İndirme devam ediyor."
          });
        }
      });
      ipcMain.on(`cancel-download-${downloadId}`, () => {
        item.cancel();
        win == null ? void 0 : win.webContents.send("download-status", {
          downloadId,
          message: "İndirme iptal edildi."
        });
      });
      item.once("done", (event3, state) => {
        if (state === "completed") {
          win == null ? void 0 : win.webContents.send("download-complete", { downloadId, savePath });
        } else {
          win == null ? void 0 : win.webContents.send("download-cancelled", downloadId);
        }
      });
    });
    win == null ? void 0 : win.webContents.downloadURL(url);
    win == null ? void 0 : win.webContents.send("download-start", downloadId);
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
