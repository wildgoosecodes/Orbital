import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import OrbitalMark from '../brand/OrbitalMark';

export default function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((current) => {
        if (!current) setInvalidLink(true);
        return current;
      });
    }, 3000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/app'), 1500);
  }

  if (invalidLink) {
    return (
      <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center justify-center bg-cosmic-bg text-orbital-text px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-orbital-text-muted">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-orbital-accent-2 hover:text-orbital-accent-2/80 text-sm">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center justify-center bg-cosmic-bg text-orbital-text px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-orbital-text-muted">Password updated — taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center justify-center bg-cosmic-bg text-orbital-text px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3 justify-center">
          <OrbitalMark size={28} />
          <h1 className="text-2xl font-bold tracking-wider uppercase">Orbital</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-cosmic-surface-2 border border-cosmic-border rounded-xl p-6 space-y-4">
          <p className="text-sm text-orbital-text-muted">Choose a new password.</p>
          <div>
            <label className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wider">New password</label>
            <input
              type="password"
              required
              minLength={6}
              disabled={!ready}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wider">Confirm password</label>
            <input
              type="password"
              required
              minLength={6}
              disabled={!ready}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1 disabled:opacity-50"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={!ready || submitting}
            className="w-full bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg py-2.5 transition-colors"
          >
            {!ready ? 'Verifying link...' : submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
