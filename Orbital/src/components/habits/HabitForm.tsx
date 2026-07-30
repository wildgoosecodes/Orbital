import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { NewHabitInput } from '../../hooks/useHabits';
import { EVERY_DAY } from '../../lib/habitStreak';
import { tapScale } from '../../lib/motion';

interface HabitFormProps {
  onSubmit: (input: NewHabitInput) => Promise<void>;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HabitForm({ onSubmit }: HabitFormProps) {
  const [name, setName] = useState('');
  const [days, setDays] = useState<number[]>(EVERY_DAY);
  const [submitting, setSubmitting] = useState(false);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || days.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), days_of_week: days });
      setName('');
      setDays(EVERY_DAY);
    } finally {
      setSubmitting(false);
    }
  }

  const isEveryDay = days.length === 7;

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Add a habit..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <motion.button
          whileTap={tapScale}
          type="submit"
          disabled={submitting || !name.trim() || days.length === 0}
          className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Add habit
        </motion.button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {DAY_LABELS.map((label, i) => (
          <motion.button
            key={i}
            type="button"
            whileTap={tapScale}
            onClick={() => toggleDay(i)}
            aria-label={`Toggle ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}`}
            aria-pressed={days.includes(i)}
            className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
              days.includes(i)
                ? 'bg-orbital-accent-1 text-orbital-text'
                : 'bg-cosmic-surface-3 text-orbital-text-faint hover:text-orbital-text-muted'
            }`}
          >
            {label}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileTap={tapScale}
          onClick={() => setDays(isEveryDay ? [] : EVERY_DAY)}
          className={`ml-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            isEveryDay
              ? 'bg-orbital-accent-1/15 text-orbital-accent-2'
              : 'text-orbital-text-faint hover:text-orbital-text-muted'
          }`}
        >
          Every day
        </motion.button>
      </div>
    </form>
  );
}
