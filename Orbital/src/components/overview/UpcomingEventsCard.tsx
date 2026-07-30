import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import type { Event } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import { upcomingEvents } from '../../lib/overviewStats';
import { cardHover, hoverScale, listItem, listItemTransition, tapScale } from '../../lib/motion';

interface UpcomingEventsCardProps {
  events: Event[];
  loading: boolean;
  onNavigate: (tab: Tab) => void;
}

function formatWhen(event: Event): string {
  const start = new Date(event.start_at);
  const today = new Date();
  const isToday = start.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const day = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (event.all_day) return day;
  const time = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function UpcomingEventsCard({ events, loading, onNavigate }: UpcomingEventsCardProps) {
  const upcoming = upcomingEvents(events);

  return (
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-orbital-text">Upcoming Events</h3>
        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={() => onNavigate('calendar')}
          className="text-xs font-semibold text-orbital-text-muted hover:text-orbital-text"
        >
          View all
        </motion.button>
      </div>

      <div className="mt-3 space-y-2">
        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}
        {!loading && upcoming.length === 0 && <p className="text-sm text-orbital-text-faint">Nothing on the calendar yet.</p>}

        <AnimatePresence initial={false}>
          {upcoming.map((event) => (
            <motion.div
              key={event.id}
              layout
              variants={listItem}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={listItemTransition}
              className="flex items-center gap-2.5"
            >
              <CalendarClock size={14} className="text-sky-400 flex-shrink-0" strokeWidth={2} />
              <p className="flex-1 min-w-0 text-sm text-orbital-text truncate">{event.title}</p>
              <span className="flex-shrink-0 text-[11px] text-orbital-text-faint">{formatWhen(event)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
