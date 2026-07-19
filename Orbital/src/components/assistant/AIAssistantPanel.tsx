export default function AIAssistantPanel() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
      <p className="mt-2 text-sm text-slate-400">Daily summary and vehicle guidance are ready for review.</p>
      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <p className="text-sm text-slate-300">"Vehicle systems are steady. Focus attention on coolant load and battery consistency."</p>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3">
        <span className="text-sm text-slate-500">Ask:</span>
        <input
          className="flex-1 border-none bg-transparent text-sm text-slate-300 outline-none"
          placeholder="What needs attention?"
        />
      </div>
    </div>
  );
}
