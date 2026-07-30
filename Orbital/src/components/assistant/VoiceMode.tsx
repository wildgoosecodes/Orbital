import { useEffect } from 'react';
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

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;

  const lastMessage = messages[messages.length - 1];
  const orbScale = 1 + Math.min(micLevel * 6, 0.6);

  function handleOrbClick() {
    if (status === 'listening') stopRecording();
    else if (status === 'idle' || status === 'error') startRecording();
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8 px-6">
      <button
        onClick={onClose}
        aria-label="Close voice mode"
        className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-900"
      >
        <X size={20} />
      </button>

      <div className="max-w-md w-full text-center space-y-2 min-h-[3rem]">
        {lastMessage && (
          <p className="text-sm text-slate-400 line-clamp-3">{lastMessage.content}</p>
        )}
        {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
      </div>

      <button
        onClick={handleOrbClick}
        aria-label={status === 'listening' ? 'Stop listening' : 'Start talking'}
        disabled={status === 'transcribing' || status === 'thinking' || status === 'speaking'}
        className="relative w-40 h-40 rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
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
          className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
            status === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
          }`}
        >
          <Mic size={32} className="text-white" strokeWidth={1.5} />
        </span>
      </button>

      <p className="text-sm font-medium text-slate-300">{STATUS_LABEL[status]}</p>
    </div>
  );
}
