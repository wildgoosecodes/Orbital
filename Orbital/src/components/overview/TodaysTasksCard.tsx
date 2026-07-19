import { Calendar, Milestone, Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types/database';
import type { Tab } from '../layout/Sidebar';
import { sortForOverview } from '../../lib/overviewStats';

interface TodaysTasksCardProps {
  tasks: Task[];
  loading: boolean;
  onToggleDone: (id: string, status: TaskStatus) => void;
  onNavigate: (tab: Tab) => void;
  goalTitleById?: Map<string, string>;
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  low: 'bg-slate-800 text-slate-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose-500/10 text-rose-400',
};

export default function TodaysTasksCard({ tasks, loading, onToggleDone, onNavigate, goalTitleById }: TodaysTasksCardProps) {
  const visible = sortForOverview(tasks).slice(0, 4);

  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Today's Tasks</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1"
          >
            View all
          </button>
          <button
            onClick={() => onNavigate('tasks')}
            aria-label="Add task"
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-slate-500">Loading tasks...</p>}
        {!loading && visible.length === 0 && <p className="text-sm text-slate-500">No tasks yet.</p>}

        {visible.map((task) => {
          const done = task.status === 'done';
          const goalTitle = task.goal_id ? goalTitleById?.get(task.goal_id) : undefined;
          return (
            <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-lg">
              <button
                onClick={() => onToggleDone(task.id, done ? 'todo' : 'done')}
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
                <p className={`text-sm font-medium ${done ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {task.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase ${PRIORITY_STYLES[task.priority]}`}>
                    {task.priority}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar size={11} />
                      {task.due_date}
                    </span>
                  )}
                </div>
                {goalTitle && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-indigo-400/80 truncate">
                    <Milestone size={11} className="flex-shrink-0" />
                    {goalTitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onNavigate('tasks')}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-300"
      >
        <Plus size={14} /> Add new task
      </button>
    </div>
  );
}
