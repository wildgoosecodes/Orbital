import { supabase } from './supabaseClient';

export interface DailyQuote {
  quote: string;
  author: string;
}

function cacheKey(): string {
  return `orbital.dailyQuote.${new Date().toISOString().slice(0, 10)}`;
}

/** One quote per day per browser — checks localStorage before calling the
 *  daily-quote Edge Function, since it's a "quote of the day" concept anyway
 *  and this keeps well under ZenQuotes' free-tier rate limit. */
export async function getDailyQuote(): Promise<DailyQuote> {
  const key = cacheKey();
  const cached = localStorage.getItem(key);
  if (cached) return JSON.parse(cached) as DailyQuote;

  const { data, error } = await supabase.functions.invoke('daily-quote');
  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const result: DailyQuote = { quote: data.quote, author: data.author };
  localStorage.setItem(key, JSON.stringify(result));
  return result;
}
