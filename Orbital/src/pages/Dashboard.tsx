import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Sidebar, { type Tab } from '../components/layout/Sidebar';
import AIAssistantPanel from '../components/assistant/AIAssistantPanel';
import SectionCard from '../components/cards/SectionCard';
import TaskList from '../components/tasks/TaskList';
import HabitList from '../components/habits/HabitList';
import GoalList from '../components/goals/GoalList';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session } = useAuth();

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      }
      header={
        <Header
          projectName="Orbital"
          systemTime={new Date().toLocaleTimeString()}
          onMenuClick={() => setSidebarOpen(true)}
        />
      }
      assistant={<AIAssistantPanel />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
            <p className="text-sm text-slate-400">Your personal dashboard.</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5"
          >
            Sign out
          </button>
        </div>

        {activeTab === 'tasks' && session && <TaskList userId={session.user.id} />}
        {activeTab === 'habits' && session && <HabitList userId={session.user.id} />}
        {activeTab === 'goals' && session && <GoalList userId={session.user.id} />}
        {activeTab === 'analytics' && session && <AnalyticsPanel userId={session.user.id} />}

        {activeTab === 'overview' && (
          <SectionCard
            title="Welcome to Orbital"
            description="Tasks, habits, goals, and analytics are all live."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
