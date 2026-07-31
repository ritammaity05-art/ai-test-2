/**
 * DeckAudioNode.ts
 * Core Web Audio pipeline and transport controller for an individual DJ Deck (Deck A or Deck B).
 */

import type { DeckId, DeckState, Track, MixerChannelState, FXUnitState, StemsState } from '../types/dj';
import { FXEngine } from './FXEngine';
import { StemsFilterNode } from './StemsFilterNode';

export class DeckAudioNode {
  public ctx: AudioContext;
  public deckId: DeckId;

  // Audio Nodes
  private sourceNode: AudioBufferSourceNode | null = null;
  private stemSources: {
    drums?: AudioBufferSourceNode;
    bass?: AudioBufferSourceNode;
    inst?: AudioBufferSourceNode;
    vocals?: AudioBufferSourceNode;
  } = {};

  private stemGains: {
    drums: GainNode;
    bass: GainNode;
    inst: GainNode;
    vocals: GainNode;
  };

  public inputGainNode: GainNode;
  public stemsFilterNode: StemsFilterNode;
  private eqHighNode: BiquadFilterNode;
  private eqMidNode: BiquadFilterNode;
  private eqLowNode: BiquadFilterNode;
  private filterSweepNode: BiquadFilterNode;
  public fxEngine: FXEngine;
  private faderGainNode: GainNode;

  // Routing
  private masterOutputGain: GainNode;
  private cueOutputGain: GainNode;
  public analyserNode: AnalyserNode;

  // Track & Playback State
  public track: Track | null = null;
  public state: DeckState;

  // Timing & Position Tracking
  private startTime: number = 0;       // AudioContext.currentTime when playback started
  private startOffset: number = 0;     // Track playback offset in seconds
  private animationFrameId: number | null = null;
  private meterBuffer: Float32Array;

  // Callbacks
  private onStateChange: (state: DeckState) => void;
  private onMeterUpdate: (left: number, right: number) => void;

  constructor(
    ctx: AudioContext,
    deckId: DeckId,
    masterOutput: GainNode,
    cueOutput: GainNode,
    onStateChange: (state: DeckState) => void,
    onMeterUpdate: (left: number, right: number) => void
  ) {
    this.ctx = ctx;
    this.deckId = deckId;
    this.masterOutputGain = masterOutput;
    this.cueOutputGain = cueOutput;
    this.onStateChange = onStateChange;
    this.onMeterUpdate = onMeterUpdate;

    this.state = {
      deckId,
      track: null,
      isPlaying: false,
      isPaused: false,
      isCued: false,
      currentTime: 0,
      duration: 0,
      bpm: 128,
      originalBpm: 128,
      key: '8A',
      keyLock: false,
      pitchPercent: 0,
      pitchBend: 0,
      vinylMode: true,
      slipMode: false,
      slipTime: 0,
      reverse: false,
      isScratching: false,
      hotCues: Array(8).fill(null),
      loop: { active: false, start: null, end: null, lengthBeats: null, isAuto: false },
      stems: { vocals: true, instruments: true, bass: true, drums: true },
      quantize: true,
      beatGridOffset: 0,
    };

    // Stem Gain Nodes for isolated multitrack stem files
    this.stemGains = {
      drums: this.ctx.createGain(),
      bass: this.ctx.createGain(),
      inst: this.ctx.createGain(),
      vocals: this.ctx.createGain(),
    };

    this.inputGainNode = this.ctx.createGain();
    this.stemsFilterNode = new StemsFilterNode(this.ctx, this.state.stems);

    // Connect Stem Gain Nodes directly to inputGainNode
    this.stemGains.drums.connect(this.inputGainNode);
    this.stemGains.bass.connect(this.inputGainNode);
    this.stemGains.inst.connect(this.inputGainNode);
    this.stemGains.vocals.connect(this.inputGainNode);

    this.eqHighNode = this.ctx.createBiquadFilter();
    this.eqHighNode.type = 'highshelf';
    this.eqHighNode.frequency.value = 4000;

    this.eqMidNode = this.ctx.createBiquadFilter();
    this.eqMidNode.type = 'peaking';
    this.eqMidNode.frequency.value = 1000;
    this.eqMidNode.Q.value = 1.0;

    this.eqLowNode = this.ctx.createBiquadFilter();
    this.eqLowNode.type = 'lowshelf';
    this.eqLowNode.frequency.value = 250;

    this.filterSweepNode = this.ctx.createBiquadFilter();
    this.filterSweepNode.type = 'lowpass';
    this.filterSweepNode.frequency.value = 20000;

    const initialFX: FXUnitState = {
      id: deckId === 'A' ? 'FX_A' : 'FX_B',
      assignedDeck: deckId,
      enabled: false,
      type: 'echo',
      param1: 0.5,
      param2: 0.5,
      param3: 0.5,
      wetDry: 0.5,
      beatSync: true,
    };
    this.fxEngine = new FXEngine(this.ctx, initialFX);

    this.faderGainNode = this.ctx.createGain();
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.meterBuffer = new Float32Array(this.analyserNode.fftSize);

    // Routing Graph:
    // InputGain -> EQ Low -> EQ Mid -> EQ High -> Filter Sweep -> FX -> Fader -> Analyser -> Master / Cue
    this.inputGainNode.connect(this.eqLowNode);
    this.stemsFilterNode.outputNode.connect(this.eqLowNode);

    this.eqLowNode.connect(this.eqMidNode);
    this.eqMidNode.connect(this.eqHighNode);
    this.eqHighNode.connect(this.filterSweepNode);

    this.filterSweepNode.connect(this.fxEngine.inputNode);
    this.fxEngine.outputNode.connect(this.faderGainNode);

    this.faderGainNode.connect(this.analyserNode);
    this.faderGainNode.connect(this.masterOutputGain);

    this.startLoopTimer();
  }

