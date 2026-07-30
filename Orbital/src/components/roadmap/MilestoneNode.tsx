import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { GoalWithItems, MilestoneWithGoals, NewRoadmapGoalInput } from '../../hooks/useRoadmap';
import type { GoalPeriodType, Milestone } from '../../types/database';
import { calculateStreak } from '../../lib/habitStreak';
import { expandCollapse, expandCollapseTransition, tapScale } from '../../lib/motion';

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
  pending: 'bg-cosmic-surface-3 text-orbital-text-muted border-cosmic-border',
  active: 'bg-orbital-accent-1/10 text-orbital-accent-2 border-orbital-accent-1/30',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

const STATUS_DOT: Record<Milestone['status'], string> = {
  pending: 'bg-orbital-text-faint',
  active: 'bg-orbital-accent-1',
  completed: 'bg-emerald-500',
};

const NEXT_STATUS: Record<Milestone['status'], Milestone['status']> = {
  pending: 'active',
  active: 'completed',
  completed: 'pending',
};

function rollupProgress(goals: GoalWithItems[]): number {
  if (goals.length === 0) return 0;
  return Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
}

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
  const progress = rollupProgress(milestone.goals);

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
          className={`w-3 h-3 rounded-full ${STATUS_DOT[milestone.status]} ring-4 ring-cosmic-bg flex-shrink-0`}
        />
        {!isLast && <div className="w-px flex-1 bg-cosmic-border mt-1" />}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="p-3 bg-cosmic-surface-2/60 border border-cosmic-border rounded-lg">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => setExpanded((v) => !v)} className="flex-1 flex items-center gap-2 text-left min-w-0">
              <ChevronDown size={14} className={`text-orbital-text-faint flex-shrink-0 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`} />
              <span className="text-sm font-medium text-orbital-text truncate">{milestone.title}</span>
            </button>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[milestone.status]}`}>
              {milestone.status}
            </span>
            <button
              onClick={() => {
                if (window.confirm(`Delete "${milestone.title}" and all its goals? This can't be undone.`)) {
                  onRemoveMilestone(milestone.id);
                }
              }}
              aria-label="Delete milestone"
              className="text-orbital-text-faint hover:text-rose-400 p-1 flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {milestone.goals.length > 0 && (
            <div className="mt-2 h-1 rounded-full bg-cosmic-surface-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-orbital-accent-1"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          )}

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                variants={expandCollapse}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={expandCollapseTransition}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {milestone.goals.length === 0 && (
                    <p className="text-xs text-orbital-text-faint">No goals yet — add one below.</p>
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
                      className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-2.5 py-1.5 text-xs text-orbital-text focus:outline-none focus:border-orbital-accent-1"
                    />
                    <select
                      value={periodType}
                      onChange={(e) => setPeriodType(e.target.value as GoalPeriodType)}
                      className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-2.5 py-1.5 text-xs text-orbital-text focus:outline-none focus:border-orbital-accent-1"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <motion.button
                      whileTap={tapScale}
                      type="submit"
                      disabled={submitting || !goalTitle.trim()}
                      className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-xs rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                    >
                      Add goal
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  goal: GoalWithItems;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState(goal.progress);
  const prevProgress = useRef(goal.progress);
  const [justCompleted, setJustCompleted] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const hasLinkedItems = goal.tasks.length > 0 || goal.habits.length > 0;

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
      layout
      animate={justCompleted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`p-2.5 bg-cosmic-bg border rounded-lg ${justCompleted ? 'border-emerald-500/60' : 'border-cosmic-border'}`}
    >
      <div className="flex items-center justify-between text-xs">
        <button
          onClick={() => hasLinkedItems && setItemsExpanded((v) => !v)}
          className="flex-1 flex items-center gap-1.5 text-left min-w-0"
        >
          {hasLinkedItems && (
            <ChevronDown
              size={11}
              className={`text-orbital-text-faint flex-shrink-0 transition-transform ${itemsExpanded ? 'rotate-0' : '-rotate-90'}`}
            />
          )}
          <span className="text-orbital-text-muted truncate">{goal.title}</span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-orbital-accent-2 font-semibold">{value}%</span>
          <button
            onClick={() => {
              if (window.confirm(`Delete "${goal.title}"? This can't be undone.`)) onDelete(goal.id);
            }}
            aria-label="Delete goal"
            className="text-orbital-text-faint hover:text-rose-400"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {hasLinkedItems ? (
        <div className="mt-1.5 h-1.5 rounded-full bg-cosmic-surface-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-orbital-accent-1"
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      ) : (
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
          className="mt-1.5 w-full accent-orbital-accent-1"
        />
      )}

      <AnimatePresence initial={false}>
        {hasLinkedItems && itemsExpanded && (
          <motion.div
            variants={expandCollapse}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={expandCollapseTransition}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 pl-1">
              {goal.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 ${
                      task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                    }`}
                  />
                  <span className={`truncate ${task.status === 'done' ? 'text-orbital-text-faint line-through' : 'text-orbital-text-muted'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
              {goal.habits.map((habit) => (
                <div key={habit.id} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-orbital-accent-1/20 border border-orbital-accent-1/50 flex-shrink-0" />
                  <span className="truncate text-orbital-text-muted">{habit.name}</span>
                  <span className="flex-shrink-0 text-orbital-accent-2/70">{calculateStreak(habit.completedDates)}d streak</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
