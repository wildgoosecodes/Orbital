import { supabase } from './supabaseClient';

// Synthesis takes ~3s + ~22ms per character, with occasional outliers near
// double that — long clips are slow and unpredictable (a 450-char clip has
// taken 22s), so chunks stay short.
const CHUNK_MAX_CHARS = 250;
const MAX_SPOKEN_CHARS = 1200;
const LEVEL_INTERVAL_MS = 50;

/** Scaled by length so short chunks fail fast and long ones get room for the
 *  latency tail: ≈10.5s for a 60-char sentence, ≈18s for a full 250-char chunk. */
function chunkTimeoutMs(chunk: string): number {
  return 8000 + 40 * chunk.length;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

// Safari/WebKit doesn't keep its own strong reference to a speaking utterance —
// if nothing else holds it, it can be garbage-collected mid-speech, silently
// cutting off audio. Holding it here for the duration of playback prevents that.
let activeUtterance: SpeechSynthesisUtterance | null = null;

/** Must run synchronously inside the user's tap. iOS (and Chrome's autoplay
 *  policy) only let audio start within a user-activation window, but the reply
 *  plays several awaits later (mic, transcribe, chat) — so the AudioContext is
 *  resumed and speechSynthesis primed here, while the gesture is still active. */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state !== 'running') void ctx.resume();
    const silent = ctx.createBufferSource();
    silent.buffer = ctx.createBuffer(1, 1, 22050);
    silent.connect(ctx.destination);
    silent.start(0);
  }
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

async function fetchSpeechBuffer(ctx: AudioContext, text: string, signal: AbortSignal, timeout: number): Promise<AudioBuffer> {
  const { data, error } = await supabase.functions.invoke('synthesize-speech', { body: { text }, signal, timeout });
  if (error) throw error;
  if (!(data instanceof Blob)) throw new Error('Unexpected response from the voice service');
  return ctx.decodeAudioData(await data.arrayBuffer());
}

/** A context iOS never unlocked stays suspended, and a source started on it
 *  never plays or fires `ended` — check up front rather than hang. */
async function ensureRunning(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'running') return true;
  await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
  // Re-read after the await — TS keeps the earlier narrowing, but resume() changes it.
  return (ctx.state as AudioContextState) === 'running';
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
  let currentSource: AudioBufferSourceNode | null = null;
  let levelTimer: ReturnType<typeof setInterval> | null = null;

  function markStarted() {
    if (started) return;
    started = true;
    onStart();
  }

  if (chunks.length === 0) {
    onDone();
    return () => {};
  }

  const ctx = getAudioContext();
  const analyser = ctx?.createAnalyser() ?? null;
  if (ctx && analyser) {
    analyser.fftSize = 1024;
    analyser.connect(ctx.destination);
  }

  // Request every chunk at once so later ones are usually ready before the
  // chunk ahead of them finishes playing. Aborted on stop() so an interrupted
  // reply doesn't keep paying for audio nobody will hear.
  const requests = new AbortController();
  const pending = ctx ? chunks.map((chunk) => fetchSpeechBuffer(ctx, chunk, requests.signal, chunkTimeoutMs(chunk))) : [];
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

  function startMeasuredLevels(node: AnalyserNode) {
    const samples = new Float32Array(node.fftSize);
    levelTimer = setInterval(() => {
      node.getFloatTimeDomainData(samples);
      let sumSquares = 0;
      for (let i = 0; i < samples.length; i++) sumSquares += samples[i] * samples[i];
      onLevel(Math.sqrt(sumSquares / samples.length));
    }, LEVEL_INTERVAL_MS);
  }

  // The browser voice exposes no audio stream to measure, so the orb gets a
  // gentle synthetic pulse instead of going still.
  function startSyntheticLevels() {
    const started = Date.now();
    levelTimer = setInterval(() => {
      const t = (Date.now() - started) / 1000;
      onLevel(0.04 + 0.05 * Math.abs(Math.sin(t * 6)));
    }, LEVEL_INTERVAL_MS);
  }

  function playBuffer(context: AudioContext, node: AnalyserNode, buffer: AudioBuffer): Promise<void> {
    return new Promise((resolve) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(node);
      // Backstop in case `ended` never fires (e.g. the context gets suspended mid-play).
      const backstop = setTimeout(resolve, (buffer.duration + 1) * 1000);
      source.onended = () => {
        clearTimeout(backstop);
        resolve();
      };
      currentSource = source;
      source.start();
    });
  }

  void (async () => {
    for (let i = 0; i < chunks.length; i++) {
      if (stopped) return;
      let buffer: AudioBuffer | null = null;
      if (ctx && analyser && !degraded) {
        try {
          buffer = await pending[i];
        } catch (err) {
          if (stopped) return;
          console.error('Orbital voice unavailable, using the browser voice for the rest of this reply:', err);
          degrade();
        }
      }
      if (stopped) return;

      let playable = false;
      if (buffer && ctx) {
        playable = await ensureRunning(ctx);
        if (!playable) degrade();
      }
      if (stopped) return;

      if (playable && buffer && ctx && analyser) {
        markStarted();
        startMeasuredLevels(analyser);
        await playBuffer(ctx, analyser, buffer);
      } else {
        markStarted();
        startSyntheticLevels();
        await speakWithBrowserVoice(chunks[i]);
      }
      stopLevels();
    }
    analyser?.disconnect();
    if (!stopped) onDone();
  })();

  return function stop() {
    if (stopped) return;
    stopped = true;
    requests.abort();
    try {
      currentSource?.stop();
    } catch {
      // Already stopped.
    }
    window.speechSynthesis?.cancel();
    if (levelTimer) clearInterval(levelTimer);
    levelTimer = null;
    analyser?.disconnect();
    onLevel(0);
  };
}
