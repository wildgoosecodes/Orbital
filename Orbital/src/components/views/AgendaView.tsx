import GoalProgressCard from '../cards/GoalProgressCard';
import HotStreakCard from '../cards/HotStreakCard';
import MonthlyGoalCard from '../cards/MonthlyGoalCard';
import TaskTrackerCard from '../cards/TaskTrackerCard';
import WeeklyProgressChart from '../charts/WeeklyProgressChart';
import TaskBreakdownChart from '../charts/TaskBreakdownChart';
import { goalProgressData } from '../../data/mockDashboardData';

export default function AgendaView() {
  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-lg font-semibold text-white">Agenda</h2>
        <p className="mt-1 text-sm text-slate-400">Productivity and planning snapshot</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TaskTrackerCard />
        <MonthlyGoalCard />
      </div>

      <HotStreakCard />

      <div className="space-y-3">
        {goalProgressData.map((goal) => (
          <GoalProgressCard key={goal.title} title={goal.title} progress={goal.progress} target={goal.target} />
        ))}
      </div>

      <WeeklyProgressChart />
      <TaskBreakdownChart />
    </div>
  );
}
