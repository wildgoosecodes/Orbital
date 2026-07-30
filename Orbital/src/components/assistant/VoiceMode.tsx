import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Mic } from 'lucide-react';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import type { ChatMessage } from '../../hooks/useAssistantChat';
import { tapScale } from '../../lib/motion';

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

  const orbScale = 1 + Math.min(micLevel * 6, 0.6);

  function handleOrbClick() {
    if (status === 'listening') stopRecording();
    else if (status === 'idle' || status === 'error') startRecording();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-cosmic-bg/95 backdrop-blur-sm flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 space-y-3 max-w-md w-full mx-auto">
            {messages.length === 0 && (
              <p className="text-center text-sm text-orbital-text-faint mt-8">Tap the mic and say something.</p>
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

            {errorMessage && (
              <div className="flex justify-start">
                <div className="bg-rose-950/50 border border-rose-900 rounded-xl px-3 py-2 text-sm text-rose-400">
                  {errorMessage}
                </div>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 py-6 flex-shrink-0"
          >
            <motion.button
              whileTap={tapScale}
              onClick={handleOrbClick}
              aria-label={status === 'listening' ? 'Stop listening' : 'Start talking'}
              disabled={status === 'transcribing' || status === 'thinking' || status === 'speaking'}
              className="relative w-32 h-32 rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
              style={{ transform: `scale(${status === 'listening' ? orbScale : 1})` }}
            >
              <span
                className={`absolute inset-0 rounded-full transition-colors ${
                  status === 'listening'
                    ? 'bg-orbital-accent-1/30 animate-pulse'
                    : status === 'thinking' || status === 'transcribing'
                      ? 'bg-orbital-accent-1/20 animate-pulse'
                      : status === 'speaking'
                        ? 'bg-emerald-500/25 animate-pulse'
                        : 'bg-cosmic-surface-2'
                }`}
              />
              <span
                className={`relative w-20 h-20 rounded-full flex items-center justify-center ${
                  status === 'error' ? 'bg-rose-600' : 'bg-orbital-accent-1'
                }`}
              >
                <Mic size={28} className="text-orbital-text" strokeWidth={1.5} />
              </span>
            </motion.button>

            <p className="text-sm font-medium text-orbital-text-muted">{STATUS_LABEL[status]}</p>

            <motion.button
              whileTap={tapScale}
              onClick={onClose}
              aria-label="Close voice mode"
              className="mt-2 flex items-center gap-1.5 text-sm text-orbital-text-faint hover:text-orbital-text-muted px-4 py-2 rounded-lg hover:bg-cosmic-surface-2"
            >
              <X size={16} />
              Close
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
