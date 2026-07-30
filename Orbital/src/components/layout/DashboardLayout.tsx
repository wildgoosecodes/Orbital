import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  topnav: ReactNode;
  assistant?: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({ topnav, assistant, children }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-[100dvh] bg-cosmic-bg text-orbital-text font-sans antialiased overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {topnav}

      <div className="flex flex-1 min-h-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">{children}</main>
        {assistant && <div className="hidden xl:flex xl:w-80 border-l border-cosmic-border">{assistant}</div>}
      </div>
    </div>
  );
}
