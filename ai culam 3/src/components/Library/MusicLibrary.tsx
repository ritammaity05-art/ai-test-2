import React, { useState, useEffect } from 'react';
import type { Track, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { AudioAnalyzer } from '../../audio/AudioAnalyzer';
import { AIStepSeparator } from '../../audio/AIStepSeparator';
import { DEMO_TRACK_METADATA, generateDemoTrack } from '../../utils/demoTracks';
import { StemBundleModal } from '../Modals/StemBundleModal';
import { FolderPlus, Search, Disc, Music, Sparkles, Cpu, Layers } from 'lucide-react';

interface MusicLibraryProps {
  deckATrack: Track | null;
  deckBTrack: Track | null;
}

export const MusicLibrary: React.FC<MusicLibraryProps> = ({
  deckATrack,
  deckBTrack,
}) => {
  const engine = AudioEngine.getInstance();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Track>('title');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'history'>('all');
  const [history, setHistory] = useState<Track[]>([]);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadDemos = async () => {
      setIsProcessingAI(true);
      try {
        const loadedDemos: Track[] = [];
        for (const meta of DEMO_TRACK_METADATA) {
          const track = await generateDemoTrack(engine.ctx, meta);
          loadedDemos.push(track);
        }
        setTracks(loadedDemos);
      } catch (err) {
        console.error('Failed to generate demo tracks:', err);
      } finally {
        setIsProcessingAI(false);
      }
    };
    loadDemos();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingAI(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer);

        const analysis = await AudioAnalyzer.analyze(audioBuffer);
        const stemBuffers = await AIStepSeparator.separate(engine.ctx, audioBuffer);

        const newTrack: Track = {
          id: `file-${Date.now()}-${i}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local Import',
          duration: audioBuffer.duration,
          bpm: analysis.bpm,
          key: analysis.key,
          audioBuffer,
          stemBuffers,
          peakData: analysis.peakData,
          overviewPeaks: analysis.overviewPeaks,
          file,
          addedAt: Date.now(),
        };

        setTracks((prev) => [newTrack, ...prev]);
      } catch (err) {
        console.error('Failed to decode and separate audio file:', file.name, err);
      }
    }
    setIsProcessingAI(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const loadToDeck = (track: Track, deckId: DeckId) => {
    if (deckId === 'A') {
      engine.deckA.loadTrack(track);
    } else {
      engine.deckB.loadTrack(track);
    }

    setHistory((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
  };

  const displayTracks = activeTab === 'history' ? history : tracks;

  const filteredTracks = displayTracks
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q));
      const matchesGenre = genreFilter === 'all' || t.genre === genreFilter;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      const valA = a[sortField] ?? '';
      const valB = b[sortField] ?? '';

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const handleSort = (field: keyof Track) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col gap-3 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-lg w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-black text-white tracking-wider">MUSIC LIBRARY</h2>
          {isProcessingAI && (
            <span className="text-xs text-cyan-400 font-bold animate-pulse flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              <Cpu className="w-3.5 h-3.5 animate-spin" /> AI Separating Song Stems (Vocals, Instruments, Bass, Beat)...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'all' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tracks ({tracks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'history' ? 'bg-blue-600 text-white font-black' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recently Played ({history.length})
            </button>
          </div>

          {/* Studio 4-Stem Bundle Loader Button */}
          <button
            onClick={() => setIsBundleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-lg transition-all shadow-md active:scale-95 border border-cyan-400"
          >
            <Layers className="w-4 h-4" />
            <span>Add Studio 4-Stem Bundle</span>
          </button>

          {/* Standard Single Audio File Loader */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg cursor-pointer transition-all shadow-md active:scale-95">
            <FolderPlus className="w-4 h-4" />
            <span>Add Audio Files</span>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.flac,.ogg,.aac"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tracks by title, artist, or genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Genres</option>
          <option value="Synthwave">Synthwave</option>
          <option value="Deep House">Deep House</option>
          <option value="Peak Techno">Peak Techno</option>
          <option value="Funk / Nu-Disco">Funk / Nu-Disco</option>
        </select>
      </div>

      <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-xl bg-slate-900/60">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>
                Title {sortField === 'title' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('artist')}>
                Artist {sortField === 'artist' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('bpm')}>
                BPM {sortField === 'bpm' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('key')}>
                Key {sortField === 'key' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5 cursor-pointer hover:text-white" onClick={() => handleSort('duration')}>
                Length {sortField === 'duration' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="p-2.5">Stems AI Status</th>
              <th className="p-2.5 text-right">Load to Deck</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs font-medium text-slate-300">
            {filteredTracks.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500 font-bold">
                  No tracks found. Drag & drop audio files here or click "Add Audio Files" / "Add Studio 4-Stem Bundle".
                </td>
              </tr>
            ) : (
              filteredTracks.map((t) => {
                const isLoadedA = deckATrack?.id === t.id;
                const isLoadedB = deckBTrack?.id === t.id;
                const hasStems = !!t.stemBuffers;

                return (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="p-2.5 font-bold text-white flex items-center gap-2">
                      <Disc className={`w-3.5 h-3.5 ${isLoadedA ? 'text-blue-400' : isLoadedB ? 'text-pink-400' : 'text-slate-500'}`} />
                      <span>{t.title}</span>
                    </td>
                    <td className="p-2.5 text-slate-400">{t.artist}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-400">{t.bpm}</td>
                    <td className="p-2.5 font-mono font-bold text-amber-400">{t.key}</td>
                    <td className="p-2.5 font-mono text-slate-400">{formatDuration(t.duration)}</td>
                    <td className="p-2.5">
                      {hasStems ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1 w-fit">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          4 STEMS READY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => loadToDeck(t, 'A')}
                          className={`px-2.5 py-1 rounded text-xs font-black transition-all border shadow-sm ${
                            isLoadedA
                              ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/50'
                              : 'bg-blue-950/60 hover:bg-blue-600 border-blue-800/80 text-blue-300 hover:text-white'
                          }`}
                        >
                          {isLoadedA ? 'LOADED A' : 'DECK A'}
                        </button>
                        <button
                          onClick={() => loadToDeck(t, 'B')}
                          className={`px-2.5 py-1 rounded text-xs font-black transition-all border shadow-sm ${
                            isLoadedB
                              ? 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-500/50'
                              : 'bg-pink-950/60 hover:bg-pink-600 border-pink-800/80 text-pink-300 hover:text-white'
                          }`}
                        >
                          {isLoadedB ? 'LOADED B' : 'DECK B'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Stem Bundle Modal */}
      <StemBundleModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        onTrackCreated={(track) => setTracks((prev) => [track, ...prev])}
      />
    </div>
  );
};
