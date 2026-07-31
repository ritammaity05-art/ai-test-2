import React, { useState, useEffect } from 'react';
import { MIDIManager } from '../../audio/MIDIManager';
import type { MIDIMapping } from '../../types/dj';
import { X, Radio, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface MIDIMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MIDIMappingModal: React.FC<MIDIMappingModalProps> = ({ isOpen, onClose }) => {
  const midiManager = MIDIManager.getInstance();
  const [devices, setDevices] = useState<{ id: string; name: string; manufacturer: string }[]>(midiManager.devices);
  const [mappings, setMappings] = useState<MIDIMapping[]>(midiManager.getMappings());
  const [learningTarget, setLearningTarget] = useState<string | null>(null);

  useEffect(() => {
    midiManager.setDevicesChangedCallback((devs) => setDevices(devs));
  }, [midiManager]);

  if (!isOpen) return null;

  const targetOptions = [
    { target: 'deckA.play', label: 'Deck A - Play / Pause' },
    { target: 'deckA.cue', label: 'Deck A - Cue' },
    { target: 'deckA.hotcue1', label: 'Deck A - Hot Cue 1' },
    { target: 'deckA.hotcue2', label: 'Deck A - Hot Cue 2' },
    { target: 'deckA.pitch', label: 'Deck A - Pitch Fader' },
    { target: 'deckB.play', label: 'Deck B - Play / Pause' },
    { target: 'deckB.cue', label: 'Deck B - Cue' },
    { target: 'deckB.hotcue1', label: 'Deck B - Hot Cue 1' },
    { target: 'deckB.hotcue2', label: 'Deck B - Hot Cue 2' },
    { target: 'deckB.pitch', label: 'Deck B - Pitch Fader' },
    { target: 'mixer.crossfader', label: 'Mixer - Crossfader' },
    { target: 'mixer.deckAFader', label: 'Mixer - Deck A Fader' },
    { target: 'mixer.deckBFader', label: 'Mixer - Deck B Fader' },
  ];

  const handleStartLearn = (target: string) => {
    setLearningTarget(target);
    midiManager.startLearning(target, () => {
      setMappings(midiManager.getMappings());
      setLearningTarget(null);
    });
  };

  const handleDelete = (target: string) => {
    midiManager.deleteMapping(target);
    setMappings(midiManager.getMappings());
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black tracking-wide">Web MIDI Controller Mapping</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Connected MIDI Devices:</span>
          {devices.length === 0 ? (
            <p className="text-xs text-amber-400 font-medium">
              No MIDI hardware detected. Plug in your Pioneer, Numark, or USB MIDI DJ controller and make sure browser permissions are granted.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/60 border border-cyan-800 rounded-lg text-xs font-bold text-cyan-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          <span className="text-xs font-bold text-slate-400 uppercase">MIDI Mappings & Interactive Learn:</span>
          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {targetOptions.map((opt) => {
              const mapped = mappings.find((m) => m.target === opt.target);
              const isLearningThis = learningTarget === opt.target;

              return (
                <div key={opt.target} className="flex items-center justify-between p-3 text-xs">
                  <span className="font-bold text-slate-200">{opt.label}</span>

                  <div className="flex items-center gap-3">
                    {mapped ? (
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {mapped.name} ({mapped.type.toUpperCase()})
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Unmapped</span>
                    )}

                    {isLearningThis ? (
                      <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black rounded animate-pulse">
                        PRESS CONTROL NOW...
                      </span>
                    ) : (
                      <button
                        onClick={() => handleStartLearn(opt.target)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        MIDI Learn
                      </button>
                    )}

                    {mapped && (
                      <button onClick={() => handleDelete(opt.target)} className="text-slate-500 hover:text-red-400 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-black text-xs text-white rounded-lg">
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
