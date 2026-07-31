import React from 'react';
import { FastForward } from 'lucide-react';

interface BeatJumpControlsProps {
  onBeatJump: (beats: number) => void;
}

export const BeatJumpControls: React.FC<BeatJumpControlsProps> = ({ onBeatJump }) => {
  const jumpSizes = [1, 2, 4, 8, 16, 32];

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center gap-1 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <FastForward className="w-3.5 h-3.5 text-cyan-400" />
        <span>Beat Jump</span>
      </div>

      <div className="grid grid-cols-6 gap-1">
        {jumpSizes.map((beats) => (
          <div key={beats} className="flex flex-col gap-1">
            <button
              onClick={() => onBeatJump(-beats)}
              className="py-1 bg-slate-950 hover:bg-cyan-950 hover:border-cyan-500/50 border border-slate-800 rounded text-[10px] font-bold text-slate-300 transition-colors"
            >
              -{beats}
            </button>
            <button
              onClick={() => onBeatJump(beats)}
              className="py-1 bg-slate-950 hover:bg-cyan-950 hover:border-cyan-500/50 border border-slate-800 rounded text-[10px] font-bold text-slate-300 transition-colors"
            >
              +{beats}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
