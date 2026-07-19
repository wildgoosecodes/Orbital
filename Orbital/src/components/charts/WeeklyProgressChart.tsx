import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { weeklyProductivityData } from '../../data/mockDashboardData';

export default function WeeklyProgressChart() {
  return (
    <div className="h-64 w-full rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Weekly Productivity</h3>
        <p className="text-sm text-slate-400">Productivity trend across the week</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={weeklyProductivityData}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
