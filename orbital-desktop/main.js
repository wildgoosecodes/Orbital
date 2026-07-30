const { app, BrowserWindow, ipcMain, safeStorage, session, Tray, Menu, nativeImage } = require('electron');
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

let win = null;
let tray = null;
let isQuitting = false;

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

  win = new BrowserWindow({
    width: 760,
    height: 820,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // The wake-word ONNX pipeline runs continuously in this renderer and must
      // keep running even while the window is hidden in the tray.
      backgroundThrottling: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'dist-renderer', 'index.html'));

  // Keep listening in the background — closing the window hides it instead of quitting.
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Orbital Desktop');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Orbital', click: () => { win.show(); win.focus(); } },
      { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
    ]),
  );
  tray.on('click', () => { win.show(); win.focus(); });
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

ipcMain.handle('data:getSnapshot', async () => {
  try {
    const [tasksRes, habitsRes, habitLogsRes, goalsRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('habits').select('*').order('created_at', { ascending: false }),
      supabase.from('habit_logs').select('habit_id, completed_on'),
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
    ]);
    if (tasksRes.error) throw tasksRes.error;
    if (habitsRes.error) throw habitsRes.error;
    if (habitLogsRes.error) throw habitLogsRes.error;
    if (goalsRes.error) throw goalsRes.error;
    return {
      success: true,
      tasks: tasksRes.data,
      habits: habitsRes.data,
      habitLogs: habitLogsRes.data,
      goals: goalsRes.data,
    };
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

ipcMain.handle('window:showAndFocus', () => {
  win.show();
  win.focus();
});

ipcMain.handle('wakeword:getModelDir', () => {
  const base = app.isPackaged ? process.resourcesPath : __dirname;
  return path.join(base, 'wakeword').replace(/\\/g, '/');
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Windows only, tray-backed — the window hides rather than closes, so this
  // shouldn't normally fire outside of an actual app.quit().
  if (process.platform !== 'darwin' && isQuitting) app.quit();
});
