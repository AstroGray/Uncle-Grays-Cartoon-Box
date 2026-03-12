const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cartoonBox', {
  loadCartoons: () => ipcRenderer.invoke('load-cartoons'),
  listEpisodes: (folderPath) => ipcRenderer.invoke('list-episodes', folderPath),
  playVideo: (filePath) => ipcRenderer.invoke('play-video', filePath)
});
