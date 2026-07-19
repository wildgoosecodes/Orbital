import { useState, useEffect } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StatCard from './components/cards/StatCard';
import TaskSummaryCard from './components/cards/TaskSummaryCard';
import GoalProgressCard from './components/cards/GoalProgressCard';
import VehicleStatusCard from './components/cards/VehicleStatusCard';
import TaskTrackerCard from './components/cards/TaskTrackerCard';
import MonthlyGoalCard from './components/cards/MonthlyGoalCard';
import HotStreakCard from './components/cards/HotStreakCard';
import WeeklyProgressChart from './components/charts/WeeklyProgressChart';
import TaskBreakdownChart from './components/charts/TaskBreakdownChart';
import VehicleHealthChart from './components/charts/VehicleHealthChart';
import MobileNavigation from './components/navigation/MobileNavigation';
import OverviewView from './components/views/OverviewView';
import AgendaView from './components/views/AgendaView';
import {
  goalProgressData,
  telemetryData,
  vehicleStatusData,
} from './data/mockDashboardData';

// Mock live stream data simulating real-time vehicle OBD-II metrics
interface DiagnosticMetric {
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'terminal'>('overview');
  const [activeMobileView, setActiveMobileView] = useState<'overview' | 'agenda'>('overview');
  
  // State simulating dynamic engine telemetry
  const [rpm, setRpm] = useState<number>(telemetryData.initialRpm);
  const [coolantTemp, setCoolantTemp] = useState<number>(telemetryData.initialCoolantTemp);

  // Simulate minimal background data fluctuation (engine idling)
  useEffect(() => {
    const interval = setInterval(() => {
      setRpm(prev => Math.floor(740 + Math.random() * 25));
      setCoolantTemp(prev => Math.floor(193 + Math.random() * 4));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics: Record<string, DiagnosticMetric> = {
    rpm: { label: 'Engine RPM', value: rpm, unit: 'RPM', status: rpm > 3000 ? 'warning' : 'normal' },
    coolant: { label: 'Coolant Temp', value: coolantTemp, unit: '°F', status: coolantTemp > 220 ? 'critical' : 'normal' },
    voltage: { label: 'Battery Voltage', value: telemetryData.batteryVoltage, unit: 'V', status: 'normal' },
    throttle: { label: 'Throttle Position', value: telemetryData.throttlePosition, unit: '%', status: 'normal' },
  };

  return (
    <DashboardLayout
      sidebar={<Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}
      header={<Header projectName="Orbital Auto Link" systemTime={new Date().toLocaleTimeString()} />}
    >
      <div className="block overflow-hidden md:hidden">
        <MobileNavigation activeView={activeMobileView} onViewChange={setActiveMobileView} />
        {activeMobileView === 'overview' ? <OverviewView metrics={metrics} /> : <AgendaView />}
      </div>

      <div className="hidden overflow-hidden md:block">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Telemetry Stream</h2>
              <p className="text-sm text-slate-400">Real-time signal feed from hardware controller module.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.values(metrics).map((metric) => (
                <StatCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  unit={metric.unit}
                  status={metric.status}
                />
              ))}
            </div>

            <TaskSummaryCard
              title="Hardware Connection Architecture"
              description="This interface acts as the presentation layer. Telemetry handles parsing raw micro-controller standard streams (serial/OBD lines) directly into JSON data blocks for real-time visualization."
            >
              {goalProgressData.map((goal) => (
                <GoalProgressCard key={goal.title} title={goal.title} progress={goal.progress} target={goal.target} />
              ))}
              {vehicleStatusData.map((item) => (
                <VehicleStatusCard key={item.title} title={item.title} detail={item.detail} status={item.status} />
              ))}
            </TaskSummaryCard>

            <div className="grid gap-4 lg:grid-cols-3">
              <TaskTrackerCard />
              <MonthlyGoalCard />
              <HotStreakCard />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <WeeklyProgressChart />
              </div>
              <TaskBreakdownChart />
            </div>

            <VehicleHealthChart />
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Diagnostic Trouble Codes (DTC)</h2>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-mono font-bold text-indigo-400">P0122</span>
                <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400">PENDING</span>
              </div>
              <p className="text-sm font-medium text-slate-300">Throttle Position Sensor/Switch A Circuit Low Input</p>
              <p className="mt-1 text-xs text-slate-500">Modules Checked: ECM, TCM</p>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && (
          <div className="flex h-full flex-col space-y-4">
            <h2 className="text-2xl font-bold text-white">Raw Stream Terminal</h2>
            <div className="flex-1 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-black p-4 font-mono text-xs text-emerald-400 shadow-inner">
              <p className="text-slate-500">[INFO] Initializing serial interface hook...</p>
              <p className="text-slate-500">[OK] Native layer bound successfully.</p>
              <p>&gt; ATZ ... ELM327 v2.1</p>
              <p>&gt; AT SP 0 ... SEARCHING AUTOMATICALLY</p>
              <p className="text-cyan-400">&gt; 01 0C ... Engine RPM: {rpm} ({((rpm * 4) / 4).toString(16).toUpperCase()} hex)</p>
              <p className="text-cyan-400">&gt; 01 05 ... Engine Coolant Temp: {coolantTemp}°F</p>
              <p className="animate-pulse text-white">&gt; Ready for physical line bind_</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}