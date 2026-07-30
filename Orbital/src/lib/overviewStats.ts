import type { DayCompletion } from '../hooks/useAnalytics';
import type { HabitWithLogs } from '../hooks/useHabits';
import type { Event, Task } from '../types/database';
import { calculateStreak, longestStreak } from './habitStreak';

export function greetingForHour(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
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

/** "2h ago" / "Yesterday" / "3d ago" / falls back to a short date past ~2 weeks. */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface ActivityItem {
  id: string;
  kind: 'task' | 'habit';
  title: string;
  at: string;
}

/** Merges recently-completed tasks and habit logs into one feed, newest first. */
export function recentActivity(tasks: Task[], habits: HabitWithLogs[], limit = 4): ActivityItem[] {
  const taskItems: ActivityItem[] = tasks
    .filter((t) => t.status === 'done')
    .map((t) => ({ id: `task-${t.id}`, kind: 'task', title: t.title, at: t.updated_at }));

  const habitItems: ActivityItem[] = habits.flatMap((h) =>
    h.completedDates.map((date) => ({ id: `habit-${h.id}-${date}`, kind: 'habit' as const, title: h.name, at: `${date}T12:00:00` })),
  );

  return [...taskItems, ...habitItems].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Events starting from now onward, soonest first. */
export function upcomingEvents(events: Event[], limit = 3): Event[] {
  const nowIso = new Date().toISOString();
  return events
    .filter((e) => e.start_at >= nowIso)
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
    .slice(0, limit);
}
