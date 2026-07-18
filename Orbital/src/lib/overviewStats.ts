import type { DayCompletion } from '../hooks/useAnalytics';
import type { HabitWithLogs } from '../hooks/useHabits';
import type { Task } from '../types/database';
import { calculateStreak, longestStreak } from './habitStreak';

export function greetingForHour(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function displayNameFromEmail(email: string): string {
  const prefix = email.split('@')[0] || email;
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export function countOpenTasks(tasks: Task[]): number {
  return tasks.filter((t) => t.status !== 'done').length;
}

/** "+2 from yesterday" / "-1 from yesterday" / "No change from yesterday", from the last7Days series. */
export function completedTodayDelta(last7Days: DayCompletion[]): string {
  if (last7Days.length < 2) return '';
  const today = last7Days[last7Days.length - 1].completed;
  const yesterday = last7Days[last7Days.length - 2].completed;
  const diff = today - yesterday;
  if (diff === 0) return 'No change from yesterday';
  return `${diff > 0 ? '+' : ''}${diff} from yesterday`;
}

/** Completed-last-7-days ÷ (completed + currently-open) — how much of the workload is cleared. */
export function weeklyProductivityScore(last7Days: DayCompletion[], openCount: number): number {
  const completed = last7Days.reduce((sum, d) => sum + d.completed, 0);
  const total = completed + openCount;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function bestCurrentStreak(habits: HabitWithLogs[]): number {
  if (habits.length === 0) return 0;
  return Math.max(...habits.map((h) => calculateStreak(h.completedDates)));
}

export function bestEverStreak(habits: HabitWithLogs[]): number {
  if (habits.length === 0) return 0;
  return Math.max(...habits.map((h) => longestStreak(h.completedDates)));
}

/** Open tasks first (soonest due first), then done tasks — for the compact Overview list. */
export function sortForOverview(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return (a.due_date ?? '9999-99-99').localeCompare(b.due_date ?? '9999-99-99');
  });
}
