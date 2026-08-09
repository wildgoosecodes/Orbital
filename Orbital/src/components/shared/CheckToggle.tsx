import { useState } from 'react';
import type { MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface CheckToggleProps {
  done: boolean;
  onToggle: () => void;
  ariaLabel: string;
  /** task -> small confetti pop; habit -> streak-scaled flame. */
  variant: 'task' | 'habit';
  /** 'sm' matches the tight per-item rows inside a timeblock (no checkmark glyph,
   *  same as before); 'md' is the ~20px size used everywhere else. */
  size?: 'sm' | 'md';
  /** Habit variant only — the streak *after* this completion, used to scale the
   *  flame. Computed optimistically by the caller (see habitStreak.ts) so the
   *  animation doesn't wait on the mutation's round-trip. */
  streak?: number;
  /** Rows inside TimelineBlock sit under a drag handle — set this so a click
   *  on the checkbox doesn't also start a block-move drag. */
  stopDragPropagation?: boolean;
}

const SIZE_CLASSES = { sm: 'w-2.5 h-2.5', md: 'w-5 h-5' } as const;

const TASK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8'];
const TASK_PARTICLE_COUNT = 8;

function TaskBurst() {
  return (
    <>
      {Array.from({ length: TASK_PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / TASK_PARTICLE_COUNT) * Math.PI * 2;
        const distance = 16 + Math.random() * 14;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 4,
              height: 4,
              borderRadius: i % 2 === 0 ? '9999px' : '1px',
              background: TASK_COLORS[i % TASK_COLORS.length],
            }}
          />
        );
      })}
    </>
  );
}

/** Streak → flame size/color/glow. Reinforces "you're building heat" as it grows. */
function habitFlameTier(streak: number): { size: number; color: string; glow: boolean } {
  if (streak >= 7) return { size: 22, color: '#f97316', glow: true };
  if (streak >= 3) return { size: 18, color: '#f59e0b', glow: false };
  return { size: 14, color: '#fbbf24', glow: false };
}

function HabitBurst({ streak }: { streak: number }) {
  const tier = habitFlameTier(streak);
  return (
    <>
      {tier.glow && (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: tier.size * 2,
            height: tier.size * 2,
            marginLeft: -tier.size,
            marginTop: -tier.size,
            borderRadius: '9999px',
            background: `radial-gradient(circle, ${tier.color}55 0%, transparent 70%)`,
          }}
        />
      )}
      <motion.span
        initial={{ y: 0, opacity: 1, scale: 0.4 }}
        animate={{ y: -18, opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: -tier.size / 2,
          marginTop: -tier.size / 2,
        }}
      >
        <Flame size={tier.size} color={tier.color} fill={tier.color} strokeWidth={0} />
      </motion.span>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ x: (i - 1) * 4, y: 0, opacity: 0.9 }}
          animate={{ x: (i - 1) * 10, y: -20 - i * 4, opacity: 0 }}
          transition={{ duration: 0.55 + i * 0.05, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: 3,
            borderRadius: '9999px',
            background: tier.color,
          }}
        />
      ))}
    </>
  );
}

export default function CheckToggle({
  done,
  onToggle,
  ariaLabel,
  variant,
  size = 'md',
  streak = 0,
  stopDragPropagation,
}: CheckToggleProps) {
  // Remounted (via the key) on every qualifying click, so each burst replays
  // from scratch — no manual timers/cleanup needed, it just goes inert once
  // its own animation finishes.
  const [burstKey, setBurstKey] = useState(0);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    if (!done) setBurstKey((k) => k + 1);
    onToggle();
  }

  return (
    <span className="relative inline-flex flex-shrink-0">
      <button
        type="button"
        onPointerDown={stopDragPropagation ? (e) => e.stopPropagation() : undefined}
        onClick={handleClick}
        aria-label={ariaLabel}
        className={`${SIZE_CLASSES[size]} rounded-full border flex-shrink-0 flex items-center justify-center ${
          done ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
        }`}
      >
        {size === 'md' && (
          <AnimatePresence>
            {done && (
              <motion.svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              >
                <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            )}
          </AnimatePresence>
        )}
      </button>

      {burstKey > 0 && (
        <span key={burstKey} className="absolute inset-0 pointer-events-none" aria-hidden="true" data-testid={`check-burst-${variant}`}>
          {variant === 'task' ? <TaskBurst /> : <HabitBurst streak={streak} />}
        </span>
      )}
    </span>
  );
}
