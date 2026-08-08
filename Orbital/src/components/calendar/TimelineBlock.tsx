import { Trash2 } from 'lucide-react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Task, TimeBlock } from '../../types/database';
import type { HabitWithLogs } from '../../hooks/useHabits';

export type DragKind = 'move' | 'resize-top' | 'resize-bottom';

interface TimelineBlockProps {
  block: TimeBlock;
  top: number;
  height: number;
  left: number;
  widthPct: number;
  color: string;
  overlaps: boolean;
  isDragging: boolean;
  durationMin: number;
  rangeLabel: string;
  tasks: Task[];
  habits: HabitWithLogs[];
  onToggleTask: (task: Task) => void;
  onToggleHabit: (habit: HabitWithLogs) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  onDragStart: (kind: DragKind, e: ReactPointerEvent) => void;
}

/** Presentational only — all the drag-position math (converting pointer movement into
 *  snapped start/end times, running collision checks) lives in the parent, which owns the
 *  timeline's actual pixel dimensions. This just reports gesture starts upward. */
export default function TimelineBlock({
  block,
  top,
  height,
  left,
  widthPct,
  color,
  overlaps,
  isDragging,
  durationMin,
  rangeLabel,
  tasks,
  habits,
  onToggleTask,
  onToggleHabit,
  onEdit,
  onDelete,
  onToggleComplete,
  onDragStart,
}: TimelineBlockProps) {
  return (
    <div
      style={{
        top: `${top}%`,
        height: `${height}%`,
        minHeight: 26,
        left: `${left}%`,
        width: `calc(${widthPct}% - 4px)`,
        backgroundColor: `${color}22`,
        borderLeft: `3px solid ${color}`,
      }}
      className={`absolute rounded-md overflow-hidden group select-none ${overlaps ? 'ring-2 ring-amber-400 z-10' : ''} ${isDragging ? 'z-20 opacity-90' : ''}`}
    >
      <div
        onPointerDown={(e) => onDragStart('resize-top', e)}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize touch-none"
      />

      <div
        onPointerDown={(e) => onDragStart('move', e)}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="px-1.5 py-0.5 cursor-grab flex items-center gap-1.5 min-w-0 touch-none"
      >
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
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
        {overlaps && <span className="text-[9px] font-semibold text-amber-400 whitespace-nowrap ml-auto flex-shrink-0">Conflict</span>}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete block"
          className="opacity-0 group-hover:opacity-100 text-orbital-text-faint hover:text-rose-400 flex-shrink-0 ml-1"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {(tasks.length > 0 || habits.length > 0) && (
        <div className="px-1.5 space-y-0.5 overflow-hidden">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-1 min-w-0">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTask(t);
                }}
                aria-label={t.status === 'done' ? 'Mark task not done' : 'Mark task done'}
                className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 ${
                  t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                }`}
              />
              <span className={`text-[10px] truncate ${t.status === 'done' ? 'line-through text-orbital-text-faint' : 'text-orbital-text-muted'}`}>
                {t.title}
              </span>
            </div>
          ))}
          {habits.map((h) => {
            const doneToday = h.completedDates.includes(new Date().toISOString().slice(0, 10));
            return (
              <div key={h.id} className="flex items-center gap-1 min-w-0">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHabit(h);
                  }}
                  aria-label={doneToday ? 'Mark habit not done' : 'Mark habit done'}
                  className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 ${
                    doneToday ? 'bg-emerald-500 border-emerald-500' : 'border-orbital-text-faint'
                  }`}
                />
                <span className={`text-[10px] truncate ${doneToday ? 'line-through text-orbital-text-faint' : 'text-orbital-text-muted'}`}>
                  {h.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {durationMin >= 40 && <p className="text-[10px] text-orbital-text-faint px-1.5">{rangeLabel}</p>}

      <div
        onPointerDown={(e) => onDragStart('resize-bottom', e)}
        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize touch-none"
      />
    </div>
  );
}
