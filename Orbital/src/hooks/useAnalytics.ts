import { useQuery } from '@tanstack/react-query';
import type { Task, TaskStatus } from '../types/database';
import { fetchTasks, tasksQueryKey } from './useTasks';

export interface DayCompletion {
  date: string;
  label: string;
  completed: number;
}

export interface StatusCount {
  status: TaskStatus;
  label: string;
  count: number;
}

const STATUS_ORDER: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildLast7Days(tasks: Task[]): DayCompletion[] {
  const doneByDay = new Map<string, number>();
  for (const task of tasks) {
    if (task.status !== 'done') continue;
    const day = task.updated_at.slice(0, 10);
    doneByDay.set(day, (doneByDay.get(day) || 0) + 1);
  }

  const days: DayCompletion[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = toDateStr(d);
    days.push({
      date,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      completed: doneByDay.get(date) || 0,
    });
  }
  return days;
}

function buildStatusBreakdown(tasks: Task[]): StatusCount[] {
  const counts = new Map<TaskStatus, number>();
  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) || 0) + 1);
  }
  return STATUS_ORDER.map(({ status, label }) => ({ status, label, count: counts.get(status) || 0 }));
}

/** Reads the same shared `tasks` query useTasks() uses — no fetch of its own. */
export function useAnalytics(userId: string) {
  const { data: tasks = [], isLoading: loading, error } = useQuery({
    queryKey: tasksQueryKey(userId),
    queryFn: fetchTasks,
    enabled: !!userId,
  });

  return {
    last7Days: buildLast7Days(tasks),
    statusBreakdown: buildStatusBreakdown(tasks),
    loading,
    error: error ? (error as Error).message : null,
  };
}
