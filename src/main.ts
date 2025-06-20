import { app, BrowserWindow, globalShortcut, screen } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Get screen dimensions for centering
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window with TL;DR popup dimensions
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    x: Math.round((screenWidth - 600) / 2),
    y: Math.round((screenHeight - 400) / 2),
    show: false, // Start hidden
    frame: false, // Remove window frame for cleaner look
    alwaysOnTop: true, // Stay above other windows
    resizable: false, // Fixed size for consistency
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Load the app - proper Vite integration
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Only open DevTools in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Hide window when it loses focus (typical overlay behavior)
  mainWindow.on("blur", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });
};

const toggleWindow = () => {
  if (!mainWindow) {
    createWindow();
  }

  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow?.show();
    mainWindow?.focus();
  }
};

app.whenReady().then(() => {
  createWindow();

  // Register global hotkey (Cmd+Shift+Space on Mac, Ctrl+Shift+Space on Windows/Linux)
  const shortcut =
    process.platform === "darwin" ? "Cmd+Alt+Space" : "Ctrl+Shift+Space";

  const registered = globalShortcut.register(shortcut, toggleWindow);

  if (!registered) {
    console.log("Global shortcut registration failed");
  } else {
    console.log(`Global shortcut registered: ${shortcut}`);
  }
});

// Quit when all windows are closed, except on macOS
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

// Clean up global shortcuts when app is quitting
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
