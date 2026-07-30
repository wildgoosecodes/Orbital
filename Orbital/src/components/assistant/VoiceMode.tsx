import { useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import type { ChatMessage } from '../../hooks/useAssistantChat';

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<string | undefined>;
}

const STATUS_LABEL: Record<string, string> = {
  idle: 'Tap the mic to talk',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  error: 'Something went wrong',
};

export default function VoiceMode({ open, onClose, messages, sendMessage }: VoiceModeProps) {
  const { status, micLevel, errorMessage, startRecording, stopRecording, reset } = useVoiceAssistant({ sendMessage });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  const orbScale = 1 + Math.min(micLevel * 6, 0.6);

  function handleOrbClick() {
    if (status === 'listening') stopRecording();
    else if (status === 'idle' || status === 'error') startRecording();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-end p-4 flex-shrink-0">
        <button
          onClick={onClose}
          aria-label="Close voice mode"
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-900"
        >
          <X size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 max-w-md w-full mx-auto">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-500 mt-8">Tap the mic and say something.</p>
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

        {errorMessage && (
          <div className="flex justify-start">
            <div className="bg-rose-950/50 border border-rose-900 rounded-xl px-3 py-2 text-sm text-rose-400">
              {errorMessage}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 py-6 flex-shrink-0">
        <button
          onClick={handleOrbClick}
          aria-label={status === 'listening' ? 'Stop listening' : 'Start talking'}
          disabled={status === 'transcribing' || status === 'thinking' || status === 'speaking'}
          className="relative w-32 h-32 rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
          style={{ transform: `scale(${status === 'listening' ? orbScale : 1})` }}
        >
          <span
            className={`absolute inset-0 rounded-full transition-colors ${
              status === 'listening'
                ? 'bg-indigo-500/30 animate-pulse'
                : status === 'thinking' || status === 'transcribing'
                  ? 'bg-indigo-500/20 animate-pulse'
                  : status === 'speaking'
                    ? 'bg-emerald-500/25 animate-pulse'
                    : 'bg-slate-800'
            }`}
          />
          <span
            className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
              status === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
            }`}
          >
            <Mic size={28} className="text-white" strokeWidth={1.5} />
          </span>
        </button>

        <p className="text-sm font-medium text-slate-300">{STATUS_LABEL[status]}</p>
      </div>
    </div>
  );
}
