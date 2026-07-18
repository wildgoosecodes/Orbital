interface HeaderProps {
  projectName: string;
  systemTime: string;
  onMenuClick: () => void;
}

export default function Header({ projectName, systemTime, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-slate-400 hover:text-slate-200 p-2 -ml-2"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 5h16M2 10h16M2 15h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="text-sm font-semibold text-slate-300">
          <span className="text-indigo-400">{projectName}</span>
        </div>
      </div>
      <div className="hidden sm:block text-xs text-slate-500">{systemTime}</div>
    </header>
  );
}