  public setStems(updates: Partial<StemsState>) {
    this.state.stems = { ...this.state.stems, ...updates };

    const now = this.ctx.currentTime;
    const ramp = 0.01;

    // Apply gains for multitrack stem files
    this.stemGains.drums.gain.setTargetAtTime(this.state.stems.drums ? 1.0 : 0.0, now, ramp);
    this.stemGains.bass.gain.setTargetAtTime(this.state.stems.bass ? 1.0 : 0.0, now, ramp);
    this.stemGains.inst.gain.setTargetAtTime(this.state.stems.instruments ? 1.0 : 0.0, now, ramp);
    this.stemGains.vocals.gain.setTargetAtTime(this.state.stems.vocals ? 1.0 : 0.0, now, ramp);

    // Update parallel DSP crossover network
    this.stemsFilterNode.updateState(updates);
    this.notifyState();
  }

  public loadTrack(track: Track) {
    this.stop();
    this.track = track;
    this.startOffset = 0;

    this.state = {
      ...this.state,
      track,
      duration: track.duration,
      originalBpm: track.bpm,
      bpm: Math.round(track.bpm * (1 + this.state.pitchPercent / 100)),
      key: track.key,
      currentTime: 0,
      isPaused: false,
      isPlaying: false,
      hotCues: Array(8).fill(null),
      loop: { active: false, start: null, end: null, lengthBeats: null, isAuto: false },
      stems: { vocals: true, instruments: true, bass: true, drums: true },
      beatGridOffset: 0,
    };

    this.setStems(this.state.stems);
    this.fxEngine.setBPM(this.state.bpm);
    this.notifyState();
  }

  public ejectTrack() {
    this.stop();
    this.track = null;
    this.state.track = null;
    this.state.currentTime = 0;
    this.state.duration = 0;
    this.notifyState();
  }

  public play() {
    if (!this.track) return;
    if (this.state.isPlaying) return;

    this.startSource(this.state.currentTime);
    this.state.isPlaying = true;
    this.state.isPaused = false;
    this.state.isCued = false;
    this.notifyState();
  }

  public pause() {
    if (!this.state.isPlaying) return;

    this.state.currentTime = this.getCurrentPlaybackTime();
    this.stopSource();
    this.state.isPlaying = false;
    this.state.isPaused = true;
    this.notifyState();
  }

  public cue() {
    if (!this.track) return;

    if (this.state.isPlaying) {
      this.pause();
      this.seek(this.startOffset);
      this.state.isCued = true;
    } else {
      this.startOffset = this.state.currentTime;
      this.play();
    }
    this.notifyState();
  }

  public stop() {
    this.stopSource();
    this.state.currentTime = 0;
    this.startOffset = 0;
    this.state.isPlaying = false;
    this.state.isPaused = false;
    this.state.isCued = false;
    this.notifyState();
  }

  public seek(targetSeconds: number) {
    if (!this.track) return;
    const clamped = Math.max(0, Math.min(this.state.duration, targetSeconds));

    const wasPlaying = this.state.isPlaying;
    if (wasPlaying) {
      this.stopSource();
    }

    this.startOffset = clamped;
    this.state.currentTime = clamped;

    if (wasPlaying) {
      this.startSource(clamped);
    }
    this.notifyState();
  }

