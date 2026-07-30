import Sparkline from '../charts/Sparkline';

export default function StatCard({ icon: Icon, label, value, delta, accentColor, sparklineData, badge }) {
  return (
    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        {badge ?? (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}
          >
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-2 text-2xl font-bold text-white tracking-tight">{value}</div>

      {delta && <p className="mt-1 text-xs text-slate-500">{delta}</p>}

      {sparklineData && (
        <div className="mt-2">
          <Sparkline data={sparklineData} color={accentColor} />
        </div>
      )}
    </div>
  );
}
