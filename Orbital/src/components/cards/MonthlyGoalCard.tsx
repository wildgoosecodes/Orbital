import { monthlyGoalData } from '../../data/mockDashboardData';

export default function MonthlyGoalCard() {
  const { title, progress, target } = monthlyGoalData;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Monthly Goal</h3>
        <span className="text-sm font-medium text-indigo-400">{progress}%</span>
      </div>
      <p className="mt-3 text-sm text-slate-400">{title}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Target: {target}</p>
    </div>
  );
}
