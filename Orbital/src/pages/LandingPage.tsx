import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, CheckSquare, Globe, Map, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import OrbitalMark from '../components/brand/OrbitalMark';
import LoadingScreen from '../components/loading/LoadingScreen';

const FEATURES = [
  {
    icon: CheckSquare,
    color: 'bg-orbital-accent-1/10 text-orbital-accent-2',
    title: 'Tasks & Habits',
    description: 'Track one-off to-dos and the daily habits that build toward something bigger.',
  },
  {
    icon: CalendarDays,
    color: 'bg-emerald-500/10 text-emerald-400',
    title: 'Calendar',
    description: 'See everything due today, right alongside the rest of your plans.',
  },
  {
    icon: Map,
    color: 'bg-orbital-violet/10 text-orbital-violet',
    title: 'Yearly Goal Tree',
    description: 'Break a year goal into quarters, milestones, and tasks — and watch the whole tree fill in as you go.',
  },
  {
    icon: Sparkles,
    color: 'bg-orbital-accent-1/10 text-orbital-accent-2',
    title: 'AI Assistant',
    description: 'Ask it to plan your quarter, add a task, or check your streaks — it only acts when you ask it to.',
  },
];

export default function LandingPage() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-cosmic-bg text-orbital-text">
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-5">
        <div className="flex items-center gap-2">
          <OrbitalMark size={26} />
          <span className="text-lg font-bold tracking-wider uppercase">Orbital</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-orbital-text-muted hover:text-orbital-text transition-colors">
            Log in
          </Link>
          <Link
            to="/signup"
            className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 text-orbital-text font-medium text-sm rounded-lg px-4 py-2 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none" aria-hidden="true">
          <div
            className="rounded-full"
            style={{
              width: '50rem',
              height: '50rem',
              marginTop: '-14rem',
              background: 'radial-gradient(circle at 50% 40%, #a78bfa 0%, #6366f1 35%, transparent 70%)',
              filter: 'blur(90px)',
              opacity: 0.28,
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative max-w-3xl mx-auto text-center px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28"
        >
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-orbital-text">
            Turn one big goal into a plan you'll actually follow.
          </h1>
          <p className="mt-5 text-lg text-orbital-text-muted max-w-xl mx-auto">
            Orbital breaks your year down into quarters, goals, tasks, and habits — with an AI assistant
            that helps you plan and otherwise stays out of your way.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="bg-orbital-accent-1 hover:bg-orbital-accent-1/90 text-orbital-text font-semibold text-sm rounded-lg px-6 py-3 transition-colors"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="border border-cosmic-border hover:border-white/20 text-orbital-text-muted font-medium text-sm rounded-lg px-6 py-3 transition-colors"
            >
              I have an account
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon: Icon, color, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: 'easeOut' }}
              className="p-5 bg-cosmic-surface-2/60 border border-cosmic-border rounded-xl"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-orbital-text">{title}</h3>
              <p className="mt-1 text-sm text-orbital-text-muted">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <h2 className="text-sm font-semibold text-orbital-text-faint uppercase tracking-wider">Join the community</h2>
        <p className="mt-2 text-sm text-orbital-text-faint">Discord and social channels are on the way.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Placeholder pills — swap for real <a href> links once Discord/social accounts exist. */}
          <span className="flex items-center gap-2 text-xs font-medium text-orbital-text-faint bg-cosmic-surface-2 border border-cosmic-border rounded-lg px-3 py-2 opacity-60 cursor-default">
            <MessageCircle size={14} />
            Discord · coming soon
          </span>
          <span className="flex items-center gap-2 text-xs font-medium text-orbital-text-faint bg-cosmic-surface-2 border border-cosmic-border rounded-lg px-3 py-2 opacity-60 cursor-default">
            <Globe size={14} />
            More · coming soon
          </span>
        </div>
      </section>

      <footer className="border-t border-cosmic-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-2">
          <OrbitalMark size={16} />
          <span className="text-xs text-orbital-text-faint">© {new Date().getFullYear()} Orbital</span>
        </div>
      </footer>
    </div>
  );
}
