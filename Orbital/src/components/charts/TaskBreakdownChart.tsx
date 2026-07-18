import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { StatusCount } from '../../hooks/useAnalytics';
import ChartTooltip from './ChartTooltip';

// Task status is a funnel-stage progression (todo -> in_progress -> done), so
// per the dataviz method this is an ordinal ramp (one hue, monotone lightness)
// rather than three unrelated categorical hues. Validated against this app's
// dark surface (#020617): light-end contrast 2.49:1, all adjacent steps >=0.06 L.
const ORDINAL_RAMP = ['#6da7ec', '#2a78d6', '#184f95'];

interface TaskBreakdownChartProps {
  data: StatusCount[];
}

export default function TaskBreakdownChart({ data }: TaskBreakdownChartProps) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <h3 className="text-sm font-semibold text-slate-300">Task breakdown by status</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="0" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={ChartTooltip} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {data.map((entry) => (
                <Cell key={entry.status} fill={ORDINAL_RAMP[STATUS_INDEX[entry.status]]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const STATUS_INDEX: Record<StatusCount['status'], number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
};
