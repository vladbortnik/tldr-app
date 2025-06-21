import { app, BrowserWindow, globalShortcut, screen, ipcMain } from "electron";
import path from "path";

if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow;

const createWindow = (): void => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Updated dimensions - 30% wider minimum
  mainWindow = new BrowserWindow({
    width: 780, // Increased from 600
    height: 80, // Smaller initial height for minimal search bar
    x: Math.round((width - 780) / 2),
    y: Math.round((height - 80) / 2),
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true, // Important for security
    },
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

  mainWindow.on("blur", () => {
    mainWindow.hide();
  });
};

// IPC handlers
ipcMain.handle("hide-window", () => {
  console.log("IPC: hide-window received"); // Debug log
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle("resize-window", (event, { width, height }) => {
  console.log("IPC: resize-window received", { width, height }); // Debug log
  if (mainWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const screenSize = primaryDisplay.workAreaSize;

    const x = Math.round((screenSize.width - width) / 2);
    const y = Math.round((screenSize.height - height) / 2);

    mainWindow.setBounds({ x, y, width, height }, true);
  }
});

app.on("ready", () => {
  createWindow();

  globalShortcut.register("CommandOrControl+Alt+Space", () => {
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

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
