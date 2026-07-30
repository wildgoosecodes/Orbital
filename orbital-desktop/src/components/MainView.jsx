import { useEffect, useRef, useState } from 'react';
import { LogOut, Sparkles } from 'lucide-react';
import { useWakeWord } from '../hooks/useWakeWord';
import { useDesktopVoice } from '../hooks/useDesktopVoice';
import VoiceOrb from './VoiceOrb';
import AnalyticsHome from './AnalyticsHome';

export default function MainView({ onSignOut }) {
  const [startupEnabled, setStartupEnabled] = useState(false);
  // Bumped after each voice exchange so AnalyticsHome refetches — the AI can
  // create/update tasks and habits via tool-calling, so a spoken "add a task"
  // should be reflected in the stats right after Orbital replies.
  const [refreshToken, setRefreshToken] = useState(0);

  const voice = useDesktopVoice({ onExchangeComplete: () => setRefreshToken((n) => n + 1) });
  const statusRef = useRef(voice.status);
  statusRef.current = voice.status;

  useEffect(() => {
    (async () => {
      setStartupEnabled(await window.orbital.getStartupSetting());
      const result = await window.orbital.getBriefing();
      voice.speakBriefing(result.success ? result.reply : `Couldn't load your briefing: ${result.error}`);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useWakeWord(true, () => {
    window.orbital.showAndFocus();
    if (statusRef.current === 'idle') voice.startRecording();
  });

  async function handleStartupToggle(e) {
    const enabled = e.target.checked;
    setStartupEnabled(enabled);
    await window.orbital.setStartupSetting(enabled);
  }

  function handleOrbClick() {
    if (voice.status === 'listening') voice.stopRecording();
    else if (voice.status === 'idle' || voice.status === 'error') voice.startRecording();
  }

  const lastMessage = voice.messages[voice.messages.length - 1];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-400" />
          Orbital Desktop
        </h2>
        <button onClick={onSignOut} aria-label="Sign out" className="text-slate-500 hover:text-slate-300 transition-colors">
          <LogOut size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <VoiceOrb
          status={voice.status}
          micLevel={voice.micLevel}
          errorMessage={voice.errorMessage}
          lastMessage={lastMessage?.content}
          onOrbClick={handleOrbClick}
        />
        <AnalyticsHome refreshToken={refreshToken} />
      </div>

      <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          id="startup-toggle"
          checked={startupEnabled}
          onChange={handleStartupToggle}
          className="accent-indigo-500"
        />
        <label htmlFor="startup-toggle">Launch Orbital Desktop when I start my computer</label>
      </div>
    </div>
  );
}
