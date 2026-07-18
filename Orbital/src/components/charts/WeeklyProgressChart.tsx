import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayCompletion } from '../../hooks/useAnalytics';
import ChartTooltip from './ChartTooltip';

// Single-series chart: one hue, no legend needed — the card title names it.
// Uses Orbital's actual brand accent (indigo-500) rather than a generic
// reference hue, since the rest of the app's UI already establishes indigo
// as this app's identity color.
const SERIES_COLOR = '#6366f1';

interface WeeklyProgressChartProps {
  data: DayCompletion[];
}

export default function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <h3 className="text-sm font-semibold text-slate-300">Tasks completed — last 7 days</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="0" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: '#334155', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="completed"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              fill={SERIES_COLOR}
              fillOpacity={0.1}
              dot={{ r: 4, fill: SERIES_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: SERIES_COLOR, stroke: '#020617', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
