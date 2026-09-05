import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import type { Task } from '../../types/database';
import { tapScale } from '../../lib/motion';

interface FocusModeProps {
  task: Task | null;
  plannedMinutes: number;
  startedAt: string | null;
  /** Both receive the actual *active* (non-paused) elapsed milliseconds, so
   *  time spent paused never gets counted as focused time in the logged
   *  session. */
  onComplete: (activeMs: number) => void;
  onExit: (activeMs: number) => void;
}

function formatClock(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
}

export default function FocusMode({ task, plannedMinutes, startedAt, onComplete, onExit }: FocusModeProps) {
  const open = !!task && !!startedAt;
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pausedAccumMs = useRef(0);
  const pauseStartedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setPaused(false);
    pausedAccumMs.current = 0;
    pauseStartedAt.current = null;
    setNow(Date.now());
  }, [open, startedAt]);

  useEffect(() => {
    if (!open || paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, paused]);

  function togglePause() {
    if (paused) {
      if (pauseStartedAt.current) pausedAccumMs.current += Date.now() - pauseStartedAt.current;
      pauseStartedAt.current = null;
      setPaused(false);
    } else {
      pauseStartedAt.current = Date.now();
      setPaused(true);
    }
  }

  // The active (non-paused) elapsed time right now — frozen at the moment
  // pause began if currently paused, otherwise live. This is what actually
  // gets logged, so a break never counts as focused time.
  function activeElapsedMs(): number {
    if (!startedAt) return 0;
    const startedMs = new Date(startedAt).getTime();
    const asOf = paused ? (pauseStartedAt.current ?? Date.now()) : Date.now();
    return Math.max(0, asOf - startedMs - pausedAccumMs.current);
  }

  if (!open || !task) return null;

  const startedMs = new Date(startedAt).getTime();
  const elapsedMs = Math.max(0, now - startedMs - pausedAccumMs.current);
  const remainingSeconds = plannedMinutes * 60 - Math.floor(elapsedMs / 1000);
  const overtime = remainingSeconds < 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-cosmic-bg/95 backdrop-blur-sm flex flex-col items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] px-6"
        >
          <button
            onClick={() => onExit(activeElapsedMs())}
            aria-label="Exit focus mode"
            className="absolute top-6 right-6 text-orbital-text-faint hover:text-orbital-text p-2"
          >
            <X size={22} />
          </button>

          <div className="w-full max-w-sm text-center space-y-8">
            <div>
              <p className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wide">Focusing on</p>
              <h1 className="mt-2 text-2xl font-bold text-orbital-text">{task.title}</h1>
              {task.next_action && <p className="mt-2 text-sm text-orbital-text-muted">{task.next_action}</p>}
            </div>

            <div>
              <p className={`text-6xl font-bold tabular-nums ${overtime ? 'text-amber-400' : 'text-orbital-text'}`}>
                {formatClock(remainingSeconds)}
              </p>
              {overtime && <p className="mt-1 text-xs text-amber-400/80">Over your suggested time — finish whenever you're ready.</p>}
              {paused && !overtime && <p className="mt-1 text-xs text-orbital-text-faint">Paused</p>}
            </div>

            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileTap={tapScale}
                onClick={togglePause}
                className="flex items-center gap-2 bg-cosmic-surface-3 hover:bg-cosmic-border text-orbital-text font-medium text-sm rounded-lg px-5 py-3 transition-colors"
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
                {paused ? 'Resume' : 'Pause'}
              </motion.button>
              <motion.button
                whileTap={tapScale}
                onClick={() => onComplete(activeElapsedMs())}
                className="bg-emerald-500 hover:bg-emerald-500/90 text-white font-semibold text-sm rounded-lg px-6 py-3 transition-colors"
              >
                Complete
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
