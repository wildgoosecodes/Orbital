import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewHabitInput } from '../../hooks/useHabits';
import type { HabitFrequency } from '../../types/database';

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
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <input
        type="text"
        placeholder="Add a habit..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
      >
        Add habit
      </button>
    </form>
  );
}
