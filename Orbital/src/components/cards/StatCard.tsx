import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import Sparkline from '../charts/Sparkline';
import { useCountUp } from '../../hooks/useCountUp';
import { cardHover, fadeInUp, fadeInUpTransition } from '../../lib/motion';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  accentColor: string;
  sparklineData?: number[];
  badge?: ReactNode;
  /** Subtle looping breathe animation on the icon badge — for "this is live and building" stats like an active streak. */
  pulse?: boolean;
}

const NUMERIC_PREFIX = /^(-?\d+(?:\.\d+)?)(.*)$/;

export default function StatCard({ icon: Icon, label, value, delta, accentColor, sparklineData, badge, pulse }: StatCardProps) {
  const match = value.match(NUMERIC_PREFIX);
  const numericTarget = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const displayNum = useCountUp(numericTarget ?? 0);
  const displayValue = numericTarget !== null ? `${Math.round(displayNum)}${suffix}` : value;

  return (
    <motion.div
      variants={fadeInUp}
      transition={fadeInUpTransition}
      whileHover={cardHover}
      className="p-5 bg-cosmic-surface-2 border border-cosmic-border rounded-xl"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-orbital-text-muted">{label}</span>
        {badge ?? (
          <motion.div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
            animate={pulse ? { scale: [1, 1.08, 1], opacity: [1, 0.85, 1] } : undefined}
            transition={pulse ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
          >
            <Icon size={18} strokeWidth={2} />
          </motion.div>
        )}
      </div>

      <div className="mt-3 text-3xl font-bold text-orbital-text tracking-tight">{displayValue}</div>

      {delta && <p className="mt-1 text-xs text-orbital-text-faint">{delta}</p>}

      {sparklineData && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color={accentColor} />
        </div>
      )}
    </motion.div>
  );
}
