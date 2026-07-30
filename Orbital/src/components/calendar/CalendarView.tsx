import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarPlus, Clock, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useEvents } from '../../hooks/useEvents';
import { useGoogleCalendarImport } from '../../hooks/useGoogleCalendarImport';
import { googleCalendarUrl, googleCalendarUrlForEvent } from '../../lib/googleCalendar';
import { buildMonthGrid, dateKey } from '../../lib/calendarGrid';
import EventForm from './EventForm';
import type { Task, Event } from '../../types/database';

interface CalendarViewProps {
  userId: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

const PRIORITY_DOT: Record<Task['priority'], string> = {
  low: 'bg-orbital-text-faint',
  medium: 'bg-amber-500',
  high: 'bg-rose-500',
};

const PRIORITY_BADGE: Record<Task['priority'], string> = {
  low: 'bg-cosmic-surface-3 text-orbital-text-muted',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function CalendarView({ userId }: CalendarViewProps) {
  const { tasks, loading: tasksLoading, setStatus } = useTasks(userId);
  const { events, loading: eventsLoading, addEvent, updateEvent, removeEvent } = useEvents(userId);
  const googleImport = useGoogleCalendarImport(userId);
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => dateKey(new Date()));
  const [addingEvent, setAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const todayKey = dateKey(today);
  const gridDays = useMemo(() => buildMonthGrid(viewDate), [viewDate]);
  const loading = tasksLoading || eventsLoading;

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const list = map.get(task.due_date) ?? [];
      list.push(task);
      map.set(task.due_date, list);
    }
    return map;
  }, [tasks]);

  // Keyed by the event's *local* calendar day, not a naive ISO-string slice —
  // start_at is a UTC instant, and slicing it directly can land on the wrong
  // day depending on the viewer's timezone.
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.start_at));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_at.localeCompare(b.start_at));
    }
    return map;
  }, [events]);

  function goToMonth(delta: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  function goToToday() {
    setViewDate(new Date());
    setSelectedKey(todayKey);
  }

  function selectDay(key: string) {
    setSelectedKey(key);
    setAddingEvent(false);
    setEditingEventId(null);
  }

  const selectedTasks = tasksByDate.get(selectedKey) ?? [];
  const selectedEvents = eventsByDate.get(selectedKey) ?? [];
  const hasAnyItems = selectedTasks.length > 0 || selectedEvents.length > 0;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-orbital-text">{MONTH_FORMAT.format(viewDate)}</h3>
          <div className="flex items-center gap-1">
            {googleImport.enabled && (
              <button
                onClick={googleImport.runImport}
                disabled={googleImport.importing}
                className="flex items-center gap-1 text-xs font-semibold text-orbital-text-muted hover:text-orbital-text disabled:opacity-50 border border-cosmic-border rounded-lg px-2.5 py-1 mr-1"
              >
                <Download size={12} />
                {googleImport.importing ? 'Importing…' : 'Import from Google'}
              </button>
            )}
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-orbital-text-muted hover:text-orbital-text border border-cosmic-border rounded-lg px-2.5 py-1 mr-1"
            >
              Today
            </button>
            <button
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="text-orbital-text-muted hover:text-orbital-text p-1.5 rounded-lg hover:bg-cosmic-surface-3"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="text-orbital-text-muted hover:text-orbital-text p-1.5 rounded-lg hover:bg-cosmic-surface-3"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {googleImport.error && <p className="text-xs text-rose-400 mb-2">{googleImport.error}</p>}
        {googleImport.importedCount !== null && !googleImport.error && (
          <p className="text-xs text-emerald-400 mb-2">
            Imported {googleImport.importedCount} event{googleImport.importedCount === 1 ? '' : 's'} from Google Calendar.
          </p>
        )}

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-orbital-text-faint mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === viewDate.getMonth();
            const dayTasks = tasksByDate.get(key) ?? [];
            const dayEvents = eventsByDate.get(key) ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedKey;

            return (
              <button
                key={key}
                onClick={() => selectDay(key)}
                className={`aspect-square p-1 rounded-lg flex flex-col items-center justify-start gap-0.5 border transition-colors ${
                  isSelected
                    ? 'bg-orbital-accent-1/20 border-orbital-accent-1'
                    : 'border-transparent hover:bg-cosmic-surface-3'
                } ${!inMonth ? 'opacity-30' : ''}`}
              >
                <span
                  className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-orbital-accent-1 text-orbital-text font-semibold' : 'text-orbital-text-muted'
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span key={t.id} className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                  ))}
                  {dayTasks.length > 3 && <span className="text-[9px] text-orbital-text-faint">+{dayTasks.length - 3}</span>}
                  {dayEvents.length > 0 && <Clock size={9} className="text-sky-400" strokeWidth={2} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-orbital-text">
            {new Date(`${selectedKey}T00:00:00`).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          {!addingEvent && (
            <button
              onClick={() => setAddingEvent(true)}
              className="flex items-center gap-1 text-xs font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80"
            >
              <Plus size={14} /> Add event
            </button>
          )}
        </div>

        {addingEvent && (
          <EventForm
            defaultDate={selectedKey}
            onSubmit={async (input) => {
              await addEvent(input);
              setAddingEvent(false);
            }}
            onCancel={() => setAddingEvent(false)}
          />
        )}

        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}
        {!loading && !hasAnyItems && !addingEvent && (
          <p className="text-sm text-orbital-text-faint">Nothing scheduled this day.</p>
        )}

        <div className="space-y-2">
          {selectedTasks.map((task) => {
            const done = task.status === 'done';
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-cosmic-surface-3/60 rounded-lg">
                <button
                  onClick={() => setStatus(task.id, done ? 'todo' : 'done')}
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

                <p className={`flex-1 min-w-0 text-sm font-medium truncate ${done ? 'text-orbital-text-faint line-through' : 'text-orbital-text'}`}>
                  {task.title}
                </p>

                <span className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide ${PRIORITY_BADGE[task.priority]}`}>
                  {task.priority}
                </span>

                <a
                  href={googleCalendarUrl(task)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add to Google Calendar"
                  className="text-orbital-text-faint hover:text-sky-400 p-1"
                >
                  <CalendarPlus size={16} strokeWidth={1.5} />
                </a>
              </div>
            );
          })}

          {selectedEvents.map((event) =>
            editingEventId === event.id ? (
              <EventForm
                key={event.id}
                initialEvent={event}
                onSubmit={async (input) => {
                  await updateEvent(event.id, input);
                  setEditingEventId(null);
                }}
                onCancel={() => setEditingEventId(null)}
              />
            ) : (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-cosmic-surface-3/60 rounded-lg">
                <Clock size={16} className="text-sky-400 flex-shrink-0" strokeWidth={1.5} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-orbital-text truncate">{event.title}</p>
                  <p className="text-xs text-orbital-text-faint mt-0.5">
                    {event.all_day
                      ? 'All day'
                      : new Date(event.start_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>

                <a
                  href={googleCalendarUrlForEvent(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add to Google Calendar"
                  className="text-orbital-text-faint hover:text-sky-400 p-1"
                >
                  <CalendarPlus size={16} strokeWidth={1.5} />
                </a>

                <button
                  onClick={() => setEditingEventId(event.id)}
                  aria-label="Edit event"
                  className="text-orbital-text-faint hover:text-orbital-accent-2 p-1"
                >
                  <Pencil size={16} strokeWidth={1.5} />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${event.title}"? This can't be undone.`)) removeEvent(event.id);
                  }}
                  aria-label="Delete event"
                  className="text-orbital-text-faint hover:text-rose-400 p-1"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
