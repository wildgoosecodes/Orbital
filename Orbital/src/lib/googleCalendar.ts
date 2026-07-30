interface CalendarTask {
  title: string;
  description?: string | null;
  due_date?: string | null;
}

/** Pre-filled "add event" link — no login or API access needed, opens in the user's own Google Calendar. */
export function googleCalendarUrl(task: CalendarTask): string {
  const start = task.due_date!.replace(/-/g, '');
  const endDate = new Date(`${task.due_date}T00:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: task.title,
    dates: `${start}/${end}`,
  });
  if (task.description) params.set('details', task.description);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface CalendarEvent {
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
}

/** Same pre-filled "add event" link as googleCalendarUrl, but for timed
 *  events rather than all-day tasks — uses the full UTC instant instead of
 *  a bare date. */
export function googleCalendarUrlForEvent(event: CalendarEvent): string {
  const toStamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  let dates: string;
  if (event.all_day) {
    const start = event.start_at.slice(0, 10).replace(/-/g, '');
    const endDate = new Date(event.start_at);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().slice(0, 10).replace(/-/g, '');
    dates = `${start}/${end}`;
  } else {
    const startStamp = toStamp(new Date(event.start_at).toISOString());
    const endIso = event.end_at ?? new Date(new Date(event.start_at).getTime() + 60 * 60 * 1000).toISOString();
    const endStamp = toStamp(new Date(endIso).toISOString());
    dates = `${startStamp}/${endStamp}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
  });
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
