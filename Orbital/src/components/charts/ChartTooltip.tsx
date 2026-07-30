import type { TooltipContentProps } from 'recharts';

export default function ChartTooltip({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];

  return (
    <div className="bg-cosmic-surface-2 border border-cosmic-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-orbital-text-faint">{label}</p>
      <p className="text-sm font-semibold text-orbital-text">{point.value}</p>
    </div>
  );
}
