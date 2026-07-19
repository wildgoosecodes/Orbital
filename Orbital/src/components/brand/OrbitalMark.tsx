import { useId } from 'react';

interface OrbitalMarkProps {
  size?: number;
  className?: string;
}

export default function OrbitalMark({ size = 24, className }: OrbitalMarkProps) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="45%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </radialGradient>
      </defs>

      <ellipse
        cx={50}
        cy={50}
        rx={40}
        ry={18}
        transform="rotate(-18 50 50)"
        fill="none"
        stroke="#818cf8"
        strokeOpacity={0.35}
        strokeWidth={1.5}
      />

      <circle cx={12.4} cy={55.8} r={5} fill="#47bfff" />
      <circle cx={75.6} cy={29.5} r={4.2} fill="#863bff" />
      <circle cx={68.2} cy={61.9} r={3.6} fill="#10b981" />

      <circle cx={50} cy={50} r={17} fill={`url(#${gradientId})`} />
    </svg>
  );
}
