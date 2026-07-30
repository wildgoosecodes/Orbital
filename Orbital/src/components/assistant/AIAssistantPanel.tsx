import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Mic, Send, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../hooks/useAssistantChat';

const SUGGESTIONS = [
  "What's on my plate today?",
  'Add a task to call the dentist tomorrow',
  "How's my habit streak looking?",
];

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  onOpenVoiceMode?: () => void;
}

export default function AIAssistantPanel({ messages, sending, error, sendMessage, onOpenVoiceMode }: AIAssistantPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  }

  function handleSuggestion(s: string) {
    sendMessage(s);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 border-b border-cosmic-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-orbital-text uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-orbital-accent-2" />
          Assistant
        </h2>
        {onOpenVoiceMode && (
          <button
            onClick={onOpenVoiceMode}
            aria-label="Open voice mode"
            className="text-orbital-text-faint hover:text-orbital-accent-2 p-1.5 rounded-lg hover:bg-cosmic-surface-2 transition-colors"
          >
            <Mic size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-2 gap-4">
            <p className="text-sm text-orbital-text-faint">
              Ask about your tasks, habits, and goals — or ask me to create, update, or complete them.
            </p>
            <div className="w-full space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="w-full text-left text-xs text-orbital-text-muted bg-cosmic-surface-2 hover:bg-cosmic-surface-3 hover:text-orbital-text border border-cosmic-border rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-orbital-accent-1 text-orbital-text'
                  : 'bg-cosmic-surface-2 border border-cosmic-border text-orbital-text'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-cosmic-surface-2 border border-cosmic-border rounded-xl px-3 py-2 text-sm text-orbital-text-faint">
              Thinking…
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-rose-950/50 border border-rose-900 rounded-xl px-3 py-2 text-sm text-rose-400">
              {error}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-cosmic-border flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          disabled={sending}
          className="flex-1 bg-cosmic-surface-2 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1 disabled:opacity-50"
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
  );
}
