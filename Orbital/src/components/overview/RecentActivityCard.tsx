import { CheckSquare, Repeat2 } from 'lucide-react';
import type { HabitWithLogs } from '../../hooks/useHabits';
import type { Task } from '../../types/database';
import { formatRelativeTime, recentActivity } from '../../lib/overviewStats';

interface RecentActivityCardProps {
  tasks: Task[];
  habits: HabitWithLogs[];
  loading: boolean;
}

export default function RecentActivityCard({ tasks, habits, loading }: RecentActivityCardProps) {
  const items = recentActivity(tasks, habits);

  return (
    <div className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <h3 className="text-sm font-semibold text-orbital-text">Recent Activity</h3>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-orbital-text-faint">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-orbital-text-faint">Complete a task or habit to see it here.</p>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 bg-cosmic-surface-3/60 rounded-lg">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.kind === 'task' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orbital-accent-1/10 text-orbital-accent-2'
              }`}
            >
              {item.kind === 'task' ? <CheckSquare size={14} strokeWidth={2} /> : <Repeat2 size={14} strokeWidth={2} />}
            </span>
            <p className="flex-1 min-w-0 text-sm text-orbital-text truncate">{item.title}</p>
            <span className="flex-shrink-0 text-[11px] text-orbital-text-faint">{formatRelativeTime(item.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
