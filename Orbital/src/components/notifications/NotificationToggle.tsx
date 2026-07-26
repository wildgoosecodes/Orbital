import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { isPushSubscribed, pushSupported, subscribeToPush, unsubscribeFromPush } from '../../lib/pushNotifications';

interface NotificationToggleProps {
  userId: string;
}

export default function NotificationToggle({ userId }: NotificationToggleProps) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(pushSupported());
    isPushSubscribed().then(setSubscribed);
  }, []);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush(userId);
        setSubscribed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={subscribed ? 'Disable notifications' : 'Enable notifications'}
        aria-pressed={subscribed}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          subscribed ? 'text-indigo-400 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900'
        }`}
      >
        {subscribed ? <Bell size={16} strokeWidth={2} /> : <BellOff size={16} strokeWidth={2} />}
      </button>
      {error && (
        <p className="absolute bottom-full right-0 mb-1 w-44 text-[11px] text-rose-400 bg-slate-950 border border-rose-900/50 rounded-lg p-2 text-left">
          {error}
        </p>
      )}
    </div>
  );
}
