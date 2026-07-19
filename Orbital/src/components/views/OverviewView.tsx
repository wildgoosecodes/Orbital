import StatCard from '../cards/StatCard';
import VehicleStatusCard from '../cards/VehicleStatusCard';
import AIAssistantPanel from '../assistant/AIAssistantPanel';
import VehicleHealthChart from '../charts/VehicleHealthChart';
import { goalProgressData, vehicleStatusData } from '../../data/mockDashboardData';
import GoalProgressCard from '../cards/GoalProgressCard';

interface DiagnosticMetric {
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

interface OverviewViewProps {
  metrics: Record<string, DiagnosticMetric>;
}

export default function OverviewView({ metrics }: OverviewViewProps) {
  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden">
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h2 className="text-lg font-semibold text-white">Vehicle Overview</h2>
        <p className="mt-1 text-sm text-slate-400">Current system status and diagnostics</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.values(metrics).map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            status={metric.status}
          />
        ))}
      </div>

      <div className="space-y-3">
        {vehicleStatusData.map((item) => (
          <VehicleStatusCard key={item.title} title={item.title} detail={item.detail} status={item.status} />
        ))}
      </div>

      <div className="space-y-3">
        {goalProgressData.map((goal) => (
          <GoalProgressCard key={goal.title} title={goal.title} progress={goal.progress} target={goal.target} />
        ))}
      </div>

      <VehicleHealthChart />
      <AIAssistantPanel />
    </div>
  );
}
