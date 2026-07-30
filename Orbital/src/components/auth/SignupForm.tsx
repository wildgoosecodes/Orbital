import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import OrbitalMark from '../brand/OrbitalMark';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      navigate('/onboarding');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-center justify-center bg-cosmic-bg text-orbital-text px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-orbital-text-muted">Check your email to confirm your account, then sign in.</p>
          <Link to="/login" className="mt-4 inline-block text-orbital-accent-2 hover:text-orbital-accent-2/80 text-sm">
            Back to sign in
          </Link>
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
          <div>
            <label className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-orbital-text-faint uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-cosmic-surface-3 border border-cosmic-border rounded-lg px-3 py-2 text-sm text-orbital-text focus:outline-none focus:border-orbital-accent-1"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orbital-accent-1 hover:bg-orbital-accent-1/90 disabled:opacity-50 text-orbital-text font-medium text-sm rounded-lg py-2.5 transition-colors"
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-orbital-text-faint">
          Already have an account?{' '}
          <Link to="/login" className="text-orbital-accent-2 hover:text-orbital-accent-2/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
