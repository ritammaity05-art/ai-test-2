// Reality Debug Panel & Source Code Visualizer for TINO Reality Debugger
import React, { useEffect, useState } from 'react';
import { Terminal, Cpu, Zap, Code, Shield, RotateCcw } from 'lucide-react';
import type { DetectedObject } from '../services/visionScanner';

interface RealityDebugPanelProps {
  targetObject: DetectedObject | null;
  onResetObject?: () => void;
  onUpdateState?: (key: keyof DetectedObject['realityState'], val: unknown) => void;
}

export const RealityDebugPanel: React.FC<RealityDebugPanelProps> = ({
  targetObject,
  onResetObject,
  onUpdateState
}) => {
  const [modifiedKey, setModifiedKey] = useState<string | null>(null);

  const { gravity, color, scale, timeFrozen, physics, dissolved } = targetObject?.realityState || {
    gravity: true,
    color: 'default',
    scale: 1.0,
    timeFrozen: false,
    physics: 'metal',
    dissolved: false
  };

  // Track property changes for glowing code line animation
  useEffect(() => {
    setModifiedKey('all');
    const timer = setTimeout(() => setModifiedKey(null), 800);
    return () => clearTimeout(timer);
  }, [gravity, color, scale, timeFrozen, physics, dissolved]);

  if (!targetObject) {
    return (
      <div className="cyber-glass-panel p-4 w-80 text-xs font-mono border-cyan-500/30 text-cyan-400">
        <div className="flex items-center gap-2 mb-2 text-cyan-300">
          <Terminal className="w-4 h-4 animate-pulse" />
          <span className="font-bold tracking-widest">REALITY DEBUGGER</span>
        </div>
        <p className="text-gray-400">NO TARGET LOCKED. POINT FINGER OR CLICK OBJECT TO INITIALIZE DEBUGER.</p>
      </div>
    );
  }

  return (
    <div className="cyber-glass-panel w-96 p-5 border border-cyan-400/40 text-xs font-mono shadow-2xl relative overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-300">
          <Code className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold tracking-wider text-sm glow-cyan">REALITY DEBUG MATRIX</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px]">
          ID: {targetObject.id}
        </span>
      </div>

      {/* Target Details */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded bg-black/40 border border-cyan-500/20">
        <div>
          <span className="text-gray-400 text-[10px] block">TARGET OBJECT</span>
          <span className="font-bold text-white tracking-wide">{targetObject.label}</span>
        </div>
        <div>
          <span className="text-gray-400 text-[10px] block">CONFIDENCE</span>
          <span className="font-bold text-cyan-400">{Math.round(targetObject.confidence * 100)}%</span>
        </div>
      </div>

      {/* Status Indicators Grid */}
      <div className="space-y-1.5 mb-4">
        <div 
          onClick={() => onUpdateState && onUpdateState('gravity', !gravity)}
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
            !gravity ? 'bg-purple-950/40 border-purple-500/50 text-purple-300' : 'bg-black/30 border-cyan-500/20 text-gray-300 hover:border-cyan-400/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" /> GRAVITY
          </span>
          <span className={`font-bold ${!gravity ? 'text-purple-400 glow-purple' : 'text-cyan-400'}`}>
            {gravity ? 'ON' : 'OFF [FLOATING]'}
          </span>
        </div>

        <div 
          onClick={() => onUpdateState && onUpdateState('color', color === 'default' ? 'purple' : 'default')}
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
            color === 'purple' ? 'bg-purple-950/40 border-purple-500/50 text-purple-300' : 'bg-black/30 border-cyan-500/20 text-gray-300 hover:border-cyan-400/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-purple-400" /> COLOR SHADER
          </span>
          <span className={`font-bold ${color === 'purple' ? 'text-purple-300 glow-purple' : 'text-cyan-400'}`}>
            {color === 'purple' ? 'PURPLE HOLO' : 'DEFAULT'}
          </span>
        </div>

        <div 
          onClick={() => onUpdateState && onUpdateState('scale', scale > 1.0 ? 1.0 : 3.0)}
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
            scale > 1.0 ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-300' : 'bg-black/30 border-cyan-500/20 text-gray-300 hover:border-cyan-400/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> SCALE MATRIX
          </span>
          <span className={`font-bold ${scale > 1.0 ? 'text-cyan-300 glow-cyan' : 'text-gray-400'}`}>
            {scale > 1.0 ? '300% (3.0x)' : '100%'}
          </span>
        </div>

        <div 
          onClick={() => onUpdateState && onUpdateState('timeFrozen', !timeFrozen)}
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all border ${
            timeFrozen ? 'bg-cyan-950/60 border-cyan-400/80 text-cyan-200' : 'bg-black/30 border-cyan-500/20 text-gray-300 hover:border-cyan-400/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" /> TIME STATE
          </span>
          <span className={`font-bold ${timeFrozen ? 'text-cyan-300 glow-cyan' : 'text-gray-400'}`}>
            {timeFrozen ? 'FROZEN' : 'RUNNING'}
          </span>
        </div>
      </div>

      {/* FAKE SOURCE CODE EDITING VIEW */}
      <div className="relative rounded bg-black/90 p-3 border border-cyan-500/40 font-mono text-[11px] leading-relaxed shadow-inner">
        <div className="text-gray-500 text-[10px] mb-1 flex items-center justify-between">
          <span>// REALITY_OBJECT_COMPILER.ts</span>
          <span className="text-cyan-400 animate-pulse">LIVE EDITS</span>
        </div>
        <pre className="text-gray-300 overflow-x-auto">
          <code>
            <span className="text-purple-400">class</span> <span className="text-yellow-300">Object</span> {'{\n'}
            {'  '}
            <span className={modifiedKey ? 'line-modified text-cyan-300' : 'text-cyan-400'}>
              gravity = <span className="text-amber-300">{gravity ? 'true' : 'false'}</span>;
            </span>{'\n'}
            {'  '}
            <span className={modifiedKey ? 'line-modified text-purple-300' : 'text-purple-400'}>
              color = <span className="text-green-300">"{color}"</span>;
            </span>{'\n'}
            {'  '}
            <span className={modifiedKey ? 'line-modified text-blue-300' : 'text-blue-400'}>
              scale = <span className="text-amber-300">{scale.toFixed(1)}</span>;
            </span>{'\n'}
            {'  '}
            <span className={modifiedKey ? 'line-modified text-red-300' : 'text-red-400'}>
              time = <span className="text-green-300">"{timeFrozen ? 'frozen' : 'running'}"</span>;
            </span>{'\n'}
            {'  '}
            <span className="text-gray-400">
              physics = <span className="text-green-300">"{physics}"</span>;
            </span>{'\n'}
            {'}'}
          </code>
        </pre>
      </div>

      {/* Reset Button Footer */}
      {onResetObject && (
        <button
          onClick={onResetObject}
          className="mt-3 w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded flex items-center justify-center gap-2 transition-all cursor-pointer text-[11px] tracking-wider"
        >
          <RotateCcw className="w-3.5 h-3.5" /> RE-CALIBRATE REALITY STATE [PINCH]
        </button>
      )}
    </div>
  );
};
