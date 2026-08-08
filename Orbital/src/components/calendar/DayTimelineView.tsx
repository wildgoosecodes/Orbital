import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Repeat2 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useTimeBlocks } from '../../hooks/useTimeBlocks';
import { dateKey } from '../../lib/calendarGrid';
import {
  MINUTES_PER_DAY,
  cascadePush,
  computeOverlappingIds,
  fractionToMinutes,
  layoutDayBlocks,
  minutesSinceMidnight,
  nextFreeHourSlot,
  rangesOverlap,
  snapMinutes,
} from '../../lib/timeGrid';
import type { MinuteRange } from '../../lib/timeGrid';
import { categoryColor } from '../../lib/categoryColor';
import TimeBlockForm from './TimeBlockForm';
import ConflictPicker from './ConflictPicker';
import TimelineBlock from './TimelineBlock';
import type { DragKind } from './TimelineBlock';
import type { Task, TimeBlock } from '../../types/database';
import type { HabitWithLogs } from '../../hooks/useHabits';
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
  | { mode: 'newForItem'; item: DrawerItem }
  | { mode: 'edit'; block: TimeBlock }
  | null;

interface PendingCandidate {
  label: string;
  startMin: number;
  endMin: number;
  excludeId?: string;
  onApply: (start_at: string, end_at: string) => Promise<void>;
}

interface PendingConflict {
  candidate: PendingCandidate;
  collidingBlocks: TimeBlock[];
}

type BlockDragState = {
  kind: DragKind;
  blockId: string;
  startClientY: number;
  originStartMin: number;
  originEndMin: number;
} | null;

