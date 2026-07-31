import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardModal: React.FC<KeyboardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const defaultHotkeys = [
    { key: 'Space', action: 'Deck A Play / Pause' },
    { key: 'KeyQ', action: 'Deck A Cue' },
    { key: 'KeyW', action: 'Deck A Sync' },
    { key: 'KeyE', action: 'Deck A Hot Cue 1' },
    { key: 'KeyR', action: 'Deck A Auto Loop 4 Beats' },
    { key: 'Enter', action: 'Deck B Play / Pause' },
    { key: 'KeyI', action: 'Deck B Cue' },
    { key: 'KeyO', action: 'Deck B Sync' },
    { key: 'KeyP', action: 'Deck B Hot Cue 1' },
    { key: 'KeyL', action: 'Deck B Auto Loop 4 Beats' },
    { key: 'ArrowLeft', action: 'Nudge Crossfader Left' },
    { key: 'ArrowRight', action: 'Nudge Crossfader Right' },
    { key: 'ArrowUp', action: 'Master Volume Up' },
    { key: 'ArrowDown', action: 'Master Volume Down' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-black tracking-wide">Desktop Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 max-h-80 overflow-y-auto">
          {defaultHotkeys.map((hk) => (
            <div key={hk.key} className="flex items-center justify-between p-3 text-xs">
              <span className="font-bold text-slate-300">{hk.action}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded font-mono font-black text-amber-400 shadow">
                {hk.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-black text-xs text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
