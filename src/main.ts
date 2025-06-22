import { app, BrowserWindow, globalShortcut, screen, ipcMain } from "electron";
import path from "path";

/**
 * TL;DR App - Main Process
 * Entry point for the Electron main process that handles window creation and IPC communication
 */

if (require("electron-squirrel-startup")) {
  app.quit();
}

/** Reference to the main application window */
let mainWindow: BrowserWindow;

/**
 * Creates the main application window with appropriate settings
 * Centers the window on the screen and configures security settings
 */
const createWindow = (): void => {
  // Get the primary display dimensions for centering the window
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

  // Auto-hide on blur temporarily disabled for development
  // To re-enable, uncomment these lines
  // mainWindow.on("blur", () => {
  //   mainWindow.hide();
  // });
};

// ===============================
// IPC HANDLERS
// ===============================

/**
 * IPC handler for hide-window event
 * Hides the main window when triggered from renderer process
 */
ipcMain.handle("hide-window", (): void => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

/**
 * IPC handler for resize-window event
 * Resizes the main window to specified dimensions and centers it on screen
 * 
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event
 * @param {{ width: number; height: number }} dimensions - The new window dimensions
 */
ipcMain.handle("resize-window", (event: Electron.IpcMainInvokeEvent, { width, height }: { width: number; height: number }): void => {
  if (mainWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const screenSize = primaryDisplay.workAreaSize;

    // Calculate position to center window on screen
    const x = Math.round((screenSize.width - width) / 2);
    const y = Math.round((screenSize.height - height) / 2);

    mainWindow.setBounds({ x, y, width, height }, true);
  }
});

/**
 * App ready event handler
 * Creates the main window and registers global keyboard shortcuts
 */
app.on("ready", (): void => {
  createWindow();

  // Register global hotkey to toggle window visibility
  globalShortcut.register("CommandOrControl+Alt+Space", (): void => {
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

/**
 * Window-all-closed event handler
 * Quits the application when all windows are closed (except on macOS)
 */
app.on("window-all-closed", (): void => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * App activate event handler (macOS specific)
 * Re-creates the window when the dock icon is clicked and no windows are open
 */
app.on("activate", (): void => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * App will-quit event handler
 * Cleans up resources before the app exits by unregistering all shortcuts
 */
app.on("will-quit", (): void => {
  globalShortcut.unregisterAll();
});
