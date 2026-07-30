// Dark-mode categorical palette (dataviz skill reference palette, dark column) —
// validated against Orbital's cosmic-surface-2 (#14151f): all 8 slots pass
// lightness band, chroma floor, CVD separation, normal-vision floor, and
// contrast checks (node scripts/validate_palette.js, --mode dark --surface #14151f).
const CATEGORY_PALETTE = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#4caf50', // green (shifted from the skill's #008300 — too close to the app's emerald "done" semantic color at a glance)
  '#9085e9', // violet
  '#e66767', // red
];

/** Deterministic hash so the same category always lands on the same slot,
 *  regardless of insertion order or how many categories exist. */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable hex color for a category name — same input always yields the same slot. */
export function categoryColor(category: string): string {
  const index = hashString(category.trim().toLowerCase()) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}
