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
        className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all"
      >
        <Sparkles size={18} strokeWidth={2} />
        What's new
        {hasUnseen && <span className="absolute left-6 top-2 w-2 h-2 rounded-full bg-indigo-500" />}
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
              className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-400" />
                  What's new
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-slate-500 hover:text-slate-200 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {CHANGELOG.map((entry) => (
                  <div key={entry.version}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2 py-0.5">
                        v{entry.version}
                      </span>
                      <span className="text-xs text-slate-500">{entry.date}</span>
                    </div>
                    <div className="space-y-3">
                      {entry.features.map((feature) => (
                        <div key={feature.title}>
                          <p className="text-sm font-semibold text-white">{feature.title}</p>
                          <p className="text-sm text-slate-400 mt-0.5">{feature.description}</p>
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
