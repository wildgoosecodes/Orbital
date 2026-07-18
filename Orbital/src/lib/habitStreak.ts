function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive-day streak ending today (or yesterday, if today isn't logged yet
 * so an in-progress streak isn't shown as broken before the day is over).
 */
export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const dates = new Set(completedDates);

  const cursor = new Date();
  if (!dates.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (dates.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** Longest historical consecutive-day run, anywhere in the log — not just the one ending today. */
export function longestStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;
  const sorted = [...new Set(completedDates)].sort();

  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    current = dayDiff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
