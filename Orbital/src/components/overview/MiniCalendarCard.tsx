import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import type { Event, Task } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import { buildMonthGrid, dateKey } from '../../lib/calendarGrid';
import { cardHover, hoverScale, tapScale } from '../../lib/motion';

interface MiniCalendarCardProps {
  tasks: Task[];
  events: Event[];
  onNavigate: (tab: Tab) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export default function MiniCalendarCard({ tasks, events, onNavigate }: MiniCalendarCardProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const gridDays = useMemo(() => buildMonthGrid(today), [today]);

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

  return (
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-orbital-text">{MONTH_FORMAT.format(today)}</h3>
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

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-orbital-text-faint mb-1">
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
              {(hasTask || hasEvent) && (
                <span
                  className={`w-1 h-1 rounded-full ${isToday ? 'bg-cosmic-bg' : hasEvent ? 'bg-sky-400' : 'bg-orbital-accent-2'}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
