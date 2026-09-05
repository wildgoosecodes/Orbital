import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { tapScale } from '../lib/motion';

const HOUR_MS = 60 * 60 * 1000;

export default function UpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // The browser doesn't proactively re-check an installed service worker
      // on its own while a tab stays open — without this, a new version only
      // ever gets noticed on a fresh page load.
      if (!registration) return;
      setInterval(() => registration.update(), HOUR_MS);
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        // Positioning/centering lives on this plain outer div — Framer Motion
        // writes its own inline `transform` on whatever element it animates,
        // which would otherwise clobber the `-translate-x-1/2` centering class
        // if both lived on the same element (bitten this codebase before).
        // Below Focus Mode's z-50 overlay on purpose — an update prompt
        // shouldn't interrupt an active focus session, it just waits.
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cosmic-surface-2 border border-cosmic-border shadow-lg"
          >
            <RefreshCw size={16} className="text-orbital-accent-2 flex-shrink-0" />
            <p className="text-sm text-orbital-text-muted whitespace-nowrap">A new version of Orbital is available</p>
            <motion.button
              whileTap={tapScale}
              onClick={() => updateServiceWorker(true)}
              className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 text-orbital-text font-medium text-sm rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
            >
              Update
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
