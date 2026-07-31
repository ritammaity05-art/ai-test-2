/**
 * FXEngine.ts
 * Real-Time Web Audio FX Processor for 10 DJ Effects:
 * Echo, Delay, Reverb, Filter, Flanger, Phaser, Roll, Gate, Noise, Bitcrusher.
 */

import type { FXUnitState } from '../types/dj';

export class FXEngine {
  private ctx: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;
  private dryGain: GainNode;
  private wetGain: GainNode;

  // Effect specific nodes
  private delayNode: DelayNode;
  private delayFeedbackNode: GainNode;

  private filterNode: BiquadFilterNode;

  private flangerDelayNode: DelayNode;
  private flangerOsc: OscillatorNode;
  private flangerOscGain: GainNode;

  private phaserAllPassNodes: BiquadFilterNode[] = [];
  private phaserOsc: OscillatorNode;

  private gateGainNode: GainNode;
  private gateOsc: OscillatorNode;

  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGainNode: GainNode;
  private noiseFilterNode: BiquadFilterNode;

  private convolverNode: ConvolverNode;

  private scriptProcessorNode: ScriptProcessorNode | null = null;

  private state: FXUnitState;
  private bpm: number = 128;

  constructor(ctx: AudioContext, initialState: FXUnitState) {
    this.ctx = ctx;
    this.state = { ...initialState };

    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.delayNode = this.ctx.createDelay(5.0);
    this.delayFeedbackNode = this.ctx.createGain();
    this.delayNode.connect(this.delayFeedbackNode);
    this.delayFeedbackNode.connect(this.delayNode);

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';

    this.flangerDelayNode = this.ctx.createDelay(0.1);
    this.flangerOsc = this.ctx.createOscillator();
    this.flangerOscGain = this.ctx.createGain();
    this.flangerOsc.type = 'sine';
    this.flangerOsc.frequency.value = 0.5;
    this.flangerOscGain.gain.value = 0.003;
    this.flangerOsc.connect(this.flangerOscGain);
    this.flangerOscGain.connect(this.flangerDelayNode.delayTime);
    this.flangerOsc.start();

    this.phaserOsc = this.ctx.createOscillator();
    const phaserOscGain = this.ctx.createGain();
    this.phaserOsc.type = 'sine';
    this.phaserOsc.frequency.value = 0.5;
    phaserOscGain.gain.value = 1000;
    this.phaserOsc.connect(phaserOscGain);

    for (let i = 0; i < 4; i++) {
      const ap = this.ctx.createBiquadFilter();
      ap.type = 'allpass';
      ap.frequency.value = 1000;
      phaserOscGain.connect(ap.frequency);
      this.phaserAllPassNodes.push(ap);
    }
    for (let i = 0; i < 3; i++) {
      this.phaserAllPassNodes[i].connect(this.phaserAllPassNodes[i + 1]);
    }
    this.phaserOsc.start();

    this.gateGainNode = this.ctx.createGain();
    this.gateOsc = this.ctx.createOscillator();
    this.gateOsc.type = 'square';
    this.gateOsc.frequency.value = 4;
    this.gateOsc.connect(this.gateGainNode.gain);
    this.gateOsc.start();

    this.noiseGainNode = this.ctx.createGain();
    this.noiseFilterNode = this.ctx.createBiquadFilter();
    this.noiseFilterNode.type = 'bandpass';
    this.createNoiseBuffer();

    this.convolverNode = this.ctx.createConvolver();
    this.createReverbImpulse();

    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.wetGain.connect(this.outputNode);

    this.updateFXGraph();
  }

  public setBPM(bpm: number) {
    this.bpm = bpm;
    this.applyParameters();
  }

  public updateState(newState: Partial<FXUnitState>) {
    this.state = { ...this.state, ...newState };
    this.updateFXGraph();
    this.applyParameters();
  }

  private updateFXGraph() {
    try {
      this.inputNode.disconnect(this.delayNode);
      this.inputNode.disconnect(this.filterNode);
      this.inputNode.disconnect(this.flangerDelayNode);
      this.inputNode.disconnect(this.phaserAllPassNodes[0]);
      this.inputNode.disconnect(this.gateGainNode);
      this.inputNode.disconnect(this.convolverNode);

      if (this.scriptProcessorNode) {
        this.inputNode.disconnect(this.scriptProcessorNode);
        this.scriptProcessorNode.disconnect(this.wetGain);
      }
      this.delayNode.disconnect(this.wetGain);
      this.filterNode.disconnect(this.wetGain);
      this.flangerDelayNode.disconnect(this.wetGain);
      this.phaserAllPassNodes[3].disconnect(this.wetGain);
      this.gateGainNode.disconnect(this.wetGain);
      this.convolverNode.disconnect(this.wetGain);
      this.noiseGainNode.disconnect(this.wetGain);
    } catch (_) {}

    if (!this.state.enabled) {
      this.dryGain.gain.value = 1.0;
      this.wetGain.gain.value = 0.0;
      return;
    }

    const wet = Math.max(0, Math.min(1, this.state.wetDry));
    this.wetGain.gain.value = wet;
    this.dryGain.gain.value = 1 - wet * 0.5;

    switch (this.state.type) {
      case 'echo':
      case 'delay':
        this.inputNode.connect(this.delayNode);
        this.delayNode.connect(this.wetGain);
        break;

      case 'filter':
        this.inputNode.connect(this.filterNode);
        this.filterNode.connect(this.wetGain);
        break;

      case 'flanger':
        this.inputNode.connect(this.flangerDelayNode);
        this.flangerDelayNode.connect(this.wetGain);
        break;

      case 'phaser':
        this.inputNode.connect(this.phaserAllPassNodes[0]);
        this.phaserAllPassNodes[3].connect(this.wetGain);
        break;

      case 'reverb':
        this.inputNode.connect(this.convolverNode);
        this.convolverNode.connect(this.wetGain);
        break;

      case 'gate':
        this.inputNode.connect(this.gateGainNode);
        this.gateGainNode.connect(this.wetGain);
        break;

      case 'noise':
        this.noiseFilterNode.connect(this.noiseGainNode);
        this.noiseGainNode.connect(this.wetGain);
        break;

      case 'bitcrusher':
        this.setupBitcrusher();
        if (this.scriptProcessorNode) {
          this.inputNode.connect(this.scriptProcessorNode);
          this.scriptProcessorNode.connect(this.wetGain);
        }
        break;

      case 'roll':
        this.inputNode.connect(this.delayNode);
        this.delayNode.connect(this.wetGain);
        break;
    }
  }

