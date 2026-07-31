import React, { useRef, useEffect } from 'react';
import type { Track, CuePoint } from '../../types/dj';

interface OverviewWaveformProps {
  track: Track | null;
  currentTime: number;
  duration: number;
  hotCues: (CuePoint | null)[];
  onSeek: (seconds: number) => void;
  accentColor?: string;
}

export const OverviewWaveform: React.FC<OverviewWaveformProps> = ({
  track,
  currentTime,
  duration,
  hotCues,
  onSeek,
  accentColor = '#3b82f6',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!track || !track.overviewPeaks || duration <= 0) {
      return;
    }

    const peaks = track.overviewPeaks;
    const totalPeaks = peaks.length;
    const midY = height / 2;
    const maxAmp = height / 2 - 2;

    const progressX = (currentTime / duration) * width;

    ctx.fillStyle = accentColor;
    for (let i = 0; i < totalPeaks; i++) {
      const x = (i / totalPeaks) * width;
      const amp = peaks[i] * maxAmp;

      if (x <= progressX) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = '#475569';
      }
      ctx.fillRect(x, midY - amp, 2, amp * 2);
    }

    hotCues.forEach((cue) => {
      if (!cue) return;
      const cx = (cue.position / duration) * width;
      ctx.fillStyle = cue.color;
      ctx.fillRect(cx - 1, 0, 3, height);
    });

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(progressX - 1, 0, 2, height);
  }, [track, currentTime, duration, hotCues, accentColor]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetSeconds = (clickX / rect.width) * duration;
    onSeek(targetSeconds);
  };

  return (
    <div className="w-full h-8 bg-slate-900 rounded overflow-hidden border border-slate-800 cursor-pointer shadow-inner">
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full" />
    </div>
  );
};
