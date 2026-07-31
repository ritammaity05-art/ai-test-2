import React from 'react';
import type { LoopState } from '../../types/dj';
import { Repeat } from 'lucide-react';

interface LoopControlsProps {
  loop: LoopState;
  onSetLoopIn: () => void;
  onSetLoopOut: () => void;
  onAutoLoop: (beats: number) => void;
  onExitLoop: () => void;
}

export const LoopControls: React.FC<LoopControlsProps> = ({
  loop,
  onSetLoopIn,
  onSetLoopOut,
  onAutoLoop,
  onExitLoop,
}) => {
  const autoLoopOptions = [0.25, 0.5, 1, 2, 4, 8, 16, 32];

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Repeat className="w-3.5 h-3.5 text-emerald-400" />
          <span>Loop Controls</span>
        </div>
        {loop.active && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold animate-pulse">
            LOOP ACTIVE ({loop.lengthBeats ? `${loop.lengthBeats} BEATS` : 'MANUAL'})
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={onSetLoopIn}
          className={`py-1.5 rounded text-xs font-bold border transition-colors ${
            loop.start !== null
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          LOOP IN
        </button>
        <button
          onClick={onSetLoopOut}
          className={`py-1.5 rounded text-xs font-bold border transition-colors ${
            loop.end !== null
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          LOOP OUT
        </button>
        <button
          onClick={onExitLoop}
          className={`py-1.5 rounded text-xs font-bold border transition-colors ${
            loop.active
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
          }`}
        >
          {loop.active ? 'EXIT LOOP' : 'RELOOP'}
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
        {autoLoopOptions.map((beats) => {
          const isSelected = loop.active && loop.lengthBeats === beats;
          const label = beats < 1 ? `1/${1 / beats}` : `${beats}`;

          return (
            <button
              key={beats}
              onClick={() => onAutoLoop(beats)}
              className={`py-1 rounded text-[11px] font-bold border transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg font-black'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
