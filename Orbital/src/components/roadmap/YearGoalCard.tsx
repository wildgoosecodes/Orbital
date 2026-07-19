import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { YearGoalWithMilestones } from '../../hooks/useRoadmap';
import type { NewMilestoneInput, NewRoadmapGoalInput } from '../../hooks/useRoadmap';
import type { Milestone } from '../../types/database';
import MilestoneNode from './MilestoneNode';

interface YearGoalCardProps {
  yearGoal: YearGoalWithMilestones;
  onAddMilestone: (input: NewMilestoneInput, position: number) => Promise<void>;
  onRemoveYearGoal: (id: string) => Promise<void>;
  onAddGoal: (input: NewRoadmapGoalInput) => Promise<void>;
  onUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  onUpdateMilestoneStatus: (id: string, status: Milestone['status']) => Promise<void>;
  onRemoveMilestone: (id: string) => Promise<void>;
  onRemoveGoal: (id: string) => Promise<void>;
}

function rollupProgress(yearGoal: YearGoalWithMilestones): number {
  const allGoals = yearGoal.milestones.flatMap((m) => m.goals);
  if (allGoals.length === 0) return 0;
  return Math.round(allGoals.reduce((sum, g) => sum + g.progress, 0) / allGoals.length);
}

export default function YearGoalCard({
  yearGoal,
  onAddMilestone,
  onRemoveYearGoal,
  onAddGoal,
  onUpdateGoalProgress,
  onUpdateMilestoneStatus,
  onRemoveMilestone,
  onRemoveGoal,
}: YearGoalCardProps) {
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const progress = rollupProgress(yearGoal);

  async function handleAddMilestone(e: FormEvent) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setSubmitting(true);
    try {
      await onAddMilestone({ year_goal_id: yearGoal.id, title: milestoneTitle.trim() }, yearGoal.milestones.length);
      setMilestoneTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{yearGoal.title}</h3>
            <p className="text-xs text-slate-500">{yearGoal.year} · {progress}% of the way there</p>
          </div>
        </div>
        <button
          onClick={() => onRemoveYearGoal(yearGoal.id)}
          aria-label="Delete year goal"
          className="text-slate-500 hover:text-rose-400 p-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 space-y-3">
        {yearGoal.milestones.length === 0 && (
          <p className="text-sm text-slate-500">No milestones yet — add one below to start the path.</p>
        )}
        {yearGoal.milestones.map((milestone, i) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
          >
            <MilestoneNode
              milestone={milestone}
              isLast={i === yearGoal.milestones.length - 1}
              onAddGoal={onAddGoal}
              onUpdateGoalProgress={onUpdateGoalProgress}
              onUpdateStatus={onUpdateMilestoneStatus}
              onRemoveMilestone={onRemoveMilestone}
              onRemoveGoal={onRemoveGoal}
            />
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleAddMilestone} className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Add a milestone..."
          value={milestoneTitle}
          onChange={(e) => setMilestoneTitle(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={submitting || !milestoneTitle.trim()}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Add milestone
        </button>
      </form>
    </div>
  );
}
