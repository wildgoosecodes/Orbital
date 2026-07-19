import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({ sidebar, header, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900 font-sans text-slate-100 antialiased">
      {sidebar}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-900">
        {header}
        <div className="min-w-0 flex-1 overflow-x-hidden p-8">{children}</div>
      </main>
    </div>
  );
}
