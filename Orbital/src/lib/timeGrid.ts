import type { TimeBlock } from '../types/database';

export const MINUTES_PER_DAY = 24 * 60;

/** Minutes elapsed since local midnight — used to position a block vertically on the timeline. */
export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Fraction (0..1) of the timeline's own height → minutes since midnight — used to translate a
 *  drag/drop pointer position into a time, independent of however tall the timeline actually
 *  renders (it's a fraction of the container, not a fixed px-per-minute constant). */
export function fractionToMinutes(fraction: number): number {
  return Math.round(fraction * MINUTES_PER_DAY);
}

/** Rounds to the nearest `step`-minute increment, clamped to a valid day. Default 30min matches
 *  the drag-and-drop snap grid. */
export function snapMinutes(minutes: number, step = 30): number {
  return Math.min(MINUTES_PER_DAY, Math.max(0, Math.round(minutes / step) * step));
}

/** Shared half-open interval overlap test — true when [aStart,aEnd) and [bStart,bEnd) intersect.
 *  Works on any consistent numeric time unit (ms epoch, minutes since midnight, etc). */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** First hour-long slot (between 6am and 10pm) that doesn't collide with any existing block
 *  on `dayKey` — used to default the start time when scheduling a task/habit from the drawer. */
export function nextFreeHourSlot(blocks: TimeBlock[], dayKey: string): string {
  for (let h = 6; h < 22; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    const slotStart = new Date(`${dayKey}T${label}`).getTime();
    const slotEnd = slotStart + 60 * 60_000;
    const collides = blocks.some((b) => {
      const bStart = new Date(b.start_at).getTime();
      const bEnd = new Date(b.end_at).getTime();
      return slotStart < bEnd && bStart < slotEnd;
    });
    if (!collides) return label;
  }
  return '09:00';
}

/** IDs of every block that overlaps at least one other block, via pairwise interval comparison.
 *  Fine at day-scale volumes (a handful to a few dozen blocks); not meant for bulk data. */
export function computeOverlappingIds(blocks: TimeBlock[]): Set<string> {
  const overlapping = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const aStart = new Date(a.start_at).getTime();
    const aEnd = new Date(a.end_at).getTime();
    for (let j = i + 1; j < blocks.length; j++) {
      const b = blocks[j];
      const bStart = new Date(b.start_at).getTime();
      const bEnd = new Date(b.end_at).getTime();
      if (rangesOverlap(aStart, aEnd, bStart, bEnd)) {
        overlapping.add(a.id);
        overlapping.add(b.id);
      }
    }
  }
  return overlapping;
}

export interface BlockColumn {
  col: number;
  cols: number;
}

/** Side-by-side column layout for a day's blocks, so overlapping blocks sit next to each other
 *  instead of fully occluding one another (each stacked absolutely at the same position/width
 *  would otherwise make everything but the topmost block invisible *and* unclickable). Standard
 *  greedy interval-coloring: each block takes the lowest-numbered column not in use by another
 *  block still active at its start time; every block in the same overlap cluster is stretched to
 *  share that cluster's column count, so a 2-wide cluster renders as two equal half-width blocks. */
export function layoutDayBlocks(blocks: TimeBlock[]): Map<string, BlockColumn> {
  const sorted = [...blocks].sort((a, b) => a.start_at.localeCompare(b.start_at) || a.id.localeCompare(b.id));
  const result = new Map<string, BlockColumn>();

  let active: { end: number; col: number }[] = [];
  let cluster: { id: string; col: number }[] = [];

  function flushCluster() {
    if (cluster.length === 0) return;
    const cols = Math.max(...cluster.map((c) => c.col)) + 1;
    for (const c of cluster) result.set(c.id, { col: c.col, cols });
    cluster = [];
  }

  for (const block of sorted) {
    const start = new Date(block.start_at).getTime();
    const end = new Date(block.end_at).getTime();

    active = active.filter((a) => a.end > start);
    if (active.length === 0) flushCluster();

    const usedCols = new Set(active.map((a) => a.col));
    let col = 0;
    while (usedCols.has(col)) col++;

    active.push({ end, col });
    cluster.push({ id: block.id, col });
  }
  flushCluster();

  return result;
}

export interface MinuteRange {
  id: string;
  startMin: number;
  endMin: number;
}

/** "Push later blocks down" conflict resolution: given every *other* block that day, sorted by
 *  start time ascending, shifts any block that starts before `pushFromMin` to start exactly
 *  there — preserving its own duration — then advances the push point to that block's new end.
 *  Stops at the first block that already starts at/after the current push point: since the
 *  input is sorted ascending and the push point only ever grows, every later block already
 *  clears it too, so nothing past that point needs to move. Returns only the blocks that
 *  actually shifted. */
export function cascadePush(sortedOtherBlocks: MinuteRange[], pushFromMin: number): MinuteRange[] {
  const shifted: MinuteRange[] = [];
  let cursor = pushFromMin;
  for (const block of sortedOtherBlocks) {
    if (block.startMin >= cursor) break;
    const duration = block.endMin - block.startMin;
    const newStart = cursor;
    const newEnd = newStart + duration;
    shifted.push({ id: block.id, startMin: newStart, endMin: newEnd });
    cursor = newEnd;
  }
  return shifted;
}
