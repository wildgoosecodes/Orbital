import type { Task } from '../../types/database';

interface TaskItemProps {
  task: Task;
  onToggleDone: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-slate-800 text-slate-400',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
};

export default function TaskItem({ task, onToggleDone, onDelete }: TaskItemProps) {
  const done = task.status === 'done';

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

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
        {task.due_date && <p className="text-xs text-slate-500 mt-0.5">Due {task.due_date}</p>}
      </div>

      <span className={`text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}>
        {task.priority}
      </span>

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
