import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
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
}

export default function AIAssistantPanel({ messages, sending, error, sendMessage }: AIAssistantPanelProps) {
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
      <div className="p-6 pb-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          Assistant
        </h2>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-2 gap-4">
            <p className="text-sm text-slate-500">
              Ask about your tasks, habits, and goals — or ask me to create, update, or complete them.
            </p>
            <div className="w-full space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="w-full text-left text-xs text-slate-400 bg-slate-900 hover:bg-slate-800 hover:text-slate-200 border border-slate-800 rounded-lg px-3 py-2 transition-colors"
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
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-500">
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          disabled={sending}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          aria-label="Send message"
          className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg p-2.5 transition-colors"
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
