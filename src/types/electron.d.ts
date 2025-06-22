/**
 * TypeScript declaration file for Electron API bridge
 * Defines the interface for the preload-exposed Electron APIs
 */

interface ElectronAPI {
  /**
   * Hides the application window
   * @returns {Promise<void>} Promise that resolves when the window is hidden
   */
  hideWindow: () => Promise<void>;
  
  /**
   * Resizes the application window to specified dimensions
   * @param {object} dimensions - The dimensions to resize the window to
   * @param {number} dimensions.width - The width in pixels
   * @param {number} dimensions.height - The height in pixels
   * @returns {Promise<void>} Promise that resolves when the window is resized
   */
  resizeWindow: (dimensions: { width: number; height: number }) => Promise<void>;
}

interface Window {
  /**
   * The Electron API exposed by the preload script
   */
  electronAPI?: ElectronAPI;
}
