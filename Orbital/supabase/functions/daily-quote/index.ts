import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
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

    // ZenQuotes doesn't send CORS headers, so browsers can't call it directly —
    // this function exists purely to proxy that one request server-side.
    const res = await fetch('https://zenquotes.io/api/random');
    if (!res.ok) throw new Error(`ZenQuotes error ${res.status}`);
    const data = await res.json();
    const entry = data[0];
    if (!entry?.q) return json({ error: 'No quote returned' }, 502);

    return json({ quote: entry.q as string, author: (entry.a as string) || 'Unknown' });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});
