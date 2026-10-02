import { supabase } from './supabaseClient';

// Synthesis takes ~3s + ~22ms per character, with occasional outliers near
// double that — long clips are slow and unpredictable (a 450-char clip has
// taken 22s), so chunks stay short.
const CHUNK_MAX_CHARS = 250;
const MAX_SPOKEN_CHARS = 1200;
const LEVEL_INTERVAL_MS = 50;
/** Window of the precomputed loudness envelope that drives the orb. */
const ENVELOPE_STEP_S = 0.05;
const PLAY_START_TIMEOUT_MS = 5000;

/** Scaled by length so short chunks fail fast and long ones get room for the
 *  latency tail: ≈10.5s for a 60-char sentence, ≈18s for a full 250-char chunk. */
function chunkTimeoutMs(chunk: string): number {
  return 8000 + 40 * chunk.length;
}

// Orbital's voice plays through one reused <audio> element, not Web Audio. On
// iOS, Web Audio is muted by the silent switch and has played nothing at all in
// home-screen PWAs, while media-element playback routes to the speaker and
// coexists with mic capture (forcing the audio session to 'playback' instead
// blocks getUserMedia). iOS only lets an element play without a tap once it has
// played inside one — hence a single element, unlocked in unlockAudio().
let voiceElement: HTMLAudioElement | null = null;
let silentClipUrl: string | null = null;

function getVoiceElement(): HTMLAudioElement {
  if (!voiceElement) {
    voiceElement = new Audio();
    voiceElement.preload = 'auto';
  }
  return voiceElement;
}

/** 0.1s of 16-bit mono silence as a WAV — just enough to play during the tap. */
function getSilentClipUrl(): string {
  if (silentClipUrl) return silentClipUrl;
  const sampleRate = 24000;
  const sampleCount = sampleRate / 10;
  const view = new DataView(new ArrayBuffer(44 + sampleCount * 2));
  const writeTag = (offset: number, tag: string) => {
    for (let i = 0; i < tag.length; i++) view.setUint8(offset + i, tag.charCodeAt(i));
  };
  writeTag(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeTag(8, 'WAVE');
  writeTag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeTag(36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  silentClipUrl = URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }));
  return silentClipUrl;
}

// Safari/WebKit doesn't keep its own strong reference to a speaking utterance —
// if nothing else holds it, it can be garbage-collected mid-speech, silently
// cutting off audio. Holding it here for the duration of playback prevents that.
let activeUtterance: SpeechSynthesisUtterance | null = null;

/** Must run synchronously inside the user's tap. iOS (and Chrome's autoplay
 *  policy) only let audio start within a user-activation window, but the reply
 *  plays several awaits later (mic, transcribe, chat) — so the voice element and
 *  speechSynthesis are both played once here, while the gesture is still active. */
export function unlockAudio() {
  const element = getVoiceElement();
  element.src = getSilentClipUrl();
  element.play().catch(() => {});
  if (window.speechSynthesis) {
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  }
}

/** Markdown never belongs in speech — the assistant is asked for plain spoken
 *  replies in voice mode, this is the safety net if it slips. */
