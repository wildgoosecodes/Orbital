import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { taskCompletionData } from '../../data/mockDashboardData';

interface ChartSlice {
  name: string;
  value: number;
  color: string;
}

export default function TaskBreakdownChart() {
  const chartData: ChartSlice[] = [
    { name: 'Completed', value: taskCompletionData.completed, color: '#34d399' },
    { name: 'Active', value: taskCompletionData.total - taskCompletionData.completed, color: '#818cf8' },
    { name: 'Overdue', value: Math.max(0, taskCompletionData.total - taskCompletionData.completed - 3), color: '#f87171' },
  ];

  return (
    <div className="h-64 w-full rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Task Breakdown</h3>
        <p className="text-sm text-slate-400">Completed versus active work</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
