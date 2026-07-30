import { motion } from 'framer-motion';

interface GoalProgressCardProps {
  title: string;
  progress: number;
  target: string;
}

export default function GoalProgressCard({ title, progress, target }: GoalProgressCardProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="p-4 bg-cosmic-surface-2/80 border border-cosmic-border rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="text-orbital-text-muted">{title}</span>
        <span className="text-orbital-accent-2 font-semibold">{safeProgress}%</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-cosmic-surface-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-orbital-accent-1"
          initial={{ width: 0 }}
          animate={{ width: `${safeProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-2 text-xs text-orbital-text-faint">Target: {target}</p>
    </div>
  );
}
