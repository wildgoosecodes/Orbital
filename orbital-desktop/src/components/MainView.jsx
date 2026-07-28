import { useEffect, useRef, useState } from 'react';
import { LogOut, Mic, Sparkles, Square } from 'lucide-react';
import { useWakeWord } from '../hooks/useWakeWord';
import { blobToWav } from '../lib/wavEncoder';

const SILENCE_THRESHOLD = 0.02; // RMS amplitude
const MIN_SPEAKING_MS = 800; // ignore leading silence before the user starts talking
const SILENCE_DURATION_MS = 1200; // how long silence must persist to auto-stop

function speak(text) {
  if (!text) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

/** Watches amplitude on the given stream; calls onSilence() once speaking has
 *  clearly stopped. Only used for hands-free (wake-word-triggered) recording. */
function startSilenceMonitor(stream, onSilence) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  const startedAt = Date.now();
  let silenceStartedAt = null;
  let stopped = false;

  const intervalId = setInterval(() => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) sumSquares += data[i] * data[i];
    const rms = Math.sqrt(sumSquares / data.length);

    if (Date.now() - startedAt < MIN_SPEAKING_MS) return;

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

export default function MainView({ onSignOut }) {
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micStatus, setMicStatus] = useState('');
  const [startupEnabled, setStartupEnabled] = useState(false);

  const scrollRef = useRef(null);
  const conversationRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const silenceMonitorRef = useRef(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    (async () => {
      setStartupEnabled(await window.orbital.getStartupSetting());
      const result = await window.orbital.getBriefing();
      const reply = result.success ? result.reply : `Couldn't load your briefing: ${result.error}`;
      appendMessage('assistant', reply);
      if (result.success) speak(reply);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function appendMessage(role, content) {
    conversationRef.current = [...conversationRef.current, { role, content }];
    setMessages(conversationRef.current);
  }

  async function startRecording(handsFree) {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setMicStatus(`Couldn't access the microphone: ${err.message}`);
      return;
    }

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    });
    mediaRecorder.addEventListener('stop', async () => {
      stream.getTracks().forEach((track) => track.stop());
      if (silenceMonitorRef.current) {
        silenceMonitorRef.current();
        silenceMonitorRef.current = null;
      }
      await handleRecordingComplete(mediaRecorder.mimeType);
    });

    mediaRecorder.start();
    isRecordingRef.current = true;
    setIsRecording(true);
    setMicStatus(handsFree ? 'Listening for your command…' : 'Listening… click again to stop');

    if (handsFree) {
      silenceMonitorRef.current = startSilenceMonitor(stream, () => stopRecording());
    }
  }

  function stopRecording() {
    isRecordingRef.current = false;
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function handleRecordingComplete(mimeType) {
    if (recordedChunksRef.current.length === 0) {
      setMicStatus('');
      return;
    }
    setMicStatus('Transcribing…');

    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    const { base64, mimeType: wavMimeType } = await blobToWav(blob);

    const transcribeResult = await window.orbital.transcribe(base64, wavMimeType);
    if (!transcribeResult.success) {
      setMicStatus(`Transcription failed: ${transcribeResult.error}`);
      return;
    }

    appendMessage('user', transcribeResult.text);
    setMicStatus('');
    setSending(true);
    const chatResult = await window.orbital.sendChat(conversationRef.current);
    setSending(false);
    if (chatResult.success) {
      appendMessage('assistant', chatResult.reply);
      speak(chatResult.reply);
    } else {
      appendMessage('assistant', `Something went wrong: ${chatResult.error}`);
    }
  }

  useWakeWord(true, () => {
    window.orbital.showAndFocus();
    if (!isRecordingRef.current) startRecording(true);
  });

  async function handleStartupToggle(e) {
    const enabled = e.target.checked;
    setStartupEnabled(enabled);
    await window.orbital.setStartupSetting(enabled);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          Orbital Desktop
        </h2>
        <button onClick={onSignOut} aria-label="Sign out" className="text-slate-500 hover:text-slate-300 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-500">Thinking…</div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 flex flex-col items-center gap-2">
        <button
          onClick={() => (isRecording ? stopRecording() : startRecording(false))}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isRecording ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'
          } text-white`}
        >
          {isRecording ? <Square size={20} /> : <Mic size={20} />}
        </button>
        <div className="text-xs text-slate-500 min-h-[16px]">{micStatus}</div>
      </div>

      <div className="px-4 pb-4 flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          id="startup-toggle"
          checked={startupEnabled}
          onChange={handleStartupToggle}
          className="accent-indigo-500"
        />
        <label htmlFor="startup-toggle">Launch Orbital Desktop when I start my computer</label>
      </div>
    </div>
  );
}
