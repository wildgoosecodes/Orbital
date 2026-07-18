import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="md:hidden p-4">
      <button
        onClick={onMenuClick}
        className="text-slate-400 hover:text-slate-200 p-2 -ml-2"
        aria-label="Open menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
