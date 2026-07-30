import { Mic } from 'lucide-react';

const STATUS_LABEL = {
  idle: 'Tap the mic, or say "Hey Orbital"',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  error: 'Something went wrong',
};

/** The home-screen voice control — an always-visible orb (not a modal), since
 *  speaking to the AI is Desktop's primary interaction, not a secondary mode. */
export default function VoiceOrb({ status, micLevel, errorMessage, lastMessage, onOrbClick }) {
  const orbScale = 1 + Math.min(micLevel * 6, 0.6);
  const disabled = status === 'transcribing' || status === 'thinking' || status === 'speaking';

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      <div className="max-w-sm w-full text-center min-h-[2.5rem] px-2">
        {lastMessage && <p className="text-sm text-slate-400 line-clamp-2">{lastMessage}</p>}
        {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
      </div>

      <button
        onClick={onOrbClick}
        aria-label={status === 'listening' ? 'Stop listening' : 'Start talking'}
        disabled={disabled}
        className="relative w-28 h-28 rounded-full flex items-center justify-center transition-transform disabled:cursor-not-allowed"
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
          className={`relative w-[4.5rem] h-[4.5rem] rounded-full flex items-center justify-center ${
            status === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
          }`}
        >
          <Mic size={26} className="text-white" strokeWidth={1.5} />
        </span>
      </button>

      <p className="text-xs font-medium text-slate-400">{STATUS_LABEL[status]}</p>
    </div>
  );
}
