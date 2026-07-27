const { app, BrowserWindow, ipcMain, safeStorage, session } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Electron bundles its own (older) Node runtime, which lacks the native `WebSocket`
// global that @supabase/supabase-js's realtime client expects — polyfill it.
global.WebSocket = require('ws');

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY } = require('./config');
const { fetchBriefing } = require('./briefing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY — copy .env.example to .env and fill it in.');
}

const store = new Store();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function saveRefreshToken(refreshToken) {
  if (safeStorage.isEncryptionAvailable()) {
    store.set('refreshToken', safeStorage.encryptString(refreshToken).toString('base64'));
  } else {
    // Encryption unavailable (unusual on Windows) — fall back to plain storage rather than failing outright.
    store.set('refreshTokenPlain', refreshToken);
  }
}

function loadRefreshToken() {
  const encrypted = store.get('refreshToken');
  if (encrypted && safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
  }
  return store.get('refreshTokenPlain') || null;
}

function clearSession() {
  store.delete('refreshToken');
  store.delete('refreshTokenPlain');
}

function createWindow() {
  // Electron blocks getUserMedia by default unless the main process explicitly allows it.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  const win = new BrowserWindow({
    width: 480,
    height: 640,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('auth:restoreSession', async () => {
  const refreshToken = loadRefreshToken();
  if (!refreshToken) return { loggedIn: false };

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) {
    clearSession();
    return { loggedIn: false };
  }
  saveRefreshToken(data.session.refresh_token);
  return { loggedIn: true };
});

ipcMain.handle('auth:signIn', async (_event, { email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { success: false, error: error?.message ?? 'Sign-in failed.' };
  }
  saveRefreshToken(data.session.refresh_token);
  return { success: true };
});

ipcMain.handle('auth:signOut', async () => {
  await supabase.auth.signOut();
  clearSession();
  return { success: true };
});

ipcMain.handle('briefing:get', async () => {
  try {
    const reply = await fetchBriefing(supabase);
    return { success: true, reply };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('voice:transcribe', async (_event, { base64, mimeType }) => {
  try {
    const { data, error } = await supabase.functions.invoke('transcribe-audio', {
      body: { audio: { mimeType, data: base64 } },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return { success: true, text: data.text };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('chat:send', async (_event, messages) => {
  try {
    const { data, error } = await supabase.functions.invoke('assistant-chat', { body: { messages } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return { success: true, reply: data.reply };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
});

ipcMain.handle('startup:get', () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('startup:set', (_event, openAtLogin) => {
  app.setLoginItemSettings({ openAtLogin });
  return app.getLoginItemSettings().openAtLogin;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
