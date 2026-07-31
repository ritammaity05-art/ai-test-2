import React from 'react';
import type { CrossfaderCurve } from '../../types/dj';

interface CrossfaderProps {
  value: number;
  curve: CrossfaderCurve;
  onChange: (value: number) => void;
  onCurveChange: (curve: CrossfaderCurve) => void;
}

export const Crossfader: React.FC<CrossfaderProps> = ({
  value,
  curve,
  onChange,
  onCurveChange,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl w-full">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-xs font-black text-blue-400">DECK A</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          CROSSFADER
        </span>
        <span className="text-xs font-black text-pink-400">DECK B</span>
      </div>

      <div className="relative w-full py-2">
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 shadow-inner border border-slate-800"
        />
      </div>

      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
        <span className="text-slate-500 px-1">Curve:</span>
        <button
          onClick={() => onCurveChange('linear')}
          className={`px-2 py-0.5 rounded transition-colors ${
            curve === 'linear' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Linear
        </button>
        <button
          onClick={() => onCurveChange('constant_power')}
          className={`px-2 py-0.5 rounded transition-colors ${
            curve === 'constant_power' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Power
        </button>
        <button
          onClick={() => onCurveChange('scratch')}
          className={`px-2 py-0.5 rounded transition-colors ${
            curve === 'scratch' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scratch Cut
        </button>
      </div>
    </div>
  );
};
