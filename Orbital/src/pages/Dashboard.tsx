import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Sidebar, { type Tab } from '../components/layout/Sidebar';
import AIAssistantPanel from '../components/assistant/AIAssistantPanel';
import TaskList from '../components/tasks/TaskList';
import HabitList from '../components/habits/HabitList';
import RoadmapView from '../components/roadmap/RoadmapView';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import OverviewPage from '../components/overview/OverviewPage';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session?.user.id ?? '');

  if (!session) return null;
  const userEmail = session.user.email ?? '';

  if (!profileLoading && profile && !profile.onboarding_completed_at) {
    return <Navigate to="/onboarding" replace />;
  }

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
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
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
              {activeTab === 'roadmap' && <RoadmapView userId={session.user.id} />}
              {activeTab === 'analytics' && <AnalyticsPanel userId={session.user.id} />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
