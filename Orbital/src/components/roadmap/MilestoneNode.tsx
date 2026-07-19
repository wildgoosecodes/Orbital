import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { MilestoneWithGoals, NewRoadmapGoalInput } from '../../hooks/useRoadmap';
import type { Goal, GoalPeriodType, Milestone } from '../../types/database';

interface MilestoneNodeProps {
  milestone: MilestoneWithGoals;
  isLast: boolean;
  onAddGoal: (input: NewRoadmapGoalInput) => Promise<void>;
  onUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  onUpdateStatus: (id: string, status: Milestone['status']) => Promise<void>;
  onRemoveMilestone: (id: string) => Promise<void>;
  onRemoveGoal: (id: string) => Promise<void>;
}

const STATUS_STYLES: Record<Milestone['status'], string> = {
  pending: 'bg-slate-800 text-slate-400 border-slate-700',
  active: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

const STATUS_DOT: Record<Milestone['status'], string> = {
  pending: 'bg-slate-600',
  active: 'bg-indigo-500',
  completed: 'bg-emerald-500',
};

const NEXT_STATUS: Record<Milestone['status'], Milestone['status']> = {
  pending: 'active',
  active: 'completed',
  completed: 'pending',
};

export default function MilestoneNode({
  milestone,
  isLast,
  onAddGoal,
  onUpdateGoalProgress,
  onUpdateStatus,
  onRemoveMilestone,
  onRemoveGoal,
}: MilestoneNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [periodType, setPeriodType] = useState<GoalPeriodType>('weekly');
  const [submitting, setSubmitting] = useState(false);

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setSubmitting(true);
    try {
      await onAddGoal({ milestone_id: milestone.id, title: goalTitle.trim(), period_type: periodType });
      setGoalTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <button
          onClick={() => onUpdateStatus(milestone.id, NEXT_STATUS[milestone.status])}
          aria-label={`Cycle status (currently ${milestone.status})`}
          className={`w-3 h-3 rounded-full ${STATUS_DOT[milestone.status]} ring-4 ring-slate-950 flex-shrink-0`}
        />
        {!isLast && <div className="w-px flex-1 bg-slate-800 mt-1" />}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setExpanded((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0">
              <ChevronDown size={14} className={`text-slate-500 flex-shrink-0 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`} />
              <span className="text-sm font-medium text-white truncate">{milestone.title}</span>
            </button>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[milestone.status]}`}>
              {milestone.status}
            </span>
            <button
              onClick={() => onRemoveMilestone(milestone.id)}
              aria-label="Delete milestone"
              className="text-slate-500 hover:text-rose-400 p-1 flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {expanded && (
            <div className="mt-3 space-y-2">
              {milestone.goals.length === 0 && (
                <p className="text-xs text-slate-500">No goals yet — add one below.</p>
              )}
              {milestone.goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} onUpdateProgress={onUpdateGoalProgress} onDelete={onRemoveGoal} />
              ))}

              <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a goal..."
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as GoalPeriodType)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting || !goalTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                >
                  Add goal
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalRow({
  goal,
  onUpdateProgress,
  onDelete,
}: {
  goal: Goal;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState(goal.progress);
  const prevProgress = useRef(goal.progress);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    setValue(goal.progress);
    if (prevProgress.current < 100 && goal.progress >= 100) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 700);
      prevProgress.current = goal.progress;
      return () => clearTimeout(t);
    }
    prevProgress.current = goal.progress;
  }, [goal.progress]);

  function commit() {
    if (value !== goal.progress) onUpdateProgress(goal.id, value);
  }

  return (
    <motion.div
      animate={justCompleted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`p-2.5 bg-slate-950 border rounded-lg ${justCompleted ? 'border-emerald-500/60' : 'border-slate-800'}`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 truncate">{goal.title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-indigo-400 font-semibold">{value}%</span>
          <button onClick={() => onDelete(goal.id)} aria-label="Delete goal" className="text-slate-500 hover:text-rose-400">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        className="mt-1.5 w-full accent-indigo-500"
      />
    </motion.div>
  );
}
