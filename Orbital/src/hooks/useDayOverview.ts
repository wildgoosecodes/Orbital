import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { todayStr } from '../lib/habitStreak';

const OVERVIEW_PROMPT =
  "Give me a brief, encouraging 1-2 sentence overview of my day based on today's tasks and habits. " +
  'Mention priority if something stands out. Keep it short and conversational — no greeting, no markdown.';

/** Auto-generates a short AI summary of the day once, then caches it in
 *  localStorage for the rest of the day — this is an isolated one-off call,
 *  not routed through the shared assistant chat, so it never appears in the
 *  visible Assistant panel conversation (same pattern Onboarding.tsx uses
 *  for its own independent assistant-chat calls). */
export function useDayOverview(userId: string) {
  const [overview, setOverview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Guards against React StrictMode's dev-mode double-invoke (and any other
  // rapid remount) firing two real Gemini calls before the first one's
  // localStorage write lands.
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cacheKey = `orbital.dayOverview.${userId}.${todayStr()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setOverview(cached);
      setLoading(false);
      return;
    }

    if (requestedRef.current) return;
    requestedRef.current = true;

    let cancelled = false;
    setLoading(true);

    supabase.functions
      .invoke('assistant-chat', {
        body: { messages: [{ role: 'user', content: OVERVIEW_PROMPT }] },
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || data?.error || !data?.reply) {
          setLoading(false);
          return;
        }
        const reply = data.reply as string;
        localStorage.setItem(cacheKey, reply);
        setOverview(reply);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { overview, loading };
}
