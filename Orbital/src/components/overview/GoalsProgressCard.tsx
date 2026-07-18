import { Rocket, Target, Trophy } from 'lucide-react';
import type { Goal } from '../../types/database';
import type { Tab } from '../layout/Sidebar';
import GoalProgressCard from '../cards/GoalProgressCard';

interface GoalsProgressCardProps {
  goals: Goal[];
  loading: boolean;
  onNavigate: (tab: Tab) => void;
}

const PERIOD_ICON: Record<Goal['period_type'], { icon: typeof Rocket; color: string }> = {
  weekly: { icon: Target, color: '#f59e0b' },
  quarterly: { icon: Rocket, color: '#6366f1' },
  yearly: { icon: Trophy, color: '#10b981' },
};

export default function GoalsProgressCard({ goals, loading, onNavigate }: GoalsProgressCardProps) {
  const active = goals.filter((g) => g.status === 'active').slice(0, 3);

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Goals Progress</h3>
        <button
          onClick={() => onNavigate('goals')}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1"
        >
          View all
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading goals...</p>}
        {!loading && active.length === 0 && <p className="text-sm text-slate-500">No active goals yet.</p>}

        {active.map((goal) => {
          const { icon: Icon, color } = PERIOD_ICON[goal.period_type];
          return (
            <div key={goal.id} className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${color}1a`, color }}
              >
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <GoalProgressCard title={goal.title} progress={goal.progress} target={`${goal.progress}% complete`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
