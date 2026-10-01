import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
// Each TTS model has its own daily request cap (Flash is 100/day on Tier 1),
// so when the preferred model is capped, fall through to Lite — same voice,
// separate quota — instead of dropping straight to the browser voice.
const MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
const VOICE = 'Achernar';
const STYLE = 'calm, warm, unhurried — a steady, reassuring co-pilot';
// Voice replies are 1–3 spoken sentences by design; this bounds per-request cost.
const MAX_CHARS = 600;
// Per attempt, and only a backstop for a hung upstream — the client already
// times out by chunk length (~18s for its largest 250-char chunk). A timed-out
// attempt isn't retried.
const TTS_TIMEOUT_MS = 30_000;

const MAX_ATTEMPTS_PER_MODEL = 3;

function makeJson(cors: Record<string, string>) {
  return function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  };
}

type TtsResponse = {
  steps?: { type?: string; content?: { type?: string; data?: string }[] }[];
};

async function synthesize(text: string): Promise<Uint8Array> {
  let lastError = '';
  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));

      const res = await fetch(TTS_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
        headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          input: [
            {
              type: 'user_input',
              content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLE }] }],
            },
          ],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: VOICE }] },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as TtsResponse;
        const audio = (data.steps ?? [])
          .filter((s) => s.type === 'model_output')
          .flatMap((s) => s.content ?? [])
          .filter((c) => c.type === 'audio')
          .pop();
        if (!audio?.data) throw new Error('No audio returned');
        return Uint8Array.from(atob(audio.data), (c) => c.charCodeAt(0));
      }

      lastError = `Gemini API error ${res.status}: ${await res.text()}`;
      // A cap won't lift by retrying the same model in a few seconds — move on to the next one.
      if (res.status === 429) {
        console.warn(`${model} is rate-limited, trying the next TTS model`);
        break;
      }
      // 503 is transient overload: retry this model with backoff. Anything else is a real error.
      if (res.status !== 503) throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const json = makeJson(cors);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const { text } = await req.json();
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return json({ error: 'text is required' }, 400);
    if (trimmed.length > MAX_CHARS) return json({ error: `text must be ${MAX_CHARS} characters or fewer` }, 400);

    const wav = await synthesize(trimmed);
    // octet-stream (not audio/wav) so supabase-js's functions.invoke hands the
    // client a Blob — it parses any unrecognized content type as text.
    return new Response(wav, { headers: { ...cors, 'Content-Type': 'application/octet-stream' } });
  } catch (err) {
    console.error(err);
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return json({ error: 'The voice service took too long to respond.' }, 504);
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Gemini API error 429') || message.includes('Gemini API error 503')) {
      return json({ error: 'The voice service is busy — try again in a few seconds.' }, 503);
    }
    return json({ error: message }, 500);
  }
});