interface DrawerDragVisual {
  item: DrawerItem;
  clientX: number;
  clientY: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const UNCATEGORIZED = 'Uncategorized';

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

function formatMinuteLabel(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = ((min % 60) + 60) % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function minutesToIso(startMin: number, endMin: number, dayKey: string): { start_at: string; end_at: string } {
  const start = new Date(`${dayKey}T00:00:00`);
  start.setMinutes(start.getMinutes() + startMin);
  const end = new Date(`${dayKey}T00:00:00`);
  end.setMinutes(end.getMinutes() + endMin);
  return { start_at: start.toISOString(), end_at: end.toISOString() };
}

function toMinuteRange(block: TimeBlock): MinuteRange {
  const start = new Date(block.start_at);
  const startMin = minutesSinceMidnight(start);
  const durationMin = (new Date(block.end_at).getTime() - start.getTime()) / 60_000;
  return { id: block.id, startMin, endMin: startMin + durationMin };
}

export default function DayTimelineView({ userId, selectedKey, onSelectDay }: DayTimelineViewProps) {
  const { tasks, setStatus: setTaskStatus, setTimeBlock: setTaskTimeBlock } = useTasks(userId);
  const { habits, toggleToday, setTimeBlock: setHabitTimeBlock } = useHabits(userId);
  const { timeBlocks, loading, addTimeBlock, updateTimeBlock, updateTiming, applyCascade, removeTimeBlock, toggleComplete } =
    useTimeBlocks(userId);

  const [formState, setFormState] = useState<FormState>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);
  const [pickerFor, setPickerFor] = useState<DrawerItem | null>(null);

  const [blockDrag, setBlockDrag] = useState<BlockDragState>(null);
  const [dragPreview, setDragPreview] = useState<{ blockId: string; startMin: number; endMin: number } | null>(null);
  const dragPreviewRef = useRef<{ startMin: number; endMin: number } | null>(null);

  const [drawerDragVisual, setDrawerDragVisual] = useState<DrawerDragVisual | null>(null);
  const drawerDragRef = useRef<DrawerDragVisual | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
  const dayBlockIds = useMemo(() => new Set(dayBlocks.map((b) => b.id)), [dayBlocks]);

  const tasksByBlock = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (t.time_block_id && dayBlockIds.has(t.time_block_id)) {
        const list = map.get(t.time_block_id) ?? [];
        list.push(t);
        map.set(t.time_block_id, list);
      }
    }
    return map;
  }, [tasks, dayBlockIds]);

  const habitsByBlock = useMemo(() => {
    const map = new Map<string, HabitWithLogs[]>();
    for (const h of habits) {
      if (h.time_block_id && dayBlockIds.has(h.time_block_id)) {
        const list = map.get(h.time_block_id) ?? [];
        list.push(h);
        map.set(h.time_block_id, list);
      }
    }
    return map;
  }, [habits, dayBlockIds]);

  const unscheduled: DrawerItem[] = useMemo(() => {
    const items: DrawerItem[] = [];
    for (const t of tasks) {
      if (t.due_date === selectedKey && t.status !== 'done' && !t.time_block_id) {
        items.push({ type: 'task', id: t.id, title: t.title, category: t.category });
      }
    }
    for (const h of habits) {
      if (h.days_of_week.includes(weekday) && !h.time_block_id) {
        items.push({ type: 'habit', id: h.id, title: h.name, category: h.category });
      }
    }
    return items;
  }, [tasks, habits, selectedKey, weekday]);

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

  const formCategories = useMemo(
    () => [...new Set(dayBlocks.map((b) => b.category).filter((c): c is string => !!c))].sort(),
    [dayBlocks],
  );

  // Auto-scroll to ~1 hour before the current time so today's schedule is in view on load.
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

  function findCollisions(candidate: { startMin: number; endMin: number; excludeId?: string }): TimeBlock[] {
    return dayBlocks.filter((b) => {
      if (b.id === candidate.excludeId) return false;
      const r = toMinuteRange(b);
      return rangesOverlap(candidate.startMin, candidate.endMin, r.startMin, r.endMin);
    });
  }

  async function commitBlockChange(candidate: PendingCandidate) {
    const collisions = findCollisions(candidate);
    if (collisions.length === 0) {
      const { start_at, end_at } = minutesToIso(candidate.startMin, candidate.endMin, selectedKey);
      await candidate.onApply(start_at, end_at);
      return;
    }
    setPendingConflict({ candidate, collidingBlocks: collisions });
  }

  async function resolveOverlap() {
    if (!pendingConflict) return;
    const { candidate } = pendingConflict;
    const { start_at, end_at } = minutesToIso(candidate.startMin, candidate.endMin, selectedKey);
    await candidate.onApply(start_at, end_at);
    setPendingConflict(null);
  }

  async function resolvePush() {
    if (!pendingConflict) return;
    const { candidate } = pendingConflict;
    const others = dayBlocks
      .filter((b) => b.id !== candidate.excludeId)
      .sort((a, b) => a.start_at.localeCompare(b.start_at))
      .map(toMinuteRange);
    const shifted = cascadePush(others, candidate.endMin);
    const { start_at, end_at } = minutesToIso(candidate.startMin, candidate.endMin, selectedKey);
    await candidate.onApply(start_at, end_at);
    if (shifted.length > 0) {
      await applyCascade(
        shifted.map((s) => ({ id: s.id, ...minutesToIso(s.startMin, s.endMin, selectedKey) })),
      );
    }
    setPendingConflict(null);
  }

  function resolveCancel() {
    setPendingConflict(null);
  }

  async function assignItemToBlock(item: DrawerItem, blockId: string) {
    if (item.type === 'task') await setTaskTimeBlock(item.id, blockId);
    else await setHabitTimeBlock(item.id, blockId);
  }

  async function handleFormSubmit(input: NewTimeBlockInput) {
    const startMin = minutesSinceMidnight(new Date(input.start_at));
    const durationMin = (new Date(input.end_at).getTime() - new Date(input.start_at).getTime()) / 60_000;
    const endMin = startMin + durationMin;
    const excludeId = formState?.mode === 'edit' ? formState.block.id : undefined;
    const capturedState = formState;

    await commitBlockChange({
      label: `${input.title} · ${formatMinuteLabel(startMin)}–${formatMinuteLabel(endMin)}`,
      startMin,
      endMin,
      excludeId,
      onApply: async (start_at, end_at) => {
        const finalInput = { ...input, start_at, end_at };
        if (capturedState?.mode === 'edit') {
          await updateTimeBlock(capturedState.block.id, finalInput);
        } else if (capturedState?.mode === 'newForItem') {
          const newBlock = await addTimeBlock(finalInput);
          await assignItemToBlock(capturedState.item, newBlock.id);
        } else {
          await addTimeBlock(finalInput);
        }
      },
    });
    setFormState(null);
  }

  function handleDelete(block: TimeBlock) {
    if (window.confirm(`Delete "${block.title}"? Tasks/habits inside it become unscheduled, not deleted.`)) {
      removeTimeBlock(block.id);
    }
  }

  // Block move/resize drag —————————————————————————————————————————————
  function startBlockDrag(kind: DragKind, block: TimeBlock, e: ReactPointerEvent) {
    e.stopPropagation();
    const range = toMinuteRange(block);
    setBlockDrag({ kind, blockId: block.id, startClientY: e.clientY, originStartMin: range.startMin, originEndMin: range.endMin });
    dragPreviewRef.current = { startMin: range.startMin, endMin: range.endMin };
    setDragPreview({ blockId: block.id, startMin: range.startMin, endMin: range.endMin });
  }

  useEffect(() => {
    if (!blockDrag) return;
    let moved = false;

    function onMove(e: PointerEvent) {
      const state = blockDrag;
      if (!state || !contentRef.current) return;
      const containerHeight = contentRef.current.clientHeight;
      if (!containerHeight) return;
      const deltaPx = e.clientY - state.startClientY;
      if (Math.abs(deltaPx) > 3) moved = true;
      const deltaMin = (deltaPx / containerHeight) * MINUTES_PER_DAY;

      let newStart = state.originStartMin;
      let newEnd = state.originEndMin;

      if (state.kind === 'move') {
        const duration = state.originEndMin - state.originStartMin;
        newStart = snapMinutes(state.originStartMin + deltaMin);
        newStart = Math.max(0, Math.min(MINUTES_PER_DAY - duration, newStart));
        newEnd = newStart + duration;
      } else if (state.kind === 'resize-bottom') {
        newEnd = snapMinutes(state.originEndMin + deltaMin);
        newEnd = Math.max(state.originStartMin + 30, Math.min(MINUTES_PER_DAY, newEnd));
      } else {
        newStart = snapMinutes(state.originStartMin + deltaMin);
        newStart = Math.min(state.originEndMin - 30, Math.max(0, newStart));
      }

      dragPreviewRef.current = { startMin: newStart, endMin: newEnd };
      setDragPreview({ blockId: state.blockId, startMin: newStart, endMin: newEnd });
    }

    function onUp() {
      const state = blockDrag;
      const finalPreview = dragPreviewRef.current;
      setBlockDrag(null);
      setDragPreview(null);
      dragPreviewRef.current = null;
      if (!state || !moved || !finalPreview) return;
      commitBlockChange({
        label: `New time · ${formatMinuteLabel(finalPreview.startMin)}–${formatMinuteLabel(finalPreview.endMin)}`,
        startMin: finalPreview.startMin,
        endMin: finalPreview.endMin,
        excludeId: state.blockId,
        onApply: async (start_at, end_at) => {
          await updateTiming(state.blockId, start_at, end_at);
        },
      });
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockDrag]);

  // Drag-from-drawer to schedule —————————————————————————————————————————
  function startDrawerDrag(item: DrawerItem, e: ReactPointerEvent) {
    const initial = { item, clientX: e.clientX, clientY: e.clientY };
    drawerDragRef.current = initial;
    setDrawerDragVisual(initial);
  }

  function handleDrawerDrop(item: DrawerItem, clientX: number, clientY: number) {
    const el = contentRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;

    const fraction = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const droppedMin = snapMinutes(fractionToMinutes(fraction));

    const targetBlock = dayBlocks.find((b) => {
      const r = toMinuteRange(b);
      return droppedMin >= r.startMin && droppedMin < r.endMin;
    });

    if (targetBlock) {
      assignItemToBlock(item, targetBlock.id);
      return;
    }

    const startMin = Math.min(droppedMin, MINUTES_PER_DAY - 60);
    const endMin = startMin + 60;
    commitBlockChange({
      label: `${item.category || 'Uncategorized'} · ${formatMinuteLabel(startMin)}–${formatMinuteLabel(endMin)}`,
      startMin,
      endMin,
      onApply: async (start_at, end_at) => {
        const newBlock = await addTimeBlock({
          title: item.category || 'Untitled',
          category: item.category || undefined,
          start_at,
          end_at,
        });
        await assignItemToBlock(item, newBlock.id);
      },
    });
  }

  useEffect(() => {
    if (!drawerDragVisual) return;

    function onMove(e: PointerEvent) {
      if (!drawerDragRef.current) return;
      const next = { ...drawerDragRef.current, clientX: e.clientX, clientY: e.clientY };
      drawerDragRef.current = next;
      setDrawerDragVisual(next);
    }

    function onUp(e: PointerEvent) {
      const final = drawerDragRef.current;
      drawerDragRef.current = null;
      setDrawerDragVisual(null);
      if (final) handleDrawerDrop(final.item, e.clientX, e.clientY);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerDragVisual?.item.id]);

  function blockContents(block: TimeBlock) {
    return { tasks: tasksByBlock.get(block.id) ?? [], habits: habitsByBlock.get(block.id) ?? [] };
  }

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

        {pendingConflict ? (
          <div className="mb-4">
            <ConflictPicker
              candidateLabel={pendingConflict.candidate.label}
              collidingTitles={pendingConflict.collidingBlocks.map((b) => b.title)}
              onOverlap={resolveOverlap}
              onPush={resolvePush}
              onCancel={resolveCancel}
            />
          </div>
        ) : formState ? (
          <div className="mb-4 space-y-2">
            <TimeBlockForm
              defaultDate={selectedKey}
              categories={formCategories}
              initialBlock={formState.mode === 'edit' ? formState.block : undefined}
              prefillTitle={formState.mode === 'newForItem' ? (formState.item.category ?? formState.item.title) : undefined}
              prefillCategory={formState.mode === 'newForItem' ? formState.item.category : undefined}
              prefillStartTime={formState.mode === 'newForItem' ? nextFreeHourSlot(dayBlocks, selectedKey) : undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => setFormState(null)}
            />
            {formState.mode === 'edit' &&
              (blockContents(formState.block).tasks.length > 0 || blockContents(formState.block).habits.length > 0) && (
                <div className="p-3 bg-cosmic-surface-3/40 border border-cosmic-border rounded-lg space-y-1.5">
                  <p className="text-xs font-semibold text-orbital-text-muted">Contains</p>
                  {blockContents(formState.block).tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 text-xs text-orbital-text">
                      <span className="truncate">{t.title}</span>
                      <button
                        onClick={() => setTaskTimeBlock(t.id, null)}
                        className="text-orbital-text-faint hover:text-rose-400 text-[10px] font-semibold flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {blockContents(formState.block).habits.map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-2 text-xs text-orbital-text">
                      <span className="truncate">{h.name}</span>
                      <button
                        onClick={() => setHabitTimeBlock(h.id, null)}
                        className="text-orbital-text-faint hover:text-rose-400 text-[10px] font-semibold flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ) : null}

        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}

        <div ref={timelineRef} className="relative overflow-y-auto max-h-[45vh] sm:max-h-[55vh]">
          <div ref={contentRef} className="relative h-[1200px] sm:h-[1440px]">
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
                const isDraggingThis = dragPreview?.blockId === block.id;
                const range = isDraggingThis ? dragPreview! : toMinuteRange(block);
                const top = (range.startMin / MINUTES_PER_DAY) * 100;
                const height = ((range.endMin - range.startMin) / MINUTES_PER_DAY) * 100;
                const color = categoryColor(block.category || 'Uncategorized');
                const overlaps = overlappingIds.has(block.id);
                const { col, cols } = blockColumns.get(block.id) ?? { col: 0, cols: 1 };
                const widthPct = 100 / cols;
                const durationMin = range.endMin - range.startMin;

                return (
                  <TimelineBlock
                    key={block.id}
                    block={block}
                    top={top}
                    height={height}
                    left={col * widthPct}
                    widthPct={widthPct}
                    color={color}
                    overlaps={overlaps}
                    isDragging={isDraggingThis}
                    durationMin={durationMin}
                    rangeLabel={`${formatMinuteLabel(range.startMin)} – ${formatMinuteLabel(range.endMin)}`}
                    tasks={tasksByBlock.get(block.id) ?? []}
                    habits={habitsByBlock.get(block.id) ?? []}
                    onToggleTask={(t) => setTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
                    onToggleHabit={(h) => toggleToday(h)}
                    onEdit={() => setFormState({ mode: 'edit', block })}
                    onDelete={() => handleDelete(block)}
                    onToggleComplete={() => toggleComplete(block)}
                    onDragStart={(kind, e) => startBlockDrag(kind, block, e)}
                  />
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
                {items.map((item) => {
                  const isPickerOpen = pickerFor?.id === item.id && pickerFor.type === item.type;
                  return (
                    <div key={`${item.type}-${item.id}`}>
                      <div
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startDrawerDrag(item, e);
                        }}
                        className="flex items-center gap-2 p-2 bg-cosmic-surface-3/60 rounded-lg cursor-grab touch-none select-none"
                      >
                        {item.type === 'task' ? (
                          <CheckSquare size={13} className="text-orbital-text-faint flex-shrink-0" strokeWidth={1.5} />
                        ) : (
                          <Repeat2 size={13} className="text-orbital-accent-2 flex-shrink-0" strokeWidth={2} />
                        )}
                        <p className="flex-1 min-w-0 text-xs text-orbital-text truncate">{item.title}</p>
                        <button
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => setPickerFor(isPickerOpen ? null : item)}
                          className="text-[10px] font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80 whitespace-nowrap flex-shrink-0"
                        >
                          Add to timeline
                        </button>
                      </div>
                      {isPickerOpen && (
                        <div className="mt-1 ml-2 p-2 bg-cosmic-surface-3/40 border border-cosmic-border rounded-lg space-y-1">
                          {dayBlocks.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                assignItemToBlock(item, b.id);
                                setPickerFor(null);
                              }}
                              className="w-full text-left text-[11px] text-orbital-text-muted hover:text-orbital-text px-1.5 py-1 rounded hover:bg-cosmic-surface-3"
                            >
                              {b.title} · {formatMinuteLabel(minutesSinceMidnight(new Date(b.start_at)))}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setFormState({ mode: 'newForItem', item });
                              setPickerFor(null);
                            }}
                            className="w-full text-left text-[11px] font-semibold text-orbital-accent-2 hover:text-orbital-accent-2/80 px-1.5 py-1 rounded hover:bg-cosmic-surface-3"
                          >
                            + New block...
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {drawerDragVisual &&
        createPortal(
          <div
            className="fixed z-50 pointer-events-none px-2 py-1 rounded-md text-xs font-medium text-orbital-text bg-orbital-accent-1/90 shadow-lg"
            style={{ left: drawerDragVisual.clientX + 10, top: drawerDragVisual.clientY + 10 }}
          >
            {drawerDragVisual.item.title}
          </div>,
          document.body,
        )}
    </div>
  );
}
