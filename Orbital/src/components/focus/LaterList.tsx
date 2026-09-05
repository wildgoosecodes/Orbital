import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '../../types/database';
import type { NewTaskInput } from '../../hooks/useTasks';
import { tapScale } from '../../lib/motion';

interface LaterListProps {
  tasks: Task[];
  onAddTask: (input: NewTaskInput) => Promise<void>;
  onPinNow: (id: string) => Promise<void>;
}

export default function LaterList({ tasks, onAddTask, onPinNow }: LaterListProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAddTask({ title: title.trim() });
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wide">Later</p>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Capture something for later..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <motion.button
          whileTap={tapScale}
          type="submit"
          disabled={submitting || !title.trim()}
          className="bg-cosmic-surface-3 hover:bg-cosmic-border disabled:opacity-50 text-orbital-text-muted font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Capture
        </motion.button>
      </form>

      {tasks.length === 0 ? (
        <p className="text-xs text-orbital-text-faint">Nothing else waiting — you're caught up.</p>
      ) : (
        <div className="space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-2 py-1.5 px-1">
              <span className="text-sm text-orbital-text-muted truncate">{task.title}</span>
              <button
                onClick={() => onPinNow(task.id)}
                className="flex-shrink-0 text-[11px] text-orbital-text-faint hover:text-orbital-accent-2"
              >
                Focus on this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
