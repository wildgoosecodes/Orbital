interface HeaderProps {
  projectName: string;
  systemTime: string;
}

export default function Header({ projectName, systemTime }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between px-8">
      <div className="text-sm font-semibold text-slate-300">
        Project: <span className="text-indigo-400">{projectName}</span>
      </div>
      <div className="text-xs text-slate-500">System Clock: {systemTime}</div>
    </header>
  );
}
