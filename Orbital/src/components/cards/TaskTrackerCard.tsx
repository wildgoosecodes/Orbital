import { taskTrackerData } from '../../data/mockDashboardData';

export default function TaskTrackerCard() {
  const { totalTasks, completedTasks, remainingTasks, completionPercent } = taskTrackerData;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Task Tracker</h3>
        <span className="text-sm font-medium text-indigo-400">{completionPercent}%</span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Total</p>
          <p className="text-xl font-semibold text-white">{totalTasks}</p>
        </div>
        <div>
          <p className="text-slate-500">Completed</p>
          <p className="text-xl font-semibold text-emerald-400">{completedTasks}</p>
        </div>
        <div>
          <p className="text-slate-500">Remaining</p>
          <p className="text-xl font-semibold text-amber-400">{remainingTasks}</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${completionPercent}%` }} />
      </div>
    </div>
  );
}
