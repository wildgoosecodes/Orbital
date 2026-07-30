export interface Star {
  id: number;
  top: number; // %
  left: number; // %
  size: number; // px
  baseOpacity: number;
  twinkleDuration: number; // s
  twinkleDelay: number; // s
}

/** Deterministic-enough scatter (no true randomness needed — this only ever
 *  runs once per mount via useMemo, not something that needs to be stable
 *  across renders/reloads). */
export function buildStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 1 + Math.random() * 1.6,
      baseOpacity: 0.25 + Math.random() * 0.35,
      twinkleDuration: 2.5 + Math.random() * 4,
      twinkleDelay: Math.random() * 5,
    });
  }
  return stars;
}
