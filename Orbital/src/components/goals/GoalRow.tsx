import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { GoalWithItems } from '../../hooks/useRoadmap';
import type { NewTaskInput } from '../../hooks/useTasks';
import { calculateStreak } from '../../lib/habitStreak';
import { expandCollapse, expandCollapseTransition, tapScale } from '../../lib/motion';

export default function GoalRow({
  goal,
  onUpdateProgress,
  onArchive,
  onDelete,
  onAddTask,
}: {
  goal: GoalWithItems;
  onUpdateProgress: (id: string, progress: number) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (input: NewTaskInput) => Promise<void>;
}) {
  const [value, setValue] = useState(goal.progress);
  const prevProgress = useRef(goal.progress);
  const [justCompleted, setJustCompleted] = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const hasLinkedItems = goal.tasks.length > 0 || goal.habits.length > 0;
  // Only tasks drive progress now — a goal with only a habit linked must keep
  // the editable manual slider, otherwise it's stuck at a frozen 0% forever.
  const hasProgressDrivingTask = goal.tasks.length > 0;
  const isComplete = goal.status === 'completed';
  const readyToArchive = goal.tasks.length > 0 && value === 100 && !isComplete;
  // Build "today" from local date parts, not toISOString() (which is UTC) —
  // otherwise a goal due "today" flips to Overdue up to a day early/late
  // depending on the viewer's timezone offset from UTC.
  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isOverdue = !!goal.deadline && !isComplete && goal.deadline < todayLocal;

  function handleArchive() {
    if (window.confirm(`Mark "${goal.title}" complete? It'll move to the completed list.`)) {
      onArchive(goal.id);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      await onAddTask({ title: newTaskTitle.trim(), goal_id: goal.id });
      setNewTaskTitle('');
    } finally {
      setAddingTask(false);
    }
  }

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
          onClick={() => setItemsExpanded((v) => !v)}
          className="flex-1 flex items-center gap-1.5 text-left min-w-0"
        >
          <ChevronDown
            size={11}
            className={`text-orbital-text-faint flex-shrink-0 transition-transform ${itemsExpanded ? 'rotate-0' : '-rotate-90'}`}
          />
          <span className="text-orbital-text-muted truncate">{goal.title}</span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isComplete && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Completed
            </span>
          )}
          {goal.deadline && (
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                isOverdue
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-cosmic-surface-3 text-orbital-text-faint border-cosmic-border'
              }`}
            >
              {isOverdue ? 'Overdue' : 'Due'} {goal.deadline}
            </span>
          )}
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

      {hasProgressDrivingTask ? (
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

      {readyToArchive && (
        <motion.button
          whileTap={tapScale}
          onClick={handleArchive}
          className="mt-1.5 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-[11px] rounded-md py-1 transition-colors"
        >
          All tasks done — mark goal complete
        </motion.button>
      )}

      <AnimatePresence initial={false}>
        {itemsExpanded && (
          <motion.div
            variants={expandCollapse}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={expandCollapseTransition}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5 pl-1">
              {!hasLinkedItems && (
                <p className="text-[11px] text-orbital-text-faint">No tasks or habits linked yet.</p>
              )}
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
                  <span className="flex-shrink-0 text-orbital-accent-2/70">{calculateStreak(habit.completedDates, habit.days_of_week)}d streak</span>
                </div>
              ))}

              <form onSubmit={handleAddTask} className="flex gap-1.5 pt-0.5">
                <input
                  type="text"
                  placeholder="Add a task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 min-w-0 bg-cosmic-surface-3 border border-cosmic-border rounded-md px-2 py-1 text-[11px] text-orbital-text focus:outline-none focus:border-orbital-accent-1"
                />
                <motion.button
                  whileTap={tapScale}
                  type="submit"
                  disabled={addingTask || !newTaskTitle.trim()}
                  className="bg-cosmic-surface-3 hover:bg-cosmic-border disabled:opacity-50 text-orbital-text-muted font-medium text-[11px] rounded-md px-2 py-1 transition-colors whitespace-nowrap"
                >
                  Add
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
