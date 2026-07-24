import { useState } from 'react';
import type { FormEvent } from 'react';
import type { NewTaskInput } from '../../hooks/useTasks';
import type { Task, TaskPriority } from '../../types/database';

interface TaskItemProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  onUpdate: (id: string, input: NewTaskInput) => Promise<void>;
  onDelete: (id: string) => void;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-slate-800 text-slate-400',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function TaskItem({ task, onToggleDone, onUpdate, onDelete }: TaskItemProps) {
  const done = task.status === 'done';
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? '');
  const [category, setCategory] = useState(task.category ?? '');
  const [saving, setSaving] = useState(false);

  function startEditing() {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setPriority(task.priority);
    setDueDate(task.due_date ?? '');
    setCategory(task.category ?? '');
    setEditing(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        category: category.trim() || undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSave}
        className="p-4 bg-slate-950 border border-indigo-500/50 rounded-xl space-y-3"
      >
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <button
        onClick={() => onToggleDone(task)}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
        className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center ${
          done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
        }`}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
            <path d="M1 5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <button onClick={startEditing} className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
        {task.due_date && <p className="text-xs text-slate-500 mt-0.5">Due {task.due_date}</p>}
      </button>

      <span className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}>
        {task.priority}
      </span>

      <button
        onClick={startEditing}
        aria-label="Edit task"
        className="text-slate-500 hover:text-indigo-400 p-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M11.5 2.5a1.5 1.5 0 0 1 2.12 2.12L5.5 12.75l-3 .75.75-3 8.25-8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="text-slate-500 hover:text-rose-400 p-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0-.5 9a1 1 0 01-1 1H4.5a1 1 0 01-1-1L3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
