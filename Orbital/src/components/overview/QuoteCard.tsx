import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { getDailyQuote } from '../../lib/dailyQuote';

export default function QuoteCard() {
  const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyQuote()
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null;

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
        <Quote size={18} strokeWidth={2} />
      </div>
      {quote ? (
        <div className="min-w-0">
          <p className="text-sm text-slate-200 italic leading-snug">"{quote.quote}"</p>
          <p className="mt-1 text-xs text-slate-500">— {quote.author}</p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Loading today's quote…</p>
      )}
    </div>
  );
}
