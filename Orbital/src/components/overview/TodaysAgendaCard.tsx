import { AnimatePresence, motion } from 'framer-motion';
import { Milestone, Plus, Repeat2 } from 'lucide-react';
import type { HabitWithLogs } from '../../hooks/useHabits';
import type { Task, TaskStatus } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import { calculateStreak, todayStr } from '../../lib/habitStreak';
import { cardHover, hoverScale, listItem, listItemTransition, tapScale } from '../../lib/motion';
import { categoryColor } from '../../lib/categoryColor';
import { useDayOverview } from '../../hooks/useDayOverview';

interface TodaysAgendaCardProps {
  userId: string;
  tasks: Task[];
  habits: HabitWithLogs[];
  tasksLoading: boolean;
  habitsLoading: boolean;
  onToggleTask: (id: string, status: TaskStatus) => void;
  onToggleHabit: (habit: HabitWithLogs) => void;
  onNavigate: (tab: Tab) => void;
  goalTitleById?: Map<string, string>;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-cosmic-surface-3 text-orbital-text-muted',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose-500/10 text-rose-400',
};

const overviewContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const sentenceVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };

function splitSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export default function TodaysAgendaCard({
  userId,
  tasks,
  habits,
  tasksLoading,
  habitsLoading,
  onToggleTask,
  onToggleHabit,
  onNavigate,
  goalTitleById,
}: TodaysAgendaCardProps) {
  const { overview, loading: overviewLoading } = useDayOverview(userId);
  const today = todayStr();
  const todayWeekday = new Date().getDay();

  const todayTasks = tasks.filter((t) => t.due_date === today);
  const todayHabits = habits.filter((h) => h.days_of_week.includes(todayWeekday));
  const loading = tasksLoading || habitsLoading;

  const sortedTasks = [...todayTasks].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const sortedHabits = [...todayHabits].sort(
    (a, b) => Number(a.completedDates.includes(today)) - Number(b.completedDates.includes(today)),
  );

  const isEmpty = !loading && todayTasks.length === 0 && todayHabits.length === 0;

  return (
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-orbital-text">Today's Agenda</h3>
        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={() => onNavigate('tasks')}
          aria-label="Add task"
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-orbital-accent-1 hover:bg-orbital-accent-1/90 text-orbital-text"
        >
          <Plus size={14} strokeWidth={2.5} />
        </motion.button>
      </div>

      <div className="mt-3 min-h-[1.25rem]">
        <AnimatePresence mode="wait">
          {overviewLoading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-orbital-text-faint italic"
            >
              Thinking about your day…
            </motion.p>
          ) : overview ? (
            <motion.div key="overview" variants={overviewContainer} initial="hidden" animate="visible">
              {splitSentences(overview).map((sentence, i) => (
                <motion.span key={i} variants={sentenceVariants} className="text-sm text-orbital-text-muted">
                  {sentence}{' '}
                </motion.span>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-3 space-y-2">
        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}
        {isEmpty && <p className="text-sm text-orbital-text-faint">Nothing due today — you're all caught up!</p>}

        <AnimatePresence initial={false}>
          {sortedTasks.map((task) => {
            const done = task.status === 'done';
            const goalTitle = task.goal_id ? goalTitleById?.get(task.goal_id) : undefined;
            return (
              <motion.div
                key={`task-${task.id}`}
                layout
                variants={listItem}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={listItemTransition}
                className="flex items-center gap-3 p-3 bg-cosmic-surface-3/60 rounded-lg"
              >
                <button
                  onClick={() => onToggleTask(task.id, done ? 'todo' : 'done')}
                  aria-label={done ? 'Mark as not done' : 'Mark as done'}
                  className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                  }`}
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                      <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'text-orbital-text-faint line-through' : 'text-orbital-text'}`}>
                    {task.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.category && (
                      <span
                        className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${categoryColor(task.category)}1a`, color: categoryColor(task.category) }}
                      >
                        {task.category}
                      </span>
                    )}
                    {goalTitle && (
                      <span className="flex items-center gap-1 text-[11px] text-orbital-accent-2/80 truncate">
                        <Milestone size={11} className="flex-shrink-0" />
                        {goalTitle}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {sortedHabits.map((habit) => {
            const done = habit.completedDates.includes(today);
            const streak = calculateStreak(habit.completedDates, habit.days_of_week);
            return (
              <motion.div
                key={`habit-${habit.id}`}
                layout
                variants={listItem}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={listItemTransition}
                className="flex items-center gap-3 p-3 bg-cosmic-surface-3/60 rounded-lg"
              >
                <button
                  onClick={() => onToggleHabit(habit)}
                  aria-label={done ? 'Unmark today' : 'Mark done for today'}
                  className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    done ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                  }`}
                >
                  {done && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                      <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <Repeat2 size={12} className="text-orbital-accent-2 flex-shrink-0" strokeWidth={2} />
                  <p className={`text-sm font-medium truncate ${done ? 'text-orbital-text-faint' : 'text-orbital-text'}`}>
                    {habit.name}
                  </p>
                </div>

                <span className="text-[11px] font-semibold text-orbital-accent-2 bg-orbital-accent-1/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                  {streak}d streak
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
