import { hotStreakData } from '../../data/mockDashboardData';

export default function HotStreakCard() {
  const { streakDays, label } = hotStreakData;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl text-amber-500">🔥</span>
        <h3 className="text-lg font-semibold text-white">Hot Streak</h3>
      </div>
      <div className="mt-4">
        <p className="text-4xl font-semibold text-white">{streakDays}</p>
        <p className="mt-1 text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
