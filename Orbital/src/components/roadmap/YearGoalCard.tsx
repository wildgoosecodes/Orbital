import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { YearGoalWithMilestones } from '../../hooks/useRoadmap';
import type { NewMilestoneInput, NewRoadmapGoalInput } from '../../hooks/useRoadmap';
import type { NewTaskInput } from '../../hooks/useTasks';
import type { Goal, Milestone } from '../../types/database';
import MilestoneNode from './MilestoneNode';
import { tapScale } from '../../lib/motion';

interface YearGoalCardProps {
  yearGoal: YearGoalWithMilestones;
  onAddMilestone: (input: NewMilestoneInput, position: number) => Promise<void>;
  onRemoveYearGoal: (id: string) => Promise<void>;
  onAddGoal: (input: NewRoadmapGoalInput) => Promise<Goal>;
  onAddTask: (input: NewTaskInput) => Promise<void>;
  onUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  onArchiveGoal: (id: string) => Promise<void>;
  onUpdateMilestoneStatus: (id: string, status: Milestone['status']) => Promise<void>;
  onRemoveMilestone: (id: string) => Promise<void>;
  onRemoveGoal: (id: string) => Promise<void>;
}

function rollupProgress(yearGoal: YearGoalWithMilestones): number {
  const allGoals = [...yearGoal.milestones.flatMap((m) => m.goals), ...yearGoal.directGoals];
  if (allGoals.length === 0) return 0;
  return Math.round(allGoals.reduce((sum, g) => sum + g.progress, 0) / allGoals.length);
}

export default function YearGoalCard({
  yearGoal,
  onAddMilestone,
  onRemoveYearGoal,
  onAddGoal,
  onAddTask,
  onUpdateGoalProgress,
  onArchiveGoal,
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
    <div className="p-5 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orbital-text">{yearGoal.title}</h3>
            <p className="text-xs text-orbital-text-faint">{yearGoal.year} · {progress}% of the way there</p>
          </div>
        </div>
        <motion.button
          whileTap={tapScale}
          onClick={() => {
            if (window.confirm(`Delete "${yearGoal.title}" and all its milestones and goals? This can't be undone.`)) {
              onRemoveYearGoal(yearGoal.id);
            }
          }}
          aria-label="Delete year goal"
          className="text-orbital-text-faint hover:text-rose-400 p-1"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-cosmic-surface-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {yearGoal.directGoals.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-orbital-text-faint uppercase tracking-wide">Linked goals</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {yearGoal.directGoals.map((goal) => (
              <span
                key={goal.id}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-cosmic-surface-3 border border-cosmic-border text-orbital-text-muted"
                title="Managed from the Goals tab"
              >
                {goal.title}
                <span className="text-orbital-accent-2 font-semibold">{goal.progress}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {yearGoal.milestones.length === 0 && (
          <p className="text-sm text-orbital-text-faint">No milestones yet — add one below to start the path.</p>
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
              onAddTask={onAddTask}
              onUpdateGoalProgress={onUpdateGoalProgress}
              onArchiveGoal={onArchiveGoal}
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
          className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <motion.button
          whileTap={tapScale}
          type="submit"
          disabled={submitting || !milestoneTitle.trim()}
          className="bg-cosmic-surface-3 hover:bg-cosmic-border disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Add milestone
        </motion.button>
      </form>
    </div>
  );
}
