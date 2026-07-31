import React, { useState, useEffect } from 'react';
import { RecorderEngine } from '../../audio/RecorderEngine';
import { MIDIManager } from '../../audio/MIDIManager';
import { AudioEngine } from '../../audio/AudioEngine';
import { Disc, Mic, Keyboard, Radio, Settings, Download } from 'lucide-react';

interface HeaderProps {
  onOpenMIDIModal: () => void;
  onOpenKeyboardModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMIDIModal,
  onOpenKeyboardModal,
  onOpenSettingsModal,
}) => {
  const [recorderEngine] = useState<RecorderEngine>(() => new RecorderEngine());
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recDuration, setRecDuration] = useState<number>(0);
  const [recBlobUrl, setRecBlobUrl] = useState<string | null>(null);

  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [audioRunning, setAudioRunning] = useState<boolean>(false);

  useEffect(() => {
    recorderEngine.setCallback((recording, duration, blobUrl) => {
      setIsRecording(recording);
      setRecDuration(duration);
      if (blobUrl) setRecBlobUrl(blobUrl);
    });

    const midiManager = MIDIManager.getInstance();
    setMidiConnected(midiManager.isConnected);
    midiManager.setDevicesChangedCallback((devs) => {
      setMidiConnected(devs.length > 0);
    });

    const engine = AudioEngine.getInstance();
    setAudioRunning(engine.ctx.state === 'running');
  }, []);

  const handleStartAudio = async () => {
    const engine = AudioEngine.getInstance();
    const running = await engine.resumeAudioContext();
    setAudioRunning(running);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recorderEngine.stopRecording();
    } else {
      setRecBlobUrl(null);
      recorderEngine.startRecording();
    }
  };

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-6 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-30 shadow-2xl">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Disc className="w-6 h-6 text-white animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-lg font-black text-white tracking-wider flex items-center gap-2">
            TINO DJ <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-black tracking-widest uppercase">PRO</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">Browser Audio & MIDI Engine</p>
        </div>
      </div>

      {/* Center Live Mix Recorder */}
      <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-1.5 rounded-xl border border-slate-800 shadow-inner">
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black transition-all shadow-md active:scale-95 border ${
            isRecording
              ? 'bg-red-600 text-white border-red-400 shadow-red-500/50 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Mic className={`w-3.5 h-3.5 ${isRecording ? 'animate-ping' : ''}`} />
          {isRecording ? 'STOP REC' : 'RECORD MIX'}
        </button>

        {isRecording && (
          <span className="font-mono text-xs font-bold text-red-400">
            {formatRecTime(recDuration)}
          </span>
        )}

        {recBlobUrl && !isRecording && (
          <a
            href={recBlobUrl}
            download={`tino-dj-mix-${Date.now()}.webm`}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800"
          >
            <Download className="w-3.5 h-3.5" />
            Download Recording
          </a>
        )}
      </div>

      {/* Right Controls & Status Badges */}
      <div className="flex items-center gap-2">
        {/* Audio Context Status / Resume Button */}
        {!audioRunning ? (
          <button
            onClick={handleStartAudio}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all animate-bounce shadow-lg"
          >
            Start Audio Engine
          </button>
        ) : (
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Audio Engine Active
          </span>
        )}

        {/* MIDI Controller Badge */}
        <button
          onClick={onOpenMIDIModal}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            midiConnected
              ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>{midiConnected ? 'MIDI Device Connected' : 'MIDI Learn'}</span>
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          onClick={onOpenKeyboardModal}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* App Settings Trigger */}
        <button
          onClick={onOpenSettingsModal}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 transition-colors"
          title="Audio & Performance Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
