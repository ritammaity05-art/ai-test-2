import React, { useState } from 'react';
import type { CuePoint } from '../../types/dj';
import { Trash2 } from 'lucide-react';

interface HotCueGridProps {
  hotCues: (CuePoint | null)[];
  onTriggerCue: (index: number) => void;
  onDeleteCue: (index: number) => void;
  currentTime: number;
}

export const HotCueGrid: React.FC<HotCueGridProps> = ({
  hotCues,
  onTriggerCue,
  onDeleteCue,
}) => {
  const [deleteMode, setDeleteMode] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Hot Cues (1 - 8)
        </span>
        <button
          onClick={() => setDeleteMode(!deleteMode)}
          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
            deleteMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trash2 className="w-3 h-3" />
          {deleteMode ? 'Delete Mode ON' : 'Delete Mode'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, idx) => {
          const cue = hotCues[idx];
          const hasCue = cue !== null;

          return (
            <button
              key={idx}
              onClick={() => {
                if (deleteMode) {
                  if (hasCue) onDeleteCue(idx);
                } else {
                  onTriggerCue(idx);
                }
              }}
              className={`h-10 sm:h-12 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all relative overflow-hidden active:scale-95 border ${
                hasCue
                  ? 'border-transparent shadow-lg text-white font-black'
                  : 'bg-slate-950/80 border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
              }`}
              style={{
                backgroundColor: hasCue ? cue.color : undefined,
                boxShadow: hasCue ? `0 0 12px ${cue.color}66` : undefined,
              }}
            >
              <span className="text-[11px]">PAD {idx + 1}</span>
              {hasCue && (
                <span className="text-[9px] opacity-90 font-mono">
                  {Math.floor(cue.position / 60)}:
                  {(cue.position % 60).toFixed(1).padStart(4, '0')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
