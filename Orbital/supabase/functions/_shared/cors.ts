// Same-origin allowlist for the browser-facing Edge Functions. Every caller
// still needs a valid Supabase JWT (checked separately in each function) —
// this only stops a stolen token from being replayed via a CORS request
// initiated from an arbitrary origin.
const ALLOWED_ORIGINS = [
  'https://orbital-six-black.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    // The allowed origin varies per request, so caches must key on it too.
    Vary: 'Origin',
  };
  if (ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}
