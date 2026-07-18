interface GoalProgressCardProps {
  title: string;
  progress: number;
  target: string;
}

export default function GoalProgressCard({ title, progress, target }: GoalProgressCardProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{title}</span>
        <span className="text-indigo-400 font-semibold">{safeProgress}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${safeProgress}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Target: {target}</p>
    </div>
  );
}
