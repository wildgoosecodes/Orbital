const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('orbital', {
  restoreSession: () => ipcRenderer.invoke('auth:restoreSession'),
  signIn: (email, password) => ipcRenderer.invoke('auth:signIn', { email, password }),
  signOut: () => ipcRenderer.invoke('auth:signOut'),
  getBriefing: () => ipcRenderer.invoke('briefing:get'),
  transcribe: (base64, mimeType) => ipcRenderer.invoke('voice:transcribe', { base64, mimeType }),
  sendChat: (messages) => ipcRenderer.invoke('chat:send', messages),
  getStartupSetting: () => ipcRenderer.invoke('startup:get'),
  setStartupSetting: (openAtLogin) => ipcRenderer.invoke('startup:set', openAtLogin),
});
