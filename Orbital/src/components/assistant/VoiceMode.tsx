import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Mic } from 'lucide-react';
import { useVoiceAssistant, type VoiceStatus } from '../../hooks/useVoiceAssistant';
import type { ChatMessage, SendMessageOptions } from '../../hooks/useAssistantChat';
import OrbitalOrb, { type OrbState } from '../brand/OrbitalOrb';
import { tapScale } from '../../lib/motion';

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<string | undefined>;
}

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: 'Tap Orbital to talk',
  listening: 'Listening…',
  transcribing: 'Thinking…',
  thinking: 'Thinking…',
  preparing: 'Thinking…',
  speaking: 'Speaking — tap to interrupt',
  error: 'Something went wrong — tap to try again',
};

const ORB_STATE: Record<VoiceStatus, OrbState> = {
  idle: 'idle',
  listening: 'listening',
  transcribing: 'thinking',
  thinking: 'thinking',
  preparing: 'thinking',
  speaking: 'speaking',
  error: 'idle',
};

// Mic and voice RMS rarely exceed ~0.15 — scale into the orb's 0–1 range.
const LEVEL_GAIN = 6;

export default function VoiceMode({ open, onClose, messages, sendMessage }: VoiceModeProps) {
  const { status, micLevel, speakingLevel, errorMessage, startRecording, stopRecording, reset } = useVoiceAssistant({ sendMessage });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const busy = status === 'transcribing' || status === 'thinking';
  const rawLevel = status === 'listening' ? micLevel : status === 'speaking' ? speakingLevel : 0;
  const orbLevel = Math.min(1, rawLevel * LEVEL_GAIN);

  function handleOrbClick() {
    if (status === 'listening') stopRecording();
    else if (!busy) startRecording();
  }

  const orbLabel =
    status === 'listening'
      ? 'Stop listening'
      : status === 'speaking' || status === 'preparing'
        ? 'Interrupt Orbital and talk'
        : 'Start talking';

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
              <p className="text-center text-sm text-orbital-text-faint mt-8">Tap Orbital and say what's on your mind.</p>
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
              aria-label={orbLabel}
              disabled={busy}
              className="relative w-48 h-48 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-orbital-accent-2/60 disabled:cursor-wait"
            >
              <OrbitalOrb state={ORB_STATE[status]} level={orbLevel} size={176} />
            </motion.button>

            <p className={`flex items-center gap-1.5 text-sm font-medium ${status === 'error' ? 'text-rose-400' : 'text-orbital-text-muted'}`}>
              {status === 'idle' && <Mic size={14} strokeWidth={1.75} />}
              {STATUS_LABEL[status]}
            </p>

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
