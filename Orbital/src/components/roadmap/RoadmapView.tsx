import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useRoadmap } from '../../hooks/useRoadmap';
import YearGoalCard from './YearGoalCard';

interface RoadmapViewProps {
  userId: string;
}

export default function RoadmapView({ userId }: RoadmapViewProps) {
  const {
    yearGoals,
    loading,
    error,
    addYearGoal,
    addMilestone,
    addGoal,
    updateGoalProgress,
    updateMilestoneStatus,
    removeYearGoal,
    removeMilestone,
    removeGoal,
  } = useRoadmap(userId);

  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await addYearGoal({ title: title.trim(), year });
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2 p-4 bg-slate-950 border border-slate-800 rounded-xl"
      >
        <input
          type="text"
          placeholder="Add a year goal..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="sm:w-24 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Add year goal
        </button>
      </form>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading roadmap...</p>}

      {!loading && yearGoals.length === 0 && (
        <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
          <p className="text-sm text-slate-500">
            No roadmap yet — add a year goal above, or let Orbital build one with you.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors"
          >
            <Sparkles size={14} />
            Start with Orbital
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {yearGoals.map((yearGoal) => (
          <YearGoalCard
            key={yearGoal.id}
            yearGoal={yearGoal}
            onAddMilestone={addMilestone}
            onRemoveYearGoal={removeYearGoal}
            onAddGoal={addGoal}
            onUpdateGoalProgress={updateGoalProgress}
            onUpdateMilestoneStatus={updateMilestoneStatus}
            onRemoveMilestone={removeMilestone}
            onRemoveGoal={removeGoal}
          />
        ))}
      </div>
    </div>
  );
}
