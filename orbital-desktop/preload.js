const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbital', {
  restoreSession: () => ipcRenderer.invoke('auth:restoreSession'),
  signIn: (email, password) => ipcRenderer.invoke('auth:signIn', { email, password }),
  signOut: () => ipcRenderer.invoke('auth:signOut'),
  getBriefing: () => ipcRenderer.invoke('briefing:get'),
  getStartupSetting: () => ipcRenderer.invoke('startup:get'),
  setStartupSetting: (openAtLogin) => ipcRenderer.invoke('startup:set', openAtLogin),
});
