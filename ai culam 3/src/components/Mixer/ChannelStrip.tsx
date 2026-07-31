import React from 'react';
import type { MixerChannelState, DeckId } from '../../types/dj';
import { Headphones } from 'lucide-react';

interface ChannelStripProps {
  deckId: DeckId;
  state: MixerChannelState;
  onChange: (updates: Partial<MixerChannelState>) => void;
  accentColor?: string;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  deckId,
  state,
  onChange,
  accentColor = deckId === 'A' ? '#3b82f6' : '#ec4899',
}) => {
  const handleEqChange = (freq: 'high' | 'mid' | 'low', val: number) => {
    onChange({
      eq: {
        ...state.eq,
        [freq]: val,
      },
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl w-full max-w-[170px]">
      <div
        className="w-full py-1 rounded-lg text-center font-black text-xs text-slate-950 shadow-md"
        style={{ backgroundColor: accentColor }}
      >
        CH {deckId}
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-slate-400">GAIN</span>
        <input
          type="range"
          min="0"
          max="2"
          step="0.05"
          value={state.gain}
          onChange={(e) => onChange({ gain: parseFloat(e.target.value) })}
          className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[9px] font-mono text-slate-500">{(state.gain * 100).toFixed(0)}%</span>
      </div>

      <div className="flex flex-col items-center gap-2 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">3-Band EQ</span>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
            <span>HI</span>
            <span>{state.eq.high}dB</span>
          </div>
          <input
            type="range"
            min="-24"
            max="6"
            step="1"
            value={state.eq.high}
            onChange={(e) => handleEqChange('high', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
            <span>MID</span>
            <span>{state.eq.mid}dB</span>
          </div>
          <input
            type="range"
            min="-24"
            max="6"
            step="1"
            value={state.eq.mid}
            onChange={(e) => handleEqChange('mid', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full">
          <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
            <span>LOW</span>
            <span>{state.eq.low}dB</span>
          </div>
          <input
            type="range"
            min="-24"
            max="6"
            step="1"
            value={state.eq.low}
            onChange={(e) => handleEqChange('low', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[10px] font-bold text-slate-400">FILTER (HP / LP)</span>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={state.filter}
          onChange={(e) => onChange({ filter: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between w-full text-[8px] font-bold text-slate-500">
          <span>HPF</span>
          <span>OFF</span>
          <span>LPF</span>
        </div>
      </div>

      <button
        onClick={() => onChange({ cue: !state.cue })}
        className={`w-full py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all border shadow-md active:scale-95 ${
          state.cue
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/40'
            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        <Headphones className="w-3.5 h-3.5" />
        CUE
      </button>

      <div className="flex items-center gap-3 h-44 py-2">
        <div className="relative h-full flex items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.volume}
            onChange={(e) => onChange({ volume: parseFloat(e.target.value) })}
            className="h-full w-2 appearance-none bg-slate-950 rounded-lg outline-none cursor-pointer accent-emerald-400"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
        </div>

        <div className="flex gap-1 h-full p-1 bg-slate-950 rounded-lg border border-slate-800">
          <div className="w-2 h-full flex flex-col justify-end bg-slate-900 rounded overflow-hidden">
            <div
              className="w-full transition-all duration-75 rounded-t"
              style={{
                height: `${Math.min(100, state.peakMeter.left * 100)}%`,
                backgroundColor: state.peakMeter.left > 0.85 ? '#ef4444' : state.peakMeter.left > 0.6 ? '#eab308' : '#10b981',
              }}
            />
          </div>
          <div className="w-2 h-full flex flex-col justify-end bg-slate-900 rounded overflow-hidden">
            <div
              className="w-full transition-all duration-75 rounded-t"
              style={{
                height: `${Math.min(100, state.peakMeter.right * 100)}%`,
                backgroundColor: state.peakMeter.right > 0.85 ? '#ef4444' : state.peakMeter.right > 0.6 ? '#eab308' : '#10b981',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
