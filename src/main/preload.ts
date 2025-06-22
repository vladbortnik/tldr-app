/**
 * TL;DR App - Preload Script
 * 
 * Securely exposes specific IPC functions to the renderer process
 * See the Electron documentation for details on how to use preload scripts:
 * https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
 */
import { contextBridge, ipcRenderer } from "electron";
import { Command } from "../shared/types";

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 * 
 * This creates a safe API bridge between main and renderer processes
 */
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Hides the application window
   * @returns {Promise<void>} Promise that resolves when the window is hidden
   */
  hideWindow: (): Promise<void> => ipcRenderer.invoke("hide-window"),
  
  /**
   * Resizes the application window to specified dimensions
   * @param {object} dimensions - The dimensions to resize the window to
   * @param {number} dimensions.width - The width in pixels
   * @param {number} dimensions.height - The height in pixels
   * @returns {Promise<void>} Promise that resolves when the window is resized
   */
  resizeWindow: (dimensions: { width: number; height: number }): Promise<void> =>
    ipcRenderer.invoke("resize-window", dimensions),

  /**
   * Database operations bridge - provides safe access to SQLite operations
   * All database operations are executed in the main process
   */
  database: {
    /**
     * Search commands in database
     * @param {string} query - Search query
     * @param {number} limit - Maximum results to return
     * @returns {Promise<Command[]>} Matching commands
     */
    searchCommands: (query: string, limit: number = 10): Promise<Command[]> => 
      ipcRenderer.invoke("db:search-commands", query, limit),
    
    /**
     * Get a command by name
     * @param name - The command name
     * @returns Promise that resolves with the command or null if not found
     */
    getCommandByName: (name: string) => 
      ipcRenderer.invoke('db:get-command-by-name', name),
    
    /**
     * Get recent commands
     * @param {number} limit - Maximum results
     * @returns {Promise<Command[]>} Recent commands
     */
    getRecentCommands: (limit: number = 10): Promise<Command[]> => 
      ipcRenderer.invoke("db:get-recent-commands", limit),
    
    /**
     * Get command count
     * @returns {Promise<number>} Number of commands
     */
    getCommandCount: (): Promise<number> => 
      ipcRenderer.invoke("db:get-command-count"),
      
    /**
     * Log command usage
     * @param {number} commandId - Command ID
     * @param {string} rawInput - User input
     * @returns {Promise<boolean>} Success status
     */
    logCommandUsage: (commandId: number, rawInput: string): Promise<boolean> => 
      ipcRenderer.invoke("db:log-command-usage", commandId, rawInput),
  },
});

/**
 * NOTE: Global type declarations for the window interface have been moved to
 * a separate declaration file at src/types/electron.d.ts to provide better
 * type support throughout the application.
 */
