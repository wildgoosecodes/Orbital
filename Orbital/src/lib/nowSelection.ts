import type { Task, TaskPriority } from '../types/database';
import { todayStr } from './habitStreak';

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** 0 = overdue, 1 = due today, 2 = has a future due date, 3 = no due date at all. */
function urgencyBucket(task: Task, today: string): number {
  if (!task.due_date) return 3;
  if (task.due_date < today) return 0;
  if (task.due_date === today) return 1;
  return 2;
}

/**
 * Open tasks ranked by urgency (overdue > due today > future date > no date),
 * then priority (high > medium > low), then soonest due date, then oldest
 * first as a final tiebreak so nothing gets perpetually skipped.
 */
export function rankOpenTasks(tasks: Task[]): Task[] {
  const today = todayStr();
  return tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      const bucketDiff = urgencyBucket(a, today) - urgencyBucket(b, today);
      if (bucketDiff !== 0) return bucketDiff;
      const priorityDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      const aDate = a.due_date ?? '9999-99-99';
      const bDate = b.due_date ?? '9999-99-99';
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return a.created_at.localeCompare(b.created_at);
    });
}

/** A manually pinned task always wins; otherwise the top-ranked open task. */
export function pickNow(tasks: Task[]): Task | null {
  const pinned = tasks.find((t) => t.pinned_now && t.status !== 'done');
  if (pinned) return pinned;
  const ranked = rankOpenTasks(tasks);
  return ranked[0] ?? null;
}

/** Whatever would become NOW next, i.e. the rank-order item right after the current NOW task. */
export function pickNext(tasks: Task[], nowTask: Task | null): Task | null {
  const ranked = rankOpenTasks(tasks).filter((t) => t.id !== nowTask?.id);
  return ranked[0] ?? null;
}
