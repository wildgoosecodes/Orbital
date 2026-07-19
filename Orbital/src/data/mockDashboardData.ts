export interface WeeklyProductivityPoint {
  day: string;
  value: number;
}

export interface TaskCompletionStats {
  completed: number;
  total: number;
  percent: number;
}

export interface GoalProgressItem {
  title: string;
  progress: number;
  target: string;
}

export interface VehicleStatusItem {
  title: string;
  detail: string;
  status: 'normal' | 'warning' | 'critical';
}

export interface DashboardTelemetryState {
  initialRpm: number;
  initialCoolantTemp: number;
  batteryVoltage: number;
  throttlePosition: number;
}

export interface VehicleMetrics {
  batteryVoltage: number;
  fuelEconomy: number;
  engineTemperature: number;
}

export interface ProductivitySummaryCardData {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercent: number;
}

export interface MonthlyGoalCardData {
  title: string;
  progress: number;
  target: string;
}

export interface HotStreakCardData {
  streakDays: number;
  label: string;
}

export const weeklyProductivityData: WeeklyProductivityPoint[] = [
  { day: 'Mon', value: 72 },
  { day: 'Tue', value: 84 },
  { day: 'Wed', value: 76 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 88 },
  { day: 'Sat', value: 79 },
  { day: 'Sun', value: 86 },
];

export const taskCompletionData: TaskCompletionStats = {
  completed: 24,
  total: 32,
  percent: 75,
};

export const goalProgressData: GoalProgressItem[] = [
  { title: 'Signal Integrity', progress: 82, target: '99% stable' },
  { title: 'Packet Sync', progress: 74, target: '92% efficiency' },
];

export const vehicleStatusData: VehicleStatusItem[] = [
  { title: 'Battery Health', detail: 'Voltage holding steady at 14.2V', status: 'normal' },
  { title: 'Coolant Load', detail: 'Temperature stable within safe range', status: 'warning' },
];

export const telemetryData: DashboardTelemetryState = {
  initialRpm: 750,
  initialCoolantTemp: 195,
  batteryVoltage: 14.2,
  throttlePosition: 12.4,
};

export const vehicleMetricsData: VehicleMetrics = {
  batteryVoltage: 14.2,
  fuelEconomy: 29.4,
  engineTemperature: 195,
};

export const taskTrackerData: ProductivitySummaryCardData = {
  totalTasks: 32,
  completedTasks: 24,
  remainingTasks: 8,
  completionPercent: 75,
};

export const monthlyGoalData: MonthlyGoalCardData = {
  title: 'Monthly Vehicle Readiness Goal',
  progress: 78,
  target: '100% complete',
};

export const hotStreakData: HotStreakCardData = {
  streakDays: 12,
  label: 'consecutive check-ins',
};
