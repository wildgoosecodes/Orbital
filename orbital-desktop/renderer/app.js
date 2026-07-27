const loginView = document.getElementById('login-view');
const mainView = document.getElementById('main-view');
const errorEl = document.getElementById('error');
const chatMessagesEl = document.getElementById('chat-messages');
const micBtn = document.getElementById('mic-btn');
const micStatusEl = document.getElementById('mic-status');
const signoutBtn = document.getElementById('signout-btn');
const startupToggle = document.getElementById('startup-toggle');

let conversation = [];
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

// Silence-detection state for hands-free (wake-word-triggered) recording only.
let silenceMonitor = null;

function speak(text) {
  if (!text) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function addBubble(role, text) {
  const row = document.createElement('div');
  row.className = `bubble-row ${role}`;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessagesEl.appendChild(row);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  return bubble;
}

async function showMainView() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  signoutBtn.classList.remove('hidden');

  startupToggle.checked = await window.orbital.getStartupSetting();

  const pending = addBubble('assistant', 'Loading your briefing…');
  const result = await window.orbital.getBriefing();
  if (result.success) {
    pending.textContent = result.reply;
    conversation.push({ role: 'assistant', content: result.reply });
    speak(result.reply);
  } else {
    pending.textContent = `Couldn't load your briefing: ${result.error}`;
  }
}

function showLoginView() {
  mainView.classList.add('hidden');
  loginView.classList.remove('hidden');
  signoutBtn.classList.add('hidden');
}

document.getElementById('signin-btn').addEventListener('click', async () => {
  errorEl.textContent = '';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) {
    errorEl.textContent = 'Enter your email and password.';
    return;
  }
  const result = await window.orbital.signIn(email, password);
  if (result.success) {
    showMainView();
  } else {
    errorEl.textContent = result.error;
  }
});

signoutBtn.addEventListener('click', async () => {
  await window.orbital.signOut();
  conversation = [];
  chatMessagesEl.innerHTML = '';
  showLoginView();
});

startupToggle.addEventListener('change', async (e) => {
  await window.orbital.setStartupSetting(e.target.checked);
});

/** Watches amplitude on the given stream; calls onSilence() once speaking has
 *  clearly stopped. Only used for hands-free (wake-word) recording. */
function startSilenceMonitor(stream, onSilence) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  const SILENCE_THRESHOLD = 0.02; // RMS amplitude
  const MIN_SPEAKING_MS = 800; // ignore leading silence before the user starts talking
  const SILENCE_DURATION_MS = 1200; // how long silence must persist to auto-stop
  const startedAt = Date.now();
  let silenceStartedAt = null;
  let stopped = false;

  const intervalId = setInterval(() => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) sumSquares += data[i] * data[i];
    const rms = Math.sqrt(sumSquares / data.length);

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SPEAKING_MS) return;

    if (rms < SILENCE_THRESHOLD) {
      if (silenceStartedAt === null) silenceStartedAt = Date.now();
      else if (Date.now() - silenceStartedAt >= SILENCE_DURATION_MS) {
        stopped = true;
        onSilence();
      }
    } else {
      silenceStartedAt = null;
    }
  }, 150);

  return function cleanup() {
    stopped = true;
    clearInterval(intervalId);
    audioCtx.close();
  };
}

async function startRecording(handsFree = false) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    micStatusEl.textContent = `Couldn't access the microphone: ${err.message}`;
    return;
  }

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  });
  mediaRecorder.addEventListener('stop', async () => {
    stream.getTracks().forEach((track) => track.stop());
    if (silenceMonitor) {
      silenceMonitor();
      silenceMonitor = null;
    }
    await handleRecordingComplete();
  });

  mediaRecorder.start();
  isRecording = true;
  micBtn.classList.add('recording');
  micBtn.setAttribute('aria-label', 'Stop recording');
  micStatusEl.textContent = handsFree ? 'Listening for your command…' : 'Listening… click again to stop';

  if (handsFree) {
    silenceMonitor = startSilenceMonitor(stream, () => stopRecording());
  }
}

function stopRecording() {
  isRecording = false;
  micBtn.classList.remove('recording');
  micBtn.setAttribute('aria-label', 'Start recording');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
}

async function handleRecordingComplete() {
  if (recordedChunks.length === 0) {
    micStatusEl.textContent = '';
    return;
  }
  micStatusEl.textContent = 'Transcribing…';
  micBtn.disabled = true;

  try {
    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
    const { base64, mimeType } = await blobToWav(blob);

    const transcribeResult = await window.orbital.transcribe(base64, mimeType);
    if (!transcribeResult.success) {
      micStatusEl.textContent = `Transcription failed: ${transcribeResult.error}`;
      return;
    }

    const text = transcribeResult.text;
    addBubble('user', text);
    conversation.push({ role: 'user', content: text });

    micStatusEl.textContent = 'Thinking…';
    const pending = addBubble('assistant', 'Thinking…');
    const chatResult = await window.orbital.sendChat(conversation);
    if (chatResult.success) {
      pending.textContent = chatResult.reply;
      conversation.push({ role: 'assistant', content: chatResult.reply });
      speak(chatResult.reply);
    } else {
      pending.textContent = `Something went wrong: ${chatResult.error}`;
    }
    micStatusEl.textContent = '';
  } finally {
    micBtn.disabled = false;
  }
}

micBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording(false);
  }
});

(async function init() {
  const { loggedIn } = await window.orbital.restoreSession();
  if (loggedIn) {
    showMainView();
  } else {
    showLoginView();
  }
})();
