interface StatCardProps {
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export default function StatCard({ label, value, unit, status }: StatCardProps) {
  return (
    <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-sm font-semibold text-slate-400 ml-1">{unit}</span>
      </div>

      <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            status === 'critical'
              ? 'bg-rose-500 w-full'
              : status === 'warning'
                ? 'bg-amber-500 w-3/4'
                : 'bg-emerald-500 w-1/4'
          }`}
        />
      </div>
    </div>
  );
}
