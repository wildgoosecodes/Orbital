import { BarChart3, CheckSquare, Map, Repeat2 } from 'lucide-react';
import type { Tab } from '../layout/Sidebar';

interface QuickActionsCardProps {
  onNavigate: (tab: Tab) => void;
}

const ACTIONS: { label: string; tab: Tab; icon: typeof CheckSquare; color: string }[] = [
  { label: 'Add New Task', tab: 'tasks', icon: CheckSquare, color: '#6366f1' },
  { label: 'Log a Habit', tab: 'habits', icon: Repeat2, color: '#10b981' },
  { label: 'View Roadmap', tab: 'roadmap', icon: Map, color: '#f59e0b' },
  { label: 'View Analytics', tab: 'analytics', icon: BarChart3, color: '#3987e5' },
];

export default function QuickActionsCard({ onNavigate }: QuickActionsCardProps) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <h3 className="text-sm font-semibold text-slate-300">Quick Actions</h3>
      <div className="mt-4 space-y-2">
        {ACTIONS.map(({ label, tab, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="w-full flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-slate-200">{label}</span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon size={14} strokeWidth={2} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
