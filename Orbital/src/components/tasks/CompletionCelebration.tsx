import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#38bdf8'];
const PARTICLE_COUNT = 24;

function Particle({ index }: { index: number }) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 70 + Math.random() * 110;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance - 30;
  const rotate = Math.random() * 360;

  return (
    <motion.span
      initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ x, y, opacity: 0, rotate, scale: 0.6 }}
      transition={{ duration: 1 + Math.random() * 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 8,
        height: 8,
        borderRadius: index % 3 === 0 ? '9999px' : '2px',
        background: COLORS[index % COLORS.length],
      }}
    />
  );
}

interface CompletionCelebrationProps {
  show: boolean;
  message?: string;
}

export default function CompletionCelebration({
  show,
  message = "All tasks done — nice work today! 🎉",
}: CompletionCelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <motion.div
            key="celebration"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-2 h-2">
              {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                <Particle key={i} index={i} />
              ))}
            </div>
            <div className="mt-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-sm font-medium px-4 py-2 rounded-full shadow-lg shadow-emerald-500/10 whitespace-nowrap">
              {message}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
