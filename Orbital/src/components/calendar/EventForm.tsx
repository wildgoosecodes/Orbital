import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewEventInput } from '../../hooks/useEvents';
import type { Event } from '../../types/database';

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
      className="p-4 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3"
    >
      <input
        type="text"
        required
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        {!allDay && (
          <>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="time"
              placeholder="End (optional)"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-400 px-1">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
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
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <select
          value={reminder}
          onChange={(e) => setReminder(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
      />

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          {submitting ? 'Saving...' : initialEvent ? 'Save' : 'Add event'}
        </button>
      </div>
    </form>
  );
}
