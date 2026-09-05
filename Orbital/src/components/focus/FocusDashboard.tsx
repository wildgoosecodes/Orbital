import { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useHabits } from '../../hooks/useHabits';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useFocusSessions } from '../../hooks/useFocusSessions';
import { pickNow, pickNext } from '../../lib/nowSelection';
import { displayNameFromEmail } from '../../lib/overviewStats';
import type { Task } from '../../types/database';
import type { Tab } from '../../lib/navTabs';
import type { Profile } from '../../types/database';
import NowCard from './NowCard';
import FocusMode from './FocusMode';
import LaterList from './LaterList';
import FocusHeader from './FocusHeader';
import AnalyticsSection from './AnalyticsSection';

interface FocusDashboardProps {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  onNavigate: (tab: Tab) => void;
  onOpenVoiceMode: () => void;
}

interface ActiveFocusSession {
  task: Task;
  plannedMinutes: number;
  startedAt: string;
}

export default function FocusDashboard({ userId, userEmail, profile, onNavigate, onOpenVoiceMode }: FocusDashboardProps) {
  const { tasks, loading, addTask, setStatus, setFocusFields, pinNow } = useTasks(userId);
  const { goals } = useGoals(userId);
  const { habits, loading: habitsLoading } = useHabits(userId);
  const { last7Days, loading: analyticsLoading } = useAnalytics(userId);
  const { logSession } = useFocusSessions(userId);
  const [session, setSession] = useState<ActiveFocusSession | null>(null);

  const name =
    profile?.display_name && profile.display_name !== userEmail ? profile.display_name : displayNameFromEmail(userEmail);

  const nowTask = pickNow(tasks);
  const nextTask = pickNext(tasks, nowTask);
  const laterTasks = tasks.filter(
    (t) => t.status !== 'done' && t.id !== nowTask?.id && t.id !== nextTask?.id,
  );

  function handleStartFocus(task: Task, minutes: number) {
    setSession({ task, plannedMinutes: minutes, startedAt: new Date().toISOString() });
  }

  async function handleComplete(activeMs: number) {
    if (!session) return;
    await Promise.all([
      setStatus(session.task.id, 'done'),
      logSession({
        task_id: session.task.id,
        planned_minutes: session.plannedMinutes,
        started_at: session.startedAt,
        active_ms: activeMs,
        status: 'completed',
      }),
    ]);
    setSession(null);
  }

  async function handleExit(activeMs: number) {
    if (!session) return;
    await logSession({
      task_id: session.task.id,
      planned_minutes: session.plannedMinutes,
      started_at: session.startedAt,
      active_ms: activeMs,
      status: 'abandoned',
    });
    setSession(null);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <FocusHeader name={name} onOpenVoiceMode={onOpenVoiceMode} />

      {loading ? (
        <p className="text-sm text-orbital-text-faint text-center">Loading...</p>
      ) : (
        <>
          <NowCard userId={userId} task={nowTask} goals={goals} onStartFocus={handleStartFocus} onSetFocusFields={setFocusFields} />

          {nextTask && (
            <p className="text-center text-xs text-orbital-text-faint">
              Next: <span className="text-orbital-text-muted">{nextTask.title}</span>
            </p>
          )}

          <LaterList tasks={laterTasks} onAddTask={addTask} onPinNow={pinNow} />

          <button
            onClick={() => onNavigate('tasks')}
            className="block mx-auto text-xs text-orbital-text-faint hover:text-orbital-text-muted"
          >
            View all tasks →
          </button>

          <AnalyticsSection
            tasks={tasks}
            habits={habits}
            last7Days={last7Days}
            tasksLoading={loading}
            habitsLoading={habitsLoading}
            analyticsLoading={analyticsLoading}
          />
        </>
      )}

      <FocusMode
        task={session?.task ?? null}
        plannedMinutes={session?.plannedMinutes ?? 30}
        startedAt={session?.startedAt ?? null}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </div>
  );
}