  public applyParameters() {
    if (!this.state.enabled) return;

    const p1 = this.state.param1;
    const p2 = this.state.param2;
    const p3 = this.state.param3;

    const beatTime = 60 / this.bpm;

    switch (this.state.type) {
      case 'echo':
      case 'delay': {
        const delays = [beatTime * 0.25, beatTime * 0.5, beatTime, beatTime * 0.75, beatTime * 1.5];
        const delayIdx = Math.floor(p3 * (delays.length - 1));
        const time = this.state.beatSync ? delays[delayIdx] : p1 * 1.5 + 0.05;
        this.delayNode.delayTime.setTargetAtTime(time, this.ctx.currentTime, 0.02);
        this.delayFeedbackNode.gain.setTargetAtTime(Math.min(0.85, p2), this.ctx.currentTime, 0.02);
        break;
      }

      case 'filter': {
        const isHPF = p2 > 0.5;
        if (isHPF) {
          this.filterNode.type = 'highpass';
          const freq = 20 * Math.pow(1000, (p2 - 0.5) * 2);
          this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
        } else {
          this.filterNode.type = 'lowpass';
          const freq = 20000 * Math.pow(0.01, 1 - p2 * 2);
          this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
        }
        this.filterNode.Q.setTargetAtTime(p1 * 15 + 1, this.ctx.currentTime, 0.02);
        break;
      }

      case 'flanger': {
        this.flangerOsc.frequency.setTargetAtTime(p1 * 5 + 0.1, this.ctx.currentTime, 0.02);
        this.flangerOscGain.gain.setTargetAtTime(p2 * 0.008 + 0.001, this.ctx.currentTime, 0.02);
        break;
      }

      case 'phaser': {
        this.phaserOsc.frequency.setTargetAtTime(p1 * 8 + 0.1, this.ctx.currentTime, 0.02);
        break;
      }

      case 'gate': {
        const rates = [beatTime / 4, beatTime / 2, beatTime, beatTime * 2];
        const rateIdx = Math.floor(p3 * (rates.length - 1));
        const freq = this.state.beatSync ? 1 / rates[rateIdx] : p1 * 20 + 1;
        this.gateOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
        break;
      }

      case 'noise': {
        this.noiseFilterNode.frequency.setTargetAtTime(p1 * 8000 + 200, this.ctx.currentTime, 0.02);
        this.noiseFilterNode.Q.setTargetAtTime(p2 * 20 + 1, this.ctx.currentTime, 0.02);
        break;
      }

      case 'roll': {
        const divisions = [beatTime / 16, beatTime / 8, beatTime / 4, beatTime / 2, beatTime];
        const divIdx = Math.floor(p1 * (divisions.length - 1));
        const time = divisions[divIdx];
        this.delayNode.delayTime.setTargetAtTime(time, this.ctx.currentTime, 0.01);
        this.delayFeedbackNode.gain.setTargetAtTime(0.95, this.ctx.currentTime, 0.01);
        break;
      }
    }
  }

  private setupBitcrusher() {
    if (this.scriptProcessorNode) return;
    this.scriptProcessorNode = this.ctx.createScriptProcessor(4096, 2, 2);

    let phase = 0;
    let lastSampleL = 0;
    let lastSampleR = 0;

    this.scriptProcessorNode.onaudioprocess = (e) => {
      const inputL = e.inputBuffer.getChannelData(0);
      const inputR = e.inputBuffer.getChannelData(1);
      const outputL = e.outputBuffer.getChannelData(0);
      const outputR = e.outputBuffer.getChannelData(1);

      const normP1 = Math.max(0.01, this.state.param1);
      const step = Math.pow(0.5, Math.floor(this.state.param2 * 14 + 2));

      const phFactor = Math.max(1, Math.floor((1 - normP1) * 32));

      for (let i = 0; i < inputL.length; i++) {
        phase++;
        if (phase % phFactor === 0) {
          lastSampleL = Math.round(inputL[i] / step) * step;
          lastSampleR = Math.round(inputR[i] / step) * step;
        }
        outputL[i] = lastSampleL;
        outputR[i] = lastSampleR;
      }
    };
  }

  private createNoiseBuffer() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.noiseFilterNode);
    this.noiseNode.start();
  }

  private createReverbImpulse() {
    const rate = this.ctx.sampleRate;
    const length = rate * 2.5;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    this.convolverNode.buffer = impulse;
  }
}