  public setPitchPercent(pct: number) {
    this.state.pitchPercent = Math.max(-50, Math.min(50, pct));
    this.updatePlaybackRate();
  }

  public setPitchBend(nudge: number) {
    this.state.pitchBend = Math.max(-1, Math.min(1, nudge));
    this.updatePlaybackRate();
  }

  public setKeyLock(enabled: boolean) {
    this.state.keyLock = enabled;
    this.updatePlaybackRate();
    this.notifyState();
  }

  public setVinylMode(enabled: boolean) {
    this.state.vinylMode = enabled;
    this.notifyState();
  }

  public setScratchSpeed(speedRatio: number) {
    const rate = Math.max(0.001, Math.min(4.0, speedRatio));
    this.state.isScratching = speedRatio !== 1.0;

    if (this.sourceNode) {
      this.sourceNode.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.01);
    }
    Object.values(this.stemSources).forEach((src) => {
      if (src) src.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.01);
    });
  }

  public setSlipMode(enabled: boolean) {
    this.state.slipMode = enabled;
    if (enabled) {
      this.state.slipTime = this.state.currentTime;
    }
    this.notifyState();
  }

  public setReverse(enabled: boolean) {
    this.state.reverse = enabled;
    if (this.track && this.state.isPlaying) {
      const pos = this.getCurrentPlaybackTime();
      this.stopSource();
      this.startSource(pos);
    }
    this.notifyState();
  }

  public setHotCue(index: number) {
    if (index < 0 || index > 7) return;
    const current = this.getCurrentPlaybackTime();
    const cueColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

    const newCues = [...this.state.hotCues];
    newCues[index] = {
      id: index,
      position: current,
      label: `CUE ${index + 1}`,
      color: cueColors[index],
    };
    this.state.hotCues = newCues;
    this.notifyState();
  }

  public jumpToHotCue(index: number) {
    const cue = this.state.hotCues[index];
    if (!cue) {
      this.setHotCue(index);
      return;
    }
    this.seek(cue.position);
    if (!this.state.isPlaying) {
      this.play();
    }
  }

  public deleteHotCue(index: number) {
    const newCues = [...this.state.hotCues];
    newCues[index] = null;
    this.state.hotCues = newCues;
    this.notifyState();
  }

  public setLoopIn() {
    const pos = this.getCurrentPlaybackTime();
    this.state.loop = {
      ...this.state.loop,
      start: pos,
      active: false,
    };
    this.notifyState();
  }

  public setLoopOut() {
    if (this.state.loop.start === null) return;
    const pos = this.getCurrentPlaybackTime();
    if (pos <= this.state.loop.start) return;

    this.state.loop = {
      ...this.state.loop,
      end: pos,
      active: true,
      lengthBeats: null,
    };
    this.notifyState();
  }

  public triggerAutoLoop(beats: number) {
    if (!this.track) return;
    const current = this.getCurrentPlaybackTime();
    const secondsPerBeat = 60 / this.state.bpm;
    const loopDuration = beats * secondsPerBeat;

    this.state.loop = {
      active: true,
      start: current,
      end: current + loopDuration,
      lengthBeats: beats,
      isAuto: true,
    };
    this.notifyState();
  }

  public exitLoop() {
    this.state.loop.active = false;
    this.notifyState();
  }

  public beatJump(beats: number) {
    if (!this.track) return;
    const secondsPerBeat = 60 / this.state.bpm;
    const jumpSeconds = beats * secondsPerBeat;
    const target = this.getCurrentPlaybackTime() + jumpSeconds;
    this.seek(target);
  }

  public applyMixerChannelState(channelState: MixerChannelState) {
    this.inputGainNode.gain.setTargetAtTime(channelState.gain, this.ctx.currentTime, 0.02);

    this.eqHighNode.gain.setTargetAtTime(channelState.eq.high, this.ctx.currentTime, 0.02);
    this.eqMidNode.gain.setTargetAtTime(channelState.eq.mid, this.ctx.currentTime, 0.02);
    this.eqLowNode.gain.setTargetAtTime(channelState.eq.low, this.ctx.currentTime, 0.02);

    const val = channelState.filter;
    if (val > 0) {
      this.filterSweepNode.type = 'lowpass';
      const freq = 20000 * Math.pow(0.01, val);
      this.filterSweepNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
    } else if (val < 0) {
      this.filterSweepNode.type = 'highpass';
      const freq = 20 * Math.pow(500, Math.abs(val));
      this.filterSweepNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
    } else {
      this.filterSweepNode.type = 'lowpass';
      this.filterSweepNode.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.02);
    }

    this.faderGainNode.gain.setTargetAtTime(channelState.volume, this.ctx.currentTime, 0.02);

    try {
      if (channelState.cue) {
        this.faderGainNode.connect(this.cueOutputGain);
      } else {
        this.faderGainNode.disconnect(this.cueOutputGain);
      }
    } catch (_) {}
  }

  private startSource(offsetSeconds: number) {
    if (!this.track) return;
    this.stopSource();

    this.startOffset = offsetSeconds;
    this.startTime = this.ctx.currentTime;

    // Check if multi-channel isolated stem buffers are present
    if (this.track.stemBuffers) {
      const stems = this.track.stemBuffers;

      if (stems.drums) {
        const s = this.ctx.createBufferSource();
        s.buffer = stems.drums;
        s.connect(this.stemGains.drums);
        s.start(0, offsetSeconds);
        this.stemSources.drums = s;
      }
      if (stems.bass) {
        const s = this.ctx.createBufferSource();
        s.buffer = stems.bass;
        s.connect(this.stemGains.bass);
        s.start(0, offsetSeconds);
        this.stemSources.bass = s;
      }
      if (stems.instruments) {
        const s = this.ctx.createBufferSource();
        s.buffer = stems.instruments;
        s.connect(this.stemGains.inst);
        s.start(0, offsetSeconds);
        this.stemSources.inst = s;
      }
      if (stems.vocals) {
        const s = this.ctx.createBufferSource();
        s.buffer = stems.vocals;
        s.connect(this.stemGains.vocals);
        s.start(0, offsetSeconds);
        this.stemSources.vocals = s;
      }
    }

    // Connect stereo AudioBuffer through StemsFilterNode
    if (this.track.audioBuffer) {
      this.sourceNode = this.ctx.createBufferSource();
      this.sourceNode.buffer = this.track.audioBuffer;
      this.sourceNode.connect(this.stemsFilterNode.inputNode);
      this.sourceNode.start(0, offsetSeconds);

      this.sourceNode.onended = () => {
        if (this.state.isPlaying && this.getCurrentPlaybackTime() >= this.state.duration) {
          this.stop();
        }
      };
    }

    this.updatePlaybackRate();
  }

  private stopSource() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }

    Object.values(this.stemSources).forEach((src) => {
      if (src) {
        try {
          src.stop();
          src.disconnect();
        } catch (_) {}
      }
    });
    this.stemSources = {};
  }

  private updatePlaybackRate() {
    const pitchFactor = 1 + (this.state.pitchPercent + this.state.pitchBend * 5) / 100;
    const finalRate = Math.max(0.1, Math.min(4.0, pitchFactor));

    this.state.bpm = Math.round(this.state.originalBpm * finalRate);
    this.fxEngine.setBPM(this.state.bpm);

    if (this.sourceNode) {
      this.sourceNode.playbackRate.setTargetAtTime(finalRate, this.ctx.currentTime, 0.02);
    }
    Object.values(this.stemSources).forEach((src) => {
      if (src) src.playbackRate.setTargetAtTime(finalRate, this.ctx.currentTime, 0.02);
    });
  }

  public getCurrentPlaybackTime(): number {
    if (!this.state.isPlaying) return this.state.currentTime;

    const rate = 1 + (this.state.pitchPercent + this.state.pitchBend * 5) / 100;
    const elapsed = (this.ctx.currentTime - this.startTime) * rate;
    let pos = this.startOffset + elapsed;

    if (this.state.loop.active && this.state.loop.start !== null && this.state.loop.end !== null) {
      if (pos >= this.state.loop.end) {
        pos = this.state.loop.start;
        this.seek(pos);
      }
    }

    return Math.min(this.state.duration, pos);
  }

  private startLoopTimer() {
    const loop = () => {
      if (this.state.isPlaying) {
        this.state.currentTime = this.getCurrentPlaybackTime();
        this.onStateChange(this.state);
      }

      if (this.analyserNode) {
        this.analyserNode.getFloatTimeDomainData(this.meterBuffer as any);
        let sum = 0;
        for (let i = 0; i < this.meterBuffer.length; i++) {
          sum += this.meterBuffer[i] * this.meterBuffer[i];
        }
        const rms = Math.sqrt(sum / this.meterBuffer.length);
        const peak = Math.min(1.0, rms * 3.0);
        this.onMeterUpdate(peak, peak * 0.95);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private notifyState() {
    this.onStateChange({ ...this.state });
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.stopSource();
  }
}
