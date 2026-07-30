import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import OrbitalMark from '../components/brand/OrbitalMark';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING =
  "Hi, I'm Orbital 👋 I help you turn big goals into a roadmap you can actually follow — milestones, smaller goals, and the tasks that get you there.\n\nWhat do you want to have accomplished by the end of the year?";

export default function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const { completeOnboarding } = useProfile(userId);

  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function finishOnboarding() {
    try {
      await completeOnboarding();
    } finally {
      navigate('/app', { replace: true });
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('assistant-chat', {
        body: { messages: nextMessages, mode: 'onboarding' },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      setMessages([...nextMessages, { role: 'assistant', content: data.reply as string }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong reaching Orbital.');
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const hasExchanged = messages.length > 1;

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col bg-cosmic-bg text-orbital-text px-4">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <OrbitalMark size={26} />
            <h1 className="text-xl font-bold tracking-wider text-orbital-text uppercase">Orbital</h1>
          </div>
          <button
            onClick={finishOnboarding}
            className="text-xs font-semibold text-orbital-text-faint hover:text-orbital-text-muted border border-cosmic-border rounded-lg px-3 py-1.5"
          >
            Skip for now
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-cosmic-surface-2 border border-cosmic-border rounded-xl overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[50vh]">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-orbital-accent-1 text-orbital-text'
                        : 'bg-cosmic-surface-3 border border-cosmic-border text-orbital-text'
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <div className="flex justify-start">
                <div className="bg-cosmic-surface-3 border border-cosmic-border rounded-xl px-4 py-2.5 text-sm text-orbital-text-faint">
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-rose-950/50 border border-rose-900 rounded-xl px-4 py-2.5 text-sm text-rose-400">
                  {error}
                </div>
              </div>
            )}

            {hasExchanged && !sending && (
              <div className="flex justify-start pt-2">
                <button
                  onClick={finishOnboarding}
                  className="text-xs font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80 border border-orbital-accent-1/30 bg-orbital-accent-1/10 rounded-lg px-3 py-1.5"
                >
                  View my roadmap →
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-cosmic-border-soft flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell Orbital about your year..."
              disabled={sending}
              className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2.5 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex-shrink-0 bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-40 text-orbital-text rounded-lg p-2.5 transition-colors"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
