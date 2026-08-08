import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { tapScale } from '../../lib/motion';

interface ConflictPickerProps {
  /** e.g. "School · 3:00 PM – 5:00 PM" */
  candidateLabel: string;
  collidingTitles: string[];
  onOverlap: () => void;
  onPush: () => void;
  onCancel: () => void;
}

export default function ConflictPicker({ candidateLabel, collidingTitles, onOverlap, onPush, onCancel }: ConflictPickerProps) {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orbital-text">{candidateLabel} collides with the timeline</p>
          <p className="text-xs text-orbital-text-muted mt-0.5">
            Overlaps {collidingTitles.map((t) => `"${t}"`).join(', ')}. How should this be resolved?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        <motion.button
          whileTap={tapScale}
          type="button"
          onClick={onCancel}
          className="text-sm text-orbital-text-muted hover:text-orbital-text px-3 py-2"
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={tapScale}
          type="button"
          onClick={onOverlap}
          className="text-xs font-semibold text-orbital-text bg-cosmic-surface-3 hover:bg-cosmic-surface-3/70 border border-cosmic-border rounded-lg px-3 py-2"
        >
          Overlap anyway
        </motion.button>
        <motion.button
          whileTap={tapScale}
          type="button"
          onClick={onPush}
          className="text-xs font-semibold text-orbital-text bg-orbital-accent-1 hover:bg-orbital-accent-1/90 rounded-lg px-3 py-2"
        >
          Push later blocks down
        </motion.button>
      </div>
    </div>
  );
}
