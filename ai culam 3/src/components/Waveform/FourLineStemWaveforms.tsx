import React, { useRef, useEffect } from 'react';
import type { Track, StemsState, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { Mic, Music2, VolumeX, Layers } from 'lucide-react';

interface FourLineStemWaveformsProps {
  deckId: DeckId;
  track: Track | null;
  currentTime: number;
  duration: number;
  stems: StemsState;
  onSeek: (seconds: number) => void;
}

export const FourLineStemWaveforms: React.FC<FourLineStemWaveformsProps> = ({
  deckId,
  track,
  currentTime,
  duration,
  stems,
  onSeek,
}) => {
  const engine = AudioEngine.getInstance();
  const deckNode = deckId === 'A' ? engine.deckA : engine.deckB;

  const canvasRefVocal = useRef<HTMLCanvasElement | null>(null);
  const canvasRefInst = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBass = useRef<HTMLCanvasElement | null>(null);
  const canvasRefDrums = useRef<HTMLCanvasElement | null>(null);

  const toggleStem = (key: keyof StemsState) => {
    deckNode.setStems({ [key]: !stems[key] });
  };

  const renderStemCanvas = (
    canvas: HTMLCanvasElement | null,
    peaks: Float32Array | undefined,
    color: string,
    isActive: boolean
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    if (!track || duration <= 0 || !peaks || peaks.length === 0) {
      return;
    }

    const zoomLevel = 6; // Display 6 seconds window
    const startTime = currentTime - zoomLevel / 2;
    const endTime = currentTime + zoomLevel / 2;

    const secondsToX = (t: number) => ((t - startTime) / zoomLevel) * width;
    const midY = height / 2;
    const maxAmp = height / 2 - 2;

    const totalPeaks = peaks.length;
    const startPeakIdx = Math.max(0, Math.floor((startTime / duration) * totalPeaks));
    const endPeakIdx = Math.min(totalPeaks - 1, Math.ceil((endTime / duration) * totalPeaks));

    ctx.fillStyle = isActive ? color : '#334155';

    for (let i = startPeakIdx; i <= endPeakIdx; i++) {
      const peakTime = (i / totalPeaks) * duration;
      const x = secondsToX(peakTime);
      const amp = peaks[i] * maxAmp;
      ctx.fillRect(x, midY - amp, 2, amp * 2);
    }

    // Playhead center needle
    const playheadX = width / 2;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(playheadX - 1, 0, 2, height);
  };

  useEffect(() => {
    // Generate dummy stem peaks if not computed yet
    const basePeaks = track?.peakData || new Float32Array(0);

    renderStemCanvas(canvasRefVocal.current, track?.vocalPeaks || basePeaks, '#a855f7', stems.vocals);
    renderStemCanvas(canvasRefInst.current, track?.instPeaks || basePeaks, '#06b6d4', stems.instruments);
    renderStemCanvas(canvasRefBass.current, track?.bassPeaks || basePeaks, '#f59e0b', stems.bass);
    renderStemCanvas(canvasRefDrums.current, track?.drumsPeaks || basePeaks, '#10b981', stems.drums);
  }, [track, currentTime, duration, stems]);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!track || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const zoomLevel = 6;
    const startTime = currentTime - zoomLevel / 2;
    const target = startTime + (clickX / rect.width) * zoomLevel;
    onSeek(target);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-950/95 rounded-2xl border-2 border-slate-800 shadow-2xl backdrop-blur-md w-full">
      <div className="flex items-center justify-between px-1 border-b border-slate-800/80 pb-1.5">
        <span className="text-xs font-black text-white uppercase tracking-wider">
          4-LINE STEM WAVEFORM CHANNELS & ON/OFF SWITCHES
        </span>
        <span className="text-[10px] text-slate-400 font-bold">
          Click any ON/OFF switch to isolate or mute that waveform line!
        </span>
      </div>

      {/* 4 Parallel Waveform Lines */}
      <div className="flex flex-col gap-1.5" onClick={handleSeekClick}>
        {/* LINE 1: VOCALS */}
        <div className="flex items-center gap-2 h-9 bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStem('vocals');
            }}
            className={`w-28 h-full rounded text-[10px] font-black flex items-center justify-center gap-1 transition-all border shadow ${
              stems.vocals
                ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <Mic className="w-3 h-3" />
            VOCAL {stems.vocals ? 'ON' : 'OFF'}
          </button>
          <div className="flex-1 h-full relative cursor-pointer">
            <canvas ref={canvasRefVocal} className="w-full h-full" />
          </div>
        </div>

        {/* LINE 2: INSTRUMENT (Melodies, Synths, Guitars, Keys) */}
        <div className="flex items-center gap-2 h-9 bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStem('instruments');
            }}
            className={`w-28 h-full rounded text-[10px] font-black flex items-center justify-center gap-1 transition-all border shadow ${
              stems.instruments
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <Music2 className="w-3 h-3" />
            INSTRUMENT {stems.instruments ? 'ON' : 'OFF'}
          </button>
          <div className="flex-1 h-full relative cursor-pointer">
            <canvas ref={canvasRefInst} className="w-full h-full" />
          </div>
        </div>

        {/* LINE 3: BASS */}
        <div className="flex items-center gap-2 h-9 bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStem('bass');
            }}
            className={`w-28 h-full rounded text-[10px] font-black flex items-center justify-center gap-1 transition-all border shadow ${
              stems.bass
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/30'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <VolumeX className="w-3 h-3" />
            BASS {stems.bass ? 'ON' : 'OFF'}
          </button>
          <div className="flex-1 h-full relative cursor-pointer">
            <canvas ref={canvasRefBass} className="w-full h-full" />
          </div>
        </div>

        {/* LINE 4: BEAT / DRUMS */}
        <div className="flex items-center gap-2 h-9 bg-slate-900 rounded-lg p-1 border border-slate-800 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStem('drums');
            }}
            className={`w-28 h-full rounded text-[10px] font-black flex items-center justify-center gap-1 transition-all border shadow ${
              stems.drums
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/30'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            BEAT {stems.drums ? 'ON' : 'OFF'}
          </button>
          <div className="flex-1 h-full relative cursor-pointer">
            <canvas ref={canvasRefDrums} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
