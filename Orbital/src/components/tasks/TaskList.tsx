import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import type { Task, TaskPriority } from '../../types/database';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import CompletionCelebration from './CompletionCelebration';

interface TaskListProps {
  userId: string;
}

type LinkFilter = 'all' | 'linked' | 'standalone';
type PriorityFilter = 'all' | TaskPriority;
type StatusFilter = 'all' | 'open' | 'done';

const selectClass =
  'bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-2.5 py-1.5 text-xs text-orbital-text focus:outline-none focus:border-orbital-accent-1';

export default function TaskList({ userId }: TaskListProps) {
  const { tasks, loading, error, addTask, setStatus, updateTask, removeTask } = useTasks(userId);
  const { goals } = useGoals(userId);
  const [celebrate, setCelebrate] = useState(false);
  const prevOpenCountRef = useRef<number | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const categories = useMemo(
    () => [...new Set(tasks.map((t) => t.category).filter((c): c is string => !!c))].sort(),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (linkFilter === 'linked' && !t.goal_id) return false;
      if (linkFilter === 'standalone' && t.goal_id) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter === 'open' && t.status === 'done') return false;
      if (statusFilter === 'done' && t.status !== 'done') return false;
      return true;
    });
  }, [tasks, categoryFilter, linkFilter, priorityFilter, statusFilter]);

  const filtersActive = categoryFilter || linkFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all';

  useEffect(() => {
    if (loading) return;
    const openCount = tasks.filter((t) => t.status !== 'done').length;
    const prevOpenCount = prevOpenCountRef.current;
    prevOpenCountRef.current = openCount;
    if (prevOpenCount !== null && prevOpenCount > 0 && openCount === 0 && tasks.length > 0) {
      setCelebrate(true);
    }
  }, [tasks, loading]);

  useEffect(() => {
    if (!celebrate) return;
    const timeout = setTimeout(() => setCelebrate(false), 2600);
    return () => clearTimeout(timeout);
  }, [celebrate]);

  function handleToggleDone(task: Task) {
    setStatus(task.id, task.status === 'done' ? 'todo' : 'done');
  }

  return (
    <div className="space-y-4">
      <CompletionCelebration show={celebrate} />
      <TaskForm onSubmit={addTask} goals={goals} categories={categories} />

      {tasks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap p-3 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={linkFilter} onChange={(e) => setLinkFilter(e.target.value as LinkFilter)} className={selectClass}>
            <option value="all">All tasks</option>
            <option value="linked">Linked to a goal</option>
            <option value="standalone">Standalone</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)} className={selectClass}>
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className={selectClass}>
            <option value="all">Open + Done</option>
            <option value="open">Open only</option>
            <option value="done">Done only</option>
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setCategoryFilter('');
                setLinkFilter('all');
                setPriorityFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs font-semibold text-orbital-text-faint hover:text-orbital-text-muted ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-orbital-text-faint">Loading tasks...</p>}

      {!loading && tasks.length === 0 && (
        <p className="text-sm text-orbital-text-faint p-4">No tasks yet — add one above.</p>
      )}
      {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
        <p className="text-sm text-orbital-text-faint p-4">No tasks match these filters.</p>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleDone={handleToggleDone}
              onUpdate={updateTask}
              onDelete={removeTask}
              goals={goals}
              categories={categories}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
