import { CalendarDays, CheckSquare, LayoutDashboard, Map, Repeat2, Sparkles, Target } from 'lucide-react';

export type Tab = 'overview' | 'tasks' | 'calendar' | 'habits' | 'goals' | 'roadmap' | 'assistant';

export const TABS: { tab: Tab; label: string; icon: typeof LayoutDashboard; xlHidden?: boolean }[] = [
  { tab: 'overview', label: 'Now', icon: LayoutDashboard },
  { tab: 'tasks', label: 'Tasks', icon: CheckSquare },
  { tab: 'calendar', label: 'Calendar', icon: CalendarDays },
  { tab: 'habits', label: 'Habits', icon: Repeat2 },
  { tab: 'goals', label: 'Goals', icon: Target },
  { tab: 'roadmap', label: 'Yearly Goal Tree', icon: Map },
  // The assistant already lives in the persistent side panel on xl+ screens.
  { tab: 'assistant', label: 'Assistant', icon: Sparkles, xlHidden: true },
];

export const TAB_PATHS: Record<Tab, string> = {
  overview: '/app',
  tasks: '/app/tasks',
  calendar: '/app/calendar',
  habits: '/app/habits',
  goals: '/app/goals',
  roadmap: '/app/roadmap',
  assistant: '/app/assistant',
};
