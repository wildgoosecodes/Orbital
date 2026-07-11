import { useState, useEffect } from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StatCard from './components/cards/StatCard';
import TaskSummaryCard from './components/cards/TaskSummaryCard';
import GoalProgressCard from './components/cards/GoalProgressCard';
import VehicleStatusCard from './components/cards/VehicleStatusCard';

// Mock live stream data simulating real-time vehicle OBD-II metrics
interface DiagnosticMetric {
  label: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'terminal'>('overview');
  
  // State simulating dynamic engine telemetry
  const [rpm, setRpm] = useState<number>(750);
  const [coolantTemp, setCoolantTemp] = useState<number>(195);

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
    voltage: { label: 'Battery Voltage', value: 14.2, unit: 'V', status: 'normal' },
    throttle: { label: 'Throttle Position', value: 12.4, unit: '%', status: 'normal' },
  };

  return (
    <DashboardLayout
      sidebar={<Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}
      header={<Header projectName="Orbital Auto Link" systemTime={new Date().toLocaleTimeString()} />}
    >
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Telemetry Stream</h2>
            <p className="text-sm text-slate-400">Real-time signal feed from hardware controller module.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <GoalProgressCard title="Signal Integrity" progress={82} target="99% stable" />
            <GoalProgressCard title="Packet Sync" progress={74} target="92% efficiency" />
            <VehicleStatusCard title="Battery Health" detail="Voltage holding steady at 14.2V" status="normal" />
            <VehicleStatusCard title="Coolant Load" detail="Temperature stable within safe range" status="warning" />
          </TaskSummaryCard>
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Diagnostic Trouble Codes (DTC)</h2>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <span className="font-mono text-indigo-400 font-bold">P0122</span>
              <span className="px-2 py-1 text-xs font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>
            </div>
            <p className="text-sm text-slate-300 font-medium">Throttle Position Sensor/Switch A Circuit Low Input</p>
            <p className="text-xs text-slate-500 mt-1">Modules Checked: ECM, TCM</p>
          </div>
        </div>
      )}

      {activeTab === 'terminal' && (
        <div className="space-y-4 h-full flex flex-col">
          <h2 className="text-2xl font-bold text-white">Raw Stream Terminal</h2>
          <div className="flex-1 bg-black rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-1 overflow-y-auto border border-slate-800 shadow-inner">
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
    </DashboardLayout>
  );
}