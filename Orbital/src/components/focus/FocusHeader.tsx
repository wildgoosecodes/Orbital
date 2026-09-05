import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { fadeInUp, fadeInUpTransition, hoverScale, staggerContainer, tapScale } from '../../lib/motion';
import QuoteCard from '../overview/QuoteCard';

interface FocusHeaderProps {
  name: string;
  onOpenVoiceMode: () => void;
}

export default function FocusHeader({ name, onOpenVoiceMode }: FocusHeaderProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 text-center"
    >
      <motion.p variants={fadeInUp} transition={fadeInUpTransition} className="text-lg font-semibold text-orbital-text">
        Welcome {name}, what shall we work on today?
      </motion.p>

      <motion.div variants={fadeInUp} transition={fadeInUpTransition} className="w-full">
        <QuoteCard containerClassName="bg-cosmic-surface-2 border border-cosmic-border" />
      </motion.div>

      <motion.button
        variants={fadeInUp}
        transition={fadeInUpTransition}
        whileHover={hoverScale}
        whileTap={tapScale}
        onClick={onOpenVoiceMode}
        className="flex items-center gap-3 rounded-full px-6 py-3.5 w-full bg-cosmic-surface-2 border border-cosmic-border hover:border-orbital-accent-1/40 transition-colors"
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
    </motion.div>
  );
}