export function toSpeechText(text: string): string {
  const withoutBlocks = text.replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return withoutBlocks
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
        .replace(/[*_~`]+/g, '')
        .trim(),
    )
    .filter(Boolean)
    // Lines that were list items have no closing punctuation — add some so
    // they're spoken as separate phrases instead of one run-on.
    .map((line) => (/[.!?:;,]$/.test(line) ? line : `${line}.`))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Splits only where a sentence ends and the next starts with a capital or
 *  digit, so abbreviations mid-sentence ("seven p.m. tonight") stay intact. */
function splitSentences(text: string): string[] {
  const boundary = /[.!?]+["')\]]*\s+(?=["'([]?[A-Z0-9])/g;
  const sentences: string[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text))) {
    const end = match.index + match[0].length;
    sentences.push(text.slice(last, end).trim());
    last = end;
  }
  const tail = text.slice(last).trim();
  if (tail) sentences.push(tail);
  return sentences;
}

function hardWrap(sentence: string, max: number): string[] {
  const pieces: string[] = [];
  let rest = sentence;
  while (rest.length > max) {
    const cut = rest.lastIndexOf(' ', max);
    const at = cut > 0 ? cut : max;
    pieces.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) pieces.push(rest);
  return pieces;
}

function limitSpokenLength(text: string): string {
  if (text.length <= MAX_SPOKEN_CHARS) return text;
  let spoken = '';
  for (const sentence of splitSentences(text)) {
    if (spoken.length + sentence.length > MAX_SPOKEN_CHARS) break;
    spoken = spoken ? `${spoken} ${sentence}` : sentence;
  }
  return `${spoken} The rest is on your screen.`.trim();
}

/** First sentence alone (so Orbital starts talking sooner — synthesis time
 *  scales with clip length), then the remainder grouped into larger chunks. */
export function chunkForSpeech(text: string): string[] {
  const sentences = splitSentences(text).flatMap((s) => hardWrap(s, CHUNK_MAX_CHARS));
  if (sentences.length === 0) return [];
  const chunks = [sentences[0]];
  let current = '';
  for (const sentence of sentences.slice(1)) {
    if (current && current.length + 1 + sentence.length > CHUNK_MAX_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

interface SpeechClip {
  blob: Blob;
  /** Seconds; 0 if the WAV couldn't be parsed. */
  duration: number;
  /** RMS loudness per ENVELOPE_STEP_S window — the orb reads this in step with
   *  playback, since a media element exposes no live level of its own. */
  envelope: number[];
}

/** Reads duration and a loudness envelope straight from the WAV's PCM data
 *  (the voice service returns 16-bit PCM). Anything unexpected yields an empty
 *  envelope — the clip still plays, the orb just gets a synthetic pulse. */
function analyseWav(bytes: ArrayBuffer): Pick<SpeechClip, 'duration' | 'envelope'> {
  const view = new DataView(bytes);
  const tag = (at: number) => String.fromCharCode(...new Uint8Array(bytes, at, 4));
  if (view.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return { duration: 0, envelope: [] };

  let channels = 1;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataSize = 0;
  let offset = 12;
  while (offset + 8 <= view.byteLength) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    if (id === 'fmt ' && offset + 24 <= view.byteLength) {
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (id === 'data') {
      dataOffset = offset + 8;
      dataSize = Math.min(size, view.byteLength - dataOffset);
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (dataOffset < 0 || bitsPerSample !== 16 || !sampleRate || !channels) return { duration: 0, envelope: [] };

  const frameCount = Math.floor(dataSize / (2 * channels));
  const stepFrames = Math.max(1, Math.round(sampleRate * ENVELOPE_STEP_S));
  const envelope: number[] = [];
  for (let start = 0; start < frameCount; start += stepFrames) {
    const end = Math.min(frameCount, start + stepFrames);
    let sumSquares = 0;
    for (let frame = start; frame < end; frame++) {
      const sample = view.getInt16(dataOffset + frame * 2 * channels, true) / 32768;
      sumSquares += sample * sample;
    }
    envelope.push(Math.sqrt(sumSquares / (end - start)));
  }
  return { duration: frameCount / sampleRate, envelope };
}

async function fetchSpeechClip(text: string, signal: AbortSignal, timeout: number): Promise<SpeechClip> {
  const { data, error } = await supabase.functions.invoke('synthesize-speech', { body: { text }, signal, timeout });
  if (error) throw error;
  if (!(data instanceof Blob)) throw new Error('Unexpected response from the voice service');
  const bytes = await data.arrayBuffer();
  // Re-typed as WAV: Safari won't play a blob labelled application/octet-stream.
  return { blob: new Blob([bytes], { type: 'audio/wav' }), ...analyseWav(bytes) };
}

function speakWithBrowserVoice(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!text || !window.speechSynthesis) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const finish = () => {
      activeUtterance = null;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = (event) => {
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('speechSynthesis error:', event.error, 'for utterance:', activeUtterance?.text);
      }
      finish();
    };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

export interface SpeakHandlers {
  /** Fires when audio actually starts — synthesis takes a few seconds, and the
   *  UI shouldn't claim Orbital is speaking while it's still silent. */
  onStart: () => void;
  /** Raw RMS amplitude of Orbital's voice, roughly 0–0.3, for the orb animation. */
  onLevel: (level: number) => void;
  /** Called when the whole reply has finished playing — not when stopped early. */
  onDone: () => void;
}

/** Speaks a reply in Orbital's voice, falling back to the browser's built-in
 *  voice for any chunk the voice service can't produce. Returns a stop function
 *  for interrupting mid-reply. */
export function speakAloud(rawText: string, { onStart, onLevel, onDone }: SpeakHandlers): () => void {
  const chunks = chunkForSpeech(limitSpokenLength(toSpeechText(rawText)));
  let stopped = false;
  let started = false;
  let levelTimer: ReturnType<typeof setInterval> | null = null;
  let abortPlayback: (() => void) | null = null;

  function markStarted() {
    if (started) return;
    started = true;
    onStart();
  }

  if (chunks.length === 0) {
    onDone();
    return () => {};
  }

  // Request every chunk at once so later ones are usually ready before the
  // chunk ahead of them finishes playing. Aborted on stop() so an interrupted
  // reply doesn't keep paying for audio nobody will hear.
  const requests = new AbortController();
  const pending = chunks.map((chunk) => fetchSpeechClip(chunk, requests.signal, chunkTimeoutMs(chunk)));
  pending.forEach((p) => p.catch(() => {}));

  // Once Orbital's voice fails for one chunk, the rest of the reply uses the
  // browser voice — the remaining requests likely fail too, and flipping between
  // voices mid-reply is more jarring than one consistent fallback.
  let degraded = false;
  function degrade() {
    degraded = true;
    requests.abort();
  }

  function stopLevels() {
    if (levelTimer) clearInterval(levelTimer);
    levelTimer = null;
    onLevel(0);
  }

  // The browser voice exposes no audio stream to measure, so the orb gets a
  // gentle synthetic pulse instead of going still.
  function startSyntheticLevels() {
    const startedAt = Date.now();
    levelTimer = setInterval(() => {
      const t = (Date.now() - startedAt) / 1000;
      onLevel(0.04 + 0.05 * Math.abs(Math.sin(t * 6)));
    }, LEVEL_INTERVAL_MS);
  }

  function startEnvelopeLevels(element: HTMLAudioElement, envelope: number[]) {
    if (envelope.length === 0) {
      startSyntheticLevels();
      return;
    }
    levelTimer = setInterval(() => {
      onLevel(envelope[Math.floor(element.currentTime / ENVELOPE_STEP_S)] ?? 0);
    }, LEVEL_INTERVAL_MS);
  }

  /** Resolves true once the clip has played through (or was stopped), false if
   *  the element refused or failed to play it. */
  function playClip(clip: SpeechClip): Promise<boolean> {
    const element = getVoiceElement();
    const url = URL.createObjectURL(clip.blob);
    return new Promise((resolve) => {
      let settled = false;
      let backstop: ReturnType<typeof setTimeout> | null = null;
      let startGuard: ReturnType<typeof setTimeout> | null = null;
      const finish = (played: boolean) => {
        if (settled) return;
        settled = true;
        if (backstop) clearTimeout(backstop);
        if (startGuard) clearTimeout(startGuard);
        element.removeEventListener('ended', onEnded);
        element.removeEventListener('error', onError);
        abortPlayback = null;
        stopLevels();
        URL.revokeObjectURL(url);
        resolve(played);
      };
      const onEnded = () => finish(true);
      const onError = () => finish(false);
      abortPlayback = () => {
        element.pause();
        finish(true);
      };
      element.addEventListener('ended', onEnded);
      element.addEventListener('error', onError);
      element.src = url;
      // iOS can leave play() pending indefinitely (e.g. during an audio
      // interruption) — a local blob should start within milliseconds, so don't
      // sit on "Thinking…" forever waiting for it.
      startGuard = setTimeout(() => {
        element.pause();
        finish(false);
      }, PLAY_START_TIMEOUT_MS);
      element.play().then(
        () => {
          if (settled) return;
          if (startGuard) clearTimeout(startGuard);
          startGuard = null;
          markStarted();
          startEnvelopeLevels(element, clip.envelope);
          // Backstop in case `ended` never fires (e.g. playback stalls).
          const seconds = clip.duration || (Number.isFinite(element.duration) ? element.duration : 30);
          backstop = setTimeout(() => finish(true), (seconds + 1.5) * 1000);
        },
        () => finish(false),
      );
    });
  }

  void (async () => {
    for (let i = 0; i < chunks.length; i++) {
      if (stopped) return;
      let clip: SpeechClip | null = null;
      if (!degraded) {
        try {
          clip = await pending[i];
        } catch (err) {
          if (stopped) return;
          console.error('Orbital voice unavailable, using the browser voice for the rest of this reply:', err);
          degrade();
        }
      }
      if (stopped) return;

      if (clip) {
        const played = await playClip(clip);
        if (stopped) return;
        if (played) continue;
        console.error('Orbital voice could not play, using the browser voice for the rest of this reply');
        degrade();
      }

      markStarted();
      startSyntheticLevels();
      await speakWithBrowserVoice(chunks[i]);
      stopLevels();
    }
    if (!stopped) onDone();
  })();

  return function stop() {
    if (stopped) return;
    stopped = true;
    requests.abort();
    abortPlayback?.();
    window.speechSynthesis?.cancel();
    if (levelTimer) clearInterval(levelTimer);
    levelTimer = null;
    onLevel(0);
  };
}
