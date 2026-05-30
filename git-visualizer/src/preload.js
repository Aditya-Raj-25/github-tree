const { contextIsolation, ipcRenderer } = require("electron");
constextBridge.exposeInMainWorld("api", {
    openFolder: () => ipcRenderer.invoke("open-folder-dialog"),
    loadRepo: (path) => ipcRenderer.invoke("git:load", path),
    getDiff: (path, hash) => ipcRenderer.invoke("git:diff", path, hash)
});