import { useAnalytics } from '../../hooks/useAnalytics';
import WeeklyProgressChart from '../charts/WeeklyProgressChart';
import TaskBreakdownChart from '../charts/TaskBreakdownChart';

interface AnalyticsPanelProps {
  userId: string;
}

export default function AnalyticsPanel({ userId }: AnalyticsPanelProps) {
  const { last7Days, statusBreakdown, loading, error } = useAnalytics(userId);

  if (loading) return <p className="text-sm text-slate-500">Loading analytics...</p>;
  if (error) return <p className="text-sm text-rose-400">{error}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <WeeklyProgressChart data={last7Days} />
      <TaskBreakdownChart data={statusBreakdown} />
    </div>
  );
}
