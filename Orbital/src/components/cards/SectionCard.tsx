import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export default function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <div className="p-6 bg-cosmic-surface-2 border border-cosmic-border rounded-xl">
      <h3 className="text-lg font-semibold text-orbital-text mb-2">{title}</h3>
      <p className="text-sm text-orbital-text-muted leading-relaxed max-w-2xl">{description}</p>
      {children ? <div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div> : null}
    </div>
  );
}
