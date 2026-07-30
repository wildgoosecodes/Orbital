import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, Menu, Pencil, X } from 'lucide-react';
import OrbitalMark from '../brand/OrbitalMark';
import WhatsNewModal from '../changelog/WhatsNewModal';
import WhatsNewTrigger from '../changelog/WhatsNewTrigger';
import NotificationToggle from '../notifications/NotificationToggle';
import EditProfileModal from '../profile/EditProfileModal';
import { TABS, TAB_PATHS } from '../../lib/navTabs';
import type { Profile } from '../../types/database';

interface TopNavProps {
  userId: string;
  userEmail: string;
  profile: Profile | null;
  onUpdateProfile: (updates: { display_name: string; city: string | null }) => Promise<void>;
  onSignOut: () => void;
}

const pillClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
    isActive
      ? 'bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 text-cosmic-bg'
      : 'text-orbital-text-muted hover:text-orbital-text'
  }`;

const mobilePillClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 text-cosmic-bg'
      : 'text-orbital-text-muted hover:bg-cosmic-surface-3 hover:text-orbital-text'
  }`;

export default function TopNav({ userId, userEmail, profile, onUpdateProfile, onSignOut }: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const initials = userEmail.slice(0, 2).toUpperCase();
  const displayName = profile?.display_name && profile.display_name !== userEmail ? profile.display_name : null;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="border-b border-cosmic-border bg-cosmic-surface">
      <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <OrbitalMark size={24} />
          <span className="font-display font-bold tracking-wide text-orbital-text uppercase text-sm hidden sm:inline">
            Orbital
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-0.5 bg-cosmic-surface-2 border border-cosmic-border rounded-full p-1">
          {TABS.filter((t) => !t.xlHidden).map(({ tab, label }) => (
            <NavLink key={tab} to={TAB_PATHS[tab]} end={tab === 'overview'} className={pillClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <NotificationToggle userId={userId} />

          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              aria-label="Account menu"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-orbital-accent-1 to-orbital-accent-2 flex items-center justify-center text-xs font-bold text-cosmic-bg"
            >
              {initials}
            </button>

            {avatarOpen && (
              <div className="absolute right-0 top-11 z-50 w-56 bg-cosmic-surface-2 border border-cosmic-border rounded-xl shadow-2xl py-2">
                <div className="px-3.5 py-2 border-b border-cosmic-border-soft mb-1">
                  {displayName && <p className="text-sm font-semibold text-orbital-text truncate">{displayName}</p>}
                  <p className="text-xs text-orbital-text-faint truncate">{userEmail}</p>
                </div>

                <button
                  onClick={() => {
                    setEditOpen(true);
                    setAvatarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-orbital-text-muted hover:bg-cosmic-surface-3 hover:text-orbital-text"
                >
                  <Pencil size={15} strokeWidth={2} />
                  Edit profile
                </button>

                <WhatsNewTrigger
                  onOpen={() => {
                    setWhatsNewOpen(true);
                    setAvatarOpen(false);
                  }}
                />

                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-sm text-orbital-text-muted hover:bg-cosmic-surface-3 hover:text-orbital-accent-2"
                >
                  <LogOut size={15} strokeWidth={2} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden w-9 h-9 rounded-full bg-cosmic-surface-2 border border-cosmic-border flex items-center justify-center text-orbital-text-muted flex-shrink-0"
          >
            {mobileOpen ? <X size={17} strokeWidth={2} /> : <Menu size={17} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden px-4 pb-3 space-y-1">
          {TABS.map(({ tab, label }) => (
            <NavLink key={tab} to={TAB_PATHS[tab]} end={tab === 'overview'} onClick={() => setMobileOpen(false)} className={mobilePillClass}>
              {label}
            </NavLink>
          ))}
        </nav>
      )}

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} userEmail={userEmail} onSave={onUpdateProfile} />
      <WhatsNewModal open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
    </div>
  );
}
