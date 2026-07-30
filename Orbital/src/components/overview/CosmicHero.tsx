import { Mic, Plus } from 'lucide-react';
import { greetingForHour } from '../../lib/overviewStats';
import QuoteCard from './QuoteCard';

interface CosmicHeroProps {
  name: string;
  weeklyProgress: number;
  streak: number;
  todayTasks: number;
  todayHabits: number;
  todayGoals: number;
  onOpenVoiceMode: () => void;
  onAddTask: () => void;
  onNewGoal: () => void;
}

export default function CosmicHero({
  name,
  weeklyProgress,
  streak,
  todayTasks,
  todayHabits,
  todayGoals,
  onOpenVoiceMode,
  onAddTask,
  onNewGoal,
}: CosmicHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl px-6 py-9 flex flex-col items-center gap-5 text-center bg-[#0a0a14]">
      {/* layered gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(34rem 20rem at 22% -20%, rgba(99,102,241,0.4), transparent 60%),' +
            'radial-gradient(28rem 18rem at 82% 0%, rgba(34,211,238,0.22), transparent 55%),' +
            'radial-gradient(40rem 24rem at 50% 130%, rgba(167,139,250,0.2), transparent 60%)',
        }}
      />
      {/* starfield */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(1.4px 1.4px at 10% 25%, rgba(255,255,255,0.5), transparent)',
            'radial-gradient(1.4px 1.4px at 24% 70%, rgba(255,255,255,0.35), transparent)',
            'radial-gradient(1px 1px at 38% 14%, rgba(255,255,255,0.45), transparent)',
            'radial-gradient(1.4px 1.4px at 55% 45%, rgba(255,255,255,0.3), transparent)',
            'radial-gradient(1px 1px at 70% 75%, rgba(255,255,255,0.45), transparent)',
            'radial-gradient(1.4px 1.4px at 86% 22%, rgba(255,255,255,0.35), transparent)',
            'radial-gradient(1px 1px at 93% 62%, rgba(255,255,255,0.4), transparent)',
            'radial-gradient(1.4px 1.4px at 6% 85%, rgba(255,255,255,0.28), transparent)',
            'radial-gradient(1px 1px at 62% 90%, rgba(255,255,255,0.3), transparent)',
          ].join(','),
        }}
      />
      {/* orbit ring */}
      <div
        className="absolute -top-36 -right-28 w-96 h-96 rounded-full pointer-events-none"
        style={{ border: '1px solid rgba(255,255,255,0.09)', transform: 'rotate(-16deg)' }}
      >
        <span
          className="absolute top-1/2 -left-[3px] w-[7px] h-[7px] rounded-full bg-orbital-accent-2"
          style={{ boxShadow: '0 0 14px 2px rgba(34,211,238,0.75)' }}
        />
      </div>

      <p className="relative text-sm font-semibold text-orbital-text-muted">
        {greetingForHour()}, {name} 👋
      </p>

      <div className="relative w-full max-w-lg">
        <QuoteCard />
      </div>

      <button
        onClick={onOpenVoiceMode}
        className="relative flex items-center gap-3 rounded-full px-6 py-3.5 w-full max-w-lg bg-black/35 border border-white/10 backdrop-blur-md hover:border-white/20 transition-colors"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orbital-text-faint flex-shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span className="font-display font-semibold text-lg text-orbital-text">Just ask me anything</span>
        <span className="ml-auto w-8 h-8 rounded-full bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 flex items-center justify-center text-cosmic-bg flex-shrink-0">
          <Mic size={14} strokeWidth={2.5} />
        </span>
      </button>

      <div className="relative flex flex-wrap justify-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-orbital-text-muted bg-black/35 border border-white/10 backdrop-blur-md">
          <i className="w-1.5 h-1.5 rounded-sm bg-orbital-accent-1" />
          Weekly progress <b className="font-mono tabular-nums text-orbital-text font-semibold">{weeklyProgress}%</b>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-orbital-text-muted bg-black/35 border border-white/10 backdrop-blur-md">
          <i className="w-1.5 h-1.5 rounded-sm bg-amber-400" />
          Streak <b className="font-mono tabular-nums text-orbital-text font-semibold">{streak} day{streak === 1 ? '' : 's'}</b>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-orbital-text-muted bg-black/35 border border-white/10 backdrop-blur-md">
          <i className="w-1.5 h-1.5 rounded-sm bg-orbital-accent-2" />
          Today{' '}
          <b className="font-mono tabular-nums text-orbital-text font-semibold">
            {todayTasks} tasks · {todayHabits} habits · {todayGoals} goals
          </b>
        </span>
      </div>

      <div className="relative flex gap-2.5">
        <button
          onClick={onAddTask}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 text-cosmic-bg"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add task
        </button>
        <button
          onClick={onNewGoal}
          className="rounded-full px-4 py-2 text-sm font-semibold bg-white/5 border border-white/10 text-orbital-text backdrop-blur-md"
        >
          New goal
        </button>
      </div>
    </div>
  );
}
