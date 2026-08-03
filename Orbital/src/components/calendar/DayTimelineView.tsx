import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare, Repeat2 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useTimeBlocks } from '../../hooks/useTimeBlocks';
import { dateKey } from '../../lib/calendarGrid';
import { computeOverlappingIds, layoutDayBlocks, minutesSinceMidnight, nextFreeHourSlot } from '../../lib/timeGrid';
import { categoryColor } from '../../lib/categoryColor';
import TimeBlockForm from './TimeBlockForm';
import type { TimeBlock } from '../../types/database';
import type { NewTimeBlockInput } from '../../hooks/useTimeBlocks';

interface DayTimelineViewProps {
  userId: string;
  selectedKey: string;
  onSelectDay: (key: string) => void;
}

interface DrawerItem {
  type: 'task' | 'habit';
  id: string;
  title: string;
  category: string | null;
}

type FormState =
  | { mode: 'blank' }
  | { mode: 'linked'; item: DrawerItem }
  | { mode: 'edit'; block: TimeBlock }
  | null;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_PER_DAY = 24 * 60;
const UNCATEGORIZED = 'Uncategorized';

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

export default function DayTimelineView({ userId, selectedKey, onSelectDay }: DayTimelineViewProps) {
  const { tasks } = useTasks(userId);
  const { habits } = useHabits(userId);
  const { timeBlocks, loading, addTimeBlock, updateTimeBlock, removeTimeBlock, toggleComplete } = useTimeBlocks(userId);

  const [formState, setFormState] = useState<FormState>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => new Date(`${selectedKey}T00:00:00`), [selectedKey]);
  const weekday = selectedDate.getDay();

  const dayBlocks = useMemo(
    () =>
      timeBlocks
        .filter((b) => dateKey(new Date(b.start_at)) === selectedKey)
        .sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [timeBlocks, selectedKey],
  );
  const overlappingIds = useMemo(() => computeOverlappingIds(dayBlocks), [dayBlocks]);
  const blockColumns = useMemo(() => layoutDayBlocks(dayBlocks), [dayBlocks]);

  const linkedTaskIds = useMemo(() => new Set(dayBlocks.map((b) => b.task_id).filter(Boolean)), [dayBlocks]);
  const linkedHabitIds = useMemo(() => new Set(dayBlocks.map((b) => b.habit_id).filter(Boolean)), [dayBlocks]);

  const unscheduled: DrawerItem[] = useMemo(() => {
    const items: DrawerItem[] = [];
    for (const t of tasks) {
      if (t.due_date === selectedKey && t.status !== 'done' && !linkedTaskIds.has(t.id)) {
        items.push({ type: 'task', id: t.id, title: t.title, category: t.category });
      }
    }
    for (const h of habits) {
      if (h.days_of_week.includes(weekday) && !linkedHabitIds.has(h.id)) {
        items.push({ type: 'habit', id: h.id, title: h.name, category: h.category });
      }
    }
    return items;
  }, [tasks, habits, selectedKey, weekday, linkedTaskIds, linkedHabitIds]);

  const groupedByCategory = useMemo(() => {
    const map = new Map<string, DrawerItem[]>();
    for (const item of unscheduled) {
      const key = item.category?.trim() || UNCATEGORIZED;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    const categories = [...map.keys()].filter((c) => c !== UNCATEGORIZED).sort();
    if (map.has(UNCATEGORIZED)) categories.push(UNCATEGORIZED);
    return categories.map((category) => ({ category, items: map.get(category)! }));
  }, [unscheduled]);

  // Auto-scroll to ~1 hour before the current time so today's schedule is in view on load.
  // Computed as a fraction of the actual rendered content height (not a fixed px-per-hour
  // constant) so it lands in the right place whatever height the container ends up at.
  useEffect(() => {
    if (!timelineRef.current) return;
    const nowHour = new Date().getHours();
    const fraction = Math.max(0, nowHour - 1) / 24;
    timelineRef.current.scrollTop = fraction * timelineRef.current.scrollHeight;
  }, []);

  function shiftDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    onSelectDay(dateKey(d));
  }

  async function handleFormSubmit(input: NewTimeBlockInput) {
    if (formState?.mode === 'edit') {
      await updateTimeBlock(formState.block.id, input);
    } else {
      await addTimeBlock(input);
    }
    setFormState(null);
  }

  function handleDelete(block: TimeBlock) {
    if (window.confirm(`Delete "${block.title}"? This can't be undone.`)) removeTimeBlock(block.id);
  }

  const formCategories = useMemo(
    () => [...new Set(dayBlocks.map((b) => b.category).filter((c): c is string => !!c))].sort(),
    [dayBlocks],
  );

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      <div className="flex-1 p-3 sm:p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-orbital-text whitespace-nowrap">
            {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFormState({ mode: 'blank' })}
              className="flex items-center gap-1 text-xs font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80 border border-cosmic-border rounded-lg px-2 py-1"
            >
              <Plus size={12} /> Add
            </button>
            <button
              onClick={() => onSelectDay(dateKey(new Date()))}
              className="text-xs font-semibold text-orbital-text-muted hover:text-orbital-text border border-cosmic-border rounded-lg px-2 py-1"
            >
              Today
            </button>
            <button
              onClick={() => shiftDay(-1)}
              aria-label="Previous day"
              className="text-orbital-text-muted hover:text-orbital-text p-1 rounded-lg hover:bg-cosmic-surface-3"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => shiftDay(1)}
              aria-label="Next day"
              className="text-orbital-text-muted hover:text-orbital-text p-1 rounded-lg hover:bg-cosmic-surface-3"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {formState && (
          <div className="mb-4">
            <TimeBlockForm
              defaultDate={selectedKey}
              categories={formCategories}
              initialBlock={formState.mode === 'edit' ? formState.block : undefined}
              prefillTitle={formState.mode === 'linked' ? formState.item.title : undefined}
              prefillCategory={formState.mode === 'linked' ? formState.item.category : undefined}
              prefillTaskId={formState.mode === 'linked' && formState.item.type === 'task' ? formState.item.id : undefined}
              prefillHabitId={formState.mode === 'linked' && formState.item.type === 'habit' ? formState.item.id : undefined}
              prefillStartTime={formState.mode === 'linked' ? nextFreeHourSlot(dayBlocks, selectedKey) : undefined}
              linkedLabel={
                formState.mode === 'linked'
                  ? `Linked to ${formState.item.type}: "${formState.item.title}"`
                  : formState.mode === 'edit' && (formState.block.task_id || formState.block.habit_id)
                    ? `Linked to ${formState.block.task_id ? 'task' : 'habit'}`
                    : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={() => setFormState(null)}
            />
          </div>
        )}

        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}

        <div ref={timelineRef} className="relative overflow-y-auto max-h-[45vh] sm:max-h-[55vh]">
          {/* Every position below is a % of this div's own height, not a fixed px-per-hour
              constant — the div's actual height comes from CSS (h-[...] below) and everything
              inside scales to whatever that ends up being. */}
          <div className="relative h-[1200px] sm:h-[1440px]">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-cosmic-border/50"
                style={{ top: `${(h / 24) * 100}%`, height: `${100 / 24}%` }}
              >
                <span className="absolute -top-2 left-0 text-[9px] text-orbital-text-faint w-9">{formatHour(h)}</span>
              </div>
            ))}

            <div className="absolute left-10 right-1 top-0 bottom-0">
              {dayBlocks.map((block) => {
                const start = new Date(block.start_at);
                const end = new Date(block.end_at);
                const startMin = minutesSinceMidnight(start);
                const durationMin = (end.getTime() - start.getTime()) / 60_000;
                const top = (startMin / MINUTES_PER_DAY) * 100;
                const height = (durationMin / MINUTES_PER_DAY) * 100;
                const color = categoryColor(block.category || 'Uncategorized');
                const overlaps = overlappingIds.has(block.id);
                const { col, cols } = blockColumns.get(block.id) ?? { col: 0, cols: 1 };
                const widthPct = 100 / cols;

                return (
                  <div
                    key={block.id}
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      minHeight: 20,
                      left: `${col * widthPct}%`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: `${color}22`,
                      borderLeft: `3px solid ${color}`,
                    }}
                    className={`absolute rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer group ${
                      overlaps ? 'ring-2 ring-amber-400 z-10' : ''
                    }`}
                    onClick={() => setFormState({ mode: 'edit', block })}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(block);
                        }}
                        aria-label={block.is_completed ? 'Mark incomplete' : 'Mark complete'}
                        className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center ${
                          block.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                        }`}
                      >
                        {block.is_completed && (
                          <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <p
                        className={`text-xs font-medium truncate ${
                          block.is_completed ? 'text-orbital-text-faint line-through' : 'text-orbital-text'
                        }`}
                      >
                        {block.title}
                      </p>
                      {overlaps && (
                        <span className="text-[9px] font-semibold text-amber-400 whitespace-nowrap ml-auto flex-shrink-0">
                          Conflict
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(block);
                        }}
                        aria-label="Delete block"
                        className="opacity-0 group-hover:opacity-100 text-orbital-text-faint hover:text-rose-400 flex-shrink-0 ml-1"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    {durationMin >= 40 && (
                      <p className="text-[10px] text-orbital-text-faint mt-0.5">
                        {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:w-64 xl:w-72 flex-shrink-0 p-3 sm:p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-orbital-text">Unscheduled today</h3>
        {groupedByCategory.length === 0 && (
          <p className="text-sm text-orbital-text-faint">Nothing left to schedule for this day.</p>
        )}
        <div className="space-y-3">
          {groupedByCategory.map(({ category, items }) => (
            <div key={category}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${category === UNCATEGORIZED ? 'bg-orbital-text-faint' : ''}`}
                  style={category === UNCATEGORIZED ? undefined : { backgroundColor: categoryColor(category) }}
                />
                <span className="text-xs font-semibold text-orbital-text-muted">{category}</span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-2 p-2 bg-cosmic-surface-3/60 rounded-lg"
                  >
                    {item.type === 'task' ? (
                      <CheckSquare size={13} className="text-orbital-text-faint flex-shrink-0" strokeWidth={1.5} />
                    ) : (
                      <Repeat2 size={13} className="text-orbital-accent-2 flex-shrink-0" strokeWidth={2} />
                    )}
                    <p className="flex-1 min-w-0 text-xs text-orbital-text truncate">{item.title}</p>
                    <button
                      onClick={() => setFormState({ mode: 'linked', item })}
                      className="text-[10px] font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80 whitespace-nowrap flex-shrink-0"
                    >
                      Add to timeline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
