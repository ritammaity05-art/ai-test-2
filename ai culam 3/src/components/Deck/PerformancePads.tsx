import React, { useState } from 'react';
import type { DeckState, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { SamplerEngine } from '../../audio/SamplerEngine';

interface PerformancePadsProps {
  deckId: DeckId;
  deckState: DeckState;
}

export type PadMode =
  | 'HOT_CUE'
  | 'KEYBOARD'
  | 'PAD_FX1'
  | 'PAD_FX2'
  | 'BEAT_JUMP'
  | 'BEAT_LOOP'
  | 'SAMPLER'
  | 'KEY_SHIFT';

export const PerformancePads: React.FC<PerformancePadsProps> = ({
  deckId,
  deckState,
}) => {
  const engine = AudioEngine.getInstance();
  const deckNode = deckId === 'A' ? engine.deckA : engine.deckB;
  const samplerEngine = SamplerEngine.getInstance();

  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<PadMode>('HOT_CUE');
  const [activePadFx, setActivePadFx] = useState<number | null>(null);

  // Toggle Mode based on primary click vs Shift click
  const selectMode = (primaryMode: PadMode, shiftMode: PadMode) => {
    if (shiftActive) {
      setActiveMode(shiftMode);
    } else {
      setActiveMode(primaryMode);
    }
  };

  const handlePadPress = (padIdx: number) => {
    switch (activeMode) {
      case 'HOT_CUE': {
        if (shiftActive) {
          deckNode.deleteHotCue(padIdx);
        } else {
          deckNode.jumpToHotCue(padIdx);
        }
        break;
      }

      case 'KEYBOARD': {
        // Semitone shifts: [-4, -3, -2, -1, 0, +1, +2, +3]
        const semitones = [-4, -3, -2, -1, 0, 1, 2, 3];
        const shiftAmount = semitones[padIdx];
        const percent = Math.pow(2, shiftAmount / 12) * 100 - 100;
        deckNode.setPitchPercent(percent);
        deckNode.jumpToHotCue(0);
        break;
      }

      case 'PAD_FX1':
      case 'PAD_FX2': {
        // Toggle instant FX
        if (activePadFx === padIdx) {
          setActivePadFx(null);
          deckNode.fxEngine.updateState({ enabled: false });
        } else {
          setActivePadFx(padIdx);
          const fxTypes: Array<{ type: any; p1: number; p2: number; p3: number }> = [
            { type: 'filter', p1: 0.8, p2: 0.8, p3: 0.5 },
            { type: 'filter', p1: 0.8, p2: 0.2, p3: 0.5 },
            { type: 'echo', p1: 0.5, p2: 0.7, p3: 0.25 },
            { type: 'echo', p1: 0.5, p2: 0.8, p3: 0.1 },
            { type: 'gate', p1: 0.8, p2: 0.5, p3: 0.1 },
            { type: 'flanger', p1: 0.9, p2: 0.9, p3: 0.5 },
            { type: 'bitcrusher', p1: 0.4, p2: 0.5, p3: 0.5 },
            { type: 'reverb', p1: 0.7, p2: 0.8, p3: 0.5 },
          ];
          const cfg = fxTypes[padIdx] || fxTypes[0];
          deckNode.fxEngine.updateState({
            enabled: true,
            type: cfg.type,
            param1: cfg.p1,
            param2: cfg.p2,
            param3: cfg.p3,
            wetDry: 0.7,
          });
        }
        break;
      }

      case 'BEAT_JUMP': {
        const jumps = [-1, 1, -2, 2, -4, 4, -8, 8];
        deckNode.beatJump(jumps[padIdx]);
        break;
      }

      case 'BEAT_LOOP': {
        const loopSizes = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8];
        deckNode.triggerAutoLoop(loopSizes[padIdx]);
        break;
      }

      case 'SAMPLER': {
        samplerEngine.triggerPad(padIdx);
        break;
      }

      case 'KEY_SHIFT': {
        const semitones = [-4, -3, -2, -1, 0, 1, 2, 3];
        const shiftAmount = semitones[padIdx];
        const percent = Math.pow(2, shiftAmount / 12) * 100 - 100;
        deckNode.setPitchPercent(percent);
        break;
      }
    }
  };

  // Helper labels for pad grid
  const getPadLabel = (idx: number) => {
    switch (activeMode) {
      case 'HOT_CUE': {
        const cue = deckState.hotCues[idx];
        return cue ? `CUE ${idx + 1}` : `PAD ${idx + 1}`;
      }
      case 'KEYBOARD': {
        const semitones = ['-4st', '-3st', '-2st', '-1st', 'ROOT', '+1st', '+2st', '+3st'];
        return semitones[idx];
      }
      case 'PAD_FX1':
      case 'PAD_FX2': {
        const fxNames = ['LPF ROLL', 'HPF SWEEP', 'ECHO 1/2', 'ECHO 1/4', 'GATE 1/16', 'FLANGER', 'BITCRUSH', 'REVERB'];
        return fxNames[idx];
      }
      case 'BEAT_JUMP': {
        const jumps = ['-1 BEAT', '+1 BEAT', '-2 BEATS', '+2 BEATS', '-4 BEATS', '+4 BEATS', '-8 BEATS', '+8 BEATS'];
        return jumps[idx];
      }
      case 'BEAT_LOOP': {
        const loops = ['1/16', '1/8', '1/4', '1/2', '1 BEAT', '2 BEATS', '4 BEATS', '8 BEATS'];
        return loops[idx];
      }
      case 'SAMPLER': {
        return samplerEngine.pads[idx]?.name || `SMP ${idx + 1}`;
      }
      case 'KEY_SHIFT': {
        const semitones = ['-4 KEY', '-3 KEY', '-2 KEY', '-1 KEY', 'ORIGINAL', '+1 KEY', '+2 KEY', '+3 KEY'];
        return semitones[idx];
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border-2 border-slate-800/90 shadow-2xl backdrop-blur-xl max-w-full">
      {/* SHIFT & Mode Selection Header Bar */}
      <div className="flex items-center gap-3">
        {/* SHIFT Modifier Button */}
        <button
          onClick={() => setShiftActive(!shiftActive)}
          className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg font-black text-[10px] tracking-widest border transition-all active:scale-95 shadow-md ${
            shiftActive
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/40 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <span>SHIFT</span>
        </button>

        {/* 4 Pioneer DDJ Mode Selection Buttons */}
        <div className="grid grid-cols-4 gap-1.5 flex-1">
          {/* 1. HOT CUE / KEYBOARD */}
          <button
            onClick={() => selectMode('HOT_CUE', 'KEYBOARD')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] font-black transition-all ${
              activeMode === 'HOT_CUE' || activeMode === 'KEYBOARD'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] tracking-wider uppercase text-amber-400">HOT CUE</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">KEYBOARD</span>
          </button>

          {/* 2. PAD FX1 / PAD FX2 */}
          <button
            onClick={() => selectMode('PAD_FX1', 'PAD_FX2')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] font-black transition-all ${
              activeMode === 'PAD_FX1' || activeMode === 'PAD_FX2'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] tracking-wider uppercase text-cyan-400">PAD FX1</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">PAD FX2</span>
          </button>

          {/* 3. BEAT JUMP / BEAT LOOP */}
          <button
            onClick={() => selectMode('BEAT_JUMP', 'BEAT_LOOP')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] font-black transition-all ${
              activeMode === 'BEAT_JUMP' || activeMode === 'BEAT_LOOP'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] tracking-wider uppercase text-emerald-400">BEAT JUMP</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">BEAT LOOP</span>
          </button>

          {/* 4. SAMPLER / KEY SHIFT */}
          <button
            onClick={() => selectMode('SAMPLER', 'KEY_SHIFT')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-[10px] font-black transition-all ${
              activeMode === 'SAMPLER' || activeMode === 'KEY_SHIFT'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500 shadow-lg shadow-purple-500/20'
                : 'bg-slate-950 border-slate-800/90 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] tracking-wider uppercase text-purple-400">SAMPLER</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">KEY SHIFT</span>
          </button>
        </div>
      </div>

      {/* Active Mode Status Badge */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          ACTIVE PAD MODE: <span className="text-amber-400 font-black">{activeMode.replace('_', ' ')}</span>
        </span>
        {shiftActive && (
          <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded shadow">
            SHIFT HELD
          </span>
        )}
      </div>

      {/* 8 Pioneer DDJ Metallic Performance Pads Grid (2 rows of 4) */}
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 8 }).map((_, idx) => {
          const cue = deckState.hotCues[idx];
          const hasCue = activeMode === 'HOT_CUE' && cue !== null;
          const isFxActive = (activeMode === 'PAD_FX1' || activeMode === 'PAD_FX2') && activePadFx === idx;

          return (
            <button
              key={idx}
              onClick={() => handlePadPress(idx)}
              className={`h-14 sm:h-16 rounded-xl flex flex-col items-center justify-center p-1 transition-all duration-75 border-2 relative overflow-hidden active:scale-95 cursor-pointer shadow-lg ${
                isFxActive
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-cyan-500/60 font-black animate-pulse'
                  : hasCue
                  ? 'border-amber-400 text-white font-black shadow-amber-500/40'
                  : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-amber-500/80 hover:border-amber-400 text-amber-300 hover:text-white shadow-inner'
              }`}
              style={{
                backgroundColor: hasCue && cue ? cue.color : undefined,
                boxShadow: hasCue && cue ? `0 0 15px ${cue.color}aa` : '0 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              {/* Pioneer LED Inner Border Ring */}
              <div className="absolute inset-0.5 rounded-lg border border-amber-500/30 pointer-events-none" />

              <span className="text-[11px] font-black tracking-wider drop-shadow-md text-center leading-tight">
                {getPadLabel(idx)}
              </span>

              {hasCue && cue && (
                <span className="text-[9px] font-mono text-white/90">
                  {Math.floor(cue.position / 60)}:{(cue.position % 60).toFixed(1).padStart(4, '0')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
