import React, { useState } from 'react';
import type { Track } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { AudioAnalyzer } from '../../audio/AudioAnalyzer';
import { X, Layers, Music, Mic, VolumeX, FolderPlus, Sparkles } from 'lucide-react';

interface StemBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackCreated: (track: Track) => void;
}

export const StemBundleModal: React.FC<StemBundleModalProps> = ({
  isOpen,
  onClose,
  onTrackCreated,
}) => {
  const engine = AudioEngine.getInstance();

  const [title, setTitle] = useState<string>('Custom 4-Stem Song');
  const [artist, setArtist] = useState<string>('Studio Multitrack');

  const [vocalFile, setVocalFile] = useState<File | null>(null);
  const [instFile, setInstFile] = useState<File | null>(null);
  const [bassFile, setBassFile] = useState<File | null>(null);
  const [drumsFile, setDrumsFile] = useState<File | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCreateBundle = async () => {
    if (!vocalFile && !instFile && !bassFile && !drumsFile) return;

    setIsProcessing(true);
    try {
      let vBuf: AudioBuffer | undefined;
      let iBuf: AudioBuffer | undefined;
      let bBuf: AudioBuffer | undefined;
      let dBuf: AudioBuffer | undefined;

      let masterBuf: AudioBuffer | undefined;

      if (vocalFile) {
        vBuf = await engine.ctx.decodeAudioData(await vocalFile.arrayBuffer());
        masterBuf = vBuf;
      }
      if (instFile) {
        iBuf = await engine.ctx.decodeAudioData(await instFile.arrayBuffer());
        if (!masterBuf) masterBuf = iBuf;
      }
      if (bassFile) {
        bBuf = await engine.ctx.decodeAudioData(await bassFile.arrayBuffer());
        if (!masterBuf) masterBuf = bBuf;
      }
      if (drumsFile) {
        dBuf = await engine.ctx.decodeAudioData(await drumsFile.arrayBuffer());
        if (!masterBuf) masterBuf = dBuf;
      }

      if (!masterBuf) return;

      const analysis = await AudioAnalyzer.analyze(masterBuf);

      const newTrack: Track = {
        id: `stem-bundle-${Date.now()}`,
        title: title || 'Custom Stem Song',
        artist: artist || 'Studio Multitrack',
        duration: masterBuf.duration,
        bpm: analysis.bpm,
        key: analysis.key,
        audioBuffer: masterBuf,
        stemBuffers: {
          vocals: vBuf,
          instruments: iBuf,
          bass: bBuf,
          drums: dBuf,
        },
        peakData: analysis.peakData,
        overviewPeaks: analysis.overviewPeaks,
        addedAt: Date.now(),
      };

      onTrackCreated(newTrack);
      onClose();
    } catch (err) {
      console.error('Failed to assemble 4-stem multitrack bundle:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black tracking-wide">Upload Studio 4-Stem Bundle</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Upload 4 separate audio stem files (Vocals, Instruments, Bass, Beat/Drums) for 100% pure studio isolation with zero bleed!
        </p>

        {/* Track Title & Artist */}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Song Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white"
          />
          <input
            type="text"
            placeholder="Artist Name"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-white"
          />
        </div>

        {/* 4 Stem File Selectors */}
        <div className="flex flex-col gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          {/* 1. Vocal Track File */}
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-purple-800/60">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-purple-400" /> 1. Vocal Track
            </span>
            <label className="px-3 py-1 bg-purple-950 hover:bg-purple-800 text-purple-300 border border-purple-700 rounded text-xs font-bold cursor-pointer">
              {vocalFile ? vocalFile.name : 'Choose File'}
              <input type="file" accept="audio/*" onChange={(e) => setVocalFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          {/* 2. Instrument / Melody Track File */}
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-cyan-800/60">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-cyan-400" /> 2. Instrument / Melody Track
            </span>
            <label className="px-3 py-1 bg-cyan-950 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 rounded text-xs font-bold cursor-pointer">
              {instFile ? instFile.name : 'Choose File'}
              <input type="file" accept="audio/*" onChange={(e) => setInstFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          {/* 3. Bass Track File */}
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-amber-800/60">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <VolumeX className="w-4 h-4 text-amber-400" /> 3. Bass Track
            </span>
            <label className="px-3 py-1 bg-amber-950 hover:bg-amber-800 text-amber-300 border border-amber-700 rounded text-xs font-bold cursor-pointer">
              {bassFile ? bassFile.name : 'Choose File'}
              <input type="file" accept="audio/*" onChange={(e) => setBassFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>

          {/* 4. Drums / Beat Track File */}
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-emerald-800/60">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> 4. Beat / Drums Track
            </span>
            <label className="px-3 py-1 bg-emerald-950 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded text-xs font-bold cursor-pointer">
              {drumsFile ? drumsFile.name : 'Choose File'}
              <input type="file" accept="audio/*" onChange={(e) => setDrumsFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleCreateBundle}
            disabled={isProcessing}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-lg"
          >
            {isProcessing ? (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Assembling Multitrack...
              </span>
            ) : (
              <>
                <FolderPlus className="w-4 h-4" />
                Assemble 4-Stem Song
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
