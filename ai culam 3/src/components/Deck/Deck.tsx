import React from 'react';
import type { DeckState, DeckId } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { DeckHeader } from './DeckHeader';
import { WaveformCanvas } from '../Waveform/WaveformCanvas';
import { OverviewWaveform } from '../Waveform/OverviewWaveform';
import { FourLineStemWaveforms } from '../Waveform/FourLineStemWaveforms';
import { JogWheel } from './JogWheel';
import { PerformancePads } from './PerformancePads';
import { StemsControlBar } from './StemsControlBar';
import { LoopControls } from './LoopControls';
import { BeatJumpControls } from './BeatJumpControls';
import { Play, Pause, Square } from 'lucide-react';

interface DeckProps {
  deckId: DeckId;
  state: DeckState;
  accentColor?: string;
  opponentBpm?: number;
}

export const Deck: React.FC<DeckProps> = ({
  deckId,
  state,
  accentColor = deckId === 'A' ? '#3b82f6' : '#ec4899',
  opponentBpm = 128,
}) => {
  const engine = AudioEngine.getInstance();
  const deckNode = deckId === 'A' ? engine.deckA : engine.deckB;

  const handlePlayPause = () => {
    if (state.isPlaying) {
      deckNode.pause();
    } else {
      deckNode.play();
    }
  };

  const handleCue = () => {
    deckNode.cue();
  };

  const handleStop = () => {
    deckNode.stop();
  };

  const handleSeek = (seconds: number) => {
    deckNode.seek(seconds);
  };

  const handleSync = () => {
    if (opponentBpm > 0 && state.originalBpm > 0) {
      const targetPercent = ((opponentBpm - state.originalBpm) / state.originalBpm) * 100;
      deckNode.setPitchPercent(targetPercent);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-lg">
      {/* Deck Header */}
      <DeckHeader
        state={state}
        accentColor={accentColor}
        onPitchChange={(pct) => deckNode.setPitchPercent(pct)}
        onPitchBend={(nudge) => deckNode.setPitchBend(nudge)}
        onKeyLockToggle={(lock) => deckNode.setKeyLock(lock)}
        onVinylToggle={(v) => deckNode.setVinylMode(v)}
        onSlipToggle={(s) => deckNode.setSlipMode(s)}
        onReverseToggle={(r) => deckNode.setReverse(r)}
        onSync={handleSync}
      />

      {/* Main Waveforms */}
      <div className="flex flex-col gap-1.5">
        <WaveformCanvas
          track={state.track}
          currentTime={state.currentTime}
          duration={state.duration}
          bpm={state.bpm}
          beatGridOffset={state.beatGridOffset}
          hotCues={state.hotCues}
          loop={state.loop}
          onSeek={handleSeek}
          accentColor={accentColor}
        />
        <OverviewWaveform
          track={state.track}
          currentTime={state.currentTime}
          duration={state.duration}
          hotCues={state.hotCues}
          onSeek={handleSeek}
          accentColor={accentColor}
        />
      </div>

      {/* 4 Parallel Visual Stem Waveform Channels & On/Off Switches */}
      <FourLineStemWaveforms
        deckId={deckId}
        track={state.track}
        currentTime={state.currentTime}
        duration={state.duration}
        stems={state.stems}
        onSeek={handleSeek}
      />

      {/* Transport & Jogwheel Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-900/40 p-2 rounded-xl border border-slate-800/60">
        <div className="md:col-span-4 flex md:flex-col justify-around gap-2">
          <button
            onClick={handleCue}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm tracking-wider flex items-center justify-center gap-2 border-2 transition-all active:scale-95 shadow-lg ${
              state.isCued
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/50 animate-pulse'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-amber-500/60 text-amber-400 hover:bg-amber-500/20 shadow-inner'
            }`}
          >
            CUE
          </button>

          <button
            onClick={handlePlayPause}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-sm tracking-wider flex items-center justify-center gap-2 border-2 transition-all active:scale-95 shadow-lg ${
              state.isPlaying
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/50'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20 shadow-inner'
            }`}
          >
            {state.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {state.isPlaying ? 'PAUSE' : 'PLAY'}
          </button>

          <button
            onClick={handleStop}
            className="py-2 px-3 rounded-lg font-bold text-xs bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            STOP
          </button>
        </div>

        <div className="md:col-span-8 flex justify-center">
          <JogWheel
            isPlaying={state.isPlaying}
            vinylMode={state.vinylMode}
            accentColor={accentColor}
            onScratchSpeed={(speed) => deckNode.setScratchSpeed(speed)}
            onPitchBend={(nudge) => deckNode.setPitchBend(nudge)}
            deckLabel={`DECK ${deckId}`}
          />
        </div>
      </div>

      {/* Real-Time DJ Stems Control Bar */}
      <StemsControlBar deckId={deckId} stems={state.stems} />

      {/* Pioneer DDJ Multi-Mode Performance Pads Matrix */}
      <PerformancePads deckId={deckId} deckState={state} />

      {/* Looping & Beat Jump Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LoopControls
          loop={state.loop}
          onSetLoopIn={() => deckNode.setLoopIn()}
          onSetLoopOut={() => deckNode.setLoopOut()}
          onAutoLoop={(beats) => deckNode.triggerAutoLoop(beats)}
          onExitLoop={() => deckNode.exitLoop()}
        />

        <BeatJumpControls onBeatJump={(beats) => deckNode.beatJump(beats)} />
      </div>
    </div>
  );
};
