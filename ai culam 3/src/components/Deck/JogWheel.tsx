import React, { useRef, useState, useEffect } from 'react';

interface JogWheelProps {
  isPlaying: boolean;
  vinylMode: boolean;
  accentColor?: string;
  onScratchSpeed: (speedRatio: number) => void;
  onPitchBend: (nudge: number) => void;
  deckLabel: string;
}

export const JogWheel: React.FC<JogWheelProps> = ({
  isPlaying,
  vinylMode,
  accentColor = '#3b82f6',
  onScratchSpeed,
  onPitchBend,
  deckLabel,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastAngleRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Automatic spinning when playing
  useEffect(() => {
    let animId: number;
    const spin = () => {
      if (isPlaying && !isDragging) {
        setRotationAngle((prev) => (prev + 1.2) % 360);
      }
      animId = requestAnimationFrame(spin);
    };
    animId = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isDragging]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    lastAngleRef.current = Math.atan2(clientY - centerY, clientX - centerX);
    lastTimeRef.current = performance.now();
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const currentAngle = Math.atan2(clientY - centerY, clientX - centerX);
      let deltaAngle = currentAngle - lastAngleRef.current;

      // Handle wrapping at PI / -PI
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      const now = performance.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // seconds

      if (deltaTime > 0) {
        const angularVelocity = deltaAngle / deltaTime; // rad/s
        const speedRatio = angularVelocity / (2 * Math.PI * 0.5); // normalized to 33 RPM

        if (vinylMode) {
          onScratchSpeed(speedRatio);
        } else {
          const nudge = Math.max(-1, Math.min(1, speedRatio * 0.3));
          onPitchBend(nudge);
        }
      }

      setRotationAngle((prev) => (prev + (deltaAngle * 180) / Math.PI) % 360);

      lastAngleRef.current = currentAngle;
      lastTimeRef.current = now;
    };

    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onScratchSpeed(1.0);
        onPitchBend(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, vinylMode, onScratchSpeed, onPitchBend]);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full cursor-grab active:cursor-grabbing select-none shadow-2xl flex items-center justify-center border-4 border-slate-800 bg-slate-950 transition-transform active:scale-[0.99]"
        style={{
          boxShadow: isDragging ? `0 0 25px ${accentColor}88` : '0 10px 25px rgba(0,0,0,0.8)',
        }}
      >
        {/* Outer LED Accent Ring */}
        <div
          className="absolute inset-1 rounded-full border-2 border-dashed opacity-40 transition-opacity"
          style={{ borderColor: accentColor }}
        />

        {/* Vinyl Disc Grooves */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-transform"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <svg className="w-full h-full text-slate-900" viewBox="0 0 200 200">
            {/* Concentric vinyl groove circles */}
            <circle cx="100" cy="100" r="95" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <circle cx="100" cy="100" r="85" fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="#334155" strokeWidth="1" />
            <circle cx="100" cy="100" r="65" fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx="100" cy="100" r="55" fill="none" stroke="#334155" strokeWidth="1" />

            {/* Vinyl marker stripe */}
            <line x1="100" y1="10" x2="100" y2="40" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          </svg>

          {/* Center Label Platter */}
          <div
            className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 border-slate-700 shadow-inner"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-slate-950 font-black text-xs tracking-wider">{deckLabel}</span>
            <span className="text-slate-900 font-bold text-[10px]">
              {vinylMode ? 'VINYL' : 'PITCH'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
