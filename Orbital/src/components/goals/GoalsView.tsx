import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { useHabits, type HabitWithLogs } from '../../hooks/useHabits';
import { useRoadmap, type GoalWithItems } from '../../hooks/useRoadmap';
import type { Goal, GoalPeriodType, Task } from '../../types/database';
import { computeGoalProgress } from '../../lib/goalProgress';
import { expandCollapse, expandCollapseTransition, tapScale } from '../../lib/motion';
import GoalRow from './GoalRow';

interface GoalsViewProps {
  userId: string;
}

export default function GoalsView({ userId }: GoalsViewProps) {
  const { goals, loading: goalsLoading, error, addGoal, archiveGoal, updateProgress, removeGoal } = useGoals(userId);
  const { tasks, loading: tasksLoading, addTask } = useTasks(userId);
  const { habits, loading: habitsLoading } = useHabits(userId);
  // Reused purely for the Year Goal id/title list to populate the link
  // dropdown below — avoids a second fetch hook for the same data.
  const { yearGoals } = useRoadmap(userId);

  const [goalTitle, setGoalTitle] = useState('');
  const [firstTaskTitle, setFirstTaskTitle] = useState('');
  const [periodType, setPeriodType] = useState<GoalPeriodType>('weekly');
  const [yearGoalId, setYearGoalId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addGoalError, setAddGoalError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const loading = goalsLoading || tasksLoading || habitsLoading;

  const flatGoals: GoalWithItems[] = useMemo(() => {
    const tasksByGoal = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.goal_id) continue;
      const list = tasksByGoal.get(task.goal_id) || [];
      list.push(task);
      tasksByGoal.set(task.goal_id, list);
    }
    const habitsByGoal = new Map<string, HabitWithLogs[]>();
    for (const habit of habits) {
      if (!habit.goal_id) continue;
      const list = habitsByGoal.get(habit.goal_id) || [];
      list.push(habit);
      habitsByGoal.set(habit.goal_id, list);
    }
    return goals
      .filter((g) => !g.milestone_id)
      .map((goal) => {
        const goalTasks = tasksByGoal.get(goal.id) || [];
        return {
          ...goal,
          progress: computeGoalProgress(goal, goalTasks),
          tasks: goalTasks,
          habits: habitsByGoal.get(goal.id) || [],
        };
      });
  }, [goals, tasks, habits]);

  const activeGoals = flatGoals.filter((g) => g.status !== 'completed');
  const completedGoals = flatGoals.filter((g) => g.status === 'completed');

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || !firstTaskTitle.trim()) return;
    setSubmitting(true);
    setAddGoalError(null);
    let createdGoal: Goal | null = null;
    try {
      createdGoal = await addGoal({
        title: goalTitle.trim(),
        period_type: periodType,
        year_goal_id: yearGoalId || null,
        deadline: deadline || null,
      });
      await addTask({ title: firstTaskTitle.trim(), goal_id: createdGoal.id });
      setGoalTitle('');
      setFirstTaskTitle('');
      setYearGoalId('');
      setDeadline('');
    } catch {
      if (createdGoal) {
        // Same rollback as the Yearly Goal Tree's add-goal flow — never leave
        // a goal with zero tasks around if the first-task insert fails.
        await removeGoal(createdGoal.id).catch(() => {});
      }
      setAddGoalError('Could not add the goal — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-orbital-text-faint">Loading goals...</p>}

      {!loading && flatGoals.length === 0 && (
        <div className="p-8 bg-cosmic-surface-2 border border-cosmic-border rounded-xl text-center">
          <p className="text-sm text-orbital-text-faint">No goals yet — add one below.</p>
        </div>
      )}

      <div className="space-y-2">
        {activeGoals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} onUpdateProgress={updateProgress} onArchive={archiveGoal} onDelete={removeGoal} onAddTask={addTask} />
        ))}

        {completedGoals.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="flex items-center gap-1 text-xs text-orbital-text-faint hover:text-orbital-text-muted"
            >
              <ChevronDown size={12} className={`transition-transform ${showCompleted ? 'rotate-0' : '-rotate-90'}`} />
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
                      <GoalRow key={goal.id} goal={goal} onUpdateProgress={updateProgress} onArchive={archiveGoal} onDelete={removeGoal} onAddTask={addTask} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <form onSubmit={handleAddGoal} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Add a goal..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
          />
          <input
            type="text"
            placeholder="First task..."
            value={firstTaskTitle}
            onChange={(e) => setFirstTaskTitle(e.target.value)}
            className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as GoalPeriodType)}
            className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
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
            className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
          />
          <select
            value={yearGoalId}
            onChange={(e) => setYearGoalId(e.target.value)}
            className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
          >
            <option value="">No year goal</option>
            {yearGoals.map((yg) => (
              <option key={yg.id} value={yg.id}>
                {yg.title}
              </option>
            ))}
          </select>
          <motion.button
            whileTap={tapScale}
            type="submit"
            disabled={submitting || !goalTitle.trim() || !firstTaskTitle.trim()}
            className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
          >
            Add goal
          </motion.button>
        </div>
        {addGoalError ? (
          <p className="text-xs text-rose-400">{addGoalError}</p>
        ) : (
          <p className="text-xs text-orbital-text-faint">
            Every goal needs at least one task — its progress is measured by tasks completed. Optionally link it to a Year Goal to see it show up on the Yearly Goal Tree.
          </p>
        )}
      </form>
    </div>
  );
}
