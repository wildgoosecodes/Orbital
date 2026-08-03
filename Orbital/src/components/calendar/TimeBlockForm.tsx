import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { NewTimeBlockInput } from '../../hooks/useTimeBlocks';
import type { TimeBlock } from '../../types/database';
import { tapScale } from '../../lib/motion';
import { categoryColor } from '../../lib/categoryColor';

interface TimeBlockFormProps {
  /** The local day (YYYY-MM-DD) this block belongs to. */
  defaultDate: string;
  /** Present when editing an existing block. */
  initialBlock?: TimeBlock;
  /** Used when creating a block from the drawer's "Add to timeline" action. */
  prefillTitle?: string;
  prefillCategory?: string | null;
  prefillTaskId?: string | null;
  prefillHabitId?: string | null;
  prefillStartTime?: string;
  /** Shown as a read-only badge when the block is linked to a task/habit. */
  linkedLabel?: string;
  categories: string[];
  onSubmit: (input: NewTimeBlockInput) => Promise<void>;
  onCancel?: () => void;
}

function toTimePart(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Combines the day this block belongs to with a local time input into a
 *  correct UTC instant — never send a naive datetime string, since that
 *  would silently misinterpret the user's local time as UTC on the server. */
function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TimeBlockForm({
  defaultDate,
  initialBlock,
  prefillTitle,
  prefillCategory,
  prefillTaskId,
  prefillHabitId,
  prefillStartTime,
  linkedLabel,
  categories,
  onSubmit,
  onCancel,
}: TimeBlockFormProps) {
  const taskId = initialBlock?.task_id ?? prefillTaskId ?? null;
  const habitId = initialBlock?.habit_id ?? prefillHabitId ?? null;
  const isLinked = !!(taskId || habitId);

  const [title, setTitle] = useState(initialBlock?.title ?? prefillTitle ?? '');
  const [category, setCategory] = useState(initialBlock?.category ?? prefillCategory ?? '');
  const [startTime, setStartTime] = useState(
    initialBlock ? toTimePart(initialBlock.start_at) : (prefillStartTime ?? '09:00'),
  );
  const [endTime, setEndTime] = useState(
    initialBlock ? toTimePart(initialBlock.end_at) : addOneHour(prefillStartTime ?? '09:00'),
  );
  const [submitting, setSubmitting] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    const start_at = toIso(defaultDate, startTime);
    const end_at = toIso(defaultDate, endTime);
    if (end_at <= start_at) {
      setRangeError('End time must be after start time.');
      return;
    }
    setRangeError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category: category.trim() || undefined,
        start_at,
        end_at,
        task_id: taskId,
        habit_id: habitId,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-cosmic-surface-2 border border-orbital-accent-1/50 rounded-xl space-y-3"
    >
      {linkedLabel && (
        <p className="text-xs font-medium text-orbital-accent-2 bg-orbital-accent-1/10 border border-orbital-accent-1/20 rounded-lg px-3 py-1.5">
          {linkedLabel}
        </p>
      )}

      <input
        type="text"
        required
        placeholder="Block title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
      />

      {isLinked ? (
        category.trim() && (
          <div className="flex items-center gap-2 text-xs text-orbital-text-muted px-1">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor(category) }} />
            {category}
          </div>
        )
      ) : (
        <div className="relative">
          {category.trim() && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: categoryColor(category) }}
            />
          )}
          <input
            type="text"
            list="time-block-category-options"
            placeholder="Category (e.g. Work, Health) — optional"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg py-2 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1 ${category.trim() ? 'pl-7 pr-3' : 'px-3'}`}
          />
          <datalist id="time-block-category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="time"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <span className="text-orbital-text-faint text-sm">to</span>
        <input
          type="time"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
      </div>

      {rangeError && <p className="text-xs text-rose-400">{rangeError}</p>}

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <motion.button
            whileTap={tapScale}
            type="button"
            onClick={onCancel}
            className="text-sm text-orbital-text-muted hover:text-orbital-text px-3 py-2"
          >
            Cancel
          </motion.button>
        )}
        <motion.button
          whileTap={tapScale}
          type="submit"
          disabled={submitting || !title.trim()}
          className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          {submitting ? 'Saving...' : initialBlock ? 'Save' : 'Add block'}
        </motion.button>
      </div>
    </form>
  );
}
