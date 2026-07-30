import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, CalendarDays, CheckSquare, LayoutDashboard, LogOut, Map, Pencil, Repeat2, Sparkles } from 'lucide-react';
import OrbitalMark from '../brand/OrbitalMark';
import WhatsNewModal from '../changelog/WhatsNewModal';
import NotificationToggle from '../notifications/NotificationToggle';
import EditProfileModal from '../profile/EditProfileModal';
import type { Profile } from '../../types/database';

export type Tab = 'overview' | 'tasks' | 'calendar' | 'habits' | 'roadmap' | 'analytics' | 'assistant';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  profile: Profile | null;
  onUpdateProfile: (updates: { display_name: string; city: string | null }) => Promise<void>;
  onSignOut: () => void;
}

export const TABS: { tab: Tab; label: string; icon: typeof LayoutDashboard; xlHidden?: boolean }[] = [
  { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
  { tab: 'tasks', label: 'Tasks', icon: CheckSquare },
  { tab: 'calendar', label: 'Calendar', icon: CalendarDays },
  { tab: 'habits', label: 'Habits', icon: Repeat2 },
  { tab: 'roadmap', label: 'Yearly Goal Tree', icon: Map },
  { tab: 'analytics', label: 'Analytics', icon: BarChart3 },
  // The assistant already lives in the persistent side panel on xl+ screens.
  { tab: 'assistant', label: 'Assistant', icon: Sparkles, xlHidden: true },
];

export const TAB_PATHS: Record<Tab, string> = {
  overview: '/app',
  tasks: '/app/tasks',
  calendar: '/app/calendar',
  habits: '/app/habits',
  roadmap: '/app/roadmap',
  analytics: '/app/analytics',
  assistant: '/app/assistant',
};

export default function Sidebar({ open, onClose, userId, userEmail, profile, onUpdateProfile, onSignOut }: SidebarProps) {
  const nav = (
    <>
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <OrbitalMark size={26} />
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">Orbital</h1>
      </div>

      <nav className="p-4 space-y-1">
        {TABS.map(({ tab, label, icon: Icon, xlHidden }) => (
          <NavLink
            key={tab}
            to={TAB_PATHS[tab]}
            end={tab === 'overview'}
            onClick={onClose}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                xlHidden ? 'xl:hidden' : ''
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
        <WhatsNewModal onOpen={onClose} />
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile-only backdrop, shown while the drawer is open */}
      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={onClose} />}

      {/* Single sidebar: a fixed, slide-in drawer below md, a static in-flow rail at md+.
          Rendered once (not duplicated per breakpoint) so nav/WhatsNewModal/NotificationToggle
          don't double-mount and double-run their effects (localStorage reads, push-subscription
          checks) on every dashboard load. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 md:relative md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>{nav}</div>
        <ProfileCard
          userId={userId}
          userEmail={userEmail}
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onSignOut={onSignOut}
        />
      </aside>
    </>
  );
}

function ProfileCard({
  userId,
  userEmail,
  profile,
  onUpdateProfile,
  onSignOut,
}: {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  onUpdateProfile: (updates: { display_name: string; city: string | null }) => Promise<void>;
  onSignOut: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const initials = userEmail.slice(0, 2).toUpperCase();
  const displayName = profile?.display_name && profile.display_name !== userEmail ? profile.display_name : null;

  return (
    <div className="p-4 border-t border-slate-800 flex items-center gap-2">
      <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        {displayName && <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>}
        <p className="text-xs text-slate-400 truncate">{userEmail}</p>
      </div>
      <button
        onClick={() => setEditOpen(true)}
        aria-label="Edit profile"
        className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-900 flex-shrink-0"
      >
        <Pencil size={15} strokeWidth={2} />
      </button>
      <NotificationToggle userId={userId} />
      <button
        onClick={onSignOut}
        aria-label="Sign out"
        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 flex-shrink-0"
      >
        <LogOut size={16} strokeWidth={2} />
      </button>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={profile}
        userEmail={userEmail}
        onSave={onUpdateProfile}
      />
    </div>
  );
}
