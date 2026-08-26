import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { GoalWithItems, MilestoneWithGoals, NewRoadmapGoalInput } from '../../hooks/useRoadmap';
import type { NewTaskInput } from '../../hooks/useTasks';
import type { Goal, GoalPeriodType, Milestone } from '../../types/database';
import { expandCollapse, expandCollapseTransition, tapScale } from '../../lib/motion';
import GoalRow from '../goals/GoalRow';

interface MilestoneNodeProps {
  milestone: MilestoneWithGoals;
  isLast: boolean;
  onAddGoal: (input: NewRoadmapGoalInput) => Promise<Goal>;
  onAddTask: (input: NewTaskInput) => Promise<void>;
  onUpdateGoalProgress: (id: string, progress: number) => Promise<void>;
  onArchiveGoal: (id: string) => Promise<void>;
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
  onAddTask,
  onUpdateGoalProgress,
  onArchiveGoal,
  onUpdateStatus,
  onRemoveMilestone,
  onRemoveGoal,
}: MilestoneNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [firstTaskTitle, setFirstTaskTitle] = useState('');
  const [periodType, setPeriodType] = useState<GoalPeriodType>('weekly');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addGoalError, setAddGoalError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  // Rollup must see every goal, including completed/archived ones, so a
  // completed goal keeps contributing its locked-in 100% upward — only the
  // rendered list below is filtered.
  const progress = rollupProgress(milestone.goals);
  const activeGoals = milestone.goals.filter((g) => g.status !== 'completed');
  const completedGoals = milestone.goals.filter((g) => g.status === 'completed');

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || !firstTaskTitle.trim()) return;
    setSubmitting(true);
    setAddGoalError(null);
    let createdGoal: Goal | null = null;
    try {
      createdGoal = await onAddGoal({
        milestone_id: milestone.id,
        title: goalTitle.trim(),
        period_type: periodType,
        deadline: deadline || null,
      });
      await onAddTask({ title: firstTaskTitle.trim(), goal_id: createdGoal.id });
      setGoalTitle('');
      setFirstTaskTitle('');
      setDeadline('');
    } catch {
      if (createdGoal) {
        // The goal was created but its required first task wasn't — roll the
        // goal back rather than leave a task-less goal around, which would
        // silently break the "every goal needs a task" guarantee.
        await onRemoveGoal(createdGoal.id).catch(() => {});
      }
      setAddGoalError('Could not add the goal — please try again.');
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
                  {activeGoals.map((goal) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      onUpdateProgress={onUpdateGoalProgress}
                      onArchive={onArchiveGoal}
                      onDelete={onRemoveGoal}
                      onAddTask={onAddTask}
                    />
                  ))}

                  {completedGoals.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowCompleted((v) => !v)}
                        className="flex items-center gap-1 text-[11px] text-orbital-text-faint hover:text-orbital-text-muted"
                      >
                        <ChevronDown
                          size={10}
                          className={`transition-transform ${showCompleted ? 'rotate-0' : '-rotate-90'}`}
                        />
                        {completedGoals.length} completed
                      </button>
                      <AnimatePresence initial={false}>
                        {showCompleted && (
                          <motion.div
                            variants={expandCollapse}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={expandCollapseTransition}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2">
                              {completedGoals.map((goal) => (
                                <GoalRow
                                  key={goal.id}
                                  goal={goal}
                                  onUpdateProgress={onUpdateGoalProgress}
                                  onArchive={onArchiveGoal}
                                  onDelete={onRemoveGoal}
                                  onAddTask={onAddTask}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add a goal..."
                      value={goalTitle}
                      onChange={(e) => setGoalTitle(e.target.value)}
                      className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-2.5 py-1.5 text-xs text-orbital-text focus:outline-none focus:border-orbital-accent-1"
                    />
                    <input
                      type="text"
                      placeholder="First task..."
                      value={firstTaskTitle}
                      onChange={(e) => setFirstTaskTitle(e.target.value)}
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
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      aria-label="Deadline (optional)"
                      className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-2.5 py-1.5 text-xs text-orbital-text focus:outline-none focus:border-orbital-accent-1"
                    />
                    <motion.button
                      whileTap={tapScale}
                      type="submit"
                      disabled={submitting || !goalTitle.trim() || !firstTaskTitle.trim()}
                      className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-xs rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
                    >
                      Add goal
                    </motion.button>
                  </form>
                  {addGoalError ? (
                    <p className="text-[11px] text-rose-400">{addGoalError}</p>
                  ) : (
                    <p className="text-[11px] text-orbital-text-faint">
                      Every goal needs at least one task — its progress is measured by tasks completed. Add more from the goal's own row below.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

