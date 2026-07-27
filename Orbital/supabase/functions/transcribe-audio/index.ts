import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RETRYABLE_STATUS = new Set([429, 503]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function callGemini(body: unknown): Promise<Record<string, unknown>> {
  let lastError = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) return res.json();

    lastError = `Gemini API error ${res.status}: ${await res.text()}`;
    if (!RETRYABLE_STATUS.has(res.status)) throw new Error(lastError);
  }
  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });

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

    const { audio } = await req.json();
    if (!audio?.data || !audio?.mimeType) {
      return json({ error: 'audio.data and audio.mimeType are required' }, 400);
    }

    const data = await callGemini({
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Transcribe exactly what is said in this audio. Output only the transcription, nothing else — no quotes, no commentary.' },
            { inlineData: { mimeType: audio.mimeType, data: audio.data } },
          ],
        },
      ],
    });

    const text = (data.candidates as { content?: { parts?: { text?: string }[] } }[] | undefined)?.[0]
      ?.content?.parts?.map((p) => p.text ?? '')
      .join('')
      .trim();

    if (!text) return json({ error: 'No transcription returned' }, 502);
    return json({ text });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Gemini API error 429') || message.includes('Gemini API error 503')) {
      return json({ error: 'The transcription service is busy — try again in a few seconds.' }, 503);
    }
    return json({ error: message }, 500);
  }
});
