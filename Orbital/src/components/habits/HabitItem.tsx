import type { HabitWithLogs } from '../../hooks/useHabits';
import { calculateStreak, todayStr } from '../../lib/habitStreak';

interface HabitItemProps {
  habit: HabitWithLogs;
  onToggleToday: (habit: HabitWithLogs) => void;
  onDelete: (id: string) => void;
}

export default function HabitItem({ habit, onToggleToday, onDelete }: HabitItemProps) {
  const doneToday = habit.completedDates.includes(todayStr());
  const streak = calculateStreak(habit.completedDates);

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <button
        onClick={() => onToggleToday(habit)}
        aria-label={doneToday ? 'Unmark today' : 'Mark done for today'}
        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
          doneToday ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
        }`}
      >
        {doneToday && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
            <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{habit.name}</p>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">{habit.frequency}</p>
      </div>

      <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
        {streak} day{streak === 1 ? '' : 's'}
      </span>

      <button onClick={() => onDelete(habit.id)} aria-label="Delete habit" className="text-slate-500 hover:text-rose-400 p-1">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
