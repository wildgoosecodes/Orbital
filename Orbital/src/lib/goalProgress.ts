import type { Goal, Task } from '../types/database';

/**
 * Goals with linked tasks get their progress computed from real task completion
 * instead of the manual slider. Goals with no tasks (old manual-slider goals, or
 * goals with only a habit linked for organizational purposes) keep the stored
 * manual value untouched — this is what grandfathers pre-existing goals in.
 */
export function computeGoalProgress(goal: Goal, tasks: Task[]): number {
  if (tasks.length === 0) return goal.progress;
  const done = tasks.filter((t) => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}
