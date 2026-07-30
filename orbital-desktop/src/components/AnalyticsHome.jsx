import { useEffect, useState } from 'react';
import { CheckSquare, Flame, ListTodo, TrendingUp } from 'lucide-react';
import StatCard from './cards/StatCard';
import CircularProgress from './charts/CircularProgress';
import WeeklyProgressChart from './charts/WeeklyProgressChart';
import TaskBreakdownChart from './charts/TaskBreakdownChart';
import {
  attachHabitLogs,
  bestCurrentStreak,
  bestEverStreak,
  buildLast7Days,
  buildStatusBreakdown,
  completedTodayDelta,
  countOpenTasks,
  weeklyProductivityScore,
} from '../lib/stats';

/** Read-only analytics dashboard — editing tasks/habits/goals still happens on
 *  the web app or by asking the AI; Desktop is a glance-and-speak surface. */
export default function AnalyticsHome({ refreshToken }) {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await window.orbital.getSnapshot();
      if (cancelled) return;
      if (result.success) {
        setSnapshot(result);
        setError(null);
      } else {
        setError(result.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  if (error) {
    return <p className="text-sm text-rose-400">Couldn't load your stats: {error}</p>;
  }

  if (!snapshot) {
    return <p className="text-sm text-slate-500">Loading your stats…</p>;
  }

  const habitsWithLogs = attachHabitLogs(snapshot.habits, snapshot.habitLogs);
  const last7Days = buildLast7Days(snapshot.tasks);
  const statusBreakdown = buildStatusBreakdown(snapshot.tasks);
  const openCount = countOpenTasks(snapshot.tasks);
  const completedToday = last7Days.length > 0 ? last7Days[last7Days.length - 1].completed : 0;
  const productivityScore = weeklyProductivityScore(last7Days, openCount);
  const currentStreak = bestCurrentStreak(habitsWithLogs);
  const bestStreak = bestEverStreak(habitsWithLogs);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={CheckSquare}
          label="Completed Today"
          value={String(completedToday)}
          delta={completedTodayDelta(last7Days)}
          accentColor="#6366f1"
          sparklineData={last7Days.map((d) => d.completed)}
        />
        <StatCard icon={ListTodo} label="Open Tasks" value={String(openCount)} accentColor="#3987e5" />
        <StatCard
          icon={TrendingUp}
          label="Productivity"
          value={`${productivityScore}%`}
          delta="Last 7 days"
          accentColor="#10b981"
          badge={<CircularProgress percent={productivityScore} color="#10b981" />}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak} day${currentStreak === 1 ? '' : 's'}`}
          delta={`Best: ${bestStreak} day${bestStreak === 1 ? '' : 's'}`}
          accentColor="#f59e0b"
        />
      </div>

      <WeeklyProgressChart data={last7Days} />
      <TaskBreakdownChart data={statusBreakdown} />
    </div>
  );
}
