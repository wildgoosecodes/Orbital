type Tab = 'overview' | 'diagnostics' | 'terminal';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: Tab[] = ['overview', 'diagnostics', 'terminal'];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
      <div>
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">Orbital</h1>
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
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
  );
}
