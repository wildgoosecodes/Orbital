import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToWav } from '../lib/wavEncoder';

const SILENCE_THRESHOLD = 0.02; // RMS amplitude
const MIN_SPEAKING_MS = 800; // ignore leading silence before the user starts talking
const SILENCE_DURATION_MS = 1200; // how long silence must persist to auto-stop

// This app stays open for days — cap conversation history so it doesn't grow
// the chat payload/DOM/memory forever over a long-running session.
const MAX_HISTORY_MESSAGES = 20;

function speak(text, onDone) {
  if (!text || !window.speechSynthesis) {
    onDone();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
}

/** Watches amplitude on the given stream, reporting a live level for the orb
 *  animation and calling onSilence() once speaking has clearly stopped. */
function startSilenceMonitor(stream, onLevel, onSilence) {
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
    onLevel(rms);

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

/** Desktop's voice state machine — mirrors Orbital/src/hooks/useVoiceAssistant.ts's
 *  shape (idle/listening/transcribing/thinking/speaking/error + mic-level-driven orb
 *  animation), but talks to the main process over IPC (transcribe/sendChat) instead
 *  of Supabase directly, and owns its own capped conversation history since Desktop
 *  has no shared useAssistantChat to plug into. */
export function useDesktopVoice({ onExchangeComplete } = {}) {
  const [status, setStatus] = useState('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [messages, setMessages] = useState([]);

  const conversationRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const silenceMonitorRef = useRef(null);
  const streamRef = useRef(null);

  function appendMessage(role, content) {
    conversationRef.current = [...conversationRef.current, { role, content }].slice(-MAX_HISTORY_MESSAGES);
    setMessages(conversationRef.current);
  }

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const handleRecordingComplete = useCallback(
    async (mimeType) => {
      if (recordedChunksRef.current.length === 0) {
        setStatus('idle');
        return;
      }
      setStatus('transcribing');
      try {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const { base64, mimeType: wavMimeType } = await blobToWav(blob);

        const transcribeResult = await window.orbital.transcribe(base64, wavMimeType);
        if (!transcribeResult.success) throw new Error(transcribeResult.error);

        appendMessage('user', transcribeResult.text);
        setStatus('thinking');
        const chatResult = await window.orbital.sendChat(conversationRef.current);
        if (!chatResult.success) throw new Error(chatResult.error);

        appendMessage('assistant', chatResult.reply);
        onExchangeComplete?.();
        setStatus('speaking');
        speak(chatResult.reply, () => setStatus('idle'));
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setStatus('error');
      }
    },
    [onExchangeComplete],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    window.speechSynthesis?.cancel();
    setErrorMessage(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setErrorMessage(err instanceof Error ? `Couldn't access the microphone: ${err.message}` : "Couldn't access the microphone.");
      setStatus('error');
      return;
    }
    streamRef.current = stream;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    });
    mediaRecorder.addEventListener('stop', async () => {
      stopAllTracks();
      if (silenceMonitorRef.current) {
        silenceMonitorRef.current();
        silenceMonitorRef.current = null;
      }
      setMicLevel(0);
      await handleRecordingComplete(mediaRecorder.mimeType);
    });

    mediaRecorder.start();
    setStatus('listening');
    silenceMonitorRef.current = startSilenceMonitor(stream, setMicLevel, stopRecording);
  }, [handleRecordingComplete, stopAllTracks, stopRecording]);

  const reset = useCallback(() => {
    window.speechSynthesis?.cancel();
    stopRecording();
    stopAllTracks();
    if (silenceMonitorRef.current) {
      silenceMonitorRef.current();
      silenceMonitorRef.current = null;
    }
    setStatus('idle');
    setMicLevel(0);
    setErrorMessage(null);
  }, [stopAllTracks, stopRecording]);

  useEffect(() => reset, [reset]);

  /** Speaks a one-way message (the morning briefing) without a recording round-trip
   *  — shown as the orb's caption the same way a normal exchange's reply would be. */
  const speakBriefing = useCallback((text) => {
    appendMessage('assistant', text);
    setStatus('speaking');
    speak(text, () => setStatus('idle'));
  }, []);

  return {
    status,
    micLevel,
    errorMessage,
    messages,
    isRecording: status === 'listening',
    startRecording,
    stopRecording,
    reset,
    speakBriefing,
  };
}
