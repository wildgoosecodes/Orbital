import { useHabits } from '../../hooks/useHabits';
import HabitForm from './HabitForm';
import HabitItem from './HabitItem';

interface HabitListProps {
  userId: string;
}

export default function HabitList({ userId }: HabitListProps) {
  const { habits, loading, error, addHabit, toggleToday, removeHabit } = useHabits(userId);

  return (
    <div className="space-y-4">
      <HabitForm onSubmit={addHabit} />

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading habits...</p>}

      {!loading && habits.length === 0 && (
        <p className="text-sm text-slate-500 p-4">No habits yet — add one above.</p>
      )}

      <div className="space-y-2">
        {habits.map((habit) => (
          <HabitItem key={habit.id} habit={habit} onToggleToday={toggleToday} onDelete={removeHabit} />
        ))}
      </div>
    </div>
  );
}
