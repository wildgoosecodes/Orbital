import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import Sparkline from '../charts/Sparkline';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  accentColor: string;
  sparklineData?: number[];
  badge?: ReactNode;
}

export default function StatCard({ icon: Icon, label, value, delta, accentColor, sparklineData, badge }: StatCardProps) {
  return (
    <div className="p-5 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm text-orbital-text-muted">{label}</span>
        {badge ?? (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-3 text-3xl font-bold text-orbital-text tracking-tight">{value}</div>

      {delta && <p className="mt-1 text-xs text-orbital-text-faint">{delta}</p>}

      {sparklineData && (
        <div className="mt-3">
          <Sparkline data={sparklineData} color={accentColor} />
        </div>
      )}
    </div>
  );
}
