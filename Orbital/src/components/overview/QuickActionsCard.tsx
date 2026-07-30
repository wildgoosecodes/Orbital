import { motion } from 'framer-motion';
import { CalendarDays, CheckSquare, Map, Repeat2 } from 'lucide-react';
import type { Tab } from '../../lib/navTabs';
import { cardHover, tapScale } from '../../lib/motion';

interface QuickActionsCardProps {
  onNavigate: (tab: Tab) => void;
}

const ACTIONS: { label: string; tab: Tab; icon: typeof CheckSquare; color: string }[] = [
  { label: 'Add New Task', tab: 'tasks', icon: CheckSquare, color: '#6366f1' },
  { label: 'Log a Habit', tab: 'habits', icon: Repeat2, color: '#10b981' },
  { label: 'View Roadmap', tab: 'roadmap', icon: Map, color: '#f59e0b' },
  { label: 'View Calendar', tab: 'calendar', icon: CalendarDays, color: '#3987e5' },
];

export default function QuickActionsCard({ onNavigate }: QuickActionsCardProps) {
  return (
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <h3 className="text-sm font-semibold text-orbital-text">Quick Actions</h3>
      <div className="mt-4 space-y-2">
        {ACTIONS.map(({ label, tab, icon: Icon, color }) => (
          <motion.button
            key={label}
            whileTap={tapScale}
            onClick={() => onNavigate(tab)}
            className="w-full flex items-center justify-between p-3 bg-cosmic-surface-3/60 hover:bg-cosmic-surface-3 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium text-orbital-text">{label}</span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon size={14} strokeWidth={2} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
