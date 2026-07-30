import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types/database';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import CompletionCelebration from './CompletionCelebration';

interface TaskListProps {
  userId: string;
}

export default function TaskList({ userId }: TaskListProps) {
  const { tasks, loading, error, addTask, setStatus, updateTask, removeTask } = useTasks(userId);
  const [celebrate, setCelebrate] = useState(false);
  const prevOpenCountRef = useRef<number | null>(null);

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
      <TaskForm onSubmit={addTask} />

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-orbital-text-faint">Loading tasks...</p>}

      {!loading && tasks.length === 0 && (
        <p className="text-sm text-orbital-text-faint p-4">No tasks yet — add one above.</p>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggleDone={handleToggleDone} onUpdate={updateTask} onDelete={removeTask} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
