import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  header: ReactNode;
  assistant?: ReactNode;
  children: ReactNode;
}

export default function DashboardLayout({ sidebar, header, assistant, children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans antialiased overflow-hidden">
      {sidebar}

      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        {header}
        <div className="flex flex-1">
          <div className="p-4 md:p-8 flex-1 min-w-0">{children}</div>
          {assistant && <div className="hidden xl:flex xl:w-80 border-l border-slate-800">{assistant}</div>}
        </div>
      </main>
    </div>
  );
}
