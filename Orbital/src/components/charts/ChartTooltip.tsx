import type { TooltipContentProps } from 'recharts';

export default function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-white">{point.value}</p>
    </div>
  );
}
