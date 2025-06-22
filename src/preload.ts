/**
 * TL;DR App - Preload Script
 * 
 * Securely exposes specific IPC functions to the renderer process
 * See the Electron documentation for details on how to use preload scripts:
 * https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
 */
import { contextBridge, ipcRenderer } from "electron";

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
});

/**
 * NOTE: Global type declarations for the window interface have been moved to
 * a separate declaration file at src/types/electron.d.ts to provide better
 * type support throughout the application.
 */
