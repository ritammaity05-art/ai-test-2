/**
 * StemsFilterNode.ts
 * True 4-Channel Parallel Crossover Audio Network:
 * 1. BEAT / DRUMS Channel (20Hz - 200Hz Low-pass + Transient Peak)
 * 2. BASS Channel (50Hz - 280Hz Band-pass)
 * 3. VOCALS Channel (320Hz - 3.4kHz Formant Band-pass)
 * 4. INSTRUMENTS Channel (400Hz - 16kHz High-pass & Upper Harmonics)
 *
 * Each channel is connected in PARALLEL. Turning OFF any 1, 2, or 3 stems
 * NEVER blocks or mutes the remaining active stems!
 */

import type { StemsState } from '../types/dj';

export class StemsFilterNode {
  private ctx: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;

  // Channel 1: Drums / Beat
  private drumsFilterLow: BiquadFilterNode;
  private drumsGain: GainNode;

  // Channel 2: Bass
  private bassFilterBand: BiquadFilterNode;
  private bassGain: GainNode;

  // Channel 3: Vocals
  private vocalFilterLow: BiquadFilterNode;
  private vocalFilterHigh: BiquadFilterNode;
  private vocalGain: GainNode;

  // Channel 4: Instruments
  private instFilterHigh: BiquadFilterNode;
  private instGain: GainNode;

  private state: StemsState;

  constructor(ctx: AudioContext, initialState?: StemsState) {
    this.ctx = ctx;
    this.state = initialState || {
      vocals: true,
      instruments: true,
      bass: true,
      drums: true,
    };

    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();

    // 1. DRUMS / BEAT (Low-pass 200Hz)
    this.drumsFilterLow = this.ctx.createBiquadFilter();
    this.drumsFilterLow.type = 'lowpass';
    this.drumsFilterLow.frequency.value = 200;
    this.drumsFilterLow.Q.value = 1.0;
    this.drumsGain = this.ctx.createGain();

    // 2. BASS (Band-pass 120Hz)
    this.bassFilterBand = this.ctx.createBiquadFilter();
    this.bassFilterBand.type = 'bandpass';
    this.bassFilterBand.frequency.value = 120;
    this.bassFilterBand.Q.value = 1.5;
    this.bassGain = this.ctx.createGain();

    // 3. VOCALS (Band-pass Highpass 320Hz + Lowpass 3400Hz)
    this.vocalFilterLow = this.ctx.createBiquadFilter();
    this.vocalFilterLow.type = 'highpass';
    this.vocalFilterLow.frequency.value = 320;

    this.vocalFilterHigh = this.ctx.createBiquadFilter();
    this.vocalFilterHigh.type = 'lowpass';
    this.vocalFilterHigh.frequency.value = 3400;
    this.vocalGain = this.ctx.createGain();

    // 4. INSTRUMENTS (High-pass 400Hz)
    this.instFilterHigh = this.ctx.createBiquadFilter();
    this.instFilterHigh.type = 'highpass';
    this.instFilterHigh.frequency.value = 400;
    this.instGain = this.ctx.createGain();

    // PARALLEL ROUTING GRAPH:
    // Input -> DrumsFilterLow -> DrumsGain -> Output
    this.inputNode.connect(this.drumsFilterLow);
    this.drumsFilterLow.connect(this.drumsGain);
    this.drumsGain.connect(this.outputNode);

    // Input -> BassFilterBand -> BassGain -> Output
    this.inputNode.connect(this.bassFilterBand);
    this.bassFilterBand.connect(this.bassGain);
    this.bassGain.connect(this.outputNode);

    // Input -> VocalFilterLow -> VocalFilterHigh -> VocalGain -> Output
    this.inputNode.connect(this.vocalFilterLow);
    this.vocalFilterLow.connect(this.vocalFilterHigh);
    this.vocalFilterHigh.connect(this.vocalGain);
    this.vocalGain.connect(this.outputNode);

    // Input -> InstFilterHigh -> InstGain -> Output
    this.inputNode.connect(this.instFilterHigh);
    this.instFilterHigh.connect(this.instGain);
    this.instGain.connect(this.outputNode);

    this.applyState();
  }

  public updateState(newState: Partial<StemsState>) {
    this.state = { ...this.state, ...newState };
    this.applyState();
  }

  public getState(): StemsState {
    return { ...this.state };
  }

  private applyState() {
    const now = this.ctx.currentTime;
    const ramp = 0.01;

    // Independent 1.0 (Full Volume) when ON, 0.0 (Complete Mute) when OFF
    this.drumsGain.gain.setTargetAtTime(this.state.drums ? 1.0 : 0.0, now, ramp);
    this.bassGain.gain.setTargetAtTime(this.state.bass ? 1.0 : 0.0, now, ramp);
    this.vocalGain.gain.setTargetAtTime(this.state.vocals ? 1.0 : 0.0, now, ramp);
    this.instGain.gain.setTargetAtTime(this.state.instruments ? 1.0 : 0.0, now, ramp);
  }
}
