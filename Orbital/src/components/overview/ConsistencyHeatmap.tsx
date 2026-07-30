import type { HabitWithLogs } from '../../hooks/useHabits';

interface ConsistencyHeatmapProps {
  habits: HabitWithLogs[];
  loading: boolean;
}

const WEEKS = 4;
const DAYS = WEEKS * 7;

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Last 28 days, oldest first, each value = how many habits were logged that day. */
function buildDayCounts(habits: HabitWithLogs[]): number[] {
  const counts = new Map<string, number>();
  for (const habit of habits) {
    for (const date of habit.completedDates) {
      counts.set(date, (counts.get(date) || 0) + 1);
    }
  }

  const days: number[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(counts.get(toDateStr(d)) || 0);
  }
  return days;
}

/** Buckets a day's count into 0-3 intensity steps, relative to how many habits exist. */
function intensityStep(count: number, totalHabits: number): number {
  if (count === 0 || totalHabits === 0) return 0;
  const fraction = count / totalHabits;
  if (fraction < 0.34) return 1;
  if (fraction < 0.67) return 2;
  return 3;
}

const STEP_CLASS = [
  'bg-cosmic-surface-3',
  'bg-orbital-accent-1/35',
  'bg-orbital-accent-1/65',
  'bg-orbital-accent-1',
];

export default function ConsistencyHeatmap({ habits, loading }: ConsistencyHeatmapProps) {
  if (loading) {
    return (
      <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
        <h3 className="text-sm font-semibold text-orbital-text">Consistency by day</h3>
        <p className="mt-4 text-sm text-orbital-text-faint">Loading…</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
        <h3 className="text-sm font-semibold text-orbital-text">Consistency by day</h3>
        <p className="mt-4 text-sm text-orbital-text-faint">Add a habit to start tracking your consistency.</p>
      </div>
    );
  }

  const dayCounts = buildDayCounts(habits);

  return (
    <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="max-w-xl mx-auto">
        <h3 className="text-sm font-semibold text-orbital-text">Consistency by day</h3>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {dayCounts.map((count, i) => (
            <div
              key={i}
              title={`${count} habit${count === 1 ? '' : 's'} logged`}
              className={`aspect-square rounded-md ${STEP_CLASS[intensityStep(count, habits.length)]}`}
            />
          ))}
        </div>

        <div className="mt-3.5 flex items-center justify-between text-xs text-orbital-text-faint">
          <span>{WEEKS} weeks</span>
          <span className="flex items-center gap-1">
            Less
            {STEP_CLASS.map((cls, i) => (
              <i key={i} className={`w-2.5 h-2.5 rounded-sm inline-block ${cls}`} />
            ))}
            More
          </span>
        </div>
      </div>
    </div>
  );
}
