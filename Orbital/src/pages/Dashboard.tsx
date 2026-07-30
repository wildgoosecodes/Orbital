import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import Sidebar, { TABS, type Tab, TAB_PATHS } from '../components/layout/Sidebar';
import AIAssistantPanel from '../components/assistant/AIAssistantPanel';
import VoiceMode from '../components/assistant/VoiceMode';
import TaskList from '../components/tasks/TaskList';
import CalendarView from '../components/calendar/CalendarView';
import HabitList from '../components/habits/HabitList';
import RoadmapView from '../components/roadmap/RoadmapView';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import OverviewPage from '../components/overview/OverviewPage';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useAssistantChat } from '../hooks/useAssistantChat';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const { session } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile(session?.user.id ?? '');
  const location = useLocation();
  const navigate = useNavigate();
  // One shared conversation — the desktop-sidebar and mobile-tab assistant panels
  // are both mounted simultaneously (CSS-hidden depending on viewport), so they'd
  // silently diverge into two different conversations if each managed its own state.
  const assistantChat = useAssistantChat();

  if (!session) return null;
  const userId = session.user.id;
  const userEmail = session.user.email ?? '';

  if (!profileLoading && profile && !profile.onboarding_completed_at) {
    return <Navigate to="/onboarding" replace />;
  }

  function handleNavigate(tab: Tab) {
    navigate(TAB_PATHS[tab]);
  }

  const currentTabId = (location.pathname.replace(/^\/app\/?/, '').split('/')[0] || 'overview') as Tab;
  const showTabHeader = currentTabId !== 'overview' && currentTabId !== 'assistant';
  const currentTabLabel = TABS.find((t) => t.tab === currentTabId)?.label ?? currentTabId;

  return (
    <DashboardLayout
      sidebar={
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userId={userId}
          userEmail={userEmail}
          profile={profile}
          onUpdateProfile={updateProfile}
          onSignOut={() => supabase.auth.signOut()}
        />
      }
      header={<Header onMenuClick={() => setSidebarOpen(true)} />}
      assistant={<AIAssistantPanel {...assistantChat} onOpenVoiceMode={() => setVoiceModeOpen(true)} />}
    >
      <VoiceMode
        open={voiceModeOpen}
        onClose={() => setVoiceModeOpen(false)}
        messages={assistantChat.messages}
        sendMessage={assistantChat.sendMessage}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {showTabHeader ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentTabLabel}</h2>
                <p className="text-sm text-slate-400">Your personal dashboard.</p>
              </div>

              <Routes>
                <Route path="tasks" element={<TaskList userId={userId} />} />
                <Route path="calendar" element={<CalendarView userId={userId} />} />
                <Route path="habits" element={<HabitList userId={userId} />} />
                <Route path="roadmap" element={<RoadmapView userId={userId} />} />
                <Route path="analytics" element={<AnalyticsPanel userId={userId} />} />
              </Routes>
            </div>
          ) : (
            <Routes>
              <Route
                index
                element={<OverviewPage userId={userId} userEmail={userEmail} profile={profile} onNavigate={handleNavigate} />}
              />
              <Route
                path="assistant"
                element={
                  <div className="h-[calc(100dvh-8rem)] xl:hidden bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                    <AIAssistantPanel {...assistantChat} onOpenVoiceMode={() => setVoiceModeOpen(true)} />
                  </div>
                }
              />
            </Routes>
          )}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
