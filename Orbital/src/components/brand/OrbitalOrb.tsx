import { useEffect, useId } from 'react';
import type { MotionValue } from 'framer-motion';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Same geometry as OrbitalMark (viewBox 0–100), doubled for a 0–200 viewBox.
const CENTER = 100;
const CORE_R = 34;
const RING_RX = 80;
const RING_RY = 36;
const TILT = (-18 * Math.PI) / 180;

const MOONS = [
  { color: '#47bfff', r: 10, phase: 2.7 },
  { color: '#863bff', r: 8.4, phase: 5.2 },
  { color: '#10b981', r: 7.2, phase: 0.6 },
];

/** Orbit speed in radians/second — attentive and slow while listening, a swirl while thinking. */
const SPEED: Record<OrbState, number> = { idle: 0.35, listening: 0.15, thinking: 1.8, speaking: 0.55 };
/** Moons draw in toward the core while listening. */
const RADIUS_SCALE: Record<OrbState, number> = { idle: 1, listening: 0.86, thinking: 1.04, speaking: 1 };
/** How strongly the voice level swells the core. */
const LEVEL_GAIN: Record<OrbState, number> = { idle: 0, listening: 0.28, thinking: 0, speaking: 0.22 };
const GLOW_COLOR: Record<OrbState, string> = {
  idle: '#6366f1',
  listening: '#22d3ee',
  thinking: '#a78bfa',
  speaking: '#34d399',
};
const GLOW_OPACITY: Record<OrbState, number> = { idle: 0.35, listening: 0.6, thinking: 0.5, speaking: 0.6 };

function ringPoint(theta: number, scale: number) {
  const x = RING_RX * scale * Math.cos(theta);
  const y = RING_RY * scale * Math.sin(theta);
  return {
    x: CENTER + x * Math.cos(TILT) - y * Math.sin(TILT),
    y: CENTER + x * Math.sin(TILT) + y * Math.cos(TILT),
  };
}

interface OrbitMoonProps {
  angle: MotionValue<number>;
  radiusScale: MotionValue<number>;
  phase: number;
  r: number;
  color: string;
  /** Each moon renders twice — once behind the core, once in front — and only
   *  the copy on the correct side is visible, so it passes behind the core. */
  layer: 'back' | 'front';
}

function OrbitMoon({ angle, radiusScale, phase, r, color, layer }: OrbitMoonProps) {
  const cx = useTransform([angle, radiusScale], ([a, s]: number[]) => ringPoint(a + phase, s).x);
  const cy = useTransform([angle, radiusScale], ([a, s]: number[]) => ringPoint(a + phase, s).y);
  // The far half of the orbit is where sin(θ) < 0 (it projects higher on screen).
  const opacity = useTransform(angle, (a) => {
    const behind = Math.sin(a + phase) < 0;
    return (layer === 'back') === behind ? 1 : 0;
  });
  return <motion.circle cx={cx} cy={cy} r={r} fill={color} style={{ opacity }} />;
}

interface OrbitalOrbProps {
  state?: OrbState;
  /** Normalized voice level, 0–1. */
  level?: number;
  size?: number;
  className?: string;
}

/** Orbital as a living presence — the brand mark, animated: it breathes when
 *  idle, leans in to listen, swirls while thinking, and pulses with its own voice. */
export default function OrbitalOrb({ state = 'idle', level = 0, size = 160, className }: OrbitalOrbProps) {
  const id = useId();
  const coreGradient = `${id}-core`;
  const glowGradient = `${id}-glow`;
  const reduceMotion = useReducedMotion();

  const angle = useMotionValue(0);
  const breath = useMotionValue(1);
  const speed = useSpring(SPEED[state], { stiffness: 40, damping: 20 });
  const radiusScale = useSpring(RADIUS_SCALE[state], { stiffness: 80, damping: 18 });
  const gain = useSpring(reduceMotion ? 0 : LEVEL_GAIN[state], { stiffness: 120, damping: 20 });
  const levelTarget = useMotionValue(0);
  const smoothLevel = useSpring(levelTarget, { stiffness: 260, damping: 26 });

  useEffect(() => {
    speed.set(SPEED[state]);
    radiusScale.set(RADIUS_SCALE[state]);
    gain.set(reduceMotion ? 0 : LEVEL_GAIN[state]);
  }, [state, reduceMotion, speed, radiusScale, gain]);

  useEffect(() => {
    levelTarget.set(Math.max(0, Math.min(1, level)));
  }, [level, levelTarget]);

  useAnimationFrame((time, delta) => {
    if (reduceMotion) return;
    angle.set(angle.get() + speed.get() * (delta / 1000));
    breath.set(1 + 0.025 * Math.sin((time / 1000) * ((2 * Math.PI) / 4.5)));
  });

  const coreScale = useTransform([breath, smoothLevel, gain], ([b, l, g]: number[]) => b * (1 + l * g));
  const glowScale = useTransform([breath, smoothLevel, gain], ([b, l, g]: number[]) => 1 + (b - 1) * 2 + l * g * 1.5);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      overflow="visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={coreGradient} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </radialGradient>
        <radialGradient id={glowGradient}>
          <stop offset="0%" style={{ stopColor: GLOW_COLOR[state], stopOpacity: 0.9, transition: 'stop-color 0.6s ease' }} />
          <stop offset="100%" style={{ stopColor: GLOW_COLOR[state], stopOpacity: 0, transition: 'stop-color 0.6s ease' }} />
        </radialGradient>
      </defs>

      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r={88}
        fill={`url(#${glowGradient})`}
        style={{ scale: glowScale }}
        initial={false}
        animate={{ opacity: GLOW_OPACITY[state] }}
        transition={{ duration: 0.6 }}
      />

      <ellipse
        cx={CENTER}
        cy={CENTER}
        rx={RING_RX}
        ry={RING_RY}
        transform={`rotate(-18 ${CENTER} ${CENTER})`}
        fill="none"
        stroke="#818cf8"
        strokeOpacity={0.35}
        strokeWidth={1.5}
      />

      {MOONS.map((moon) => (
        <OrbitMoon key={`back-${moon.color}`} angle={angle} radiusScale={radiusScale} layer="back" {...moon} />
      ))}

      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r={CORE_R + 14}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={1.5}
        strokeDasharray="5 9"
        strokeLinecap="round"
        // Must start from 0 explicitly — with initial={false} Motion mounts it
        // already at 360 and the infinite spin never starts.
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: state === 'thinking' ? 0.6 : 0, rotate: reduceMotion ? 0 : 360 }}
        transition={{
          opacity: { duration: 0.4 },
          rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
        }}
      />

      <motion.g style={{ scale: coreScale }}>
        <circle cx={CENTER} cy={CENTER} r={CORE_R} fill={`url(#${coreGradient})`} />
        <ellipse cx={CENTER - 11} cy={CENTER - 13} rx={11} ry={7} fill="#ffffff" opacity={0.16} transform={`rotate(-30 ${CENTER - 11} ${CENTER - 13})`} />
      </motion.g>

      {MOONS.map((moon) => (
        <OrbitMoon key={`front-${moon.color}`} angle={angle} radiusScale={radiusScale} layer="front" {...moon} />
      ))}
    </svg>
  );
}
