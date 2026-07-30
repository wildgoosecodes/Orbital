function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Every day" / "Mon, Wed, Fri" / "Sat, Sun" — for display next to a habit. */
export function formatSchedule(daysOfWeek: number[]): string {
  if (daysOfWeek.length === 7) return 'Every day';
  if (daysOfWeek.length === 0) return 'Not scheduled';
  return [...daysOfWeek].sort().map((d) => DAY_ABBR[d]).join(', ');
}

/**
 * Consecutive-*scheduled*-day streak ending today (or yesterday, if today
 * isn't logged yet so an in-progress streak isn't shown as broken before the
 * day is over). Unscheduled weekdays are skipped entirely — they neither
 * extend nor break the streak — so a Mon/Wed/Fri habit isn't penalized for
 * an unscheduled Tuesday.
 */
export function calculateStreak(completedDates: string[], scheduledDays: number[] = EVERY_DAY): number {
  if (completedDates.length === 0 || scheduledDays.length === 0) return 0;
  const dates = new Set(completedDates);
  const scheduled = new Set(scheduledDays);

  const cursor = new Date();
  // If today is scheduled but not yet logged, start counting from yesterday
  // instead — the day isn't over yet, so it shouldn't read as a broken streak.
  if (scheduled.has(cursor.getDay()) && !dates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  // Cap the walk-back so an old, long-abandoned habit can't loop indefinitely.
  for (let guard = 0; guard < 3660; guard++) {
    if (!scheduled.has(cursor.getDay())) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (!dates.has(toDateStr(cursor))) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest historical consecutive-*scheduled*-day run, anywhere in the log — not just the one ending today. */
export function longestStreak(completedDates: string[], scheduledDays: number[] = EVERY_DAY): number {
  if (completedDates.length === 0 || scheduledDays.length === 0) return 0;
  const scheduled = new Set(scheduledDays);
  const sorted = [...new Set(completedDates)].sort();

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    // Count only scheduled days strictly between prev and curr (exclusive) to
    // decide whether the gap is "consecutive" for this habit's schedule.
    let unscheduledGapDays = 0;
    for (let d = 1; d < dayDiff; d++) {
      const between = new Date(prev);
      between.setDate(between.getDate() + d);
      if (!scheduled.has(between.getDay())) unscheduledGapDays++;
    }
    const isConsecutive = dayDiff - unscheduledGapDays === 1;
    current = isConsecutive ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
