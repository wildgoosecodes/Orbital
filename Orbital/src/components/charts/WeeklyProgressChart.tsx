import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayCompletion } from '../../hooks/useAnalytics';
import ChartTooltip from './ChartTooltip';

// Single-series chart: documented palette slot-1 blue (dark step), per the
// dataviz method — one series needs no legend, the card title names it.
const SERIES_COLOR = '#3987e5';

interface WeeklyProgressChartProps {
  data: DayCompletion[];
}

export default function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <h3 className="text-sm font-semibold text-slate-300">Tasks completed — last 7 days</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="0" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={ChartTooltip} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
            <Bar dataKey="completed" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
