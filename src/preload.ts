// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  resizeWindow: (dimensions: { width: number; height: number }) =>
    ipcRenderer.invoke("resize-window", dimensions),
});

// Type declarations for TypeScript
declare global {
  interface Window {
    electronAPI: {
      hideWindow: () => Promise<void>;
      resizeWindow: (dimensions: {
        width: number;
        height: number;
      }) => Promise<void>;
    };
  }
}
