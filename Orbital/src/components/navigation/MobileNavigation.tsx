type MobileView = 'overview' | 'agenda';

interface MobileNavigationProps {
  activeView: MobileView;
  onViewChange: (view: MobileView) => void;
}

export default function MobileNavigation({ activeView, onViewChange }: MobileNavigationProps) {
  const tabs: Array<{ key: MobileView; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'agenda', label: 'Agenda' },
  ];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-1">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => {
          const isActive = activeView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onViewChange(tab.key)}
              className={`rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
