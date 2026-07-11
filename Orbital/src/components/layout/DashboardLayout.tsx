import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({ sidebar, header, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden">
      {sidebar}

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        {header}
        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
