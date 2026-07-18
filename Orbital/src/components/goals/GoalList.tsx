import { useGoals } from '../../hooks/useGoals';
import GoalForm from './GoalForm';
import GoalItem from './GoalItem';

interface GoalListProps {
  userId: string;
}

export default function GoalList({ userId }: GoalListProps) {
  const { goals, loading, error, addGoal, updateProgress, removeGoal } = useGoals(userId);

  return (
    <div className="space-y-4">
      <GoalForm onSubmit={addGoal} />

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading goals...</p>}

      {!loading && goals.length === 0 && (
        <p className="text-sm text-slate-500 p-4">No goals yet — add one above.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} onUpdateProgress={updateProgress} onDelete={removeGoal} />
        ))}
      </div>
    </div>
  );
}
