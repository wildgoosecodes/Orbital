import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { vehicleMetricsData } from '../../data/mockDashboardData';

interface HealthMetricPoint {
  name: string;
  value: number;
  color: string;
}

export default function VehicleHealthChart() {
  const chartData: HealthMetricPoint[] = [
    { name: 'Battery', value: vehicleMetricsData.batteryVoltage, color: '#34d399' },
    { name: 'Fuel', value: vehicleMetricsData.fuelEconomy, color: '#818cf8' },
    { name: 'Temp', value: vehicleMetricsData.engineTemperature, color: '#f59e0b' },
  ];

  return (
    <div className="h-64 w-full rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Vehicle Health</h3>
        <p className="text-sm text-slate-400">Battery, fuel economy, and engine status</p>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
