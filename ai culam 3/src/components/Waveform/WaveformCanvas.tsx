import React, { useRef, useEffect, useState } from 'react';
import type { Track, CuePoint, LoopState } from '../../types/dj';

interface WaveformCanvasProps {
  track: Track | null;
  currentTime: number;
  duration: number;
  bpm: number;
  beatGridOffset: number;
  hotCues: (CuePoint | null)[];
  loop: LoopState;
  onSeek: (seconds: number) => void;
  accentColor?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  track,
  currentTime,
  duration,
  bpm,
  beatGridOffset,
  hotCues,
  loop,
  onSeek,
  accentColor = '#3b82f6',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    if (!track || !track.peakData || track.peakData.length === 0) {
      ctx.fillStyle = '#475569';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO TRACK LOADED', width / 2, height / 2);
      return;
    }

    const peaks = track.peakData;
    const totalPeaks = peaks.length;
    const centerTime = currentTime;

    const startTime = centerTime - zoomLevel / 2;
    const endTime = centerTime + zoomLevel / 2;

    const secondsToX = (t: number) => ((t - startTime) / zoomLevel) * width;

    if (bpm > 0) {
      const secondsPerBeat = 60 / bpm;
      let beatTime = beatGridOffset;
      while (beatTime < startTime) beatTime += secondsPerBeat;

      ctx.lineWidth = 1;
      while (beatTime <= endTime) {
        const x = secondsToX(beatTime);
        const isDownbeat = Math.round((beatTime - beatGridOffset) / secondsPerBeat) % 4 === 0;

        ctx.strokeStyle = isDownbeat ? 'rgba(234, 179, 8, 0.6)' : 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        beatTime += secondsPerBeat;
      }
    }

    if (loop.active && loop.start !== null && loop.end !== null) {
      const startX = secondsToX(loop.start);
      const endX = secondsToX(loop.end);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(startX, 0, endX - startX, height);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
    }

    const midY = height / 2;
    const maxAmp = height / 2 - 10;

    const startPeakIdx = Math.max(0, Math.floor((startTime / duration) * totalPeaks));
    const endPeakIdx = Math.min(totalPeaks - 1, Math.ceil((endTime / duration) * totalPeaks));

    ctx.fillStyle = accentColor;
    for (let i = startPeakIdx; i <= endPeakIdx; i++) {
      const peakTime = (i / totalPeaks) * duration;
      const x = secondsToX(peakTime);
      const amp = peaks[i] * maxAmp;

      if (i % 3 === 0) {
        ctx.fillStyle = '#ef4444';
      } else if (i % 3 === 1) {
        ctx.fillStyle = '#10b981';
      } else {
        ctx.fillStyle = accentColor;
      }

      ctx.fillRect(x, midY - amp, 2, amp * 2);
    }

    hotCues.forEach((cue) => {
      if (!cue) return;
      const x = secondsToX(cue.position);
      if (x >= 0 && x <= width) {
        ctx.strokeStyle = cue.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = cue.color;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 16, 0);
        ctx.lineTo(x + 16, 16);
        ctx.lineTo(x, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${cue.id + 1}`, x + 4, 12);
      }
    });

    const playheadX = width / 2;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadX - 6, 0);
    ctx.lineTo(playheadX + 6, 0);
    ctx.lineTo(playheadX, 8);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (let t = Math.floor(startTime); t <= Math.ceil(endTime); t += 1) {
      const x = secondsToX(t);
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      ctx.fillText(timeStr, x, height - 4);
    }
  }, [track, currentTime, duration, bpm, beatGridOffset, hotCues, loop, zoomLevel, accentColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !track || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const startTime = currentTime - zoomLevel / 2;
    const targetSeconds = startTime + (clickX / width) * zoomLevel;
    onSeek(targetSeconds);
  };

  return (
    <div className="relative w-full h-32 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner group">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer"
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity bg-slate-900/80 px-2 py-1 rounded backdrop-blur border border-slate-700 text-xs text-slate-300">
        <span>Zoom:</span>
        <button
          onClick={() => setZoomLevel((z) => Math.max(1, z - 1))}
          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.min(16, z + 1))}
          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded font-bold"
        >
          -
        </button>
      </div>
    </div>
  );
};
