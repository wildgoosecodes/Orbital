import type { GoalPeriodType } from '../types/database';

const PERIOD_DAYS: Record<GoalPeriodType, number> = {
  weekly: 7,
  quarterly: 90,
  yearly: 365,
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computePeriodRange(type: GoalPeriodType): { start: string; end: string } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + PERIOD_DAYS[type]);
  return { start: toDateStr(start), end: toDateStr(end) };
}
