import React, { useState } from 'react';
import type { StemsState, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { AIStepSeparator, type StemGenrePreset } from '../../audio/AIStepSeparator';
import { Mic, Music2, VolumeX, Layers, Zap, Cpu, Sparkles } from 'lucide-react';

interface StemsControlBarProps {
  deckId: DeckId;
  stems: StemsState;
}

export const StemsControlBar: React.FC<StemsControlBarProps> = ({ deckId, stems }) => {
  const engine = AudioEngine.getInstance();
  const deckNode = deckId === 'A' ? engine.deckA : engine.deckB;

  const [aiPreset, setAiPreset] = useState<StemGenrePreset>('BALANCED');
  const [isReAnalyzing, setIsReAnalyzing] = useState<boolean>(false);

  const toggleStem = (key: keyof StemsState) => {
    deckNode.setStems({ [key]: !stems[key] });
  };

  const applyPreset = (preset: 'acapella' | 'instrumental' | 'beat_mute' | 'all_on') => {
    switch (preset) {
      case 'acapella':
        deckNode.setStems({ vocals: true, instruments: false, bass: false, drums: false });
        break;
      case 'instrumental':
        deckNode.setStems({ vocals: false, instruments: true, bass: true, drums: true });
        break;
      case 'beat_mute':
        deckNode.setStems({ vocals: stems.vocals, instruments: stems.instruments, bass: false, drums: false });
        break;
      case 'all_on':
        deckNode.setStems({ vocals: true, instruments: true, bass: true, drums: true });
        break;
    }
  };

  const handleAIGenrePresetChange = async (preset: StemGenrePreset) => {
    setAiPreset(preset);
    if (!deckNode.track || !deckNode.track.audioBuffer) return;

    setIsReAnalyzing(true);
    try {
      const stemBuffers = await AIStepSeparator.separate(engine.ctx, deckNode.track.audioBuffer, preset);
      deckNode.track.stemBuffers = stemBuffers;

      if (deckNode.state.isPlaying) {
        const pos = deckNode.getCurrentPlaybackTime();
        deckNode.seek(pos);
      } else {
        deckNode.setStems(deckNode.state.stems);
      }
    } catch (err) {
      console.error('Failed to re-analyze stems:', err);
    } finally {
      setIsReAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 p-3.5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-2xl border-2 border-slate-800 shadow-xl backdrop-blur-md w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>AI STEMS SEPARATION ENGINE</span>
          {isReAnalyzing && (
            <span className="text-[10px] text-cyan-400 font-bold animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> AI Re-Separating...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
          <span className="text-slate-500 px-1">AI Mode:</span>
          <button
            onClick={() => handleAIGenrePresetChange('BALANCED')}
            className={`px-2 py-0.5 rounded transition-colors ${
              aiPreset === 'BALANCED' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Balanced
          </button>
          <button
            onClick={() => handleAIGenrePresetChange('EDM_DANCE')}
            className={`px-2 py-0.5 rounded transition-colors ${
              aiPreset === 'EDM_DANCE' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EDM / Synths
          </button>
          <button
            onClick={() => handleAIGenrePresetChange('HIPHOP_TRAP')}
            className={`px-2 py-0.5 rounded transition-colors ${
              aiPreset === 'HIPHOP_TRAP' ? 'bg-cyan-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HipHop / Vocals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => toggleStem('vocals')}
          className={`py-2.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg ${
            stems.vocals
              ? 'bg-gradient-to-b from-purple-600 to-purple-700 text-white border-purple-400 shadow-purple-500/30 font-black'
              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span className="text-[11px] font-black tracking-wider">VOCAL</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/40">
            {stems.vocals ? 'ON' : 'OFF (MUTED)'}
          </span>
        </button>

        <button
          onClick={() => toggleStem('instruments')}
          className={`py-2.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg ${
            stems.instruments
              ? 'bg-gradient-to-b from-cyan-600 to-cyan-700 text-white border-cyan-400 shadow-cyan-500/30 font-black ring-2 ring-cyan-500/30'
              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
        >
          <Music2 className="w-4 h-4" />
          <span className="text-[11px] font-black tracking-wider">INSTRUMENT</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/40">
            {stems.instruments ? 'ON' : 'OFF (MUTED)'}
          </span>
        </button>

        <button
          onClick={() => toggleStem('bass')}
          className={`py-2.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg ${
            stems.bass
              ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 border-amber-300 shadow-amber-500/30 font-black'
              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
        >
          <VolumeX className="w-4 h-4" />
          <span className="text-[11px] font-black tracking-wider">BASS</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/40">
            {stems.bass ? 'ON' : 'OFF (MUTED)'}
          </span>
        </button>

        <button
          onClick={() => toggleStem('drums')}
          className={`py-2.5 px-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg ${
            stems.drums
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-slate-950 border-emerald-300 shadow-emerald-500/30 font-black'
              : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[11px] font-black tracking-wider">BEAT</span>
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/40">
            {stems.drums ? 'ON' : 'OFF (MUTED)'}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Presets:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => applyPreset('acapella')}
            className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-950 hover:bg-purple-800 text-purple-300 border border-purple-700 transition-colors flex items-center gap-1"
          >
            <Mic className="w-3 h-3" />
            ACAPELLA
          </button>

          <button
            onClick={() => applyPreset('instrumental')}
            className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 transition-colors flex items-center gap-1"
          >
            <Music2 className="w-3 h-3" />
            INSTRUMENTAL
          </button>

          <button
            onClick={() => applyPreset('beat_mute')}
            className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 hover:bg-amber-800 text-amber-300 border border-amber-700 transition-colors flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            BEAT MUTE
          </button>

          <button
            onClick={() => applyPreset('all_on')}
            className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            RESET ALL
          </button>
        </div>
      </div>
    </div>
  );
};
