import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, Target, Trophy } from 'lucide-react';
import type { Goal } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import GoalProgressCard from '../cards/GoalProgressCard';
import { cardHover, hoverScale, listItem, listItemTransition, tapScale } from '../../lib/motion';

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
    <motion.div whileHover={cardHover} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-orbital-text">Goals Progress</h3>
        <motion.button
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={() => onNavigate('roadmap')}
          className="text-xs font-semibold text-orbital-text-muted hover:text-orbital-text border border-cosmic-border rounded-lg px-2.5 py-1"
        >
          View all
        </motion.button>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-orbital-text-faint">Loading goals...</p>}
        {!loading && active.length === 0 && <p className="text-sm text-orbital-text-faint">No active goals yet.</p>}

        <AnimatePresence initial={false}>
          {active.map((goal) => {
            const { icon: Icon, color } = PERIOD_ICON[goal.period_type];
            return (
              <motion.div
                key={goal.id}
                layout
                variants={listItem}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={listItemTransition}
                className="flex items-start gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}1a`, color }}
                >
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <GoalProgressCard title={goal.title} progress={goal.progress} target={`${goal.progress}% complete`} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
