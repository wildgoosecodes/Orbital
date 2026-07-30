import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mic, Plus } from 'lucide-react';
import { greetingForHour } from '../../lib/overviewStats';
import { fadeInUp, fadeInUpTransition, hoverScale, staggerContainer, tapScale } from '../../lib/motion';
import { buildStars } from './starfield';
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
  const stars = useMemo(() => buildStars(26), []);

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
      {/* starfield — twinkling stars on a very slow drifting layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: [0, 8, -6, 0], y: [0, -6, 4, 0] }}
        transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
      >
        {stars.map((star) => (
          <motion.span
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{ top: `${star.top}%`, left: `${star.left}%`, width: star.size, height: star.size }}
            animate={{ opacity: [star.baseOpacity * 0.4, star.baseOpacity, star.baseOpacity * 0.4] }}
            transition={{
              duration: star.twinkleDuration,
              delay: star.twinkleDelay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
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

      <motion.div
        className="relative flex flex-col items-center gap-5 w-full"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={fadeInUp}
          transition={fadeInUpTransition}
          className="text-sm font-semibold text-orbital-text-muted"
        >
          {greetingForHour()}, {name} 👋
        </motion.p>

        <motion.div variants={fadeInUp} transition={fadeInUpTransition} className="w-full max-w-lg self-center">
          <QuoteCard />
        </motion.div>

        <motion.button
          variants={fadeInUp}
          transition={fadeInUpTransition}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onOpenVoiceMode}
          className="flex items-center gap-3 rounded-full px-6 py-3.5 w-full max-w-lg bg-black/35 border border-white/10 backdrop-blur-md hover:border-white/20 transition-colors self-center"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orbital-text-faint flex-shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="font-display font-semibold text-lg text-orbital-text">Just ask me anything</span>
          <span className="ml-auto w-8 h-8 rounded-full bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 flex items-center justify-center text-cosmic-bg flex-shrink-0">
            <Mic size={14} strokeWidth={2.5} />
          </span>
        </motion.button>

        <motion.div variants={fadeInUp} transition={fadeInUpTransition} className="flex flex-wrap justify-center gap-2.5">
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
        </motion.div>

        <motion.div variants={fadeInUp} transition={fadeInUpTransition} className="flex gap-2.5">
          <motion.button
            whileHover={hoverScale}
            whileTap={tapScale}
            onClick={onAddTask}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-br from-orbital-accent-2 to-orbital-accent-1 text-cosmic-bg"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add task
          </motion.button>
          <motion.button
            whileHover={hoverScale}
            whileTap={tapScale}
            onClick={onNewGoal}
            className="rounded-full px-4 py-2 text-sm font-semibold bg-white/5 border border-white/10 text-orbital-text backdrop-blur-md"
          >
            New goal
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
