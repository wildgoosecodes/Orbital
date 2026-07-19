import { CheckSquare, Flame, ListTodo, TrendingUp } from 'lucide-react';
import StatCard from '../cards/StatCard';
import CircularProgress from '../charts/CircularProgress';
import WeeklyProgressChart from '../charts/WeeklyProgressChart';
import TodaysTasksCard from './TodaysTasksCard';
import GoalsProgressCard from './GoalsProgressCard';
import QuickActionsCard from './QuickActionsCard';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  greetingForHour,
  displayNameFromEmail,
  countOpenTasks,
  completedTodayDelta,
  weeklyProductivityScore,
  bestCurrentStreak,
  bestEverStreak,
} from '../../lib/overviewStats';
import type { Tab } from '../layout/Sidebar';

interface OverviewPageProps {
  userId: string;
  userEmail: string;
  onNavigate: (tab: Tab) => void;
}

export default function OverviewPage({ userId, userEmail, onNavigate }: OverviewPageProps) {
  const name = displayNameFromEmail(userEmail);
  const { tasks, loading: tasksLoading, setStatus } = useTasks(userId);
  const { habits, loading: habitsLoading } = useHabits(userId);
  const { goals, loading: goalsLoading } = useGoals(userId);
  const { last7Days, loading: analyticsLoading } = useAnalytics(userId);

  const goalTitleById = new Map(goals.map((g) => [g.id, g.title]));

  const openCount = countOpenTasks(tasks);
  const completedToday = last7Days.length > 0 ? last7Days[last7Days.length - 1].completed : 0;
  const productivityScore = weeklyProductivityScore(last7Days, openCount);
  const currentStreak = bestCurrentStreak(habits);
  const bestStreak = bestEverStreak(habits);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">
          {greetingForHour()}, {name} 👋
        </h2>
        <p className="text-sm text-slate-400">Here's what's happening with your productivity today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CheckSquare}
          label="Tasks Completed"
          value={tasksLoading ? '—' : String(completedToday)}
          delta={completedTodayDelta(last7Days)}
          accentColor="#6366f1"
          sparklineData={last7Days.map((d) => d.completed)}
        />
        <StatCard
          icon={ListTodo}
          label="Open Tasks"
          value={tasksLoading ? '—' : String(openCount)}
          accentColor="#3987e5"
        />
        <StatCard
          icon={TrendingUp}
          label="Productivity Score"
          value={analyticsLoading || tasksLoading ? '—' : `${productivityScore}%`}
          delta="Last 7 days"
          accentColor="#10b981"
          badge={<CircularProgress percent={productivityScore} color="#10b981" />}
        />
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={habitsLoading ? '—' : `${currentStreak} day${currentStreak === 1 ? '' : 's'}`}
          delta={habitsLoading ? undefined : `Best: ${bestStreak} day${bestStreak === 1 ? '' : 's'}`}
          accentColor="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TodaysTasksCard
            tasks={tasks}
            loading={tasksLoading}
            onToggleDone={(id, status) => setStatus(id, status)}
            onNavigate={onNavigate}
            goalTitleById={goalTitleById}
          />
        </div>
        <GoalsProgressCard goals={goals} loading={goalsLoading} onNavigate={onNavigate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WeeklyProgressChart data={last7Days} />
        </div>
        <QuickActionsCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
