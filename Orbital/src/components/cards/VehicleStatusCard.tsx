interface VehicleStatusCardProps {
  title: string;
  detail: string;
  status: 'normal' | 'warning' | 'critical';
}

export default function VehicleStatusCard({ title, detail, status }: VehicleStatusCardProps) {
  const statusClasses = {
    normal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  } as const;

  return (
    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <span className={`px-2 py-1 text-xs font-bold rounded border ${statusClasses[status]}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
