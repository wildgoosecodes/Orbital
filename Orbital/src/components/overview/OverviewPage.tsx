import { motion } from 'framer-motion';
import { CheckSquare, Flame, ListTodo, TrendingUp } from 'lucide-react';
import StatCard from '../cards/StatCard';
import CircularProgress from '../charts/CircularProgress';
import WeeklyProgressChart from '../charts/WeeklyProgressChart';
import TodaysAgendaCard from './TodaysAgendaCard';
import GoalsProgressCard from './GoalsProgressCard';
import QuickActionsCard from './QuickActionsCard';
import WeatherCard from './WeatherCard';
import UpcomingEventsCard from './UpcomingEventsCard';
import RecentActivityCard from './RecentActivityCard';
import MiniCalendarCard from './MiniCalendarCard';
import CosmicHero from './CosmicHero';
import ConsistencyHeatmap from './ConsistencyHeatmap';
import { useTasks } from '../../hooks/useTasks';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useEvents } from '../../hooks/useEvents';
import { useAnalytics } from '../../hooks/useAnalytics';
import { todayStr } from '../../lib/habitStreak';
import { fadeInUp, fadeInUpTransition, staggerContainer } from '../../lib/motion';
import {
  displayNameFromEmail,
  countOpenTasks,
  completedTodayDelta,
  weeklyProductivityScore,
  bestCurrentStreak,
  bestEverStreak,
} from '../../lib/overviewStats';
import type { Tab } from '../../lib/navTabs';
import type { Profile } from '../../types/database';

interface OverviewPageProps {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  onNavigate: (tab: Tab) => void;
  onOpenVoiceMode: () => void;
}

export default function OverviewPage({ userId, userEmail, profile, onNavigate, onOpenVoiceMode }: OverviewPageProps) {
  const name =
    profile?.display_name && profile.display_name !== userEmail ? profile.display_name : displayNameFromEmail(userEmail);
  const { tasks, loading: tasksLoading, setStatus } = useTasks(userId);
  const { habits, loading: habitsLoading, toggleToday } = useHabits(userId);
  const { goals, loading: goalsLoading } = useGoals(userId);
  const { events, loading: eventsLoading } = useEvents(userId);
  const { last7Days, loading: analyticsLoading } = useAnalytics(userId);

  const goalTitleById = new Map(goals.map((g) => [g.id, g.title]));

  const openCount = countOpenTasks(tasks);
  const completedToday = last7Days.length > 0 ? last7Days[last7Days.length - 1].completed : 0;
  const productivityScore = weeklyProductivityScore(last7Days, openCount);
  const currentStreak = bestCurrentStreak(habits);
  const bestStreak = bestEverStreak(habits);
  const todayHabits = habits.filter((h) => h.completedDates.includes(todayStr())).length;
  const activeGoals = goals.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-4">
      <CosmicHero
        name={name}
        weeklyProgress={productivityScore}
        streak={currentStreak}
        todayTasks={completedToday}
        todayHabits={todayHabits}
        todayGoals={activeGoals}
        onOpenVoiceMode={onOpenVoiceMode}
        onAddTask={() => onNavigate('tasks')}
        onNewGoal={() => onNavigate('roadmap')}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={fadeInUpTransition}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <WeatherCard city={profile?.city ?? null} />
        <UpcomingEventsCard events={events} loading={eventsLoading} onNavigate={onNavigate} />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
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
          pulse={!habitsLoading && currentStreak > 0}
        />
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeInUp} transition={fadeInUpTransition}>
        <ConsistencyHeatmap habits={habits} loading={habitsLoading} />
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={fadeInUpTransition}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2 space-y-4">
          <TodaysAgendaCard
            userId={userId}
            tasks={tasks}
            habits={habits}
            tasksLoading={tasksLoading}
            habitsLoading={habitsLoading}
            onToggleTask={(id, status) => setStatus(id, status)}
            onToggleHabit={toggleToday}
            onNavigate={onNavigate}
            goalTitleById={goalTitleById}
          />
          <MiniCalendarCard userId={userId} tasks={tasks} events={events} habits={habits} onNavigate={onNavigate} />
        </div>
        <div className="space-y-4">
          <GoalsProgressCard goals={goals} loading={goalsLoading} onNavigate={onNavigate} />
          <QuickActionsCard onNavigate={onNavigate} />
          <RecentActivityCard tasks={tasks} habits={habits} loading={tasksLoading || habitsLoading} />
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={fadeInUp}
        transition={fadeInUpTransition}
      >
        <WeeklyProgressChart data={last7Days} />
      </motion.div>
    </div>
  );
}
