import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Sidebar, { type Tab } from '../components/layout/Sidebar';
import AIAssistantPanel from '../components/assistant/AIAssistantPanel';
import TaskList from '../components/tasks/TaskList';
import HabitList from '../components/habits/HabitList';
import GoalList from '../components/goals/GoalList';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import OverviewPage from '../components/overview/OverviewPage';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session } = useAuth();

  if (!session) return null;
  const userEmail = session.user.email ?? '';

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userEmail={userEmail}
          onSignOut={() => supabase.auth.signOut()}
        />
      }
      header={<Header onMenuClick={() => setSidebarOpen(true)} />}
      assistant={<AIAssistantPanel />}
    >
      {activeTab === 'overview' && (
        <OverviewPage userId={session.user.id} userEmail={userEmail} onNavigate={setActiveTab} />
      )}

      {activeTab === 'assistant' && (
        <div className="h-[calc(100dvh-8rem)] xl:hidden bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <AIAssistantPanel />
        </div>
      )}

      {activeTab !== 'overview' && activeTab !== 'assistant' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
            <p className="text-sm text-slate-400">Your personal dashboard.</p>
          </div>

          {activeTab === 'tasks' && <TaskList userId={session.user.id} />}
          {activeTab === 'habits' && <HabitList userId={session.user.id} />}
          {activeTab === 'goals' && <GoalList userId={session.user.id} />}
          {activeTab === 'analytics' && <AnalyticsPanel userId={session.user.id} />}
        </div>
      )}
    </DashboardLayout>
  );
}
