export type Tab = 'overview' | 'tasks' | 'habits' | 'goals' | 'analytics';

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  open: boolean;
  onClose: () => void;
}

const TABS: Tab[] = ['overview', 'tasks', 'habits', 'goals', 'analytics'];

export default function Sidebar({ activeTab, onTabChange, open, onClose }: SidebarProps) {
  const nav = (
    <>
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">Orbital</h1>
      </div>

      <nav className="p-4 space-y-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              onTabChange(tab);
              onClose();
            }}
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
    </>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col justify-between">
        <div>{nav}</div>
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {open && <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={onClose} />}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>{nav}</div>
        <SidebarFooter />
      </aside>
    </>
  );
}

function SidebarFooter() {
  return (
    <div className="p-4 border-t border-slate-800 bg-slate-950/50">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Status:</span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          ONLINE
        </span>
      </div>
    </div>
  );
}
