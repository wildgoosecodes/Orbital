import type { TimeBlock } from '../types/database';

/** Minutes elapsed since local midnight — used to position a block vertically on the timeline. */
export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
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
      if (aStart < bEnd && bStart < aEnd) {
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
