import { app, BrowserWindow, globalShortcut, ipcMain, screen } from "electron";
import * as path from "path";

/**
 * TL;DR App - Main Process
 * Entry point for the Electron main process that handles window creation and IPC communication
 */

// Import storage service
import { StorageService } from '../services/storageService';

/**
 * Storage service instance for database operations
 * Use getInstance() to access the singleton
 */
const storageService = StorageService.getInstance();

if (require("electron-squirrel-startup")) {
  app.quit();
}

/**
 * Main application window reference
 * This must be maintained to prevent garbage collection
 */
let mainWindow: BrowserWindow | null = null;

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

  // Auto-hide window when it loses focus
  mainWindow.on("blur", () => {
    mainWindow.hide();
  });
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
 * IPC handler for initialize database
 * Initializes the database when triggered from renderer process
 */
ipcMain.handle("db:initialize", async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await storageService?.initialize();
    return { success: true };
  } catch (error) {
    console.error("Error initializing database:", error);
    return { success: false, error: error.message };
  }
});

/**
// Get command by name handler moved to the bottom of file to avoid duplicate registration

/**
 * IPC handler for save command
 * Saves a command to the database when triggered from renderer process
 * 
 * @param {Electron.IpcMainInvokeEvent} event - The IPC event
 * @param {any} command - The command to save
 */
ipcMain.handle("db:save-command", async (_event, command: any): Promise<any | null> => {
  try {
    const savedCommand = await storageService?.saveCommand(command);
    return savedCommand || null;
  } catch (error) {
    console.error("Error saving command:", error);
    return null;
  }
});

// Get recent commands handler moved to the bottom of file to avoid duplicate registration

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
  
  // Register ESC key to hide window
  globalShortcut.register("Escape", (): void => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
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

/**
 * IPC Handlers for Database Operations
 * These handlers run in the main process and access the SQLite database
 */

// Search commands in database
ipcMain.handle("db:search-commands", async (_event, query: string, limit: number = 10) => {
  try {
    return await storageService.searchCommands(query, limit);
  } catch (error) {
    console.error("Error in db:search-commands:", error);
    return [];
  }
});

// Get a command by name
ipcMain.handle("db:get-command-by-name", async (_event, name: string) => {
  try {
    return await storageService.getCommandByName(name);
  } catch (error) {
    console.error("Error in db:get-command-by-name:", error);
    return null;
  }
});

// Get recent commands
ipcMain.handle("db:get-recent-commands", async (_event, limit: number = 10) => {
  try {
    return await storageService.getRecentCommands(limit);
  } catch (error) {
    console.error("Error in db:get-recent-commands:", error);
    return [];
  }
});

// Get command count
ipcMain.handle("db:get-command-count", async () => {
  try {
    return await storageService.getCommandCount();
  } catch (error) {
    console.error("Error in db:get-command-count:", error);
    return 0;
  }
});

// Log command usage
ipcMain.handle("db:log-command-usage", async (_event, commandId: number, rawInput: string) => {
  try {
    return await storageService.logCommandUsage(commandId, rawInput);
  } catch (error) {
    console.error("Error in db:log-command-usage:", error);
    return false;
  }
});
