// Drives the LoadingScreen's "moons merge into a planet, orbit, then
// disperse" animation. Positions are expressed in vmin so the whole
// scene scales cleanly on both phone and desktop viewports without a
// resize listener.

export type ParticleRole = 'core' | 'orbiter';

export interface Particle {
  id: number;
  color: string;
  size: number; // vmin
  role: ParticleRole;
  scatterAngle: number; // radians
  scatterRadius: number; // vmin
  orbitRadius: number; // vmin
}

export const CYCLE_SECONDS = 8;

// Timeline breakpoints, as a fraction of the full cycle.
export const T_CONVERGE_END = 0.22; // moons finish merging into the planet
export const T_HOLD_END = 0.62; // planet starts dispersing
export const T_DISPERSE_END = 0.82; // moons back at rest
// (1 = full cycle — same as t=0, so the loop is seamless)

const ORBIT_SAMPLES = 8; // points sampled around one full orbit revolution

const COLORS = ['#6366f1', '#863bff', '#3987e5', '#10b981', '#47bfff'];

export function buildParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.35;
    const isOrbiter = i % 3 === 0;
    particles.push({
      id: i,
      color: COLORS[i % COLORS.length],
      size: isOrbiter ? 2 + (i % 3) * 0.5 : 1.5 + (i % 4) * 0.4,
      role: isOrbiter ? 'orbiter' : 'core',
      scatterAngle: angle,
      scatterRadius: 18 + ((i * 7) % 17),
      orbitRadius: 8 + (i % 3) * 3,
    });
  }
  return particles;
}

interface Keyframes {
  x: string[];
  y: string[];
  opacity: number[];
  scale: number[];
  times: number[];
  ease: string[];
}

function vmin(n: number): string {
  return `${n.toFixed(2)}vmin`;
}

function pointOnCircle(radius: number, angle: number): { x: number; y: number } {
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export function buildKeyframes(p: Particle): Keyframes {
  const scatter = pointOnCircle(p.scatterRadius, p.scatterAngle);

  if (p.role === 'core') {
    return {
      x: [vmin(scatter.x), vmin(0), vmin(0), vmin(scatter.x), vmin(scatter.x)],
      y: [vmin(scatter.y), vmin(0), vmin(0), vmin(scatter.y), vmin(scatter.y)],
      scale: [1, 0.2, 0.2, 1, 1],
      opacity: [1, 0, 0, 1, 1],
      times: [0, T_CONVERGE_END, T_HOLD_END, T_DISPERSE_END, 1],
      ease: ['easeIn', 'linear', 'easeOut', 'linear'],
    };
  }

  const orbitEntry = pointOnCircle(p.orbitRadius, p.scatterAngle);
  const times = [0, T_CONVERGE_END];
  const x = [vmin(scatter.x), vmin(orbitEntry.x)];
  const y = [vmin(scatter.y), vmin(orbitEntry.y)];

  for (let k = 1; k <= ORBIT_SAMPLES; k++) {
    const t = T_CONVERGE_END + (T_HOLD_END - T_CONVERGE_END) * (k / ORBIT_SAMPLES);
    const point = pointOnCircle(p.orbitRadius, p.scatterAngle + Math.PI * 2 * (k / ORBIT_SAMPLES));
    times.push(t);
    x.push(vmin(point.x));
    y.push(vmin(point.y));
  }

  times.push(T_DISPERSE_END, 1);
  x.push(vmin(scatter.x), vmin(scatter.x));
  y.push(vmin(scatter.y), vmin(scatter.y));

  const ease = ['easeInOut', ...Array(ORBIT_SAMPLES).fill('linear'), 'easeInOut', 'linear'];

  return {
    x,
    y,
    opacity: times.map(() => 1),
    scale: times.map(() => 1),
    times,
    ease,
  };
}

export const PLANET_TIMES = [0, T_CONVERGE_END, T_HOLD_END, T_DISPERSE_END, 1];
export const PLANET_SCALE = [0, 1, 1, 0, 0];
export const PLANET_OPACITY = [0, 1, 1, 0, 0];
export const PLANET_EASE = ['easeOut', 'linear', 'easeIn', 'linear'];
