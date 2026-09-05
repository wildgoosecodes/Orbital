import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { getDailyQuote } from '../../lib/dailyQuote';

interface QuoteCardProps {
  /** Overrides the container's background/border classes — the default dark-glass
   *  look is tuned for CosmicHero's gradient/starfield backdrop and reads as nearly
   *  invisible on a flat page background. */
  containerClassName?: string;
}

export default function QuoteCard({ containerClassName }: QuoteCardProps = {}) {
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
    <div className={`px-4 py-3 rounded-2xl flex items-start gap-3 ${containerClassName ?? 'bg-black/35 border border-white/10 backdrop-blur-md'}`}>
      <Quote size={14} className="text-orbital-accent-2 flex-shrink-0 mt-0.5" strokeWidth={2} />
      {quote ? (
        <div className="min-w-0 text-left">
          <p className="text-sm text-orbital-text-muted italic leading-snug">"{quote.quote}"</p>
          <p className="mt-1 text-xs text-orbital-text-faint">— {quote.author}</p>
        </div>
      ) : (
        <p className="text-sm text-orbital-text-faint">Loading today's quote…</p>
      )}
    </div>
  );
}
