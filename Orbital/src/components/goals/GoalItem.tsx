import { useEffect, useState } from 'react';
import GoalProgressCard from '../cards/GoalProgressCard';
import type { Goal } from '../../types/database';

interface GoalItemProps {
  goal: Goal;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}

export default function GoalItem({ goal, onUpdateProgress, onDelete }: GoalItemProps) {
  const target = `${goal.period_type} · ends ${goal.period_end}`;

  // Local value gives instant slider feedback; the server commit only fires
  // on release, since onChange fires many times per drag/keypress-hold and
  // those async requests can otherwise resolve out of order.
  const [value, setValue] = useState(goal.progress);
  useEffect(() => setValue(goal.progress), [goal.progress]);

  function commit() {
    if (value !== goal.progress) onUpdateProgress(goal.id, value);
  }

  return (
    <div className="relative">
      <GoalProgressCard title={goal.title} progress={goal.progress} target={target} />
      <div className="mt-2 flex items-center gap-3 px-4">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={commit}
          onTouchEnd={commit}
          onKeyUp={commit}
          className="flex-1 accent-indigo-500"
        />
        <button onClick={() => onDelete(goal.id)} aria-label="Delete goal" className="text-slate-500 hover:text-rose-400 p-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
