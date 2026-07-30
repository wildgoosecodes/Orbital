// Ported from Orbital/src/lib/habitStreak.ts and Orbital/src/lib/overviewStats.ts —
// Desktop is a separate codebase from the web app (by design), so these small
// pure functions are duplicated here rather than shared.

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export function todayStr() {
  return toDateStr(new Date());
}

/** Consecutive-day streak ending today (or yesterday, if today isn't logged yet). */
export function calculateStreak(completedDates) {
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

/** Longest historical consecutive-day run, anywhere in the log. */
export function longestStreak(completedDates) {
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

export function countOpenTasks(tasks) {
  return tasks.filter((t) => t.status !== 'done').length;
}

/** Last-7-days series of { date, label, completed } for the weekly progress chart. */
export function buildLast7Days(tasks) {
  const doneByDay = new Map();
  for (const task of tasks) {
    if (task.status !== 'done') continue;
    const day = task.updated_at.slice(0, 10);
    doneByDay.set(day, (doneByDay.get(day) || 0) + 1);
  }

  const days = [];
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

const STATUS_ORDER = [
  { status: 'todo', label: 'Todo' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

export function buildStatusBreakdown(tasks) {
  const counts = new Map();
  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) || 0) + 1);
  }
  return STATUS_ORDER.map(({ status, label }) => ({ status, label, count: counts.get(status) || 0 }));
}

/** Completed-last-7-days ÷ (completed + currently-open) — how much of the workload is cleared. */
export function weeklyProductivityScore(last7Days, openCount) {
  const completed = last7Days.reduce((sum, d) => sum + d.completed, 0);
  const total = completed + openCount;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/** "+2 from yesterday" / "-1 from yesterday" / "No change from yesterday". */
export function completedTodayDelta(last7Days) {
  if (last7Days.length < 2) return '';
  const today = last7Days[last7Days.length - 1].completed;
  const yesterday = last7Days[last7Days.length - 2].completed;
  const diff = today - yesterday;
  if (diff === 0) return 'No change from yesterday';
  return `${diff > 0 ? '+' : ''}${diff} from yesterday`;
}

/** Attaches completedDates (from habit_logs rows) onto each habit. */
export function attachHabitLogs(habits, habitLogs) {
  const logsByHabit = new Map();
  for (const log of habitLogs) {
    const list = logsByHabit.get(log.habit_id) || [];
    list.push(log.completed_on);
    logsByHabit.set(log.habit_id, list);
  }
  return habits.map((habit) => ({ ...habit, completedDates: logsByHabit.get(habit.id) || [] }));
}

export function bestCurrentStreak(habitsWithLogs) {
  if (habitsWithLogs.length === 0) return 0;
  return Math.max(...habitsWithLogs.map((h) => calculateStreak(h.completedDates)));
}

export function bestEverStreak(habitsWithLogs) {
  if (habitsWithLogs.length === 0) return 0;
  return Math.max(...habitsWithLogs.map((h) => longestStreak(h.completedDates)));
}
