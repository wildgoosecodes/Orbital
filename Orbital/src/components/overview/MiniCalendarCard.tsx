import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import type { Event, Task } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import type { HabitWithLogs } from '../../hooks/useHabits';
import { buildMonthGrid, dateKey } from '../../lib/calendarGrid';
import { cardHover, hoverScale, tapScale } from '../../lib/motion';
import DayTimelineView from '../calendar/DayTimelineView';

interface MiniCalendarCardProps {
  userId: string;
  tasks: Task[];
  events: Event[];
  habits: HabitWithLogs[];
  onNavigate: (tab: Tab) => void;
}

type ViewMode = 'month' | 'day';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export default function MiniCalendarCard({ userId, tasks, events, habits, onNavigate }: MiniCalendarCardProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const gridDays = useMemo(() => buildMonthGrid(today), [today]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const hasTaskByDate = useMemo(() => {
    const set = new Set<string>();
    for (const task of tasks) {
      if (task.due_date) set.add(task.due_date);
    }
    return set;
  }, [tasks]);

  const hasEventByDate = useMemo(() => {
    const set = new Set<string>();
    for (const event of events) {
      set.add(dateKey(new Date(event.start_at)));
    }
    return set;
  }, [events]);

  const hasHabitByWeekday = useMemo(() => {
    const set = new Set<number>();
    for (const habit of habits) {
      for (const day of habit.days_of_week) set.add(day);
    }
    return set;
  }, [habits]);

  return (
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1 p-1 bg-cosmic-surface-3 rounded-lg">
          <button
            onClick={() => setViewMode('month')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'month' ? 'bg-orbital-accent-1 text-orbital-text' : 'text-orbital-text-muted hover:text-orbital-text'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              viewMode === 'day' ? 'bg-orbital-accent-1 text-orbital-text' : 'text-orbital-text-muted hover:text-orbital-text'
            }`}
          >
            Day
          </button>
        </div>
        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={() => onNavigate('calendar')}
          className="flex items-center gap-1 text-xs font-semibold text-orbital-text-muted hover:text-orbital-text"
        >
          <CalendarDays size={12} />
          Open
        </motion.button>
      </div>

      {viewMode === 'month' ? (
        <>
          <h4 className="text-sm font-semibold text-orbital-text mb-2">{MONTH_FORMAT.format(today)}</h4>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-orbital-text-faint mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const key = dateKey(day);
              const inMonth = day.getMonth() === today.getMonth();
              const isToday = key === todayKey;
              const hasTask = hasTaskByDate.has(key);
              const hasEvent = hasEventByDate.has(key);
              const hasHabit = hasHabitByWeekday.has(day.getDay());

              return (
                <button
                  key={key}
                  onClick={() => onNavigate('calendar')}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors ${
                    isToday
                      ? 'bg-orbital-accent-1 text-orbital-text font-semibold'
                      : inMonth
                        ? 'text-orbital-text-muted hover:bg-cosmic-surface-3'
                        : 'text-orbital-text-faint/40'
                  }`}
                >
                  {day.getDate()}
                  {(hasTask || hasEvent || hasHabit) && (
                    <span className="flex items-center gap-0.5">
                      {(hasTask || hasEvent) && (
                        <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-cosmic-bg' : hasEvent ? 'bg-sky-400' : 'bg-orbital-accent-2'}`} />
                      )}
                      {hasHabit && <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-cosmic-bg' : 'bg-emerald-400'}`} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <DayTimelineView userId={userId} selectedKey={selectedKey} onSelectDay={setSelectedKey} />
      )}
    </motion.div>
  );
}
