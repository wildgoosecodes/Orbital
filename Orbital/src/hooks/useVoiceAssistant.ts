import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../lib/audioTranscription';

const SILENCE_THRESHOLD = 0.02; // RMS amplitude
const MIN_SPEAKING_MS = 800; // ignore leading silence before the user starts talking
const SILENCE_DURATION_MS = 1200; // how long silence must persist to auto-stop

export type VoiceStatus = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

function speak(text: string, onDone: () => void) {
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

/** iOS Safari only allows speechSynthesis.speak() to produce audio within an
 *  active "user activation" window — by the time the real reply is ready, several
 *  `await`s (getUserMedia, transcribe, chat) have passed since the tap that started
 *  recording, so the browser silently drops it. Speaking a near-silent utterance
 *  synchronously, in the same tap that starts recording, keeps speech "unlocked"
 *  for the rest of that gesture's activation window, so the real reply — spoken
 *  later, after those awaits — is still allowed to play. No-op on browsers that
 *  don't have this restriction (desktop, Android). */
function unlockSpeechSynthesis() {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  window.speechSynthesis.speak(utterance);
}

/** Watches amplitude on the given stream, reporting a live level for the orb
 *  animation and calling onSilence() once speaking has clearly stopped. */
function startSilenceMonitor(stream: MediaStream, onLevel: (level: number) => void, onSilence: () => void) {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const data = new Float32Array(analyser.fftSize);
  const startedAt = Date.now();
  let silenceStartedAt: number | null = null;
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

interface UseVoiceAssistantOptions {
  /** The same sendMessage from useAssistantChat that AIAssistantPanel uses,
   *  so voice-mode turns land in the one shared conversation instead of a
   *  divergent second one. */
  sendMessage: (text: string) => Promise<string | undefined>;
}

export function useVoiceAssistant({ sendMessage }: UseVoiceAssistantOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const silenceMonitorRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const handleRecordingComplete = useCallback(
    async (mimeType: string) => {
      if (recordedChunksRef.current.length === 0) {
        setStatus('idle');
        return;
      }
      setStatus('transcribing');
      try {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const text = await transcribeAudio(blob);

        setStatus('thinking');
        const reply = await sendMessage(text);

        if (reply) {
          setStatus('speaking');
          speak(reply, () => setStatus('idle'));
        } else {
          setStatus('idle');
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setStatus('error');
      }
    },
    [sendMessage],
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const startRecording = useCallback(async () => {
    window.speechSynthesis?.cancel();
    unlockSpeechSynthesis();
    setErrorMessage(null);

    let stream: MediaStream;
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

  return { status, micLevel, errorMessage, startRecording, stopRecording, reset };
}
