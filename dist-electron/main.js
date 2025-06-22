"use strict";
const electron = require("electron");
const path = require("path");
if (require("electron-squirrel-startup")) {
  electron.app.quit();
}
let mainWindow;
const createWindow = () => {
  const primaryDisplay = electron.screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow = new electron.BrowserWindow({
    width: 780,
    // Increased from 600
    height: 80,
    // Smaller initial height for minimal search bar
    x: Math.round((width - 780) / 2),
    y: Math.round((height - 80) / 2),
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
      // Important for security
    }
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
};
electron.ipcMain.handle("hide-window", () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});
electron.ipcMain.handle("resize-window", (event, { width, height }) => {
  if (mainWindow) {
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    const screenSize = primaryDisplay.workAreaSize;
    const x = Math.round((screenSize.width - width) / 2);
    const y = Math.round((screenSize.height - height) / 2);
    mainWindow.setBounds({ x, y, width, height }, true);
  }
});
electron.app.on("ready", () => {
  createWindow();
  electron.globalShortcut.register("CommandOrControl+Alt+Space", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
