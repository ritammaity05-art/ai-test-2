import React from 'react';
import { Volume2, Headphones } from 'lucide-react';

interface MasterSectionProps {
  masterVolume: number;
  headphoneVolume: number;
  headphoneCueMix: number;
  masterMeter: { left: number; right: number };
  onMasterVolumeChange: (vol: number) => void;
  onHeadphoneVolumeChange: (vol: number) => void;
  onHeadphoneCueMixChange: (mix: number) => void;
}

export const MasterSection: React.FC<MasterSectionProps> = ({
  masterVolume,
  headphoneVolume,
  headphoneCueMix,
  masterMeter,
  onMasterVolumeChange,
  onHeadphoneVolumeChange,
  onHeadphoneCueMixChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl w-full max-w-[170px]">
      <div className="w-full py-1 bg-emerald-600 rounded-lg text-center font-black text-xs text-slate-950 shadow-md">
        MASTER / CUE
      </div>

      {/* Master Volume */}
      <div className="flex flex-col items-center gap-1 w-full">
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>MASTER VOL</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={masterVolume}
          onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
        />
        <span className="text-[9px] font-mono text-slate-400">{(masterVolume * 100).toFixed(0)}%</span>
      </div>

      {/* Headphone Section */}
      <div className="flex flex-col items-center gap-2 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase">
          <Headphones className="w-3.5 h-3.5" />
          <span>HEADPHONES</span>
        </div>

        {/* Headphone Mix (Cue vs Master) */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
            <span>CUE</span>
            <span>MIX</span>
            <span>MST</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={headphoneCueMix}
            onChange={(e) => onHeadphoneCueMixChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Headphone Volume */}
        <div className="flex flex-col items-center gap-0.5 w-full">
          <span className="text-[9px] font-bold text-slate-400">PHONE VOL</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={headphoneVolume}
            onChange={(e) => onHeadphoneVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>

      {/* Master VU Meter */}
      <div className="flex flex-col items-center gap-1 w-full h-36">
        <span className="text-[9px] font-bold text-slate-400 uppercase">MASTER OUT</span>
        <div className="flex gap-1.5 h-full p-1.5 bg-slate-950 rounded-xl border border-slate-800 w-full justify-center">
          <div className="w-3 h-full flex flex-col justify-end bg-slate-900 rounded overflow-hidden">
            <div
              className="w-full transition-all duration-75 rounded-t"
              style={{
                height: `${Math.min(100, masterMeter.left * 100)}%`,
                backgroundColor: masterMeter.left > 0.85 ? '#ef4444' : masterMeter.left > 0.6 ? '#eab308' : '#10b981',
              }}
            />
          </div>
          <div className="w-3 h-full flex flex-col justify-end bg-slate-900 rounded overflow-hidden">
            <div
              className="w-full transition-all duration-75 rounded-t"
              style={{
                height: `${Math.min(100, masterMeter.right * 100)}%`,
                backgroundColor: masterMeter.right > 0.85 ? '#ef4444' : masterMeter.right > 0.6 ? '#eab308' : '#10b981',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
