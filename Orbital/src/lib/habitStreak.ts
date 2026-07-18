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
