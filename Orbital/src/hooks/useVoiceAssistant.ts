import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../lib/audioTranscription';
import { speakAloud, unlockAudio } from '../lib/orbitalVoice';
import type { SendMessageOptions } from './useAssistantChat';

const SILENCE_THRESHOLD = 0.02; // RMS amplitude
const MIN_SPEAKING_MS = 800; // ignore leading silence before the user starts talking
const SILENCE_DURATION_MS = 1200; // how long silence must persist to auto-stop

export type VoiceStatus = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'preparing' | 'speaking' | 'error';

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
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<string | undefined>;
}

export function useVoiceAssistant({ sendMessage }: UseVoiceAssistantOptions) {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const [speakingLevel, setSpeakingLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const silenceMonitorRef = useRef<(() => void) | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopSpeakingRef = useRef<(() => void) | null>(null);
  // Bumped on every new turn or reset, so a reply that arrives after the user
  // closed Voice Mode (or started over) is dropped instead of spoken.
  const turnRef = useRef(0);

  const stopAllTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopSpeaking = useCallback(() => {
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
    setSpeakingLevel(0);
  }, []);

  const handleRecordingComplete = useCallback(
    async (mimeType: string, turn: number) => {
      if (turn !== turnRef.current) return;
      if (recordedChunksRef.current.length === 0) {
        setStatus('idle');
        return;
      }
      setStatus('transcribing');
      try {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const text = await transcribeAudio(blob);
        if (turn !== turnRef.current) return;

        setStatus('thinking');
        const reply = await sendMessage(text, { channel: 'voice' });
        if (turn !== turnRef.current) return;

        if (reply) {
          // 'preparing' until audio actually starts (synthesis takes a few
          // seconds) — looks like thinking, but unlike thinking it can be interrupted.
          setStatus('preparing');
          stopSpeakingRef.current = speakAloud(reply, {
            onStart: () => setStatus('speaking'),
            onLevel: setSpeakingLevel,
            onDone: () => {
              stopSpeakingRef.current = null;
              setStatus('idle');
            },
          });
        } else {
          setStatus('idle');
        }
      } catch (err) {
        if (turn !== turnRef.current) return;
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

  /** Also the interrupt: tapping while Orbital is speaking cuts it off and
   *  starts listening. Everything before the first await runs inside the tap. */
  const startRecording = useCallback(async () => {
    stopSpeaking();
    unlockAudio();
    const turn = ++turnRef.current;
    setErrorMessage(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (turn !== turnRef.current) return;
      setErrorMessage(err instanceof Error ? `Couldn't access the microphone: ${err.message}` : "Couldn't access the microphone.");
      setStatus('error');
      return;
    }
    // Voice Mode was closed, or the orb tapped again, while the mic was starting
    // (e.g. during the permission prompt) — release this stream instead of
    // recording with it, or the mic stays live with nothing to stop it.
    if (turn !== turnRef.current) {
      stream.getTracks().forEach((track) => track.stop());
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
      await handleRecordingComplete(mediaRecorder.mimeType, turn);
    });

    mediaRecorder.start();
    setStatus('listening');
    silenceMonitorRef.current = startSilenceMonitor(stream, setMicLevel, stopRecording);
  }, [handleRecordingComplete, stopAllTracks, stopRecording, stopSpeaking]);

  const reset = useCallback(() => {
    turnRef.current++;
    stopSpeaking();
    stopRecording();
    stopAllTracks();
    if (silenceMonitorRef.current) {
      silenceMonitorRef.current();
      silenceMonitorRef.current = null;
    }
    setStatus('idle');
    setMicLevel(0);
    setErrorMessage(null);
  }, [stopAllTracks, stopRecording, stopSpeaking]);

  useEffect(() => reset, [reset]);

  return { status, micLevel, speakingLevel, errorMessage, startRecording, stopRecording, reset };
}
