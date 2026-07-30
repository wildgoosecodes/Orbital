import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { CHANGELOG } from '../../data/changelog';

const SEEN_KEY = 'orbital.whatsnew.lastSeenVersion';
const latestVersion = CHANGELOG[0]?.version ?? '';

interface WhatsNewModalProps {
  onOpen?: () => void;
}

export default function WhatsNewModal({ onOpen }: WhatsNewModalProps) {
  const [open, setOpen] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(SEEN_KEY);
    setHasUnseen(lastSeen !== latestVersion);
  }, []);

  function handleOpen() {
    setOpen(true);
    setHasUnseen(false);
    localStorage.setItem(SEEN_KEY, latestVersion);
    onOpen?.();
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm text-orbital-text-muted hover:bg-cosmic-surface-3 hover:text-orbital-text transition-all"
      >
        <Sparkles size={18} strokeWidth={2} />
        What's new
        {hasUnseen && <span className="absolute left-6 top-2 w-2 h-2 rounded-full bg-orbital-accent-1" />}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
          <motion.div
            key="whatsnew-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="whatsnew-panel"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-cosmic-surface-2 border border-cosmic-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-orbital-text flex items-center gap-2">
                  <Sparkles size={18} className="text-orbital-accent-2" />
                  What's new
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-orbital-text-faint hover:text-orbital-text p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {CHANGELOG.map((entry) => (
                  <div key={entry.version}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-orbital-accent-2 bg-orbital-accent-1/10 border border-orbital-accent-1/20 rounded px-2 py-0.5">
                        v{entry.version}
                      </span>
                      <span className="text-xs text-orbital-text-faint">{entry.date}</span>
                    </div>
                    <div className="space-y-3">
                      {entry.features.map((feature) => (
                        <div key={feature.title}>
                          <p className="text-sm font-semibold text-orbital-text">{feature.title}</p>
                          <p className="text-sm text-orbital-text-muted mt-0.5">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
