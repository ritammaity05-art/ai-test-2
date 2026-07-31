import React from 'react';
import type { FXUnitState, EffectType, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { Sliders, Power, RefreshCw } from 'lucide-react';

interface FXRackProps {
  deckId: DeckId;
  accentColor?: string;
}

export const FXRack: React.FC<FXRackProps> = ({
  deckId,
  accentColor = deckId === 'A' ? '#3b82f6' : '#ec4899',
}) => {
  const engine = AudioEngine.getInstance();
  const deckNode = deckId === 'A' ? engine.deckA : engine.deckB;
  const fxEngine = deckNode.fxEngine;

  const [fxState, setFxState] = React.useState<FXUnitState>({
    id: deckId === 'A' ? 'FX_A' : 'FX_B',
    assignedDeck: deckId,
    enabled: false,
    type: 'echo',
    param1: 0.5,
    param2: 0.5,
    param3: 0.5,
    wetDry: 0.5,
    beatSync: true,
  });

  const effectOptions: { type: EffectType; label: string }[] = [
    { type: 'echo', label: 'Echo Delay' },
    { type: 'delay', label: 'Ping-Pong Delay' },
    { type: 'reverb', label: 'Stereo Reverb' },
    { type: 'filter', label: 'Resonant Filter' },
    { type: 'flanger', label: 'Flanger' },
    { type: 'phaser', label: 'Phaser' },
    { type: 'roll', label: 'Loop Roll' },
    { type: 'gate', label: 'Rhythmic Gate' },
    { type: 'noise', label: 'Noise Sweep' },
    { type: 'bitcrusher', label: 'Bit Crusher' },
  ];

  const updateFX = (updates: Partial<FXUnitState>) => {
    const next = { ...fxState, ...updates };
    setFxState(next);
    fxEngine.updateState(next);
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4" style={{ color: accentColor }} />
          <span className="text-xs font-black uppercase text-white">
            FX UNIT {deckId}
          </span>
        </div>

        <button
          onClick={() => updateFX({ enabled: !fxState.enabled })}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition-all shadow-md active:scale-95 border ${
            fxState.enabled
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/30'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {fxState.enabled ? 'FX ON' : 'FX OFF'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="col-span-2">
          <select
            value={fxState.type}
            onChange={(e) => updateFX({ type: e.target.value as EffectType })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          >
            {effectOptions.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => updateFX({ beatSync: !fxState.beatSync })}
          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-colors ${
            fxState.beatSync
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          BEAT SYNC
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400">
            <span>PARAM 1</span>
            <span>{(fxState.param1 * 100).toFixed(0)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={fxState.param1}
            onChange={(e) => updateFX({ param1: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400">
            <span>PARAM 2</span>
            <span>{(fxState.param2 * 100).toFixed(0)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={fxState.param2}
            onChange={(e) => updateFX({ param2: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-bold text-slate-400">
            <span>PARAM 3</span>
            <span>{(fxState.param3 * 100).toFixed(0)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={fxState.param3}
            onChange={(e) => updateFX({ param3: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-blue-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold text-slate-400 min-w-14">WET / DRY</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={fxState.wetDry}
          onChange={(e) => updateFX({ wetDry: parseFloat(e.target.value) })}
          className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
        />
        <span className="text-[9px] font-mono text-slate-400 min-w-8 text-right">
          {(fxState.wetDry * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
