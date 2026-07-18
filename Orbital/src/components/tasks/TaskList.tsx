import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../types/database';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

interface TaskListProps {
  userId: string;
}

export default function TaskList({ userId }: TaskListProps) {
  const { tasks, loading, error, addTask, setStatus, removeTask } = useTasks(userId);

  function handleToggleDone(task: Task) {
    setStatus(task.id, task.status === 'done' ? 'todo' : 'done');
  }

  return (
    <div className="space-y-4">
      <TaskForm onSubmit={addTask} />

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading tasks...</p>}

      {!loading && tasks.length === 0 && (
        <p className="text-sm text-slate-500 p-4">No tasks yet — add one above.</p>
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggleDone={handleToggleDone} onDelete={removeTask} />
        ))}
      </div>
    </div>
  );
}
