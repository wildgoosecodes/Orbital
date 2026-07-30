import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { User, X } from 'lucide-react';
import type { Profile } from '../../types/database';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  userEmail: string;
  onSave: (updates: { display_name: string; city: string | null }) => Promise<void>;
}

export default function EditProfileModal({ open, onClose, profile, userEmail, onSave }: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const currentName = profile?.display_name && profile.display_name !== userEmail ? profile.display_name : '';
      setDisplayName(currentName);
      setCity(profile?.city ?? '');
      setError(null);
    }
  }, [open, profile, userEmail]);

  async function handleSave() {
    if (!displayName.trim()) {
      setError('Enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ display_name: displayName.trim(), city: city.trim() || null });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving your profile.');
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="edit-profile-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="edit-profile-panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-cosmic-surface-2 border border-cosmic-border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-orbital-text flex items-center gap-2">
                <User size={18} className="text-orbital-accent-2" />
                Edit profile
              </h2>
              <button onClick={onClose} aria-label="Close" className="text-orbital-text-faint hover:text-orbital-text p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-profile-name" className="block text-xs font-semibold text-orbital-text-muted mb-1.5">
                  Name
                </label>
                <input
                  id="edit-profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1"
                />
              </div>

              <div>
                <label htmlFor="edit-profile-city" className="block text-xs font-semibold text-orbital-text-muted mb-1.5">
                  City
                </label>
                <input
                  id="edit-profile-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="For weather, if location access is off"
                  className="w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text placeholder:text-orbital-text-faint focus:outline-none focus:border-orbital-accent-1"
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="text-sm font-semibold text-orbital-text-muted hover:text-orbital-text px-3 py-2 rounded-lg hover:bg-cosmic-surface-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-semibold text-orbital-text bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 px-4 py-2 rounded-lg"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
