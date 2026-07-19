import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  buildParticles,
  buildKeyframes,
  CYCLE_SECONDS,
  PLANET_TIMES,
  PLANET_SCALE,
  PLANET_OPACITY,
  PLANET_EASE,
} from './particleMotion';
import OrbitalMark from '../brand/OrbitalMark';

export default function LoadingScreen() {
  const particles = useMemo(() => buildParticles(18), []);

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex flex-col items-center justify-center gap-8 bg-slate-900 overflow-hidden">
      <div className="relative w-full h-full flex-1 max-h-[70vmin] flex items-center justify-center">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '11vmin',
            height: '11vmin',
            background: 'radial-gradient(circle at 35% 35%, #a78bfa 0%, #6366f1 45%, #4338ca 100%)',
            boxShadow: '0 0 48px 10px rgba(99,102,241,0.4)',
          }}
          animate={{ scale: PLANET_SCALE, opacity: PLANET_OPACITY }}
          transition={{ duration: CYCLE_SECONDS, times: PLANET_TIMES, ease: PLANET_EASE, repeat: Infinity }}
        />

        {particles.map((p) => {
          const kf = buildKeyframes(p);
          return (
            <motion.div
              key={p.id}
              className="absolute top-1/2 left-1/2 rounded-full"
              style={{
                width: `${p.size}vmin`,
                height: `${p.size}vmin`,
                marginLeft: `-${p.size / 2}vmin`,
                marginTop: `-${p.size / 2}vmin`,
                backgroundColor: p.color,
                boxShadow: `0 0 10px 2px ${p.color}66`,
              }}
              animate={{ x: kf.x, y: kf.y, opacity: kf.opacity, scale: kf.scale }}
              transition={{ duration: CYCLE_SECONDS, times: kf.times, ease: kf.ease, repeat: Infinity }}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <OrbitalMark size={20} />
        <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase">Orbital</span>
      </div>
    </div>
  );
}
