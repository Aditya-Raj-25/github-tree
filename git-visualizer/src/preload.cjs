const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  openFolder: () => ipcRenderer.invoke("open-folder-dialog"),
  loadRepo: (path) => ipcRenderer.invoke("git:load", path),
  getChangedFiles: (path, hash) => ipcRenderer.invoke("git:get-changed-files", path, hash)
});
