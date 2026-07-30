import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CHANGELOG } from '../../data/changelog';

const SEEN_KEY = 'orbital.whatsnew.lastSeenVersion';
const latestVersion = CHANGELOG[0]?.version ?? '';

interface WhatsNewTriggerProps {
  onOpen: () => void;
}

export default function WhatsNewTrigger({ onOpen }: WhatsNewTriggerProps) {
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(SEEN_KEY);
    setHasUnseen(lastSeen !== latestVersion);
  }, []);

  function handleClick() {
    setHasUnseen(false);
    localStorage.setItem(SEEN_KEY, latestVersion);
    onOpen();
  }

  return (
    <button
      onClick={handleClick}
      className="relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm text-orbital-text-muted hover:bg-cosmic-surface-3 hover:text-orbital-text transition-all"
    >
      <Sparkles size={18} strokeWidth={2} />
      What's new
      {hasUnseen && <span className="absolute left-6 top-2 w-2 h-2 rounded-full bg-orbital-accent-1" />}
    </button>
  );
}
