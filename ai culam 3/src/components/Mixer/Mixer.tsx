import React from 'react';
import type { MixerState } from '../../types/dj';
import { AudioEngine } from '../../audio/AudioEngine';
import { ChannelStrip } from './ChannelStrip';
import { MasterSection } from './MasterSection';
import { Crossfader } from './Crossfader';

interface MixerProps {
  mixerState: MixerState;
}

export const Mixer: React.FC<MixerProps> = ({ mixerState }) => {
  const engine = AudioEngine.getInstance();

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-lg items-center">
      <div className="flex items-center justify-center gap-3 w-full">
        <ChannelStrip
          deckId="A"
          state={mixerState.deckA}
          onChange={(updates) =>
            engine.updateMixer({ deckA: { ...mixerState.deckA, ...updates } })
          }
          accentColor="#3b82f6"
        />

        <MasterSection
          masterVolume={mixerState.masterVolume}
          headphoneVolume={mixerState.headphoneVolume}
          headphoneCueMix={mixerState.headphoneCueMix}
          masterMeter={mixerState.masterMeter}
          onMasterVolumeChange={(vol) => engine.updateMixer({ masterVolume: vol })}
          onHeadphoneVolumeChange={(vol) => engine.updateMixer({ headphoneVolume: vol })}
          onHeadphoneCueMixChange={(mix) => engine.updateMixer({ headphoneCueMix: mix })}
        />

        <ChannelStrip
          deckId="B"
          state={mixerState.deckB}
          onChange={(updates) =>
            engine.updateMixer({ deckB: { ...mixerState.deckB, ...updates } })
          }
          accentColor="#ec4899"
        />
      </div>

      <Crossfader
        value={mixerState.crossfader}
        curve={mixerState.crossfaderCurve}
        onChange={(val) => engine.updateMixer({ crossfader: val })}
        onCurveChange={(curve) => engine.updateMixer({ crossfaderCurve: curve })}
      />
    </div>
  );
};
