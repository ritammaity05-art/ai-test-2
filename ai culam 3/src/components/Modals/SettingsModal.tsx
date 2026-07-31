import React, { useState } from 'react';
import { X, Settings, Cpu, Palette, Volume2 } from 'lucide-react';
import type { AudioSettings } from '../../types/dj';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>({
    sampleRate: 44100,
    latencyHint: 'interactive',
    graphicsQuality: 'high',
    theme: 'pro-dark',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-wide">TINO DJ Pro Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Web Audio Engine Latency Hint</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['interactive', 'balanced', 'playback'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSettings({ ...settings, latencyHint: mode })}
                className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                  settings.latencyHint === mode
                    ? 'bg-emerald-600 text-slate-950 border-emerald-400 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Waveform Graphics Render FPS</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['high', 'medium', 'low'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setSettings({ ...settings, graphicsQuality: q })}
                className={`py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                  settings.graphicsQuality === q
                    ? 'bg-cyan-600 text-white border-cyan-400 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {q} (60 FPS)
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Visual Theme</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['pro-dark', 'neon-cyan', 'obsidian'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSettings({ ...settings, theme: t })}
                className={`py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                  settings.theme === t
                    ? 'bg-purple-600 text-white border-purple-400 font-black shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-black text-xs text-slate-950 rounded-lg">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
