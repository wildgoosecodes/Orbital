export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export type HabitFrequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: HabitFrequency;
  target_per_period: number;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_on: string;
  created_at: string;
}

export type GoalPeriodType = 'weekly' | 'quarterly' | 'yearly';
export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  period_type: GoalPeriodType;
  period_start: string;
  period_end: string;
  progress: number;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}
