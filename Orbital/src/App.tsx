import { useState, useEffect } from 'react';

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
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Header/Branding */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider text-white uppercase">Orbital</h1>
          </div>
          
          {/* Nav Links */}
          <nav className="p-4 space-y-2">
            {(['overview', 'diagnostics', 'terminal'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2.5 rounded-lg font-medium text-sm transition-all uppercase tracking-wider ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* System Connection Status Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Interface Status:</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              CONNECTED
            </span>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        
        {/* Top App Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between px-8">
          <div className="text-sm font-semibold text-slate-300">
            Project: <span className="text-indigo-400">Orbital Auto Link</span>
          </div>
          <div className="text-xs text-slate-500">
            System Clock: {new Date().toLocaleTimeString()}
          </div>
        </header>

        {/* Dynamic Tab Views */}
        <div className="p-8 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Telemetry Stream</h2>
                <p className="text-sm text-slate-400">Real-time signal feed from hardware controller module.</p>
              </div>

              {/* METRIC GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(metrics).map((metric) => (
                  <div key={metric.label} className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {metric.label}
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        {metric.value}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 ml-1">
                        {metric.unit}
                      </span>
                    </div>
                    
                    {/* Status indicator line */}
                    <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        metric.status === 'critical' ? 'bg-rose-500 w-full' :
                        metric.status === 'warning' ? 'bg-amber-500 w-3/4' : 'bg-emerald-500 w-1/4'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* SUB-SECTION COMPONENT PLACEHOLDER */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-2">Hardware Connection Architecture</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                  This interface acts as the presentation layer. Telemetry handles parsing raw micro-controller standard streams (serial/OBD lines) directly into JSON data blocks for real-time visualization.
                </p>
              </div>
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
                <p className="text-cyan-400">&gt; 01 0C ... Engine RPM: {rpm} ({((rpm*4)/4).toString(16).toUpperCase()} hex)</p>
                <p className="text-cyan-400">&gt; 01 05 ... Engine Coolant Temp: {coolantTemp}°F</p>
                <p className="animate-pulse text-white">&gt; Ready for physical line bind_</p>
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}