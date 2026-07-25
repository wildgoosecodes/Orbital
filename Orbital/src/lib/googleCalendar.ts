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
