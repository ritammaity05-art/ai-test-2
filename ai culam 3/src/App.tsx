import { useState, useEffect } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import type { DeckState, MixerState } from './types/dj';
import { Header } from './components/Header/Header';
import { Deck } from './components/Deck/Deck';
import { Mixer } from './components/Mixer/Mixer';
import { FXRack } from './components/FX/FXRack';
import { MusicLibrary } from './components/Library/MusicLibrary';
import { MIDIMappingModal } from './components/Modals/MIDIMappingModal';
import { KeyboardModal } from './components/Modals/KeyboardModal';
import { SettingsModal } from './components/Modals/SettingsModal';

export function App() {
  const engine = AudioEngine.getInstance();

  const [deckAState, setDeckAState] = useState<DeckState>(engine.deckA.state);
  const [deckBState, setDeckBState] = useState<DeckState>(engine.deckB.state);
  const [mixerState, setMixerState] = useState<MixerState>(engine.getMixerState());

  const [isMIDIModalOpen, setIsMIDIModalOpen] = useState<boolean>(false);
  const [isKeyboardModalOpen, setIsKeyboardModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unSubA = setInterval(() => setDeckAState({ ...engine.deckA.state }), 50);
    const unSubB = setInterval(() => setDeckBState({ ...engine.deckB.state }), 50);

    engine.setOnMixerChange((m) => setMixerState({ ...m }));

    return () => {
      clearInterval(unSubA);
      clearInterval(unSubB);
    };
  }, [engine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (deckAState.isPlaying) engine.deckA.pause();
          else engine.deckA.play();
          break;
        case 'KeyQ':
          e.preventDefault();
          engine.deckA.cue();
          break;
        case 'KeyE':
          e.preventDefault();
          engine.deckA.jumpToHotCue(0);
          break;
        case 'KeyR':
          e.preventDefault();
          engine.deckA.triggerAutoLoop(4);
          break;
        case 'Enter':
          e.preventDefault();
          if (deckBState.isPlaying) engine.deckB.pause();
          else engine.deckB.play();
          break;
        case 'KeyI':
          e.preventDefault();
          engine.deckB.cue();
          break;
        case 'KeyP':
          e.preventDefault();
          engine.deckB.jumpToHotCue(0);
          break;
        case 'KeyL':
          e.preventDefault();
          engine.deckB.triggerAutoLoop(4);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          engine.updateMixer({ crossfader: Math.max(-1, mixerState.crossfader - 0.1) });
          break;
        case 'ArrowRight':
          e.preventDefault();
          engine.updateMixer({ crossfader: Math.min(1, mixerState.crossfader + 0.1) });
          break;
        case 'ArrowUp':
          e.preventDefault();
          engine.updateMixer({ masterVolume: Math.min(1, mixerState.masterVolume + 0.05) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          engine.updateMixer({ masterVolume: Math.max(0, mixerState.masterVolume - 0.05) });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deckAState.isPlaying, deckBState.isPlaying, mixerState]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased">
      <Header
        onOpenMIDIModal={() => setIsMIDIModalOpen(true)}
        onOpenKeyboardModal={() => setIsKeyboardModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      <main className="flex-1 p-3 sm:p-6 flex flex-col gap-6 max-w-[1800px] w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FXRack deckId="A" accentColor="#3b82f6" />
          <FXRack deckId="B" accentColor="#ec4899" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5">
            <Deck
              deckId="A"
              state={deckAState}
              accentColor="#3b82f6"
              opponentBpm={deckBState.bpm}
            />
          </div>

          <div className="xl:col-span-2">
            <Mixer mixerState={mixerState} />
          </div>

          <div className="xl:col-span-5">
            <Deck
              deckId="B"
              state={deckBState}
              accentColor="#ec4899"
              opponentBpm={deckAState.bpm}
            />
          </div>
        </div>

        <MusicLibrary
          deckATrack={deckAState.track}
          deckBTrack={deckBState.track}
        />
      </main>

      <footer className="p-3 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500 font-medium">
        TINO DJ Pro • Original Low-Latency Browser Mixing Engine • Powered by Web Audio API & Web MIDI API
      </footer>

      <MIDIMappingModal isOpen={isMIDIModalOpen} onClose={() => setIsMIDIModalOpen(false)} />
      <KeyboardModal isOpen={isKeyboardModalOpen} onClose={() => setIsKeyboardModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  );
}

export default App;
