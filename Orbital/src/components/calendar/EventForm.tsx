import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { NewEventInput } from '../../hooks/useEvents';
import type { Event } from '../../types/database';
import { tapScale } from '../../lib/motion';

interface EventFormProps {
  initialEvent?: Event;
  defaultDate?: string;
  onSubmit: (input: NewEventInput) => Promise<void>;
  onCancel?: () => void;
}

const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: '5', label: '5 minutes before' },
  { value: '10', label: '10 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
];

function toDatePart(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toTimePart(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Combines a local date + time input into a correct UTC instant — never send
 *  a naive datetime string, since that would silently misinterpret the
 *  user's local time as UTC on the server. */
function toIso(date: string, time: string): string {
  return new Date(`${date}T${time || '00:00'}`).toISOString();
}

export default function EventForm({ initialEvent, defaultDate, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [allDay, setAllDay] = useState(initialEvent?.all_day ?? false);
  const [startDate, setStartDate] = useState(
    initialEvent ? toDatePart(initialEvent.start_at) : defaultDate ?? toDatePart(new Date().toISOString()),
  );
  const [startTime, setStartTime] = useState(initialEvent ? toTimePart(initialEvent.start_at) : '09:00');
  const [endTime, setEndTime] = useState(initialEvent?.end_at ? toTimePart(initialEvent.end_at) : '');
  const [reminder, setReminder] = useState(
    initialEvent?.reminder_minutes_before != null ? String(initialEvent.reminder_minutes_before) : '',
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setSubmitting(true);
    try {
      const start_at = allDay ? toIso(startDate, '00:00') : toIso(startDate, startTime);
      const end_at = allDay
        ? undefined
        : endTime
          ? toIso(startDate, endTime)
          : undefined;

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        start_at,
        end_at,
        all_day: allDay,
        reminder_minutes_before: reminder ? Number(reminder) : null,
      });

      if (!initialEvent) {
        setTitle('');
        setDescription('');
        setLocation('');
        setAllDay(false);
        setStartTime('09:00');
        setEndTime('');
        setReminder('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-cosmic-surface-2 border border-orbital-accent-1/50 rounded-xl space-y-3"
    >
      <input
        type="text"
        required
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        {!allDay && (
          <>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
            />
            <input
              type="time"
              placeholder="End (optional)"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
            />
          </>
        )}
        <label className="flex items-center gap-2 text-sm text-orbital-text-muted px-1">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-cosmic-border bg-cosmic-surface-3 text-orbital-accent-1 focus:ring-orbital-accent-1"
          />
          All day
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <select
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        >
          {REMINDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1 resize-none"
      />

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
          {submitting ? 'Saving...' : initialEvent ? 'Save' : 'Add event'}
        </motion.button>
      </div>
    </form>
  );
}
