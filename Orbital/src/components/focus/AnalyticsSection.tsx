import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, CheckSquare, Flame, ListTodo, TrendingUp } from 'lucide-react';
import type { Task } from '../../types/database';
import type { HabitWithLogs } from '../../hooks/useHabits';
import type { DayCompletion } from '../../hooks/useAnalytics';
import StatCard from '../cards/StatCard';
import CircularProgress from '../charts/CircularProgress';
import WeeklyProgressChart from '../charts/WeeklyProgressChart';
import ConsistencyHeatmap from '../overview/ConsistencyHeatmap';
import { expandCollapse, expandCollapseTransition } from '../../lib/motion';
import { countOpenTasks, completedTodayDelta, weeklyProductivityScore, bestCurrentStreak, bestEverStreak } from '../../lib/overviewStats';

interface AnalyticsSectionProps {
  tasks: Task[];
  habits: HabitWithLogs[];
  last7Days: DayCompletion[];
  tasksLoading: boolean;
  habitsLoading: boolean;
  analyticsLoading: boolean;
}

export default function AnalyticsSection({
  tasks,
  habits,
  last7Days,
  tasksLoading,
  habitsLoading,
  analyticsLoading,
}: AnalyticsSectionProps) {
  const [open, setOpen] = useState(false);

  const openCount = countOpenTasks(tasks);
  const completedToday = last7Days.length > 0 ? last7Days[last7Days.length - 1].completed : 0;
  const productivityScore = weeklyProductivityScore(last7Days, openCount);
  const currentStreak = bestCurrentStreak(habits);
  const bestStreak = bestEverStreak(habits);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-orbital-text-faint hover:text-orbital-text-muted"
      >
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        Analytics
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            variants={expandCollapse}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={expandCollapseTransition}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={CheckSquare}
                  label="Tasks Completed"
                  value={tasksLoading ? '—' : String(completedToday)}
                  delta={completedTodayDelta(last7Days)}
                  accentColor="#6366f1"
                  sparklineData={last7Days.map((d) => d.completed)}
                />
                <StatCard icon={ListTodo} label="Open Tasks" value={tasksLoading ? '—' : String(openCount)} accentColor="#3987e5" />
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
              </div>

              <ConsistencyHeatmap habits={habits} loading={habitsLoading} />
              <WeeklyProgressChart data={last7Days} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
