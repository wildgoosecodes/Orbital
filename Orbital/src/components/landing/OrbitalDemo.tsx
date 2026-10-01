import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import OrbitalOrb, { type OrbState } from '../brand/OrbitalOrb';

interface Caption {
  speaker: 'You' | 'Orbital';
  text: string;
}

const USER_LINE: Caption = { speaker: 'You', text: 'I want to run a marathon this year without burning out.' };
const ORBITAL_LINE: Caption = {
  speaker: 'Orbital',
  text: "Let's build up gently — three easy runs a week, with race day in the spring. Want me to set that up?",
};

const SCRIPT: { state: OrbState; ms: number; caption?: Caption }[] = [
  { state: 'idle', ms: 1800 },
  { state: 'listening', ms: 3000, caption: USER_LINE },
  { state: 'thinking', ms: 1500, caption: USER_LINE },
  { state: 'speaking', ms: 5200, caption: ORBITAL_LINE },
];

/** A scripted, looping exchange that shows Orbital listening, thinking, and
 *  answering — the landing page's picture of what talking to it feels like. */
export default function OrbitalDemo() {
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [level, setLevel] = useState(0);

  const step = reduceMotion ? SCRIPT[0] : SCRIPT[stepIndex];
  const voiced = step.state === 'listening' || step.state === 'speaking';

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => setStepIndex((i) => (i + 1) % SCRIPT.length), SCRIPT[stepIndex].ms);
    return () => clearTimeout(timer);
  }, [stepIndex, reduceMotion]);

  // A few overlapping sines read as speech cadence closely enough for a demo.
  useEffect(() => {
    if (!voiced) return;
    const started = performance.now();
    const timer = setInterval(() => {
      const t = (performance.now() - started) / 1000;
      const cadence = 0.45 + 0.3 * Math.sin(t * 9.3) + 0.2 * Math.sin(t * 3.1 + 1.2);
      setLevel(Math.max(0, Math.min(1, cadence * 0.75)));
    }, 70);
    return () => clearInterval(timer);
  }, [voiced]);

  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <OrbitalOrb state={step.state} level={voiced ? level : 0} size={176} className="w-36 h-36 sm:w-44 sm:h-44" />
      <div className="mt-5 h-16 w-full max-w-md flex items-start justify-center">
        <AnimatePresence mode="wait">
          {step.caption && (
            <motion.p
              key={step.caption.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-sm sm:text-base leading-relaxed text-orbital-text-muted"
            >
              <span
                className={`mr-2 text-xs font-semibold uppercase tracking-wider ${
                  step.caption.speaker === 'Orbital' ? 'text-orbital-accent-2' : 'text-orbital-text-faint'
                }`}
              >
                {step.caption.speaker}
              </span>
              {step.caption.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
