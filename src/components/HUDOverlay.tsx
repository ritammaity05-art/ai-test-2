// Futuristic HUD Telemetry Overlay Component for TINO Reality Debugger
import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Eye, 
  Volume2, 
  VolumeX, 
  Hand, 
  Maximize2, 
  Sparkles,
  Zap,
  Flame,
  Radio
} from 'lucide-react';
import type { HandGesture } from '../services/gestureDetector';
import type { DetectedObject } from '../services/visionScanner';
import { audioEngine } from '../services/audioEngine';

interface HUDOverlayProps {
  fps: number;
  aiStatus: string;
  trackingQuality: number;
  currentGesture: HandGesture;
  currentObject: DetectedObject | null;
  onSnapTriggered?: () => void;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  fps,
  aiStatus,
  trackingQuality,
  currentGesture,
  currentObject,
  onSnapTriggered
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cpuUsage, setCpuUsage] = useState<number>(14);

  // Simulated CPU usage fluctuation for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(12 + Math.random() * 16));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  // Map gesture to human label & icon
  const getGestureInfo = (gesture: HandGesture) => {
    switch (gesture) {
      case 'OPEN_PALM':
        return { label: 'OPEN PALM', power: 'TIME = FREEZE', color: 'text-cyan-400 border-cyan-400', icon: Hand };
      case 'FIST':
        return { label: 'FIST', power: 'GRAVITY = OFF', color: 'text-purple-400 border-purple-400', icon: Flame };
      case 'OK_SIGN':
        return { label: 'OK GESTURE', power: 'COLOR = PURPLE HOLO', color: 'text-purple-300 border-purple-400', icon: Sparkles };
      case 'TWO_FINGERS':
        return { label: 'TWO FINGERS', power: 'SCALE = 300%', color: 'text-cyan-300 border-cyan-400', icon: Maximize2 };
      case 'POINTING_FINGER':
        return { label: 'POINTING FINGER', power: 'TARGET LOCK ON', color: 'text-amber-400 border-amber-400', icon: Eye };
      case 'PINCH':
        return { label: 'PINCH', power: 'RESET TO DEFAULT', color: 'text-red-400 border-red-400', icon: Zap };
      default:
        return { label: 'NO GESTURE', power: 'AWAITING INPUT', color: 'text-gray-500 border-gray-700', icon: Radio };
    }
  };

  const gestureInfo = getGestureInfo(currentGesture);
  const GestureIcon = gestureInfo.icon;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 select-none font-mono">
      {/* TOP BAR */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Logo & Engine Title */}
        <div className="cyber-glass-panel px-5 py-3 pointer-events-auto flex items-center gap-3 border-cyan-500/40">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <div>
            <h1 className="text-base font-extrabold tracking-widest text-white glow-cyan flex items-center gap-2">
              TINO <span className="text-cyan-400 font-normal">REALITY DEBUGGER</span>
            </h1>
            <p className="text-[10px] text-cyan-500/80 tracking-widest">v3.0.4 // AI OPERATING SYSTEM</p>
          </div>
        </div>

        {/* Top Right: Telemetry metrics & Mute toggle */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Audio Mute Button */}
          <button
            onClick={handleToggleMute}
            className="cyber-glass-panel p-3 text-cyan-400 hover:text-white transition-all border-cyan-500/40 cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Telemetry Stats Panel */}
          <div className="cyber-glass-panel px-4 py-2.5 flex items-center gap-5 border-cyan-500/40 text-xs">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <div>
                <span className="text-[9px] text-gray-400 block">FRAME RATE</span>
                <span className="font-bold text-cyan-300">{fps} FPS</span>
              </div>
            </div>

            <div className="h-6 w-px bg-cyan-500/20" />

            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <div>
                <span className="text-[9px] text-gray-400 block">CPU LOAD</span>
                <span className="font-bold text-purple-300">{cpuUsage}%</span>
              </div>
            </div>

            <div className="h-6 w-px bg-cyan-500/20" />

            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <div>
                <span className="text-[9px] text-gray-400 block">AI STATUS</span>
                <span className="font-bold text-cyan-400">{aiStatus}</span>
              </div>
            </div>

            <div className="h-6 w-px bg-cyan-500/20" />

            <div>
              <span className="text-[9px] text-gray-400 block">TRACKING QUALITY</span>
              <span className="font-bold text-green-400">{trackingQuality}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom Left: Current Targeted Object Summary */}
        <div className="cyber-glass-panel p-4 max-w-xs pointer-events-auto border-cyan-500/30">
          <div className="text-[10px] text-gray-400 tracking-wider mb-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            TARGET LOCKED OBJECT
          </div>
          {currentObject ? (
            <div>
              <div className="text-sm font-bold text-white tracking-wide glow-cyan">
                {currentObject.label}
              </div>
              <div className="text-[10px] text-cyan-400/90 mt-1 space-x-2">
                <span>CONF: {Math.round(currentObject.confidence * 100)}%</span>
                <span>GRAVITY: {currentObject.realityState.gravity ? 'ON' : 'OFF'}</span>
                <span>SCALE: {currentObject.realityState.scale * 100}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">NO TARGET OBJECT LOCKED</div>
          )}
        </div>

        {/* Bottom Center: Gesture Recognition Badge */}
        <div className="cyber-glass-panel px-6 py-3 pointer-events-auto flex items-center gap-4 border-cyan-500/40 shadow-xl">
          <div className={`p-2.5 rounded-xl bg-black/60 border ${gestureInfo.color} animate-cyber-pulse`}>
            <GestureIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[9px] text-gray-400 tracking-widest block">RECOGNIZED GESTURE</div>
            <div className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              {gestureInfo.label}
            </div>
            <div className="text-xs font-semibold text-cyan-400 tracking-wide mt-0.5">
              POWER: {gestureInfo.power}
            </div>
          </div>
          {onSnapTriggered && (
            <button
              onClick={onSnapTriggered}
              className="ml-3 px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 text-[10px] font-mono border border-pink-500/50 rounded-lg transition-all cursor-pointer"
            >
              SNAP DISSOLVE
            </button>
          )}
        </div>

        {/* Bottom Right Spacer for Reality Debug Panel layout balance */}
        <div className="w-1" />
      </div>
    </div>
  );
};
