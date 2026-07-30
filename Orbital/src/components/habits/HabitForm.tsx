import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { NewHabitInput } from '../../hooks/useHabits';
import type { HabitFrequency } from '../../types/database';
import { tapScale } from '../../lib/motion';

interface HabitFormProps {
  onSubmit: (input: NewHabitInput) => Promise<void>;
}

export default function HabitForm({ onSubmit }: HabitFormProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), frequency });
      setName('');
      setFrequency('daily');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <input
        type="text"
        placeholder="Add a habit..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
      />
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
        className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <motion.button
        whileTap={tapScale}
        type="submit"
        disabled={submitting || !name.trim()}
        className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
      >
        Add habit
      </motion.button>
    </form>
  );
}
