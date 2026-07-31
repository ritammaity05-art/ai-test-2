import React, { useState } from 'react';
import type { DeckState } from '../../types/dj';
import { Lock, Disc, Zap, RotateCcw } from 'lucide-react';

interface DeckHeaderProps {
  state: DeckState;
  accentColor?: string;
  onPitchChange: (percent: number) => void;
  onPitchBend: (nudge: number) => void;
  onKeyLockToggle: (enabled: boolean) => void;
  onVinylToggle: (enabled: boolean) => void;
  onSlipToggle: (enabled: boolean) => void;
  onReverseToggle: (enabled: boolean) => void;
  onSync: () => void;
}

export const DeckHeader: React.FC<DeckHeaderProps> = ({
  state,
  accentColor = '#3b82f6',
  onPitchChange,
  onPitchBend,
  onKeyLockToggle,
  onVinylToggle,
  onSlipToggle,
  onReverseToggle,
  onSync,
}) => {
  const [showRemainingTime, setShowRemainingTime] = useState<boolean>(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${tenths}`;
  };

  const displayTime = showRemainingTime
    ? `-${formatTime(state.duration - state.currentTime)}`
    : formatTime(state.currentTime);

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white truncate tracking-wide">
              {state.track ? state.track.title : `DECK ${state.deckId} EMPTY`}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {state.track ? state.track.artist : 'Load a track from library'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowRemainingTime(!showRemainingTime)}
          className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono font-black text-lg sm:text-xl text-emerald-400 tracking-wider shadow-inner hover:border-emerald-500/50 transition-colors"
        >
          {displayTime}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
        <div className="flex flex-col items-center justify-center p-1 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">BPM</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-mono font-black text-white">{state.bpm}</span>
            <span className="text-[10px] text-slate-500 font-mono">({state.originalBpm})</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-1 bg-slate-900/90 rounded border border-slate-800">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KEY</span>
          <span className="text-base font-mono font-black text-amber-400">{state.key || '8A'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onSync}
            className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded transition-all shadow-md active:scale-95 flex items-center justify-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            SYNC
          </button>
          <button
            onClick={() => onKeyLockToggle(!state.keyLock)}
            className={`p-2 rounded border text-xs font-bold transition-all ${
              state.keyLock
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Key Lock (Master Tempo)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center flex-1">
            <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
              <span>PITCH</span>
              <span>{state.pitchPercent > 0 ? `+${state.pitchPercent.toFixed(1)}%` : `${state.pitchPercent.toFixed(1)}%`}</span>
            </div>
            <input
              type="range"
              min="-16"
              max="16"
              step="0.1"
              value={state.pitchPercent}
              onChange={(e) => onPitchChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <button
              onMouseDown={() => onPitchBend(0.5)}
              onMouseUp={() => onPitchBend(0)}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9px] font-black text-slate-300"
            >
              +
            </button>
            <button
              onMouseDown={() => onPitchBend(-0.5)}
              onMouseUp={() => onPitchBend(0)}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9px] font-black text-slate-300"
            >
              -
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <button
          onClick={() => onVinylToggle(!state.vinylMode)}
          className={`flex-1 py-1 px-2 rounded border font-bold flex items-center justify-center gap-1 transition-all ${
            state.vinylMode
              ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          VINYL
        </button>

        <button
          onClick={() => onSlipToggle(!state.slipMode)}
          className={`flex-1 py-1 px-2 rounded border font-bold transition-all ${
            state.slipMode
              ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          SLIP
        </button>

        <button
          onClick={() => onReverseToggle(!state.reverse)}
          className={`flex-1 py-1 px-2 rounded border font-bold flex items-center justify-center gap-1 transition-all ${
            state.reverse
              ? 'bg-rose-600/20 text-rose-400 border-rose-500/40 shadow-sm'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          REV
        </button>
      </div>
    </div>
  );
};
