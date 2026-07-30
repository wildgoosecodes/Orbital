import { useState } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { NewTaskInput } from '../../hooks/useTasks';
import type { Goal, TaskPriority } from '../../types/database';
import { tapScale } from '../../lib/motion';
import { categoryColor } from '../../lib/categoryColor';

interface TaskFormProps {
  onSubmit: (input: NewTaskInput) => Promise<void>;
  goals: Goal[];
  categories: string[];
}

export default function TaskForm({ onSubmit, goals, categories }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [goalId, setGoalId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        priority,
        due_date: dueDate || undefined,
        category: category.trim() || undefined,
        goal_id: goalId || null,
      });
      setTitle('');
      setPriority('medium');
      setDueDate('');
      setCategory('');
      setGoalId('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-cosmic-surface-2 border border-cosmic-border rounded-xl space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        />
        <motion.button
          whileTap={tapScale}
          type="submit"
          disabled={submitting || !title.trim()}
          className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          Add task
        </motion.button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          {category.trim() && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
              style={{ backgroundColor: categoryColor(category) }}
            />
          )}
          <input
            type="text"
            list="task-form-category-options"
            placeholder="Category (e.g. Work, Personal) — optional, helps filtering"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg py-2 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1 ${category.trim() ? 'pl-7 pr-3' : 'px-3'}`}
          />
        </div>
        <datalist id="task-form-category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <select
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
          className="sm:w-56 bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
        >
          <option value="">No goal</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
