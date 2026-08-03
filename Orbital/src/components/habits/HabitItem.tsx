import { AnimatePresence, motion } from 'framer-motion';
import { Milestone } from 'lucide-react';
import type { HabitWithLogs } from '../../hooks/useHabits';
import { calculateStreak, formatSchedule, todayStr } from '../../lib/habitStreak';
import { cardHover, listItem, listItemTransition, tapScale } from '../../lib/motion';
import { categoryColor } from '../../lib/categoryColor';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface HabitItemProps {
  habit: HabitWithLogs;
  onToggleToday: (habit: HabitWithLogs) => void;
  onDelete: (id: string) => void;
  goalTitle?: string;
}

export default function HabitItem({ habit, onToggleToday, onDelete, goalTitle }: HabitItemProps) {
  const doneToday = habit.completedDates.includes(todayStr());
  const streak = calculateStreak(habit.completedDates, habit.days_of_week);

  return (
    <motion.div
      layout
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={listItemTransition}
      whileHover={cardHover}
      className="flex items-center gap-3 p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl"
    >
      <button
        onClick={() => onToggleToday(habit)}
        aria-label={doneToday ? 'Unmark today' : 'Mark done for today'}
        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
          doneToday ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
        }`}
      >
        <AnimatePresence>
          {doneToday && (
            <motion.svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="white"
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-orbital-text">{habit.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-orbital-text-faint">{formatSchedule(habit.days_of_week)}</span>
          <span className="flex items-center gap-0.5">
            {DAY_LABELS.map((label, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                  habit.days_of_week.includes(i) ? 'bg-orbital-accent-1/25 text-orbital-accent-2' : 'text-orbital-text-faint/40'
                }`}
              >
                {label}
              </span>
            ))}
          </span>
        </div>
        {goalTitle && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-orbital-accent-2/80 truncate">
            <Milestone size={11} className="flex-shrink-0" />
            {goalTitle}
          </p>
        )}
      </div>

      {habit.category && (
        <span
          className="text-xs font-medium px-2 py-1 rounded whitespace-nowrap"
          style={{ backgroundColor: `${categoryColor(habit.category)}1a`, color: categoryColor(habit.category) }}
        >
          {habit.category}
        </span>
      )}

      <span className="text-xs font-semibold px-2 py-1 rounded bg-orbital-accent-1/10 text-orbital-accent-2 border border-orbital-accent-1/20 whitespace-nowrap">
        {streak} day{streak === 1 ? '' : 's'}
      </span>

      <motion.button
        whileTap={tapScale}
        onClick={() => {
          if (window.confirm(`Delete "${habit.name}" and its whole history? This can't be undone.`)) onDelete(habit.id);
        }}
        aria-label="Delete habit"
        className="text-orbital-text-faint hover:text-rose-400 p-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
