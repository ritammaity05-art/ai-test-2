/**
 * AudioEngine.ts
 * Main Audio Engine & Mixer Routing Manager for TINO DJ Pro.
 */

import type { MixerState } from '../types/dj';
import { DeckAudioNode } from './DeckAudioNode';
import { SamplerEngine } from './SamplerEngine';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext;
  public masterGain: GainNode;
  public cueGain: GainNode;
  public masterAnalyser: AnalyserNode;

  public deckA: DeckAudioNode;
  public deckB: DeckAudioNode;
  public samplerEngine: SamplerEngine;

  public streamDestination: MediaStreamAudioDestinationNode;

  private mixerState: MixerState;
  private onMixerChange?: (mixerState: MixerState) => void;
  private meterBuffer: Float32Array;

  private constructor() {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx({ latencyHint: 'interactive', sampleRate: 44100 });

    this.masterGain = this.ctx.createGain();
    this.cueGain = this.ctx.createGain();

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.meterBuffer = new Float32Array(this.masterAnalyser.fftSize);

    this.masterGain.connect(this.masterAnalyser);
    this.masterGain.connect(this.ctx.destination);

    this.streamDestination = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.streamDestination);

    this.samplerEngine = SamplerEngine.getInstance(this.ctx, this.masterGain);

    this.mixerState = {
      deckA: {
        gain: 1.0,
        eq: { high: 0, mid: 0, low: 0 },
        filter: 0,
        volume: 0.85,
        cue: false,
        peakMeter: { left: 0, right: 0 },
      },
      deckB: {
        gain: 1.0,
        eq: { high: 0, mid: 0, low: 0 },
        filter: 0,
        volume: 0.85,
        cue: false,
        peakMeter: { left: 0, right: 0 },
      },
      crossfader: 0,
      crossfaderCurve: 'linear',
      masterVolume: 0.9,
      headphoneVolume: 0.8,
      headphoneCueMix: 0.5,
      masterMeter: { left: 0, right: 0 },
    };

    this.deckA = new DeckAudioNode(
      this.ctx,
      'A',
      this.masterGain,
      this.cueGain,
      () => {},
      (l, r) => {
        this.mixerState.deckA.peakMeter = { left: l, right: r };
      }
    );

    this.deckB = new DeckAudioNode(
      this.ctx,
      'B',
      this.masterGain,
      this.cueGain,
      () => {},
      (l, r) => {
        this.mixerState.deckB.peakMeter = { left: l, right: r };
      }
    );

    this.startMasterMeterLoop();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async resumeAudioContext(): Promise<boolean> {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return this.ctx.state === 'running';
  }

  public setOnMixerChange(cb: (mixerState: MixerState) => void) {
    this.onMixerChange = cb;
  }

  public updateMixer(updates: Partial<MixerState>) {
    this.mixerState = { ...this.mixerState, ...updates };

    const xf = this.mixerState.crossfader;
    const curve = this.mixerState.crossfaderCurve;

    let gainA = 1.0;
    let gainB = 1.0;

    if (curve === 'scratch') {
      gainA = xf > 0.8 ? 0 : 1.0;
      gainB = xf < -0.8 ? 0 : 1.0;
    } else if (curve === 'constant_power') {
      const norm = (xf + 1) / 2;
      gainA = Math.cos(norm * 0.5 * Math.PI);
      gainB = Math.sin(norm * 0.5 * Math.PI);
    } else {
      gainA = Math.max(0, 1 - (xf + 1) / 2);
      gainB = Math.max(0, (xf + 1) / 2);
    }

    const effectiveVolA = this.mixerState.deckA.volume * gainA;
    const effectiveVolB = this.mixerState.deckB.volume * gainB;

    this.deckA.applyMixerChannelState({ ...this.mixerState.deckA, volume: effectiveVolA });
    this.deckB.applyMixerChannelState({ ...this.mixerState.deckB, volume: effectiveVolB });

    this.masterGain.gain.setTargetAtTime(this.mixerState.masterVolume, this.ctx.currentTime, 0.02);

    if (this.onMixerChange) {
      this.onMixerChange({ ...this.mixerState });
    }
  }

  public getMixerState(): MixerState {
    return { ...this.mixerState };
  }

  private startMasterMeterLoop() {
    const loop = () => {
      if (this.masterAnalyser) {
        this.masterAnalyser.getFloatTimeDomainData(this.meterBuffer as any);
        let sum = 0;
        for (let i = 0; i < this.meterBuffer.length; i++) {
          sum += this.meterBuffer[i] * this.meterBuffer[i];
        }
        const rms = Math.sqrt(sum / this.meterBuffer.length);
        const peak = Math.min(1.0, rms * 2.8);

        this.mixerState.masterMeter = { left: peak, right: peak * 0.96 };
        if (this.onMixerChange) {
          this.onMixerChange({ ...this.mixerState });
        }
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}
