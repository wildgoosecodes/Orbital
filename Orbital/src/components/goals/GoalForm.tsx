import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewGoalInput } from '../../hooks/useGoals';
import type { GoalPeriodType } from '../../types/database';

interface GoalFormProps {
  onSubmit: (input: NewGoalInput) => Promise<void>;
}

export default function GoalForm({ onSubmit }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [periodType, setPeriodType] = useState<GoalPeriodType>('weekly');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), period_type: periodType });
      setTitle('');
      setPeriodType('weekly');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <input
        type="text"
        placeholder="Add a goal..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />
      <select
        value={periodType}
        onChange={(e) => setPeriodType(e.target.value as GoalPeriodType)}
        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="weekly">Weekly</option>
        <option value="quarterly">Quarterly</option>
        <option value="yearly">Yearly</option>
      </select>
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
      >
        Add goal
      </button>
    </form>
  );
}
