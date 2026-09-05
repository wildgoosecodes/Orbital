import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Goal, Task } from '../../types/database';
import { useLastSession } from '../../hooks/useFocusSessions';
import { expandCollapse, expandCollapseTransition, tapScale } from '../../lib/motion';

const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90];

interface NowCardProps {
  userId: string;
  task: Task | null;
  goals: Goal[];
  onStartFocus: (task: Task, minutes: number) => void;
  onSetFocusFields: (id: string, fields: { next_action?: string; estimated_minutes?: number }) => Promise<void>;
}

export default function NowCard({ userId, task, goals, onStartFocus, onSetFocusFields }: NowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');
  const { lastSession } = useLastSession(userId, task?.id);

  const minutes = task?.estimated_minutes ?? 30;
  const goal = task?.goal_id ? goals.find((g) => g.id === task.goal_id) : undefined;
  const deadline = goal?.deadline ?? task?.due_date ?? null;

  async function handleSaveNextAction(e: FormEvent) {
    e.preventDefault();
    if (!task) return;
    await onSetFocusFields(task.id, { next_action: nextActionDraft.trim() });
    setEditingNextAction(false);
  }

  if (!task) {
    return (
      <div className="p-10 bg-cosmic-surface-2 border border-cosmic-border rounded-2xl text-center">
        <p className="text-sm text-orbital-text-faint">Nothing urgent — capture something below, or take a break.</p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-cosmic-surface-2 border border-cosmic-border rounded-2xl">
      <p className="text-xs font-semibold text-orbital-accent-2 uppercase tracking-wide">Now</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-orbital-text">{task.title}</h1>

      {editingNextAction ? (
        <form onSubmit={handleSaveNextAction} className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={nextActionDraft}
            onChange={(e) => setNextActionDraft(e.target.value)}
            placeholder="What's the next physical step?"
            className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
          />
          <motion.button whileTap={tapScale} type="submit" className="bg-orbital-accent-1 text-orbital-text text-sm font-medium rounded-lg px-3 py-2">
            Save
          </motion.button>
        </form>
      ) : task.next_action ? (
        <button
          onClick={() => {
            setNextActionDraft(task.next_action ?? '');
            setEditingNextAction(true);
          }}
          className="mt-2 text-base text-orbital-text-muted text-left hover:text-orbital-text"
        >
          {task.next_action}
        </button>
      ) : (
        <button
          onClick={() => {
            setNextActionDraft('');
            setEditingNextAction(true);
          }}
          className="mt-2 text-sm text-orbital-text-faint hover:text-orbital-text-muted"
        >
          + Add a next step
        </button>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        {DURATION_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => onSetFocusFields(task.id, { estimated_minutes: m })}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
              m === minutes
                ? 'bg-orbital-accent-1 border-orbital-accent-1 text-orbital-text'
                : 'bg-cosmic-surface-3 border-cosmic-border text-orbital-text-muted hover:text-orbital-text'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      <motion.button
        whileTap={tapScale}
        onClick={() => onStartFocus(task, minutes)}
        className="mt-6 w-full sm:w-auto bg-orbital-accent-1 hover:bg-orbital-accent-1/90 text-orbital-text font-semibold text-base rounded-xl px-8 py-3.5 transition-colors"
      >
        Start Focus
      </motion.button>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex items-center gap-1 text-xs text-orbital-text-faint hover:text-orbital-text-muted"
      >
        <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        Details
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            variants={expandCollapse}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={expandCollapseTransition}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-cosmic-border space-y-1 text-xs text-orbital-text-faint">
              {goal && <p>Project: {goal.title}</p>}
              {deadline && <p>Deadline: {deadline}</p>}
              {lastSession && <p>Previous focus: {lastSession.actual_minutes} minutes</p>}
              {!goal && !deadline && !lastSession && <p>No additional details yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
